import ballIcon from '../../assets/icons/ball-alt.svg'
import cameraIcon from '../../assets/icons/camera.svg'
import settingsIcon from '../../assets/icons/settings-gear.svg'

interface HeaderProps {
  onLogoClick: () => void
  onGuideClick: () => void
  onCalibrationClick: () => void
}

export function Header({ onLogoClick, onGuideClick, onCalibrationClick }: HeaderProps) {
  return (
    <header className="bg-bg/90 sticky top-0 z-20 border-b border-white/5 backdrop-blur-md">
      <div className="mx-auto flex h-[52px] max-w-[1240px] items-center justify-between px-4 sm:px-6">
        <button type="button" onClick={onLogoClick} className="flex items-center gap-3 rounded-lg" aria-label="PRO SHOT 처음으로">
          <img src={ballIcon} alt="" width={22} height={22} />
          <span className="flex items-baseline gap-[11px] uppercase">
            <span className="font-display text-fg text-[17px] leading-[25.5px] tracking-[2.38px]">PRO SHOT</span>
            <span className="text-fg-subtle hidden font-mono text-[9px] leading-[13.5px] font-medium tracking-[0.9px] sm:inline">
              ANALYZER
            </span>
          </span>
        </button>

        <nav className="flex items-center gap-1">
          <button
            type="button"
            onClick={onGuideClick}
            className="text-fg-muted hover:text-fg rounded-lg px-3 py-1.5 text-sm leading-5 transition hover:bg-white/5"
          >
            촬영 가이드
          </button>
          {/* 모바일에서는 아이콘만 표시 */}
          <button
            type="button"
            onClick={onCalibrationClick}
            aria-label="카메라 보정"
            className="text-fg-muted hover:text-fg flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm leading-5 transition hover:bg-white/5 pointer-coarse:min-h-11"
          >
            <img src={cameraIcon} alt="" width={17} height={17} />
            <span className="hidden sm:inline">카메라 보정</span>
          </button>
          <span className="pl-1">
            <button
              type="button"
              disabled
              title="설정은 준비 중입니다"
              aria-label="설정"
              className="flex rounded-lg p-2 opacity-70"
            >
              <img src={settingsIcon} alt="" width={17} height={17} />
            </button>
          </span>
        </nav>
      </div>
    </header>
  )
}
