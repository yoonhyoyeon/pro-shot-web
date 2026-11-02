import type { GoalArea, Size, TrajectoryPoint } from '../types/analysis'

export type FitMode = 'cover' | 'contain'

/**
 * 분석 해상도(from) 좌표를 실제 영상 해상도(to) 좌표로 환산.
 * 백엔드가 영상을 축소해 분석하거나(예: 1920×1080 → 1280×720)
 * 브라우저가 읽은 영상 크기와 분석 기준 크기가 다를 때 사용한다.
 */
export function scalePoint<T extends { x: number; y: number }>(point: T, from: Size, to: Size): T {
  if (from.width === to.width && from.height === to.height) return point
  return {
    ...point,
    x: round1((point.x * to.width) / from.width),
    y: round1((point.y * to.height) / from.height),
  }
}

export function scalePoints(points: TrajectoryPoint[], from: Size, to: Size): TrajectoryPoint[] {
  return points.map((p) => scalePoint(p, from, to))
}

export function scaleArea(area: GoalArea, from: Size, to: Size): GoalArea {
  const sx = to.width / from.width
  const sy = to.height / from.height
  return {
    x: round1(area.x * sx),
    y: round1(area.y * sy),
    width: round1(area.width * sx),
    height: round1(area.height * sy),
  }
}

/**
 * 화면 박스(box) 안에 영상(source)을 cover/contain으로 맞췄을 때의 배율과 여백.
 * CSS object-fit, SVG preserveAspectRatio(slice/meet)와 같은 계산.
 */
export function fitTransform(source: Size, box: Size, mode: FitMode) {
  const sx = box.width / source.width
  const sy = box.height / source.height
  const scale = mode === 'cover' ? Math.max(sx, sy) : Math.min(sx, sy)
  return {
    scale,
    offsetX: (box.width - source.width * scale) / 2,
    offsetY: (box.height - source.height * scale) / 2,
  }
}

/** 영상 좌표 → 화면 좌표 (box 기준 px) */
export function sourceToBox(point: { x: number; y: number }, source: Size, box: Size, mode: FitMode) {
  const { scale, offsetX, offsetY } = fitTransform(source, box, mode)
  return { x: point.x * scale + offsetX, y: point.y * scale + offsetY }
}

/** 화면 좌표(box 기준 px) → 영상 좌표. 영상 밖이면 null */
export function boxToSource(point: { x: number; y: number }, source: Size, box: Size, mode: FitMode) {
  const { scale, offsetX, offsetY } = fitTransform(source, box, mode)
  const x = (point.x - offsetX) / scale
  const y = (point.y - offsetY) / scale
  if (x < 0 || y < 0 || x > source.width || y > source.height) return null
  return { x: Math.round(x), y: Math.round(y) }
}

/**
 * 추적 점 사이를 선형 보간해 특정 프레임의 공 위치를 구한다.
 * 추적 좌표가 몇 프레임 간격으로만 있어도 재생 중인 영상의 공 위치를 따라갈 수 있다.
 * 궤적 범위 밖이면 null.
 */
export function interpolateAt(points: TrajectoryPoint[], frame: number): TrajectoryPoint | null {
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]
    const b = points[i + 1]
    if (frame >= a.frame && frame <= b.frame) {
      const t = b.frame === a.frame ? 0 : (frame - a.frame) / (b.frame - a.frame)
      return { frame, x: round1(a.x + (b.x - a.x) * t), y: round1(a.y + (b.y - a.y) * t) }
    }
  }
  return null
}

/**
 * 화면에서 최소 minCssPx 크기로 보이도록 하는 SVG(영상 좌표계) 반지름.
 * 영상이 작게 표시되는 모바일에서도 터치 영역이 충분하도록 한다.
 * @param scale 영상 1px이 화면에서 차지하는 크기 (fitTransform의 scale)
 */
export function minRadiusInSource(baseRadius: number, scale: number, minCssPx = 22) {
  if (scale <= 0) return baseRadius
  return Math.max(baseRadius, minCssPx / scale)
}

/** 재생 시간(초) → 프레임 번호 */
export function timeToFrame(seconds: number, fps: number) {
  return Math.floor(seconds * fps)
}

/** 프레임 번호 → 재생 시간(초) */
export function frameToTime(frame: number, fps: number) {
  return frame / fps
}

function round1(n: number) {
  return Math.round(n * 10) / 10
}
