import alertIcon from '../../assets/icons/alert-circle.svg'
import refreshIcon from '../../assets/icons/refresh.svg'
import wifiOffIcon from '../../assets/icons/wifi-off.svg'
import type { CalibrationErrorCode } from '../../types/calibration'
import { Button } from '../common/Button'
import { StatusBadge } from '../common/StatusBadge'

/** 원인별 안내. 영상 문제는 다시 촬영, 통신 문제는 다시 시도 */
const COPY: Record<CalibrationErrorCode, { title: string; solution: string; connection?: boolean }> = {
  CHESSBOARD_NOT_FOUND: {
    title: '체스보드를 찾지 못했어요',
    solution: '체스보드 전체가 화면 안에 들어오고, 빛 반사나 흔들림 없이 선명하게 보이도록 다시 촬영해주세요.',
  },
  NOT_ENOUGH_FRAMES: {
    title: '체스보드가 보인 장면이 부족해요',
    solution: '체스보드를 화면 가운데와 네 모서리, 기울인 각도로 천천히 옮기며 10초 이상 촬영해주세요.',
  },
  INVALID_VIDEO: {
    title: '영상을 보정에 사용할 수 없어요',
    solution: 'MP4 또는 MOV 형식의 5~30초 영상으로 다시 시도해주세요.',
  },
  NETWORK_ERROR: { title: '연결에 실패했어요', solution: '네트워크 상태를 확인한 후 다시 시도해주세요.', connection: true },
  SERVER_ERROR: { title: '서버에 문제가 발생했어요', solution: '잠시 후 다시 시도해주세요.', connection: true },
  TIMEOUT: { title: '응답 시간이 초과되었어요', solution: '잠시 후 다시 시도해주세요.', connection: true },
}

interface CalibrationErrorCardProps {
  code: CalibrationErrorCode
  rawCode?: string
  onRetry: () => void
  onChooseAnother: () => void
}

export function CalibrationErrorCard({ code, rawCode, onRetry, onChooseAnother }: CalibrationErrorCardProps) {
  const copy = COPY[code]
  return (
    <section
      role="alert"
      className="bg-surface animate-fade-in flex h-full flex-col items-center justify-center gap-3 rounded-2xl p-8 text-center shadow-[0_0_0_1px_rgb(224_84_57/0.25)]"
    >
      <span className={`flex size-14 items-center justify-center rounded-full ${copy.connection ? 'bg-white/5' : 'bg-danger/10'}`}>
        <img src={copy.connection ? wifiOffIcon : alertIcon} alt="" width={24} height={24} />
      </span>
      <StatusBadge tone={copy.connection ? 'neutral' : 'danger'}>CALIBRATION FAILED</StatusBadge>
      <h2 className="font-display text-fg text-[26px] leading-8 tracking-[1px]">{copy.title}</h2>
      <p className="text-fg-muted max-w-md text-sm leading-[22.75px]">{copy.solution}</p>
      <div className="flex flex-wrap justify-center gap-3 pt-2">
        {copy.connection ? (
          <Button onClick={onRetry}>
            <img src={refreshIcon} alt="" width={14} height={14} />
            다시 시도
          </Button>
        ) : (
          <Button onClick={onChooseAnother}>다른 영상 선택</Button>
        )}
        {copy.connection && (
          <Button variant="secondary" onClick={onChooseAnother}>
            다른 영상 선택
          </Button>
        )}
      </div>
      <p className="text-fg-faint pt-2 font-mono text-[10px] leading-[15px] tracking-[1px]">ERROR CODE · {rawCode ?? code}</p>
    </section>
  )
}
