import cameraIcon from '../../assets/icons/camera.svg'
import warningIcon from '../../assets/icons/warning.svg'
import type { RetakeAdvice } from '../../utils/retake'
import { Button } from '../common/Button'
import { Card } from '../common/Card'

interface RetakePromptProps {
  advice: RetakeAdvice
  onRetake: () => void
  onGuideClick: () => void
}

/** 결과 일부가 촬영 때문에 보류됐을 때, 무엇이 부족했는지와 다시 찍는 방법을 결과 위에 안내한다 */
export function RetakePrompt({ advice, onRetake, onGuideClick }: RetakePromptProps) {
  return (
    <Card className="mt-6 p-5 shadow-[0_0_0_1px_rgb(201_138_46/0.3)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-3">
          <img src={warningIcon} alt="" width={16} height={16} className="mt-0.5 shrink-0 self-start" />
          <div>
            <p className="text-warn text-sm leading-5 font-medium">다시 촬영하면 더 정확한 결과를 받을 수 있어요</p>
            <p className="text-fg-muted pt-1 text-xs leading-[18px]">{advice.reasons.join(' · ')}</p>
            <ul className="flex flex-col gap-1 pt-2.5">
              {advice.tips.map((tip) => (
                <li key={tip} className="text-fg flex gap-2 text-sm leading-[21px] break-keep">
                  <span aria-hidden className="text-warn">·</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 pl-7 lg:pl-0">
          <Button onClick={onRetake}>
            <img src={cameraIcon} alt="" width={14} height={14} className="brightness-0" />
            다시 촬영하기
          </Button>
          <Button variant="secondary" onClick={onGuideClick}>
            촬영 가이드
          </Button>
        </div>
      </div>
    </Card>
  )
}
