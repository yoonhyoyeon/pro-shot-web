import checkIcon from '../../assets/icons/check.svg'
import warningIcon from '../../assets/icons/warning-sm.svg'
import type { SelectedVideo } from '../../types/analysis'
import type { CalibrationResult } from '../../types/calibration'
import { compareCalibration } from '../../utils/calibration'

const size = (s: { width: number; height: number }) => `${s.width}×${s.height}`

/** 선택한 영상에 저장된 카메라 보정을 적용할 수 있는지 안내 */
export function CalibrationNotice({ calibration, video }: { calibration: CalibrationResult | null; video: SelectedVideo }) {
  if (!calibration || !video.metadata) return null
  const match = compareCalibration(calibration.image_size, video.metadata)

  if (match === 'mismatch') {
    return (
      <p className="text-warn flex items-start gap-1.5 pt-1.5 text-xs leading-[18px]">
        <img src={warningIcon} alt="" width={14} height={14} className="mt-0.5 shrink-0" />
        <span>
          보정할 때와 화면 비율·방향이 달라 이번 분석에는 보정을 적용하지 않아요. (보정 {size(calibration.image_size)} · 영상{' '}
          {size(video.metadata)})
        </span>
      </p>
    )
  }
  return (
    <p className="text-accent flex items-center gap-1.5 pt-1.5 text-xs leading-4">
      <span className="bg-accent/70 flex size-3.5 shrink-0 items-center justify-center rounded-full">
        <img src={checkIcon} alt="" width={9} height={9} />
      </span>
      {match === 'same'
        ? `카메라 보정을 적용해 분석해요 (${size(calibration.image_size)})`
        : `카메라 보정을 해상도에 맞춰 조정해 적용해요 (보정 ${size(calibration.image_size)})`}
    </p>
  )
}
