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

  /** 보정 작업이 끝날 때까지 상태를 조회한다 */
  const poll = useCallback(async (calibrationId: string, signal: AbortSignal) => {
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
  }, [])

  /** 업로드·조회 중 오류를 화면 상태로 */
  const handleError = useCallback((e: unknown, signal: AbortSignal) => {
    if (isAbortError(e) || signal.aborted) return
    if (e instanceof ApiError) setState({ phase: 'error', code: e.code as CalibrationErrorCode, rawCode: e.rawCode })
    else setState({ phase: 'error', code: 'NETWORK_ERROR' })
  }, [])

  const begin = useCallback(() => {
    stop()
    const controller = new AbortController()
    abortRef.current = controller
    return controller.signal
  }, [stop])

  const start = useCallback(
    async (video: SelectedVideo) => {
      const signal = begin()
      setState({ phase: 'uploading', progress: 0 })
      try {
        const { calibrationId } = await calibrationApi.createCalibration(video, {
          signal,
          onProgress: (progress) => setState({ phase: 'uploading', progress }),
        })
        await poll(calibrationId, signal)
      } catch (e) {
        handleError(e, signal)
      }
    },
    [begin, poll, handleError],
  )

  /** 업로드 없이 이미 있는 보정 작업의 상태를 조회한다 */
  const watch = useCallback(
    async (calibrationId: string) => {
      const signal = begin()
      try {
        await poll(calibrationId, signal)
      } catch (e) {
        handleError(e, signal)
      }
    },
    [begin, poll, handleError],
  )

  /** 진행 중인 업로드·보정을 중단하고 처음 상태로 */
  const reset = useCallback(() => {
    stop()
    setState({ phase: 'idle' })
  }, [stop])

  useEffect(() => stop, [stop])

  return { state, start, watch, reset }
}
