import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, calibrationApi, isAbortError } from '../api'
import { normalizeCalibrationCode } from '../api/errorCodes'
import type { SelectedVideo } from '../types/analysis'
import type { CalibrationErrorCode, CalibrationResult } from '../types/calibration'

export type CalibrationState =
  | { phase: 'idle' }
  | { phase: 'uploading'; progress: number }
  | { phase: 'processing'; progress: number }
  | { phase: 'done'; result: CalibrationResult }
  | { phase: 'error'; code: CalibrationErrorCode; rawCode?: string }

/** 상태 조회 간격 */
const POLL_MS = 1000
/** 이 시간 안에 끝나지 않으면 시간 초과로 처리 */
const PROCESS_TIMEOUT_MS = 120_000

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms)
    signal.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer)
        reject(new DOMException('aborted', 'AbortError'))
      },
      { once: true },
    )
  })

/**
 * 체스보드 영상 업로드 → 보정 작업 생성 → 상태 조회 반복 → 결과/오류 처리.
 * 실제 통신은 calibrationApi(Mock 또는 HTTP)에 맡긴다.
 */
export function useCalibration() {
  const [state, setState] = useState<CalibrationState>({ phase: 'idle' })
  const abortRef = useRef<AbortController | null>(null)

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
  }, [])

  const start = useCallback(
    async (video: SelectedVideo) => {
      stop()
      const controller = new AbortController()
      const { signal } = controller
      abortRef.current = controller
      setState({ phase: 'uploading', progress: 0 })

      try {
        const { calibrationId } = await calibrationApi.createCalibration(video, {
          signal,
          onProgress: (progress) => setState({ phase: 'uploading', progress }),
        })
        setState({ phase: 'processing', progress: 0 })

        const deadline = performance.now() + PROCESS_TIMEOUT_MS
        while (!signal.aborted) {
          const status = await calibrationApi.getCalibration(calibrationId, signal)
          if (signal.aborted) return
          if (status.status === 'done') return setState({ phase: 'done', result: status.result })
          if (status.status === 'failed') {
            const code = normalizeCalibrationCode(status.code)
            return setState({ phase: 'error', code, rawCode: status.code !== code ? status.code : undefined })
          }
          setState({ phase: 'processing', progress: status.progress })
          if (performance.now() > deadline) return setState({ phase: 'error', code: 'TIMEOUT' })
          await sleep(POLL_MS, signal)
        }
      } catch (e) {
        if (isAbortError(e) || signal.aborted) return
        if (e instanceof ApiError) setState({ phase: 'error', code: e.code as CalibrationErrorCode, rawCode: e.rawCode })
        else setState({ phase: 'error', code: 'NETWORK_ERROR' })
      }
    },
    [stop],
  )

  /** 진행 중인 업로드·보정을 중단하고 처음 상태로 */
  const reset = useCallback(() => {
    stop()
    setState({ phase: 'idle' })
  }, [stop])

  useEffect(() => stop, [stop])

  return { state, start, reset }
}
