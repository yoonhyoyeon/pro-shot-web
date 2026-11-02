import arrowIcon from '../assets/icons/arrow-right-dark.svg'
import { Button } from '../components/common/Button'
import { Card, Eyebrow } from '../components/common/Card'
import { CameraPositionDiagram } from '../components/guide/CameraPositionDiagram'
import { ShotExamples } from '../components/guide/ShotExamples'
import { VIDEO_RULES } from '../utils/videoValidation'

/** AI 파트 요구사항 기준 촬영 조건 */
const CHECKLIST = [
  {
    title: '슈팅 위치의 대각선 뒤 약 30°에 두세요',
    description: '공과 골대 중심을 잇는 선을 기준으로, 공 뒤쪽에서 좌우 약 30° 벗어난 곳입니다. 예를 들어 공보다 5m 뒤, 3m 옆이면 약 31°예요.',
  },
  {
    title: '공, 궤적, 골대가 한 화면에 보이게',
    description: '차기 전 공, 슛 직후 공이 날아가는 구간, 골대 전체가 함께 보이도록 화면을 맞춰주세요.',
  },
  {
    title: '공이 가리지 않게, 카메라는 수평에 가깝게',
    description: '공이 다리에 가리지 않도록 높이와 방향을 조정하되, 카메라를 아래로 많이 기울이지 마세요. AI는 화면 아래쪽을 중력 방향으로 계산합니다.',
  },
  {
    title: '삼각대로 고정하고 그대로 촬영하세요',
    description: '촬영 중에는 카메라를 옮기거나 줌을 바꾸지 마세요. 카메라 보정을 했다면 보정할 때와 같은 렌즈와 촬영 모드를 사용해주세요.',
  },
]

const SETTINGS = [
  { label: '해상도', value: '1080p 이상', note: `최소 ${VIDEO_RULES.minShortSide}p` },
  { label: '프레임', value: '60fps 권장', note: '빠른 공의 흐림 감소' },
  { label: '길이', value: `${VIDEO_RULES.maxDuration}초 이내`, note: '슈팅 장면만' },
  { label: '렌즈 · 줌', value: '촬영 중 변경 금지', note: '보정과 같은 렌즈·모드' },
]

interface GuidePageProps {
  onStartUpload: () => void
}

export function GuidePage({ onStartUpload }: GuidePageProps) {
  return (
    <div className="animate-fade-in flex flex-col gap-10">
      <section>
        <p className="text-accent font-mono text-[10px] leading-[15px] tracking-[1px] uppercase">SHOOTING GUIDE</p>
        <h1 className="font-display text-fg pt-3 text-[36px] leading-[42px] tracking-[1.1px] sm:text-[44px] sm:leading-[48px]">
          정확한 분석을 위한 촬영 가이드
        </h1>
        <p className="text-fg-muted pt-3 text-sm leading-[22.75px]">
          카메라는 슈팅 위치의 대각선 뒤 약 30°에 고정해 주세요. 차기 전 공과 슛 직후 궤적, 골대 전체가 화면에 보이도록 조정해 주세요.
        </p>
      </section>

      <section aria-labelledby="checklist-title" className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="p-5 sm:p-6 lg:self-start">
          <h2 id="checklist-title" className="text-fg-subtle font-mono text-xs leading-4 tracking-[1.2px] uppercase">
            촬영 전 체크리스트
          </h2>
          <ol className="flex flex-col gap-5 pt-5">
            {CHECKLIST.map((item, i) => (
              <li key={item.title} className="flex gap-4">
                <span className="text-accent/60 w-6 shrink-0 pt-0.5 font-mono text-xs leading-4 font-medium">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <p className="text-fg text-sm leading-5 font-medium">{item.title}</p>
                  <p className="text-fg-subtle pt-1 text-xs leading-[19.5px]">{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
        <CameraPositionDiagram />
      </section>

      <section aria-labelledby="examples-title">
        <h2 id="examples-title" className="text-fg pb-4 text-base leading-6 font-medium">
          이렇게 찍으면 분석이 어려워요
        </h2>
        <ShotExamples />
      </section>

      <section aria-labelledby="settings-title">
        <h2 id="settings-title" className="text-fg pb-4 text-base leading-6 font-medium">
          권장 카메라 설정
        </h2>
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {SETTINGS.map((s) => (
            <Card key={s.label} className="p-4">
              <dt>
                <Eyebrow>{s.label}</Eyebrow>
              </dt>
              <dd className="text-fg pt-2 text-base leading-6 font-medium">{s.value}</dd>
              <dd className="text-fg-subtle pt-0.5 text-xs leading-4">{s.note}</dd>
            </Card>
          ))}
        </dl>
      </section>

      <div className="flex justify-center">
        <Button onClick={onStartUpload}>
          영상 업로드하러 가기
          <img src={arrowIcon} alt="" width={14} height={14} />
        </Button>
      </div>
    </div>
  )
}
