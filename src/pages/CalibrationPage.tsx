import { useEffect, useState } from 'react'
import { AnalysisProgress } from '../components/analysis/AnalysisProgress'
import { CalibrationErrorCard } from '../components/calibration/CalibrationErrorCard'
import { CalibrationMetrics, CalibrationResultCard } from '../components/calibration/CalibrationResultCard'
import { CalibrationSteps } from '../components/calibration/CalibrationSteps'
import { DistortionComparison } from '../components/calibration/DistortionComparison'
import { Button } from '../components/common/Button'
import { Card } from '../components/common/Card'
import { StatusBadge } from '../components/common/StatusBadge'
import { SelectedVideo } from '../components/upload/SelectedVideo'
import { UploadZone } from '../components/upload/UploadZone'
import { useCalibration } from '../hooks/useCalibration'
import type { SelectedVideo as SelectedVideoData } from '../types/analysis'
import type { CalibrationResult } from '../types/calibration'
import { CALIBRATION_VIDEO_RULES } from '../utils/videoValidation'

/** 보정값이 분석에서 하는 역할 */
const EFFECTS = [
  { term: '렌즈 왜곡 계수', description: '화면 가장자리의 휘어짐을 되돌려 공의 위치를 바로잡습니다.' },
  {
    term: '초점거리 fx · fy',
    description: '같은 공이 작게 보일수록 멀리 있다는 계산(깊이 ≈ 초점거리 × 공 반지름 ÷ 화면 속 반지름)에 쓰입니다.',
  },
  { term: '주점 cx · cy', description: '렌즈 중심이 화면의 어디에 맺히는지로, 공의 방향을 계산하는 기준입니다.' },
]

interface CalibrationPageProps {
  /** 이 브라우저에 저장된 보정 */
  saved: CalibrationResult | null
  onSaved: (result: CalibrationResult) => void
  onClear: () => void
  onGoUpload: () => void
}

