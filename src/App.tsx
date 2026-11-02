import { useCallback, useEffect, useState } from 'react'
import { Header } from './components/layout/Header'
import { isFailureCode } from './api/errorCodes'
import { ProtoNav } from './components/layout/ProtoNav'
import { useAnalysis } from './hooks/useAnalysis'
import { SAMPLE_FRAME, mockResult } from './mocks/mockAnalysis'
import { AnalysisPage } from './pages/AnalysisPage'
import { CalibrationPage } from './pages/CalibrationPage'
import { AnalysisFailedPage, NetworkErrorPage } from './pages/ErrorPages'
import { GuidePage } from './pages/GuidePage'
import { ResultPage } from './pages/ResultPage'
import { UploadPage } from './pages/UploadPage'
import type { SelectedVideo, VideoMetadata } from './types/analysis'
import type { CalibrationResult } from './types/calibration'
import { calibrationIdFor, loadCalibration, saveCalibration } from './utils/calibration'

export type Screen = 'upload' | 'selected' | 'analyzing' | 'result' | 'failed' | 'network-error' | 'guide' | 'calibration'

/** 분석 흐름 밖에서 따로 여는 화면 */
type View = 'main' | 'guide' | 'calibration'

/** 프로토타입 이동 시 실제 파일 대신 쓰는 샘플 영상 정보 */
const SAMPLE_VIDEO: SelectedVideo = {
  name: 'sample_shooting.mp4',
  size: 18_400_000,
  type: 'video/mp4',
  previewUrl: SAMPLE_FRAME.url,
  kind: 'image',
  metadata: { duration: 4.2, width: 1920, height: 1080 },
}

function toSelectedVideo(file: File, metadata: VideoMetadata): SelectedVideo {
  return {
    file,
    name: file.name,
    size: file.size,
    type: file.type,
    previewUrl: URL.createObjectURL(file),
    kind: 'video',
    metadata,
  }
}

export default function App() {
  const [video, setVideo] = useState<SelectedVideo | null>(null)
  const [view, setView] = useState<View>('main')
  const [calibration, setCalibration] = useState<CalibrationResult | null>(loadCalibration)
  const { state, start, set } = useAnalysis()

  const updateCalibration = useCallback((next: CalibrationResult | null) => {
    setCalibration(next)
    saveCalibration(next)
  }, [])
  const clearCalibration = useCallback(() => updateCalibration(null), [updateCalibration])

  // 선택한 영상이 바뀌면 이전 미리보기 URL 해제
  useEffect(() => {
    const url = video?.file ? video.previewUrl : null
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [video])

  const screen: Screen = view !== 'main'
    ? view
    : state.phase === 'uploading' || state.phase === 'running'
      ? 'analyzing'
      : state.phase === 'done'
        ? 'result'
        : state.phase === 'error'
          ? isFailureCode(state.code)
            ? 'failed'
            : 'network-error'
          : video
            ? 'selected'
            : 'upload'

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [screen])

  const goHome = useCallback(() => {
    set({ phase: 'idle' })
    setVideo(null)
    setView('main')
  }, [set])

  /** 촬영 가이드·카메라 보정 화면. 업로드·선택 상태는 유지하고 진행 중인 분석은 중단 */
  const openView = useCallback(
    (next: Exclude<View, 'main'>) => {
      if (state.phase !== 'idle') set({ phase: 'idle' })
      setView(next)
    },
    [state.phase, set],
  )
  const goGuide = useCallback(() => openView('guide'), [openView])
  const goCalibration = useCallback(() => openView('calibration'), [openView])
  /** 보정을 마치고 업로드 화면으로. 이미 고른 영상이 있으면 그대로 둔다 */
  const backToUpload = useCallback(() => setView('main'), [])

  /** 저장된 보정이 이 영상에 맞으면 함께 보낸다 */
  const retry = () => {
    const v = video ?? SAMPLE_VIDEO
    void start(v, { calibrationId: calibrationIdFor(calibration, v) })
  }

  const navigate = (target: Screen) => {
    setView(target === 'guide' || target === 'calibration' ? target : 'main')
    switch (target) {
      case 'upload':
        goHome()
        break
      case 'selected':
        set({ phase: 'idle' })
        setVideo((v) => v ?? SAMPLE_VIDEO)
        break
      case 'analyzing': {
        const v = video ?? SAMPLE_VIDEO
        setVideo(v)
        void start(v, { calibrationId: calibrationIdFor(calibration, v) })
        break
      }
      case 'result':
        set({ phase: 'done', result: mockResult })
        break
      case 'failed':
        set({ phase: 'error', code: 'BALL_NOT_DETECTED' })
        break
      case 'network-error':
        set({ phase: 'error', code: 'NETWORK_ERROR' })
        break
      case 'guide':
        goGuide()
        break
      case 'calibration':
        goCalibration()
        break
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Header onLogoClick={goHome} onGuideClick={goGuide} onCalibrationClick={goCalibration} />

      <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 pt-10 pb-32 sm:px-6">
        {screen === 'guide' && <GuidePage onStartUpload={backToUpload} />}
        {screen === 'calibration' && (
          <CalibrationPage
            saved={calibration}
            onSaved={updateCalibration}
            onClear={clearCalibration}
            onGoUpload={backToUpload}
          />
        )}
        {(screen === 'upload' || screen === 'selected') && (
          <UploadPage
            video={video}
            onFileSelect={(file, metadata) => setVideo(toSelectedVideo(file, metadata))}
            onStart={retry}
            onReset={() => setVideo(null)}
            onOpenGuide={goGuide}
            calibration={calibration}
            onOpenCalibration={goCalibration}
          />
        )}
        {view === 'main' && (state.phase === 'uploading' || state.phase === 'running') && (
          <AnalysisPage
            video={video ?? SAMPLE_VIDEO}
            phase={state.phase}
            progress={state.progress}
            step={state.phase === 'running' ? state.step : undefined}
            onCancel={() => set({ phase: 'idle' })}
          />
        )}
        {view === 'main' && state.phase === 'done' && <ResultPage result={state.result} onRestart={goHome} onGuideClick={goGuide} />}
        {view === 'main' &&
          state.phase === 'error' &&
          (isFailureCode(state.code) ? (
            <AnalysisFailedPage code={state.code} rawCode={state.rawCode} onRetry={retry} onBack={goHome} />
          ) : (
            <NetworkErrorPage code={state.code} rawCode={state.rawCode} onRetry={retry} onBack={goHome} />
          ))}
      </main>

      <ProtoNav current={screen} onNavigate={navigate} />
    </div>
  )
}
