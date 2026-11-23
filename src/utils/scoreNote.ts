import type { AnalysisResult, GoalStatus } from '../types/analysis'

type ScoreFields = Pick<AnalysisResult, 'score' | 'goal' | 'speed_kmh' | 'score_partial'>

/**
 * 점수 이름. 골라인 판정 없이 매긴 점수는 AI 파트가 정한 '영상 참고 점수'(11/16)다.
 * 골인·골대 밖이 판정된 경우에만 골대 면 기준의 슈팅 점수가 나온다.
 */
export function scoreLabel(goal: GoalStatus) {
  return goal === 'UNDETERMINED' ? '영상 참고 점수' : '슈팅 점수'
}

/**
 * 점수 아래 설명. 채점 기준(AI 파트):
 * - 골대 면 기준(골인 판정 시): 속도 40% + 골대 면 위치 60%, 골대 밖은 0점
 * - 영상 참고 점수(판정 보류 시): 추정 속도 40점 + 화면상 골대 진입 위치 60점.
 *   측정하지 못한 항목은 빠지고 만점이 줄어든다 (속도 없이 60점 만점, 위치 없이 40점 만점)
 */
export function scoreNote({ score, goal, speed_kmh, score_partial }: ScoreFields) {
  if (score === null) {
    return speed_kmh === null ? '속도를 계산하지 못해 점수를 매기지 않았어요' : '점수를 매길 근거가 부족했어요'
  }
  if (goal === 'OUTSIDE') return '골대 밖으로 나간 슛은 0점이에요'
  if (goal === 'GOAL') return '속도 40% + 위치 60% (구석일수록 높음)'
  if (!score_partial) return '속도 40점 + 화면상 골대 진입 위치 60점'
  return speed_kmh === null
    ? '속도를 재지 못해 골대 진입 위치만으로 계산했어요'
    : '골대 진입 위치를 확인하지 못해 속도만으로 계산했어요'
}

/** 만점 표시. 100 → "100", 60.0 → "60", 소수는 한 자리 */
export function formatScoreMax(max: number) {
  return Number.isInteger(max) ? String(max) : max.toFixed(1)
}
