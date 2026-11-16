import infoIcon from '../../assets/icons/info.svg'
import type { GoalStatus } from '../../types/analysis'
import { FAILURE_DETAIL_COPY, SPEED_HOLD_FALLBACK } from '../../utils/failureCopy'
import { Card, Eyebrow } from '../common/Card'
import { StatusBadge } from '../common/StatusBadge'

/** 수치 대신 '보류'·'미평가' 같은 상태를 표시할 때. 한글이 좁은 모바일 카드에 들어가도록 숫자보다 작게 */
function HeldValue({ children }: { children: string }) {
  return (
    <span className="font-display text-fg-subtle text-[30px] leading-[48px] sm:text-[40px] sm:leading-[60px]">
      {children}
    </span>
  )
}

/** speedKmh가 null이면 속도 보류 */
export function SpeedCard({ speedKmh }: { speedKmh: number | null }) {
  if (speedKmh === null) {
    return (
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Eyebrow>추정 슈팅 속도</Eyebrow>
          <StatusBadge>ON HOLD</StatusBadge>
        </div>
        <p className="pt-3">
          <HeldValue>보류</HeldValue>
        </p>
        <p className="text-fg-subtle pt-2 text-xs leading-4 break-keep">공은 추적했지만 속도는 계산하지 못했어요</p>
      </Card>
    )
  }
  return (
    // Card와 같은 모양이지만 overflow를 자르지 않는다 (좁은 모바일 카드에서 설명 툴팁이 잘리지 않도록)
    <div className="bg-card shadow-ring rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Eyebrow>추정 슈팅 속도</Eyebrow>
        <StatusBadge tone="warn">ESTIMATED</StatusBadge>
      </div>
      <p className="flex items-end gap-2 pt-3">
        <span className="font-display text-fg text-[48px] leading-[48px] tabular-nums sm:text-[68px] sm:leading-[68px]">
          {speedKmh.toFixed(1)}
        </span>
        <span className="text-fg-muted pb-1.5 text-lg leading-7 font-medium">km/h</span>
      </p>
      <p className="text-fg-subtle flex items-center gap-1.5 pt-2 text-xs leading-4 break-keep">
        공을 찬 직후 구간의 평균값
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
            공의 크기(지름 약 22cm)로 카메라와의 거리를 추정하고, 공을 찬 직후 날아가는 구간의 평균 속도를 계산합니다.
            최고 속도나 공을 차는 순간의 속도가 아닌, 단일 카메라 영상 기반 추정값입니다.
          </span>
        </span>
      </p>
    </div>
  )
}

const GOAL_LABEL: Record<GoalStatus, { text: string; color: string }> = {
  GOAL: { text: '골인', color: 'text-accent' },
  OUTSIDE: { text: '노골', color: 'text-danger' },
  // 영상만으로 골라인 통과를 확정할 수 없는 경우. 노골로 보이지 않도록 중립 색
  UNDETERMINED: { text: '판정 보류', color: 'text-fg-muted' },
}

/** 슈팅의 핵심 결과라 속도·점수와 비슷한 크기로 표시 */
export function GoalResult({ goal }: { goal: GoalStatus }) {
  const label = GOAL_LABEL[goal]
  return (
    <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className="text-fg-muted text-sm leading-5">골인 여부</span>
      <span className={`font-display text-[36px] leading-10 tracking-[1px] ${label.color}`}>{label.text}</span>
      {goal === 'UNDETERMINED' && (
        <span className="text-fg-subtle text-xs leading-4 break-keep">영상만으로는 골라인 통과를 확정하기 어려워요</span>
      )}
    </p>
  )
}

/** score가 null이면 미평가. note: utils/scoreNote */
export function ScoreCard({ score, note }: { score: number | null; note: string }) {
  const clamped = score === null ? 0 : Math.max(0, Math.min(100, score))
  return (
    <Card className="p-5">
      <Eyebrow>슈팅 점수</Eyebrow>
      {score === null ? (
        <p className="pt-3">
          <HeldValue>미평가</HeldValue>
        </p>
      ) : (
        <p className="flex items-end gap-2 pt-3">
          <span className="font-display text-fg text-[44px] leading-[44px] tabular-nums sm:text-[60px] sm:leading-[60px]">
            {score}
          </span>
          <span className="text-fg-muted pb-1.5 text-lg leading-7 font-medium">/ 100</span>
        </p>
      )}
      <div
        {...(score === null
          ? { 'aria-hidden': true }
          : { role: 'meter', 'aria-label': '슈팅 점수', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': clamped })}
        className="mt-3 h-1 overflow-hidden rounded-full bg-white/8"
      >
        <div
          className="from-accent to-track h-full origin-left rounded-full bg-gradient-to-r transition-[width] duration-700"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <p className="text-fg-subtle pt-2 text-xs leading-4 break-keep">{note}</p>
    </Card>
  )
}

/** 부분 결과에서 속도를 보류한 이유와 다시 촬영할 때의 방법 (피드백 카드 자리에 표시) */
export function HoldReasonCard({ reason }: { reason: string }) {
  const copy = FAILURE_DETAIL_COPY[reason] ?? SPEED_HOLD_FALLBACK
  return (
    <Card className="col-span-2 flex-1 p-5 shadow-[0_0_0_1px_rgb(201_138_46/0.2)]">
      <Eyebrow>속도를 보류한 이유</Eyebrow>
      <p className="text-fg pt-3 text-sm leading-5 font-medium">{copy.title}</p>
      <p className="text-fg-muted pt-1 text-sm leading-[22.75px]">{copy.description}</p>
      <p className="text-warn pt-4 text-xs leading-4 font-medium">다시 촬영할 때</p>
      <p className="text-fg-muted pt-1 text-sm leading-[22.75px]">{copy.solution}</p>
      <p className="text-fg-faint pt-3 font-mono text-[10px] leading-[15px] tracking-[1px]">{reason}</p>
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
