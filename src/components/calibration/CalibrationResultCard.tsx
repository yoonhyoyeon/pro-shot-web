import arrowIcon from '../../assets/icons/arrow-right-dark.svg'
import type { CalibrationResult } from '../../types/calibration'
import { QUALITY_LABEL, calibrationQuality } from '../../utils/calibration'
import { Button } from '../common/Button'
import { Card, Eyebrow } from '../common/Card'
import { StatusBadge } from '../common/StatusBadge'

const QUALITY_TONE = { good: 'accent', fair: 'warn', poor: 'danger' } as const

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })

/** 보정 결과 핵심 수치 (해상도 · 사용 프레임 · 재투영 오차). compact: 좁은 옆 칸용 목록 */
export function CalibrationMetrics({ result, compact = false }: { result: CalibrationResult; compact?: boolean }) {
  const quality = calibrationQuality(result.rms_error)
  const items = [
    { label: '보정 해상도', value: `${result.image_size.width}×${result.image_size.height}` },
    {
      label: '사용한 프레임',
      value: result.frames_total ? `${result.frames_used} / ${result.frames_total}` : `${result.frames_used}장`,
    },
    {
      label: '재투영 오차',
      value: `${result.rms_error.toFixed(2)}px`,
      badge: <StatusBadge tone={QUALITY_TONE[quality]}>{QUALITY_LABEL[quality]}</StatusBadge>,
    },
  ]
  if (compact) {
    return (
      <dl className="flex flex-col gap-2.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3">
            <dt className="text-fg-subtle text-xs leading-4">{item.label}</dt>
            <dd className="text-fg flex items-center gap-2 font-mono text-sm leading-5 tabular-nums">
              {item.value}
              {item.badge}
            </dd>
          </div>
        ))}
      </dl>
    )
  }
  return (
    <dl className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <div key={item.label} className="bg-surface shadow-ring rounded-xl p-3 sm:p-4">
          <dt>
            <Eyebrow>{item.label}</Eyebrow>
          </dt>
          <dd className="text-fg pt-1.5 font-mono text-sm leading-5 font-medium tabular-nums sm:text-base">{item.value}</dd>
          {item.badge && <dd className="pt-1.5">{item.badge}</dd>}
        </div>
      ))}
    </dl>
  )
}

interface CalibrationResultCardProps {
  result: CalibrationResult
  onUseForAnalysis: () => void
  onRecalibrate: () => void
}

/** 보정 완료 화면 */
export function CalibrationResultCard({ result, onUseForAnalysis, onRecalibrate }: CalibrationResultCardProps) {
  const quality = calibrationQuality(result.rms_error)
  return (
    <div className="bg-surface shadow-ring-strong animate-fade-in flex h-full flex-col gap-5 rounded-2xl p-5 sm:p-6">
      <div>
        <StatusBadge tone="accent" dot>
          CALIBRATED
        </StatusBadge>
        <h2 className="font-display text-fg pt-2 text-[28px] leading-8 tracking-[1px]">보정이 완료되었어요</h2>
        <p className="text-fg-muted pt-1.5 text-sm leading-[22.75px]">
          이 휴대폰의 보정값을 저장했어요. 다음 분석부터 자동으로 적용됩니다.
        </p>
      </div>

      <CalibrationMetrics result={result} />

      {quality === 'poor' && (
        <p role="alert" className="text-warn text-xs leading-[19.5px]">
          재투영 오차가 커서 보정이 정확하지 않을 수 있어요. 체스보드를 더 천천히, 화면 여러 위치로 옮기며 다시 촬영해보세요.
        </p>
      )}

      <Card className="p-4">
        <Eyebrow>측정한 카메라 값</Eyebrow>
        <dl className="text-fg-muted flex flex-wrap gap-x-8 gap-y-1 pt-2 font-mono text-xs leading-5 tabular-nums">
          <div className="flex gap-3">
            <dt className="text-fg-subtle">초점거리 fx · fy</dt>
            <dd>
              {result.fx.toFixed(0)} · {result.fy.toFixed(0)}
            </dd>
          </div>
          <div className="flex gap-3">
            <dt className="text-fg-subtle">주점 cx · cy</dt>
            <dd>
              {result.cx.toFixed(0)} · {result.cy.toFixed(0)}
            </dd>
          </div>
        </dl>
        <p className="text-fg-subtle pt-3 text-xs leading-[19.5px]">
          같은 휴대폰 · 같은 렌즈 배율 · 같은 촬영 모드로 찍은 영상에만 맞는 값입니다. 측정일 {formatDate(result.created_at)}
        </p>
      </Card>

      <div className="mt-auto flex flex-wrap gap-3">
        <Button onClick={onUseForAnalysis}>
          이 보정으로 슈팅 분석하기
          <img src={arrowIcon} alt="" width={14} height={14} />
        </Button>
        <Button variant="secondary" onClick={onRecalibrate}>
          다시 보정하기
        </Button>
      </div>
    </div>
  )
}
