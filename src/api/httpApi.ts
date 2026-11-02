import type { AnalysisErrorCode, AnalysisEvent } from '../types/analysis'
import { codeFromBody, isUploadRejectCode, normalizeFailureCode } from './errorCodes'
import {
  parseServerEvent,
  stepFromProgress,
  toAnalysisResult,
  toCalibrationStatus,
  type ServerCalibrationStatus,
} from './serverMapping'
import { ApiError, type AnalysisApi, type CalibrationApi, type UploadOptions } from './types'

/** HTTP 상태 코드 → 화면 오류 코드 (응답 본문에 코드가 없을 때) */
export function errorCodeFromStatus(status: number): AnalysisErrorCode {
  if (status === 0) return 'NETWORK_ERROR'
  if (status === 408 || status === 504) return 'TIMEOUT'
  if (status === 413 || status === 415 || status === 422) return 'INVALID_VIDEO'
  return 'SERVER_ERROR'
}

/**
 * 업로드 거절 응답 → 화면 오류. 분석·보정 공통.
 * 영상 문제 코드면 '영상을 분석할 수 없음', 그 밖의 코드(예: 503 ANALYSIS_UNAVAILABLE)는 상태 코드로 판단한다.
 * 원래 코드는 rawCode로 남겨 화면에 표시한다.
 */
export function uploadError(status: number, body: unknown) {
  const raw = codeFromBody(body)
  const code = raw && isUploadRejectCode(raw) ? 'INVALID_VIDEO' : errorCodeFromStatus(status)
  return new ApiError(code, `upload failed: ${status}`, raw)
}

/** 무료 서버가 잠들어 있으면 깨어나는 데 50초 이상 걸리므로 여유 있게 둔다 */
const UPLOAD_TIMEOUT_MS = 120_000
/** 이 시간 동안 SSE 이벤트가 하나도 없으면 연결이 끊긴 것으로 판단 (keepalive가 약 0.2초 간격) */
const SSE_IDLE_TIMEOUT_MS = 60_000
/** EventSource 자동 재연결을 몇 번까지 기다릴지 */
const SSE_MAX_RETRIES = 3

export function createHttpApi(baseUrl: string): AnalysisApi & CalibrationApi {
  const url = (path: string) => `${baseUrl.replace(/\/$/, '')}${path}`
  /** 분석 id → 사용자가 올린 영상의 브라우저 URL. 결과 화면에서 서버 영상을 다시 받지 않도록 */
  const localVideos = new Map<string, string>()

  // fetch는 업로드 진행률을 알 수 없어서 XMLHttpRequest 사용
  function upload(path: string, form: FormData, { onProgress, signal }: UploadOptions = {}): Promise<string> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', url(path))
      xhr.responseType = 'json'
      xhr.timeout = UPLOAD_TIMEOUT_MS

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100))
      }
      xhr.onload = () => {
        if (xhr.status < 200 || xhr.status >= 300) return reject(uploadError(xhr.status, xhr.response))
        // 성공: 202 { "id": "uuid" }
        const id = (xhr.response as { id?: unknown } | null)?.id
        if (typeof id === 'string' && id) resolve(id)
        else reject(new ApiError('SERVER_ERROR', '응답에 id 없음'))
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
      form.append('file', video.file)
      // 백엔드는 아직 이 값을 분석에 쓰지 않는다 (연동 가이드 7장). 연결되면 그대로 적용됨
      if (calibrationId) form.append('calibration_id', calibrationId)
      const analysisId = await upload('/analyses', form, options)
      if (video.kind === 'video') localVideos.set(analysisId, video.previewUrl)
      return { analysisId }
    },

    async createCalibration(video, options) {
      if (!video.file) throw new ApiError('INVALID_VIDEO', '업로드할 파일이 없습니다')
      const form = new FormData()
      form.append('file', video.file)
      return { calibrationId: await upload('/calibrations', form, options) }
    },

    async getCalibration(calibrationId, signal) {
      let res: Response
      try {
        res = await fetch(url(`/calibrations/${calibrationId}`), { signal })
      } catch (e) {
        if (signal?.aborted) throw e
        throw new ApiError('NETWORK_ERROR')
      }
      const body: unknown = await res.json().catch(() => null)
      // 202 진행 중, 200 성공·실패 모두 본문의 status로 구분. 404 CALIBRATION_NOT_FOUND 등은 오류
      if (!res.ok || !body) {
        throw new ApiError(errorCodeFromStatus(res.status), `calibration status: ${res.status}`, codeFromBody(body))
      }
      return toCalibrationStatus(body as ServerCalibrationStatus, calibrationId)
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

      source.addEventListener('open', resetIdle)

      // 백엔드는 event: 이름 없이 data: {"type": ...} 로 보내므로 모두 message 이벤트로 들어온다
      source.onmessage = (e: MessageEvent<string>) => {
        const event = parseServerEvent(e.data)
        if (!event) return
        resetIdle()

        switch (event.type) {
          case 'progress':
            emit({ type: 'progress', progress: event.value, step: stepFromProgress(event.value) })
            break

          case 'complete': {
            const raw = event.data
            // 공 미탐지·신뢰도 미달처럼 분석이 끝까지 돌고 실패한 경우도 complete로 온다
            if (raw.status === 'ANALYSIS_FAILED') {
              fail(normalizeFailureCode(raw.failure_reason), raw.failure_reason)
              break
            }
            emit({
              type: 'complete',
              result: toAnalysisResult(raw, {
                videoUrl: localVideos.get(analysisId) ?? url(`/analyses/${analysisId}/video`),
                imageUrl: url(`/results/${encodeURIComponent(raw.trajectory_image)}`),
              }),
            })
            close()
            break
          }

          case 'failed':
            // 모델 로드 실패처럼 분석을 시작조차 못 한 경우. 코드 없이 message만 온다
            console.warn('[analysis failed]', event.message)
            fail('SERVER_ERROR')
            break
        }
      }

      // 연결 오류: EventSource가 자동 재연결하므로 몇 번은 기다린다. 없는 id(404)면 바로 CLOSED가 된다
      source.onerror = () => {
        if (closed) return
        retries += 1
        if (source.readyState === EventSource.CLOSED || retries > SSE_MAX_RETRIES) fail('NETWORK_ERROR')
      }

      return close
    },
  }
}
