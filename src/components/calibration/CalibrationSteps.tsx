import { useEffect, useMemo } from 'react'
import { CHECKERBOARD, checkerboardSvg } from '../../utils/calibration'
import { Card } from '../common/Card'

const { innerCols, innerRows, squareMm } = CHECKERBOARD

const STEPS = [
  {
    title: '체스보드 준비',
    description: `A4 용지에 실제 크기(100%)로 인쇄해 평평한 판에 붙여주세요. 가로 ${innerCols + 1}칸 × 세로 ${innerRows + 1}칸, 한 칸 ${squareMm}mm입니다.`,
  },
  {
    title: '분석과 같은 카메라로',
    description: '슈팅을 찍을 휴대폰으로, 같은 렌즈 배율(예: 1x)·해상도·프레임 설정에서 촬영하세요. 촬영 중 줌은 바꾸지 마세요.',
  },
  {
    title: '여러 위치·각도로 촬영',
    description: '체스보드 전체가 보이게 화면 가운데와 네 모서리, 기울인 각도로 천천히 옮기며 10~20초 촬영하세요. 흔들림과 빛 반사는 피해주세요.',
  },
]

/** 보정 영상 촬영 3단계와 인쇄용 체스보드 */
export function CalibrationSteps() {
  // 인쇄용 체스보드 파일 (A4 가로, 실제 크기 mm 단위 SVG)
  const downloadUrl = useMemo(
    () => URL.createObjectURL(new Blob([checkerboardSvg()], { type: 'image/svg+xml' })),
    [],
  )
  useEffect(() => () => URL.revokeObjectURL(downloadUrl), [downloadUrl])

  return (
    <ol className="grid gap-3 md:grid-cols-3">
      {STEPS.map((step, i) => (
        <li key={step.title}>
          <Card className="flex h-full flex-col p-5">
            <span className="text-accent/60 font-mono text-xs leading-4 font-medium">STEP {String(i + 1).padStart(2, '0')}</span>
            <p className="text-fg pt-2 text-sm leading-5 font-medium">{step.title}</p>
            <p className="text-fg-subtle pt-1 text-xs leading-[19.5px]">{step.description}</p>
            {i === 0 && (
              <a
                href={downloadUrl}
                download={`proshot-checkerboard-${innerCols}x${innerRows}-${squareMm}mm.svg`}
                className="text-accent mt-auto flex items-center gap-1 pt-3 text-xs leading-4 font-medium hover:underline pointer-coarse:min-h-11"
              >
                체스보드 이미지 받기 (A4 · SVG)
              </a>
            )}
          </Card>
        </li>
      ))}
    </ol>
  )
}