export function CalibrationPage({ saved, onSaved, onClear, onGoUpload }: CalibrationPageProps) {
  const [video, setVideo] = useState<SelectedVideoData | null>(null)
  const { state, start, reset } = useCalibration()

  // 선택한 영상이 바뀌거나 화면을 떠나면 미리보기 URL 해제
  useEffect(() => {
    const url = video?.file ? video.previewUrl : null
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [video])

  useEffect(() => {
    if (state.phase === 'done') onSaved(state.result)
  }, [state, onSaved])

  const chooseAnother = () => {
    reset()
    setVideo(null)
  }

  const running = state.phase === 'uploading' || state.phase === 'processing'

  let panel
  if (state.phase === 'done') {
    panel = <CalibrationResultCard result={state.result} onUseForAnalysis={onGoUpload} onRecalibrate={chooseAnother} />
  } else if (state.phase === 'error') {
    panel = (
      <CalibrationErrorCard
        code={state.code}
        rawCode={state.rawCode}
        onRetry={() => video && void start(video)}
        onChooseAnother={chooseAnother}
      />
    )
  } else if (running && video) {
    const uploading = state.phase === 'uploading'
    panel = (
      <div className="bg-surface shadow-ring-strong flex h-full flex-col gap-5 rounded-2xl p-5 sm:p-6">
        <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
          <video src={video.previewUrl} muted autoPlay loop playsInline className="size-full object-cover opacity-30" />
          <div className="bg-bg/60 absolute inset-0" />
          <AnalysisProgress
            progress={state.progress}
            message={uploading ? '보정 영상 업로드 중' : '체스보드를 찾고 카메라 값을 계산하는 중'}
            label={uploading ? 'UPLOADING' : 'CALIBRATING'}
          />
        </div>
        <div className="flex justify-center">
          <Button variant="secondary" onClick={chooseAnother} className="px-4 py-2 text-xs">
            보정 취소
          </Button>
        </div>
      </div>
    )
  } else if (video) {
    panel = <SelectedVideo video={video} onStart={() => void start(video)} onReset={() => setVideo(null)} startLabel="보정 시작" />
  } else {
    panel = (
      <UploadZone
        rules={CALIBRATION_VIDEO_RULES}
        title="체스보드 영상을 업로드하세요"
        description="체스보드 전체가 보이는 영상"
        onFileSelect={(file, metadata) =>
          setVideo({ file, name: file.name, size: file.size, type: file.type, previewUrl: URL.createObjectURL(file), kind: 'video', metadata })
        }
      />
    )
  }

  return (
    <div className="animate-fade-in flex flex-col gap-10">
      <section>
        <p className="text-accent font-mono text-[10px] leading-[15px] tracking-[1px] uppercase">CAMERA CALIBRATION</p>
        <h1 className="font-display text-fg pt-3 text-[36px] leading-[42px] tracking-[1.1px] sm:text-[44px] sm:leading-[48px]">
          카메라 보정
        </h1>
        <p className="text-fg-muted pt-3 text-sm leading-[22.75px]">
          체스보드 영상으로 휴대폰 카메라의 렌즈 왜곡과 초점거리를 측정해, 공의 위치와 거리 계산을 보정합니다. 선택 기능이며
          보정하지 않아도 분석할 수 있습니다.
        </p>
      </section>

      <section aria-labelledby="calibration-steps-title">
        <h2 id="calibration-steps-title" className="text-fg pb-4 text-base leading-6 font-medium">
          이렇게 촬영해주세요
        </h2>
        <CalibrationSteps />
      </section>

      <section aria-label="보정 영상 업로드" className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        {panel}
        <aside>
          <Card className="flex h-full flex-col gap-4 p-5">
            <h2 className="text-fg-subtle font-mono text-xs leading-4 tracking-[1.2px] uppercase">현재 보정</h2>
            {saved ? (
              <>
                <div>
                  <StatusBadge tone="accent" dot>
                    CALIBRATED
                  </StatusBadge>
                  <p className="text-fg-muted pt-2 text-sm leading-5">다음 분석에 이 보정이 적용됩니다.</p>
                </div>
                <CalibrationMetrics result={saved} compact />
                <Button variant="secondary" onClick={onClear} disabled={running} className="mt-auto self-start px-4 py-2 text-xs">
                  보정 해제
                </Button>
              </>
            ) : (
              <div>
                <StatusBadge>NOT CALIBRATED</StatusBadge>
                <p className="text-fg-muted pt-2 text-sm leading-5">아직 보정하지 않았어요.</p>
                <p className="text-fg-subtle pt-1 text-xs leading-[19.5px]">
                  보정하지 않아도 분석할 수 있지만, 공의 거리와 속도 추정 오차가 커질 수 있어요.
                </p>
              </div>
            )}
          </Card>
        </aside>
      </section>

      <section aria-labelledby="calibration-effect-title" className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="p-5 sm:p-6">
          <h2 id="calibration-effect-title" className="text-fg pb-4 text-base leading-6 font-medium">
            보정하면 무엇이 달라지나요?
          </h2>
          <DistortionComparison />
        </Card>
        <Card className="p-5">
          <h3 className="text-fg-subtle font-mono text-xs leading-4 tracking-[1.2px] uppercase">보정으로 측정하는 값</h3>
          <dl className="flex flex-col gap-4 pt-4">
            {EFFECTS.map((e) => (
              <div key={e.term}>
                <dt className="text-fg text-sm leading-5 font-medium">{e.term}</dt>
                <dd className="text-fg-subtle pt-1 text-xs leading-[19.5px]">{e.description}</dd>
              </div>
            ))}
          </dl>
          <p className="text-fg-faint pt-4 text-[11px] leading-4">
            그림은 렌즈 왜곡을 설명하기 위한 예시입니다. 실제 보정 효과는 휴대폰과 촬영 환경에 따라 다릅니다.
          </p>
        </Card>
      </section>
    </div>
  )
}
