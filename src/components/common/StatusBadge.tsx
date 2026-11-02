import type { ReactNode } from 'react'

type Tone = 'neutral' | 'accent' | 'warn' | 'danger' | 'track'

const tones: Record<Tone, string> = {
  neutral: 'bg-white/5 border-white/8 text-fg-muted',
  accent: 'bg-accent/10 border-accent/25 text-accent',
  warn: 'bg-warn/10 border-warn/25 text-warn',
  danger: 'bg-danger/10 border-danger/25 text-danger',
  track: 'bg-track/10 border-track/25 text-track',
}

const dots: Record<Tone, string> = {
  neutral: 'bg-fg-muted',
  accent: 'bg-accent',
  warn: 'bg-warn',
  danger: 'bg-danger',
  track: 'bg-track',
}

interface StatusBadgeProps {
  tone?: Tone
  dot?: boolean
  children: ReactNode
}

export function StatusBadge({ tone = 'neutral', dot = false, children }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-[3px] font-mono text-[10px] leading-[15px] font-medium tracking-[1px] uppercase ${tones[tone]}`}
    >
      {dot && <span className={`size-1.5 rounded-full ${dots[tone]}`} aria-hidden />}
      {children}
    </span>
  )
}
