/**
 * 촬영 위치 안내도 (AI 파트 요구사항 기준)
 * - 위치: 공 → 골대 중심선에서 공 뒤쪽으로 좌우 약 30° 벗어난 곳 (예: 5m 뒤 · 3m 옆 ≈ 31°)
 * - 기울기: 카메라를 과하게 아래로 기울이지 않기 (AI가 화면 아래쪽을 중력 방향으로 가정)
 */

// 평면도 좌표 (1m = 15px)
const M = 15
const BALL = { x: 180, y: 150 }
const GOAL = { x: 180, y: 24 }
const BACK = 5 * M
const SIDE = 3 * M
const CAM_L = { x: BALL.x - SIDE, y: BALL.y + BACK }
const CAM_R = { x: BALL.x + SIDE, y: BALL.y + BACK }
const ANGLE = Math.round((Math.atan2(SIDE, BACK) * 180) / Math.PI) // 31

/** 카메라가 골대 중심을 바라보는 방향 (도) */
const aim = (cam: { x: number; y: number }) => (Math.atan2(GOAL.y - cam.y, GOAL.x - cam.x) * 180) / Math.PI

export function CameraPositionDiagram() {
  const arcR = 34
  const t = Math.atan2(SIDE, BACK)
  const arcL = { x: BALL.x - arcR * Math.sin(t), y: BALL.y + arcR * Math.cos(t) }
  const arcR2 = { x: BALL.x + arcR * Math.sin(t), y: BALL.y + arcR * Math.cos(t) }
  const arcMid = { x: BALL.x, y: BALL.y + arcR }

  return (
    <figure className="flex flex-col gap-3">
      <svg
        viewBox="0 0 360 290"
        className="bg-surface shadow-ring-strong w-full rounded-2xl"
        role="img"
        aria-label={`위에서 본 촬영 위치: 공과 골대 중심을 잇는 선에서 공 뒤쪽으로 좌우 약 30도 벗어난 위치. 예를 들어 공보다 5미터 뒤, 3미터 옆이면 약 ${ANGLE}도`}
      >
        <rect x="20" y="20" width="320" height="250" rx="10" fill="#0f2a1f" stroke="#1d3b2e" />
        <rect x="110" y="20" width="140" height="62" fill="none" stroke="#2f5a46" strokeWidth="1.5" />
        <rect x="140" y="12" width="80" height="10" rx="2" fill="#f5f7f6" opacity="0.9" />
        <text x="228" y="21" fontSize="10" fill="#a5b0ac">골대</text>

        {/* 공 → 골대 중심선과 공 뒤쪽 연장선 */}
        <path d={`M${BALL.x} ${BALL.y} L${GOAL.x} ${GOAL.y + 2}`} stroke="#3ecfef" strokeWidth="2" strokeDasharray="5 4" />
        <path d={`M${BALL.x} ${BALL.y} L${BALL.x} ${CAM_R.y + 8}`} stroke="#687570" strokeWidth="1" strokeDasharray="3 4" />
        <text x={BALL.x + 7} y={100} fontSize="9.5" fill="#3ecfef">공→골대 중심선</text>

        {/* 카메라 시야: 골대 양쪽 기둥까지 */}
        {[CAM_L, CAM_R].map((c) => (
          <g key={c.x} stroke="#39e079" strokeOpacity="0.16" strokeWidth="1.5">
            <path d={`M${c.x} ${c.y} L140 22`} />
            <path d={`M${c.x} ${c.y} L220 22`} />
          </g>
        ))}

        {/* 공에서 카메라까지 + 각도 */}
        <path d={`M${BALL.x} ${BALL.y} L${CAM_L.x} ${CAM_L.y}`} stroke="#39e079" strokeOpacity="0.6" strokeWidth="1.5" />
        <path d={`M${BALL.x} ${BALL.y} L${CAM_R.x} ${CAM_R.y}`} stroke="#39e079" strokeOpacity="0.6" strokeWidth="1.5" />
        <path d={`M${arcL.x} ${arcL.y} A${arcR} ${arcR} 0 0 0 ${arcMid.x} ${arcMid.y} A${arcR} ${arcR} 0 0 0 ${arcR2.x} ${arcR2.y}`} fill="none" stroke="#39e079" strokeWidth="1.5" />
        <rect x={BALL.x - 34} y={BALL.y + arcR + 4} width="68" height="16" rx="4" fill="#0f2a1f" />
        <text x={BALL.x} y={BALL.y + arcR + 16} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#39e079">좌우 약 30°</text>

        {/* 거리 예시 (오른쪽 카메라 기준) */}
        <g stroke="#a5b0ac" strokeWidth="1">
          <path d={`M${CAM_R.x + 28} ${BALL.y} L${CAM_R.x + 28} ${CAM_R.y}`} />
          <path d={`M${CAM_R.x + 24} ${BALL.y} L${CAM_R.x + 32} ${BALL.y}`} />
          <path d={`M${CAM_R.x + 24} ${CAM_R.y} L${CAM_R.x + 32} ${CAM_R.y}`} />
          <path d={`M${BALL.x} ${CAM_R.y + 22} L${CAM_R.x} ${CAM_R.y + 22}`} />
          <path d={`M${BALL.x} ${CAM_R.y + 18} L${BALL.x} ${CAM_R.y + 26}`} />
          <path d={`M${CAM_R.x} ${CAM_R.y + 18} L${CAM_R.x} ${CAM_R.y + 26}`} />
        </g>
        <text x={CAM_R.x + 34} y={BALL.y + BACK / 2 + 4} fontSize="10" fill="#a5b0ac">5m 뒤</text>
        <text x={(BALL.x + CAM_R.x) / 2} y={CAM_R.y + 36} textAnchor="middle" fontSize="10" fill="#a5b0ac">3m 옆</text>

        <circle cx={BALL.x} cy={BALL.y} r="5" fill="#f5f7f6" />
        <text x={BALL.x - 10} y={BALL.y + 4} textAnchor="end" fontSize="10" fill="#a5b0ac">공</text>

        <Camera {...CAM_L} rotate={aim(CAM_L)} />
        <Camera {...CAM_R} rotate={aim(CAM_R)} />
        <text x={CAM_L.x - 18} y={CAM_L.y + 4} textAnchor="end" fontSize="10.5" fontWeight="600" fill="#39e079">카메라</text>
      </svg>

      <svg
        viewBox="0 0 360 124"
        className="bg-surface shadow-ring-strong w-full rounded-2xl"
        role="img"
        aria-label="옆에서 본 카메라 방향: 수평에 가깝게 두고, 아래로 과하게 기울이지 않기"
      >
        <text x="20" y="22" fontSize="10.5" fontWeight="600" fill="#a5b0ac">옆에서 본 카메라 방향</text>
        <path d="M20 100 L340 100" stroke="#2f5a46" strokeWidth="2" />
        <Tripod x={80} tilt={-4} color="#39e079" />
        <path d="M100 59 L170 54" stroke="#39e079" strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="4 3" />
        <text x="80" y="118" textAnchor="middle" fontSize="10" fontWeight="600" fill="#39e079">✓ 수평에 가깝게</text>
        <Tripod x={250} tilt={40} color="#e05439" />
        <path d="M264 74 L288 98" stroke="#e05439" strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="4 3" />
        <text x="250" y="118" textAnchor="middle" fontSize="10" fontWeight="600" fill="#e05439">✕ 아래로 과하게 기울임</text>
      </svg>

      <figcaption className="text-fg-subtle text-xs leading-[19.5px]">
        공과 골대 중심을 잇는 선을 기준으로, 공 뒤쪽에서 좌우 약 30° 벗어난 곳에 두세요. 예를 들어 공보다 5m 뒤, 3m 옆이면 약 {ANGLE}°입니다. AI는
        화면 아래쪽을 중력 방향으로 계산하므로 카메라를 아래로 많이 기울이지 마세요.
      </figcaption>
    </figure>
  )
}

function Camera({ x, y, rotate }: { x: number; y: number; rotate: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <rect x="-11" y="-8" width="22" height="16" rx="3" fill="#39e079" />
      <path d="M11 -5 L18 -9 L18 9 L11 5 Z" fill="#39e079" />
      <circle cx="0" cy="0" r="4" fill="#08110f" />
    </g>
  )
}

/** 옆에서 본 삼각대와 카메라 */
function Tripod({ x, tilt, color }: { x: number; tilt: number; color: string }) {
  return (
    <g>
      <path d={`M${x} 68 L${x - 14} 100 M${x} 68 L${x + 14} 100 M${x} 68 L${x} 100`} stroke="#687570" strokeWidth="2" />
      <g transform={`translate(${x} 60) rotate(${tilt})`}>
        <rect x="-12" y="-8" width="24" height="16" rx="3" fill={color} />
        <path d="M12 -5 L19 -8 L19 8 L12 5 Z" fill={color} />
      </g>
    </g>
  )
}
