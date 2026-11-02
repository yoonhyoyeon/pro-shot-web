interface AnalysisProgressProps {
  progress: number
  message: string
  /** 진행 바 아래 상태 표시 (UPLOADING / PROCESSING) */
  label?: string
}

/** 영상 위에 겹쳐 보이는 진행률 표시 */
export function AnalysisProgress({ progress, message, label = 'PROCESSING' }: AnalysisProgressProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-8">
      <div className="flex flex-col items-center">
        <p className="font-display text-accent text-center whitespace-nowrap tabular-nums" aria-hidden>
          <span className="text-[80px] leading-[80px] sm:text-[108px] sm:leading-[108px]">{progress}</span>
          <span className="text-accent/70 text-[32px] leading-8 sm:text-[43.2px] sm:leading-[43.2px]">%</span>
        </p>
        <p className="text-fg pt-1 text-sm leading-5 font-medium">{message}</p>
      </div>

      <div className="w-full max-w-96">
        <div
          role="progressbar"
          aria-label="분석 진행률"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-valuetext={`${progress}% · ${message}`}
          className="h-0.5 overflow-hidden rounded-full bg-white/8"
        >
          <div
            className="bg-accent h-full rounded-full shadow-[0_0_8px_rgb(57_224_121/0.5)] transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-fg-subtle flex justify-between pt-1.5 font-mono text-[10px] leading-[15px]">
          <span>{label}</span>
          <span className="tabular-nums">{progress} / 100</span>
        </div>
      </div>
    </div>
  )
}
