import type { Screen } from '../../App'

const ITEMS: { screen: Screen; label: string }[] = [
  { screen: 'upload', label: '업로드' },
  { screen: 'selected', label: '영상 선택' },
  { screen: 'analyzing', label: '분석 중' },
  { screen: 'result', label: '결과' },
  { screen: 'failed', label: '분석 실패' },
  { screen: 'network-error', label: '네트워크 오류' },
  { screen: 'guide', label: '촬영 가이드' },
  { screen: 'calibration', label: '카메라 보정' },
]

interface ProtoNavProps {
  current: Screen
  onNavigate: (screen: Screen) => void
}

/** 화면 상태를 바로 전환해 확인하기 위한 프로토타입 내비게이션 */
export function ProtoNav({ current, onNavigate }: ProtoNavProps) {
  return (
    <nav
      aria-label="프로토타입 화면 전환"
      className="fixed inset-x-0 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-30 flex justify-center px-4"
    >
      <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl bg-[rgb(14_26_30/0.9)] px-3 py-2 shadow-[0_0_0_1px_rgb(255_255_255/0.1),0_20px_25px_-5px_rgb(0_0_0/0.1),0_8px_10px_-6px_rgb(0_0_0/0.1)] backdrop-blur-md">
        <span className="text-fg-subtle hidden pr-2 font-mono text-[10px] leading-[15px] tracking-[1px] sm:inline">
          PROTOTYPE
        </span>
        {ITEMS.map(({ screen, label }) => {
          const active = screen === current
          return (
            <button
              key={screen}
              type="button"
              onClick={() => onNavigate(screen)}
              aria-current={active ? 'page' : undefined}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-xs leading-4 font-medium whitespace-nowrap transition ${
                active ? 'bg-accent text-bg' : 'text-fg-muted hover:text-fg hover:bg-white/5'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
