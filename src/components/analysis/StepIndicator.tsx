import checkIcon from '../../assets/icons/check.svg'
import type { AnalysisStep, AnalysisStepId } from '../../types/analysis'

interface StepIndicatorProps {
  steps: AnalysisStep[]
  /** null이면 모든 단계가 대기 상태 */
  currentStep: AnalysisStepId | null
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep)

  return (
    <ol className="grid grid-cols-4 gap-3">
      {steps.map((step, i) => {
        const state = i < currentIndex ? 'done' : i === currentIndex ? 'active' : 'pending'
        return (
          <li key={step.id} className="relative flex flex-col items-center gap-2" aria-current={state === 'active' ? 'step' : undefined}>
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className={`absolute top-3 left-[calc(50%+16px)] h-px w-[calc(100%-20px)] transition-colors duration-500 ${
                  state === 'done' ? 'bg-accent/40' : 'bg-white/8'
                }`}
              />
            )}
            <span
              className={`relative flex size-6 items-center justify-center rounded-full border transition-colors duration-500 ${
                state === 'done'
                  ? 'border-accent/80 bg-accent/70'
                  : state === 'active'
                    ? 'border-[rgb(103_230_142/0.43)] bg-[rgb(80_226_130/0.39)]'
                    : 'border-white/10 bg-white/[0.04]'
              }`}
            >
              {state === 'done' ? (
                <img src={checkIcon} alt="" width={12} height={12} />
              ) : (
                <span
                  className={`font-mono text-[10px] leading-[13.33px] font-medium ${
                    state === 'active' ? 'text-fg-faint' : 'text-fg-subtle'
                  }`}
                >
                  {i + 1}
                </span>
              )}
              {state === 'active' && (
                <span aria-hidden className="bg-accent/30 absolute inset-0 animate-ping rounded-full" />
              )}
            </span>
            <span
              className={`text-center text-[10px] leading-[12.5px] ${
                state === 'done' ? 'text-fg-muted' : state === 'active' ? 'text-fg' : 'text-fg-subtle'
              }`}
            >
              {step.label}
              <span className="sr-only">{state === 'done' ? ' (완료)' : state === 'active' ? ' (진행 중)' : ' (대기)'}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
