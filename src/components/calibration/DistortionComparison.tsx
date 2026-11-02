/**
 * 보정 전후 비교 안내도.
 * 광각 렌즈의 술통형 왜곡(가장자리가 안쪽으로 휨)을 격자와 골대 모양으로 보여준다.
 * 실제 영상 측정값이 아니라 왜곡 모델 x' = x · (1 + k·r²)로 그린 설명용 그림이다.
 */

const W = 220
const H = 140
const CX = W / 2
const CY = H / 2
/** 정규화 반지름 기준 (화면 대각선의 절반) */
const R = Math.hypot(CX, CY)
/** 음수면 술통형 왜곡 */
const K = -0.16

type Point = [number, number]

function distort([x, y]: Point): Point {
  const dx = (x - CX) / R
  const dy = (y - CY) / R
  const f = 1 + K * (dx * dx + dy * dy)
  return [CX + (x - CX) * f, CY + (y - CY) * f]
}

/** 직선을 잘게 나눠 왜곡을 적용한 경로 */
function linePath(a: Point, b: Point, distorted: boolean, steps = 24): string {
  const pts = Array.from({ length: steps + 1 }, (_, i): Point => {
    const t = i / steps
    const p: Point = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
    return distorted ? distort(p) : p
  })
  return pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
}

const GRID_X = [0, 1, 2, 3, 4, 5, 6].map((i) => 8 + (i * (W - 16)) / 6)
const GRID_Y = [0, 1, 2, 3, 4].map((i) => 8 + (i * (H - 16)) / 4)
/** 화면 위쪽 가장자리에 걸친 골대 (왼쪽 기둥 → 크로스바 → 오른쪽 기둥) */
const GOAL: Point[] = [
  [26, 74],
  [26, 16],
  [194, 16],
  [194, 74],
]
/** 화면 오른쪽 가장자리 근처의 공 */
const BALL: Point = [200, 108]

function Panel({ distorted }: { distorted: boolean }) {
  const ball = distorted ? distort(BALL) : BALL
  const color = distorted ? '#e05439' : '#39e079'
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="bg-bg w-full rounded-xl" aria-hidden>
      <g stroke="#a5b0ac" strokeOpacity="0.22" strokeWidth="1" fill="none">
        {GRID_X.map((x) => (
          <path key={`x${x}`} d={linePath([x, 8], [x, H - 8], distorted)} />
        ))}
        {GRID_Y.map((y) => (
          <path key={`y${y}`} d={linePath([8, y], [W - 8, y], distorted)} />
        ))}
      </g>
      <path
        d={GOAL.slice(1)
          .map((p, i) => linePath(GOAL[i], p, distorted))
          .join(' ')}
        fill="none"
        stroke="#f5f7f6"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {distorted && <circle cx={BALL[0]} cy={BALL[1]} r="6" fill="none" stroke="#a5b0ac" strokeDasharray="2 2" />}
      <circle cx={ball[0]} cy={ball[1]} r="6" fill={color} />
    </svg>
  )
}

export function DistortionComparison() {
  return (
    <figure
      className="grid gap-3 sm:grid-cols-2"
      role="img"
      aria-label="보정 전에는 화면 가장자리의 골대와 격자가 안쪽으로 휘어 보이고 공 위치가 실제와 어긋납니다. 보정 후에는 직선이 곧게 펴지고 공이 실제 위치에 놓입니다."
    >
      <div className="flex flex-col gap-2">
        <Panel distorted />
        <figcaption className="text-fg-subtle text-xs leading-[19.5px]">
          <span className="text-danger font-medium">보정 전</span> · 가장자리의 직선이 휘고, 공이 실제 위치(점선)보다 안쪽에
          보입니다.
        </figcaption>
      </div>
      <div className="flex flex-col gap-2">
        <Panel distorted={false} />
        <figcaption className="text-fg-subtle text-xs leading-[19.5px]">
          <span className="text-accent font-medium">보정 후</span> · 휘어짐을 되돌려 직선은 곧게, 공은 실제 위치에 놓입니다.
        </figcaption>
      </div>
    </figure>
  )
}
