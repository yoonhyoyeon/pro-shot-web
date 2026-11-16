import type { TrajectoryPoint } from '../types/analysis'

/** 처음 진행 방향을 정할 때 쓰는 앞쪽 점 개수 */
const DIRECTION_POINTS = 4
/** 뒤 구간의 평균 이동 속도가 비행 구간의 이 비율보다 느리면 공이 멈춘 것(골망·바닥)으로 본다 */
const SLOW_RATIO = 0.3

/**
 * 공이 골대에 닿은 뒤 골망 안에서 흔들리거나 바닥을 구른 점을 궤적에서 뺀다.
 *
 * 백엔드 궤적은 공을 찬 프레임부터 추적이 끝날 때까지(보통 영상 끝) 모두 담고 있어,
 * 그대로 그리면 골대 안에서 궤적이 엉킨다. 실제 페널티킥 영상(11/16)은 74개 점 중
 * 60개가 골망에 닿은 뒤의 점이었다. 응답에 비행이 끝난 프레임이 없어 화면에서 판단한다.
 *
 * 1. 앞쪽 점으로 처음 진행 방향을 구하고, 그 방향으로 가장 멀리 간 점을 찾는다.
 * 2. 그 뒤 구간의 평균 이동 속도가 그 전(비행) 구간의 30%보다 느리면 그 점까지만 남긴다.
 *    높이 뜬 슛처럼 방향이 바뀌어도 빠르게 움직이고 있으면 비행으로 보고 자르지 않는다.
 */
export function trimAfterFlight(points: TrajectoryPoint[]): TrajectoryPoint[] {
  if (points.length < DIRECTION_POINTS) return points

  const start = points[0]
  const ref = points[DIRECTION_POINTS - 1]
  const length = Math.hypot(ref.x - start.x, ref.y - start.y)
  if (length === 0) return points
  const ux = (ref.x - start.x) / length
  const uy = (ref.y - start.y) / length

  let farthest = 0
  let maxProgress = -Infinity
  points.forEach((p, i) => {
    const progress = (p.x - start.x) * ux + (p.y - start.y) * uy
    if (progress > maxProgress) {
      maxProgress = progress
      farthest = i
    }
  })
  // 끝까지 앞으로 나아갔거나, 시작 직후부터 뒤로 간 경우(방향을 믿기 어려움)는 그대로 둔다
  if (farthest < 2 || farthest >= points.length - 1) return points

  const flight = averageSpeed(points.slice(0, farthest + 1))
  const rest = averageSpeed(points.slice(farthest))
  return rest < flight * SLOW_RATIO ? points.slice(0, farthest + 1) : points
}

/** 프레임당 평균 이동 거리 (px). 빠진 프레임이 있어도 실제 프레임 간격으로 나눈다 */
function averageSpeed(points: TrajectoryPoint[]) {
  const frames = points[points.length - 1].frame - points[0].frame
  if (frames <= 0) return 0
  let path = 0
  for (let i = 1; i < points.length; i++) {
    path += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)
  }
  return path / frames
}
