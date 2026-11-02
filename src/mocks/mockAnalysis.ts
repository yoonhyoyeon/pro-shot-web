import sampleFrame from '../assets/sample-frame.png'
import type {
  AnalysisErrorCode,
  AnalysisEvent,
  AnalysisResult,
  AnalysisStep,
  AnalysisStepId,
  TrajectoryPoint,
} from '../types/analysis'

export const ANALYSIS_STEPS: AnalysisStep[] = [
  { id: 'validate', label: '영상 확인', message: '영상 확인 중' },
  { id: 'track', label: '공 검출 및 추적', message: '공 검출 및 추적' },
  { id: 'fit', label: '궤적 분석', message: '경로 피팅 및 속도 추정' },
  { id: 'result', label: '결과 생성', message: '결과 생성 중' },
]

/** 각 단계가 끝나는 진행률 */
const STEP_END: Record<AnalysisStepId, number> = {
  validate: 15,
  track: 55,
  fit: 85,
  result: 100,
}

export const SAMPLE_FRAME = { url: sampleFrame, width: 892, height: 642 }

/** 샘플 프레임(892×642) 원본 좌표계 기준 실제 추적 좌표 */
export const mockTrajectory: TrajectoryPoint[] = [
  { frame: 0, x: 71.4, y: 520.2, confidence: 0.91 },
  { frame: 5, x: 140.8, y: 420.5, confidence: 0.88 },
  { frame: 11, x: 228.9, y: 333.7, confidence: 0.84 },
  { frame: 16, x: 306.5, y: 288.6, confidence: 0.8 },
  { frame: 22, x: 404.4, y: 267.3, confidence: 0.79 },
  { frame: 28, x: 507.6, y: 281.7, confidence: 0.77 },
  { frame: 33, x: 597.6, y: 321.0, confidence: 0.75 },
]

/** 피팅한 3차 베지어 곡선을 샘플링한 예측 궤적 */
function sampleCubic(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  count: number,
): TrajectoryPoint[] {
  return Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1)
    const u = 1 - t
    const x = u ** 3 * p0[0] + 3 * u ** 2 * t * p1[0] + 3 * u * t ** 2 * p2[0] + t ** 3 * p3[0]
    const y = u ** 3 * p0[1] + 3 * u ** 2 * t * p1[1] + 3 * u * t ** 2 * p2[1] + t ** 3 * p3[1]
    return { frame: i, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 }
  })
}

export const mockPredictedTrajectory = sampleCubic(
  [71.4, 520.2],
  [249.7, 261.0],
  [454.9, 188.2],
  [686.8, 302.1],
  24,
)

export const mockResult: AnalysisResult = {
  status: 'VALID',
  speed_kmh: 93.7,
  score: 78,
  goal: true,
  confidence: 0.82,
  frames_tracked: 34,
  feedback: '강한 임팩트와 안정적인 궤적이 확인됩니다. 아마추어 수준을 뛰어넘는 파워 슈팅이에요 🔥',
  frame_size: { width: SAMPLE_FRAME.width, height: SAMPLE_FRAME.height },
  fps: 30,
  frame_url: SAMPLE_FRAME.url,
  trajectory: mockTrajectory,
  predicted_trajectory: mockPredictedTrajectory,
  goal_area: { x: 606.5, y: 264.1, width: 160.6, height: 113.8 },
}

export type MockScenario = 'success' | 'ball-not-detected' | 'goal-not-detected' | 'network-error'

interface MockAnalysisOptions {
  scenario?: MockScenario
  /** 전체 분석에 걸리는 시간 (ms) */
  duration?: number
  onEvent: (event: AnalysisEvent) => void
  /** 완료 시 돌려줄 결과 (기본: mockResult) */
  result?: AnalysisResult
}

/**
 * 백엔드 SSE 스트림을 흉내 내는 Mock 분석.
 * 실제 연동 시 EventSource로 받은 이벤트를 같은 onEvent에 넘기면 된다.
 * 반환값은 구독 해제 함수.
 */
export function startMockAnalysis({
  scenario = 'success',
  duration = 6000,
  onEvent,
  result = mockResult,
}: MockAnalysisOptions): () => void {
  const tickMs = 120
  const failAt: Partial<Record<MockScenario, { progress: number; code: AnalysisErrorCode }>> = {
    'ball-not-detected': { progress: 42, code: 'BALL_NOT_DETECTED' },
    'goal-not-detected': { progress: 18, code: 'GOAL_NOT_DETECTED' },
    'network-error': { progress: 27, code: 'NETWORK_ERROR' },
  }
  const failure = failAt[scenario]
  let progress = 0
  let completeTimer: number | undefined

  const timer = window.setInterval(() => {
    // 실제 분석처럼 일정하지 않은 속도로 증가
    progress = Math.min(100, progress + (100 / (duration / tickMs)) * (0.5 + Math.random()))

    if (failure && progress >= failure.progress) {
      window.clearInterval(timer)
      onEvent({ type: 'error', code: failure.code })
      return
    }

    const step = ANALYSIS_STEPS.find((s) => progress <= STEP_END[s.id])?.id ?? 'result'
    onEvent({ type: 'progress', progress: Math.floor(progress), step })

    if (progress >= 100) {
      window.clearInterval(timer)
      completeTimer = window.setTimeout(() => onEvent({ type: 'complete', result }), 400)
    }
  }, tickMs)

  return () => {
    window.clearInterval(timer)
    window.clearTimeout(completeTimer)
  }
}
