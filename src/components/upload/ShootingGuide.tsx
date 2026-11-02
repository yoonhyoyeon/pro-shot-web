import arrowIcon from '../../assets/icons/arrow-right.svg'
import type { CalibrationResult } from '../../types/calibration'
import { Card } from '../common/Card'
import { StatusBadge } from '../common/StatusBadge'

const GUIDES = [
  { title: '대각선 뒤 약 30°', description: '슈팅 위치의 대각선 뒤 약 30°에 카메라를 삼각대로 고정해주세요.' },
  { title: '공·궤적·골대가 한 화면에', description: '차기 전 공과 슛 직후 궤적, 골대 전체가 화면에 보이도록 조정해주세요.' },
  { title: '수평에 가깝게, 그대로 촬영', description: '카메라를 아래로 많이 기울이지 말고, 촬영 중 이동이나 줌 변경은 하지 마세요.' },
]

interface ShootingGuideProps {
  onOpenGuide: () => void
  calibration: CalibrationResult | null
  onOpenCalibration: () => void
}

export function ShootingGuide({ onOpenGuide, calibration, onOpenCalibration }: ShootingGuideProps) {
  return (
    <aside id="shooting-guide" className="flex scroll-mt-20 flex-col gap-4">
      <Card className="flex-1 p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-fg-subtle font-mono text-xs leading-4 tracking-[1.2px] uppercase">촬영 전 확인해주세요</h2>
          <button
            type="button"
            onClick={onOpenGuide}
            className="text-accent -my-2 flex items-center gap-1 py-2 text-xs leading-4 font-medium hover:underline pointer-coarse:min-h-11"
          >
            자세히 보기
          </button>
        </div>
        <ol className="flex flex-col gap-5 pt-5">
          {GUIDES.map((guide, i) => (
            <li key={guide.title} className="flex gap-4">
              <span className="text-accent/60 w-6 shrink-0 pt-0.5 font-mono text-xs leading-4 font-medium">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <p className="text-fg text-sm leading-5 font-medium">{guide.title}</p>
                <p className="text-fg-subtle pt-1 text-xs leading-[19.5px]">{guide.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <Card className="p-5">
        {calibration ? (
          <>
            <p className="text-fg-muted text-sm leading-5">카메라 보정이 적용되어 있어요</p>
            <p className="text-fg-subtle pt-1 font-mono text-xs leading-4">
              {calibration.image_size.width}×{calibration.image_size.height} · 오차 {calibration.rms_error.toFixed(2)}px
            </p>
          </>
        ) : (
          <>
            <p className="text-fg-muted text-sm leading-5">더 정확한 분석이 필요하신가요?</p>
            <p className="text-fg-subtle pt-1 text-xs leading-4">체스보드 영상을 이용해 렌즈 왜곡을 보정할 수 있습니다.</p>
          </>
        )}
        <div className="flex items-center justify-between pt-4">
          {calibration ? (
            <StatusBadge tone="accent" dot>
              CALIBRATED
            </StatusBadge>
          ) : (
            <StatusBadge>선택 기능</StatusBadge>
          )}
          <button
            type="button"
            onClick={onOpenCalibration}
            className="text-fg-muted hover:text-fg flex items-center gap-2 text-sm leading-5 transition pointer-coarse:min-h-11"
          >
            {calibration ? '보정 관리' : '카메라 보정하기'}
            <img src={arrowIcon} alt="" width={16} height={16} />
          </button>
        </div>
      </Card>
    </aside>
  )
}
