import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, analysisApi, isAbortError } from '../api'
import type { AnalysisErrorCode, AnalysisEvent, AnalysisResult, AnalysisStepId, SelectedVideo } from '../types/analysis'

export type AnalysisState =
  | { phase: 'idle' }
  | { phase: 'uploading'; progress: number }
  | { phase: 'running'; progress: number; step: AnalysisStepId }
  | { phase: 'done'; result: AnalysisResult }
  /** rawCode: 서버가 보낸 원래 코드 (화면 코드와 다를 때) */
  | { phase: 'error'; code: AnalysisErrorCode; rawCode?: string }

/**
 * 업로드 → 분석 생성 → SSE 진행 이벤트 수신 → 결과/오류 처리 흐름을 관리한다.
 * 실제 통신은 analysisApi(Mock 또는 HTTP)에 맡긴다.
 */
export function useAnalysis() {
  const [state, setState] = useState<AnalysisState>({ phase: 'idle' })
  const abortRef = useRef<AbortController | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    unsubscribeRef.current?.()
    unsubscribeRef.current = null
  }, [])

  const subscribe = useCallback((analysisId: string) => {
    setState({ phase: 'running', progress: 0, step: 'validate' })
    unsubscribeRef.current = analysisApi.subscribe(analysisId, (event: AnalysisEvent) => {
      if (event.type === 'progress') setState({ phase: 'running', progress: event.progress, step: event.step })
      else if (event.type === 'complete') setState({ phase: 'done', result: event.result })
      else setState({ phase: 'error', code: event.code, rawCode: event.rawCode })
    })
  }, [])

  const start = useCallback(
    async (video: SelectedVideo, { calibrationId }: { calibrationId?: string } = {}) => {
      stop()
      const controller = new AbortController()
      abortRef.current = controller
      setState({ phase: 'uploading', progress: 0 })

      try {
        const { analysisId } = await analysisApi.createAnalysis(video, {
          calibrationId,
          signal: controller.signal,
          onProgress: (progress) => setState({ phase: 'uploading', progress }),
        })
        if (controller.signal.aborted) return
        subscribe(analysisId)
      } catch (e) {
        if (isAbortError(e)) return
        if (e instanceof ApiError) setState({ phase: 'error', code: e.code as AnalysisErrorCode, rawCode: e.rawCode })
        else setState({ phase: 'error', code: 'NETWORK_ERROR' })
      }
    },
    [stop, subscribe],
  )

  /** 업로드 없이 이미 있는 분석 작업에 붙는다. 끝난 작업이면 결과가 바로 온다 */
  const watch = useCallback(
    (analysisId: string) => {
      stop()
      subscribe(analysisId)
    },
    [stop, subscribe],
  )

  /** 진행 중인 업로드·분석을 중단하고 상태를 바꾼다 */
  const set = useCallback(
    (next: AnalysisState) => {
      stop()
      setState(next)
    },
    [stop],
  )

  useEffect(() => stop, [stop])

  return { state, start, watch, set }
}
