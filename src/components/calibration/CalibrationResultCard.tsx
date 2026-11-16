import arrowIcon from '../../assets/icons/arrow-right-dark.svg'
import type { CalibrationResult } from '../../types/calibration'
import { QUALITY_LABEL, calibrationQuality, type CalibrationQuality } from '../../utils/calibration'
import { Button } from '../common/Button'
import { StatusBadge } from '../common/StatusBadge'

const QUALITY_TONE = { good: 'accent', fair: 'warn', poor: 'danger' } as const

/** 품질 등급이 사용자에게 뜻하는 것 */
const QUALITY_MESSAGE: Record<CalibrationQuality, string> = {
  good: '체스보드를 잘 인식했어요. 이대로 분석에 사용하면 됩니다.',
  fair: '사용할 수 있지만, 더 정확한 분석을 원하면 다시 촬영해보세요.',
  poor: '보정이 정확하지 않을 수 있어요. 체스보드를 더 천천히, 화면 여러 위치로 옮기며 다시 촬영해보세요.',
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })

/** 현재 보정 요약 (좁은 옆 칸용): 품질과, 영상과 맞춰 볼 해상도 */
export function CalibrationSummary({ result }: { result: CalibrationResult }) {
  const quality = calibrationQuality(result.rms_error)
  return (
    <dl className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3">
        <dt className="text-fg-subtle text-xs leading-4">보정 품질</dt>
        <dd>
          <StatusBadge tone={QUALITY_TONE[quality]}>{QUALITY_LABEL[quality]}</StatusBadge>
        </dd>
      </div>
      <div className="flex items-center justify-between gap-3">
        <dt className="text-fg-subtle text-xs leading-4">보정 해상도</dt>
        <dd className="text-fg font-mono text-sm leading-5 tabular-nums">
          {result.image_size.width}×{result.image_size.height}
        </dd>
      </div>
    </dl>
  )
}

/** 전문 용어로 된 측정값. 궁금한 사용자만 펼쳐 보도록 접어 둔다 */
function CalibrationDetails({ result }: { result: CalibrationResult }) {
  const items = [
    { label: '보정 해상도', value: `${result.image_size.width}×${result.image_size.height}` },
    {
      label: '사용한 프레임',
      value: result.frames_total ? `${result.frames_used} / ${result.frames_total}` : `${result.frames_used}장`,
    },
    { label: '재투영 오차', value: `${result.rms_error.toFixed(2)}px` },
    { label: '초점거리 fx · fy', value: `${result.fx.toFixed(0)} · ${result.fy.toFixed(0)}` },
    { label: '주점 cx · cy', value: `${result.cx.toFixed(0)} · ${result.cy.toFixed(0)}` },
    { label: '측정일', value: formatDate(result.created_at) },
  ]
  return (
    <details className="bg-card shadow-ring rounded-xl px-4 py-3">
      <summary className="text-fg-muted hover:text-fg cursor-pointer text-sm leading-5 transition pointer-coarse:py-3">
        측정값 자세히 보기
      </summary>
      <dl className="flex flex-col gap-2.5 pt-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3">
            <dt className="text-fg-subtle text-xs leading-4">{item.label}</dt>
            <dd className="text-fg-muted font-mono text-xs leading-4 tabular-nums">{item.value}</dd>
          </div>
        ))}
      </dl>
    </details>
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

      <div>
        <p className="flex items-center gap-2.5">
          <span className="text-fg text-sm leading-5 font-medium">보정 품질</span>
          <StatusBadge tone={QUALITY_TONE[quality]}>{QUALITY_LABEL[quality]}</StatusBadge>
        </p>
        <p role={quality === 'poor' ? 'alert' : undefined} className={`pt-1.5 text-sm leading-[22.75px] ${quality === 'poor' ? 'text-warn' : 'text-fg-muted'}`}>
          {QUALITY_MESSAGE[quality]}
        </p>
        <p className="text-fg-subtle pt-1.5 text-xs leading-[19.5px]">
          같은 휴대폰, 같은 렌즈 배율, 같은 촬영 모드로 찍은 영상에 적용됩니다.
        </p>
      </div>

      <CalibrationDetails result={result} />

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
