import type { AnalysisErrorCode, AnalysisEvent, AnalysisResult, AnalysisStepId } from '../types/analysis'
import type { CalibrationStatus } from '../types/calibration'
import { codeFromBody, normalizeCalibrationCode, normalizeFailureCode } from './errorCodes'
import { ApiError, type AnalysisApi, type CalibrationApi, type UploadOptions } from './types'

/** HTTP 상태 코드 → 화면 오류 코드 (응답 본문에 코드가 없을 때) */
export function errorCodeFromStatus(status: number): AnalysisErrorCode {
  if (status === 0) return 'NETWORK_ERROR'
  if (status === 408 || status === 504) return 'TIMEOUT'
  if (status === 413 || status === 415 || status === 422) return 'INVALID_VIDEO'
  return 'SERVER_ERROR'
}

/** 업로드 거절 응답 → 화면 오류. 본문에 코드가 있으면 상태 코드보다 우선한다 */
export function uploadError(status: number, body: unknown, kind: 'analysis' | 'calibration' = 'analysis') {
  const raw = codeFromBody(body)
  const normalize = kind === 'calibration' ? normalizeCalibrationCode : normalizeFailureCode
  return new ApiError(raw ? normalize(raw) : errorCodeFromStatus(status), `upload failed: ${status}`, raw)
}

const UPLOAD_TIMEOUT_MS = 120_000
/** 이 시간 동안 SSE 이벤트가 하나도 없으면 연결이 끊긴 것으로 판단 */
const SSE_IDLE_TIMEOUT_MS = 60_000
/** EventSource 자동 재연결을 몇 번까지 기다릴지 */
const SSE_MAX_RETRIES = 3

export function createHttpApi(baseUrl: string): AnalysisApi & CalibrationApi {
  const url = (path: string) => `${baseUrl.replace(/\/$/, '')}${path}`

  // fetch는 업로드 진행률을 알 수 없어서 XMLHttpRequest 사용
  function upload(
    path: string,
    form: FormData,
    kind: 'analysis' | 'calibration',
    { onProgress, signal }: UploadOptions = {},
  ): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', url(path))
      xhr.responseType = 'json'
      xhr.timeout = UPLOAD_TIMEOUT_MS

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100))
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300 && xhr.response) resolve(xhr.response)
        else reject(uploadError(xhr.status, xhr.response, kind))
      }
      xhr.onerror = () => reject(new ApiError('NETWORK_ERROR'))
      xhr.ontimeout = () => reject(new ApiError('TIMEOUT'))
      xhr.onabort = () => reject(new DOMException('aborted', 'AbortError'))
      signal?.addEventListener('abort', () => xhr.abort(), { once: true })

      xhr.send(form)
    })
  }

  return {
    async createAnalysis(video, { calibrationId, ...options } = {}) {
      if (!video.file) throw new ApiError('INVALID_VIDEO', '업로드할 파일이 없습니다')
      const form = new FormData()
      form.append('video', video.file)
      if (calibrationId) form.append('calibration_id', calibrationId)
      const body = await upload('/analyses', form, 'analysis', options)
      if (!body.analysis_id) throw new ApiError('SERVER_ERROR', 'analysis_id 없음')
      return { analysisId: String(body.analysis_id) }
    },

    async createCalibration(video, options) {
      if (!video.file) throw new ApiError('INVALID_VIDEO', '업로드할 파일이 없습니다')
      const form = new FormData()
      form.append('video', video.file)
      const body = await upload('/calibrations', form, 'calibration', options)
      if (!body.calibration_id) throw new ApiError('SERVER_ERROR', 'calibration_id 없음')
      return { calibrationId: String(body.calibration_id) }
    },

    async getCalibration(calibrationId, signal) {
      let res: Response
      try {
        res = await fetch(url(`/calibrations/${calibrationId}`), { signal })
      } catch (e) {
        if (signal?.aborted) throw e
        throw new ApiError('NETWORK_ERROR')
      }
      if (!res.ok) throw new ApiError(errorCodeFromStatus(res.status), `calibration status: ${res.status}`)
      return (await res.json()) as CalibrationStatus
    },

    subscribe(analysisId, onEvent) {
      const source = new EventSource(url(`/analyses/${analysisId}/events`))
      let closed = false
      let retries = 0
      let idleTimer = 0

      const close = () => {
        closed = true
        window.clearTimeout(idleTimer)
        source.close()
      }
      const emit = (event: AnalysisEvent) => {
        if (!closed) onEvent(event)
      }
      const fail = (code: AnalysisErrorCode, rawCode?: string) => {
        emit({ type: 'error', code, rawCode: rawCode !== code ? rawCode : undefined })
        close()
      }
      const resetIdle = () => {
        retries = 0
        window.clearTimeout(idleTimer)
        idleTimer = window.setTimeout(() => fail('TIMEOUT'), SSE_IDLE_TIMEOUT_MS)
      }
      const parse = <T,>(e: MessageEvent): T | null => {
        try {
          return JSON.parse(e.data) as T
        } catch {
          return null
        }
      }

      source.addEventListener('open', resetIdle)
      // 연결 유지 신호. 주석(: keepalive)은 브라우저가 이벤트로 전달하지 않으므로 이름 있는 이벤트로 받는다
      source.addEventListener('keepalive', resetIdle)

      // event: progress  data: {"progress": 42, "step": "track"}
      source.addEventListener('progress', (e) => {
        resetIdle()
        const data = parse<{ progress: number; step: AnalysisStepId }>(e as MessageEvent)
        if (data) emit({ type: 'progress', progress: data.progress, step: data.step })
      })

      // event: complete  data: {} → 결과는 별도 API로 조회
      source.addEventListener('complete', async () => {
        window.clearTimeout(idleTimer)
        source.close()
        try {
          const res = await fetch(url(`/analyses/${analysisId}/result`))
          if (!res.ok) return fail(errorCodeFromStatus(res.status))
          emit({ type: 'complete', result: (await res.json()) as AnalysisResult })
          close()
        } catch {
          fail('NETWORK_ERROR')
        }
      })

      // 서버가 보낸 분석 실패: event: failed  data: {"code": "BALL_NOT_DETECTED"}
      // 프론트에 없는 세부 코드도 화면 코드로 바꾸고, 원래 코드는 함께 넘긴다
      source.addEventListener('failed', (e) => {
        const raw = parse<{ code?: string }>(e as MessageEvent)?.code
        fail(normalizeFailureCode(raw), raw)
      })

      // 연결 오류: EventSource가 자동 재연결하므로 몇 번은 기다린다
      source.onerror = () => {
        if (closed) return
        retries += 1
        if (source.readyState === EventSource.CLOSED || retries > SSE_MAX_RETRIES) fail('NETWORK_ERROR')
      }

      return close
    },
  }
}
