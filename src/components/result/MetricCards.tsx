import infoIcon from '../../assets/icons/info.svg'
import { Card, Eyebrow } from '../common/Card'
import { StatusBadge } from '../common/StatusBadge'

export function SpeedCard({ speedKmh }: { speedKmh: number }) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Eyebrow>추정 최고 속도</Eyebrow>
        <StatusBadge tone="warn">ESTIMATED</StatusBadge>
      </div>
      <p className="flex items-end gap-2 pt-3">
        <span className="font-display text-fg text-[48px] leading-[48px] tabular-nums sm:text-[68px] sm:leading-[68px]">
          {speedKmh.toFixed(1)}
        </span>
        <span className="text-fg-muted pb-1.5 text-lg leading-7 font-medium">km/h</span>
      </p>
      <p className="text-fg-subtle flex items-center gap-1.5 pt-2 text-xs leading-4">
        단일 카메라 추적 기반 추정값
        <span
          tabIndex={0}
          className="group relative inline-flex rounded-full"
          aria-label="속도 추정 방식 안내"
        >
          <img src={infoIcon} alt="" width={13} height={13} />
          <span
            role="tooltip"
            className="bg-surface text-fg-muted shadow-ring-strong pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-56 -translate-x-1/2 rounded-lg p-3 text-xs leading-[18px] opacity-0 transition group-hover:opacity-100 group-focus:opacity-100"
          >
            골대 크기를 기준으로 화면 거리를 실제 거리로 환산하고, 프레임 간 공의 이동 거리로 속도를 추정합니다.
          </span>
        </span>
      </p>
    </Card>
  )
}

export function ScoreCard({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score))
  return (
    <Card className="p-5">
      <Eyebrow>파워 점수</Eyebrow>
      <p className="flex items-end gap-2 pt-3">
        <span className="font-display text-fg text-[44px] leading-[44px] tabular-nums sm:text-[60px] sm:leading-[60px]">
          {score}
        </span>
        <span className="text-fg-muted pb-1.5 text-lg leading-7 font-medium">/ 100</span>
      </p>
      <div
        role="meter"
        aria-label="파워 점수"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
        className="mt-3 h-1 overflow-hidden rounded-full bg-white/8"
      >
        <div
          className="from-accent to-track h-full origin-left rounded-full bg-gradient-to-r transition-[width] duration-700"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <p className="text-fg-subtle pt-2 text-xs leading-4">추정 속도를 기반으로 한 참고 지표</p>
    </Card>
  )
}

export function FeedbackCard({ feedback }: { feedback: string }) {
  return (
    <Card className="col-span-2 flex-1 p-5">
      <Eyebrow>SHOT FEEDBACK</Eyebrow>
      <p className="text-fg pt-3 text-sm leading-[22.75px]">{feedback}</p>
    </Card>
  )
}
