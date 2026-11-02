import { AnalysisProgress } from '../components/analysis/AnalysisProgress'
import { StepIndicator } from '../components/analysis/StepIndicator'
import { Button } from '../components/common/Button'
import { ANALYSIS_STEPS } from '../mocks/mockAnalysis'
import type { AnalysisStepId, SelectedVideo } from '../types/analysis'

interface AnalysisPageProps {
  video: SelectedVideo
  phase: 'uploading' | 'running'
  progress: number
  /** 업로드 중에는 없음 */
  step?: AnalysisStepId
  onCancel: () => void
}

export function AnalysisPage({ video, phase, progress, step, onCancel }: AnalysisPageProps) {
  const uploading = phase === 'uploading'
  const message = uploading ? '영상 업로드 중' : (ANALYSIS_STEPS.find((s) => s.id === step)?.message ?? '')

  return (
    <div className="animate-fade-in mx-auto flex min-h-[calc(100dvh-52px-80px)] max-w-[768px] flex-col justify-center">
      <div className="shadow-ring-strong relative aspect-video overflow-hidden rounded-2xl bg-black">
        {video.kind === 'video' ? (
          <video src={video.previewUrl} muted autoPlay loop playsInline className="size-full object-cover opacity-30" />
        ) : (
          <img src={video.previewUrl} alt="" className="size-full object-cover opacity-30" />
        )}
        <div className="bg-bg/60 absolute inset-0" />
        <AnalysisProgress progress={progress} message={message} label={uploading ? 'UPLOADING' : 'PROCESSING'} />
      </div>

      <div className="pt-6">
        {/* 업로드 중에는 아직 어떤 단계도 시작되지 않은 상태로 표시 */}
        <StepIndicator steps={ANALYSIS_STEPS} currentStep={uploading ? null : (step ?? 'validate')} />
      </div>
      <p className="text-fg-subtle pt-4 text-center text-xs leading-4">
        {uploading
          ? '업로드가 끝나면 AI 분석이 바로 시작됩니다.'
          : '영상 길이와 환경에 따라 분석 시간이 달라질 수 있습니다.'}
      </p>
      <div className="flex justify-center pt-5">
        <Button variant="secondary" onClick={onCancel} className="px-4 py-2 text-xs">
          분석 취소
        </Button>
      </div>
    </div>
  )
}
