import { SAMPLE_FRAME } from '../../mocks/mockAnalysis'

interface Example {
  ok: boolean
  title: string
  description: string
  /** 샘플 프레임에 적용해 잘못된 촬영 상태를 재현하는 스타일 */
  imageClass: string
}

const EXAMPLES: Example[] = [
  {
    ok: true,
    title: '좋은 예',
    description: '차기 전 공, 슛 직후 궤적이 지나갈 공간, 골대 전체가 함께 보여요.',
    imageClass: '',
  },
  {
    ok: false,
    title: '골대가 잘림',
    description: '골대 크기로 실제 거리를 환산하므로 골대가 모두 보여야 해요.',
    imageClass: 'scale-[1.9] origin-[15%_95%]',
  },
  {
    ok: false,
    title: '너무 어두움',
    description: '공을 찾기 어려워요. 해가 있는 시간이나 밝은 조명 아래에서 찍어주세요.',
    imageClass: 'brightness-[0.3] contrast-75',
  },
  {
    ok: false,
    title: '흔들림 · 흐림',
    description: '카메라가 움직이면 공의 이동과 구분할 수 없어요. 삼각대에 고정해주세요.',
    imageClass: 'blur-[3px] scale-105',
  },
]

/** 샘플 프레임으로 재현한 좋은 촬영 예와 나쁜 촬영 예 */
export function ShotExamples() {
  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {EXAMPLES.map((ex) => (
        <li
          key={ex.title}
          className={`bg-card overflow-hidden rounded-2xl ${
            ex.ok ? 'shadow-[0_0_0_1.5px_rgb(57_224_121/0.5)]' : 'shadow-ring'
          }`}
        >
          <div className="relative aspect-video overflow-hidden bg-black">
            <img
              src={SAMPLE_FRAME.url}
              alt={`${ex.title} 예시`}
              className={`size-full object-cover ${ex.imageClass}`}
              loading="lazy"
            />
            <span
              className={`absolute top-2 left-2 flex size-6 items-center justify-center rounded-full text-xs font-bold ${
                ex.ok ? 'bg-accent text-bg' : 'bg-danger text-white'
              }`}
              aria-hidden
            >
              {ex.ok ? '✓' : '✕'}
            </span>
          </div>
          <div className="p-3 sm:p-4">
            <p className={`text-sm leading-5 font-medium ${ex.ok ? 'text-accent' : 'text-fg'}`}>
              <span className="sr-only">{ex.ok ? '권장: ' : '비권장: '}</span>
              {ex.title}
            </p>
            <p className="text-fg-subtle pt-1 text-xs leading-[18px]">{ex.description}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
