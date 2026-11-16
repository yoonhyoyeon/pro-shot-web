import type { GoalStatus } from '../types/analysis'

/**
 * 점수 아래 설명. 미평가면 왜 점수가 없는지 알려 준다.
 * 채점 기준(AI 9주차): 골인한 슛만 속도 40% + 골대 면 위치 60%, 중심에서 멀수록 위치 점수가 높다.
 * 골대 밖은 0점, 골인 미확정이거나 속도가 없으면 미평가.
 */
export function scoreNote(score: number | null, goal: GoalStatus, speedKmh: number | null) {
  if (score !== null) return goal === 'OUTSIDE' ? '골대 밖으로 나간 슛은 0점이에요' : '속도 40% + 위치 60% (구석일수록 높음)'
  if (speedKmh === null) return '속도를 계산하지 못해 점수를 매기지 않았어요'
  if (goal !== 'GOAL') return '골인이 확인된 슛만 점수를 매겨요'
  return '점수를 계산하지 못했어요'
}
