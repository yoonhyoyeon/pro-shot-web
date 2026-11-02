import { mockResult, startMockAnalysis, type MockScenario } from '../mocks/mockAnalysis'
import { MOCK_CALIBRATION_FAILURE, mockCalibrationResult, type MockCalibrationScenario } from '../mocks/mockCalibration'
import type { AnalysisResult, SelectedVideo } from '../types/analysis'
import type { AnalysisApi, CalibrationApi, UploadOptions } from './types'

const SCENARIOS: MockScenario[] = ['success', 'ball-not-detected', 'goal-not-detected', 'network-error']
const CALIBRATION_SCENARIOS: MockCalibrationScenario[] = ['success', 'checkerboard-not-found', 'not-enough-frames']

/** 보정 처리에 걸리는 시간 흉내 (ms) */
const CALIBRATION_DURATION = 3500

/** 개발용: ?scenario=ball-not-detected, ?calibration=not-enough-frames 등으로 첫 결과를 바꿀 수 있음 */
function fromUrl<T extends string>(key: string, values: T[], fallback: T): T {
  const value = new URLSearchParams(window.location.search).get(key) as T | null
  return value && values.includes(value) ? value : fallback
}

/** Mock 결과에 사용자가 올린 영상을 붙여 실제 영상 위 궤적 표시를 확인할 수 있게 함 */
function resultFor(video: SelectedVideo): AnalysisResult {
  return video.kind === 'video' ? { ...mockResult, video_url: video.previewUrl } : mockResult
}

/** 파일 크기에 비례한 업로드 시간 흉내 (1.2~2.5초) */
function fakeUpload(video: SelectedVideo, { onProgress, signal }: UploadOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const duration = Math.min(2500, 1200 + video.size / 50_000)
    const started = performance.now()
    const timer = window.setInterval(() => {
      const percent = Math.min(100, Math.round(((performance.now() - started) / duration) * 100))
      onProgress?.(percent)
      if (percent >= 100) {
        window.clearInterval(timer)
        resolve()
      }
    }, 80)
    signal?.addEventListener(
      'abort',
      () => {
        window.clearInterval(timer)
        reject(new DOMException('aborted', 'AbortError'))
      },
      { once: true },
    )
  })
}

export function createMockApi(): AnalysisApi & CalibrationApi {
  let nextScenario = fromUrl('scenario', SCENARIOS, 'success')
  let nextCalibration = fromUrl('calibration', CALIBRATION_SCENARIOS, 'success')
  const jobs = new Map<string, SelectedVideo>()
  const calibrations = new Map<string, { video: SelectedVideo; started: number; scenario: MockCalibrationScenario }>()

  return {
    async createAnalysis(video, options) {
      await fakeUpload(video, options)
      const analysisId = `mock-${Date.now()}`
      jobs.set(analysisId, video)
      return { analysisId }
    },

    subscribe(analysisId, onEvent) {
      const video = jobs.get(analysisId)
      const scenario = nextScenario
      // 쿼리로 지정한 실패 시나리오는 첫 실행에만 적용해 재시도는 성공하도록 함
      nextScenario = 'success'
      return startMockAnalysis({
        scenario,
        onEvent,
        result: video ? resultFor(video) : mockResult,
      })
    },

    async createCalibration(video, options) {
      await fakeUpload(video, options)
      const calibrationId = `mock-cal-${Date.now()}`
      calibrations.set(calibrationId, { video, started: performance.now(), scenario: nextCalibration })
      nextCalibration = 'success'
      return { calibrationId }
    },

    async getCalibration(calibrationId) {
      const job = calibrations.get(calibrationId)
      if (!job) return { status: 'failed', code: 'SERVER_ERROR' }
      const progress = Math.min(100, Math.round(((performance.now() - job.started) / CALIBRATION_DURATION) * 100))
      const failure = MOCK_CALIBRATION_FAILURE[job.scenario]
      if (failure && progress >= 45) return { status: 'failed', code: failure }
      if (progress < 100) return { status: 'processing', progress }
      const size = job.video.metadata ?? { width: 1920, height: 1080 }
      return { status: 'done', result: mockCalibrationResult({ width: size.width, height: size.height }) }
    },
  }
}
