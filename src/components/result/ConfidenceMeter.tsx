function getLevel(confidence: number) {
  if (confidence >= 0.75) return { label: '높음', text: 'text-accent', bg: 'bg-accent/10' }
  if (confidence >= 0.5) return { label: '보통', text: 'text-warn', bg: 'bg-warn/10' }
  return { label: '낮음', text: 'text-danger', bg: 'bg-danger/10' }
}

/** 분석 신뢰도(0~1)를 퍼센트와 등급으로 표시 */
export function ConfidenceMeter({ confidence }: { confidence: number }) {
  const percent = Math.round(confidence * 100)
  const level = getLevel(confidence)

  return (
    <div className="flex items-center gap-2" title="AI가 공을 안정적으로 추적한 정도">
      <span className="text-fg-subtle font-mono text-[10px] leading-[15px] tracking-[1px]">분석 신뢰도</span>
      <span className={`font-mono text-xs leading-4 font-medium tabular-nums ${level.text}`}>{percent}%</span>
      <span className={`rounded px-1.5 py-px font-mono text-[10px] leading-[15px] ${level.text} ${level.bg}`}>
        {level.label}
      </span>
    </div>
  )
}
