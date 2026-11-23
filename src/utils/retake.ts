import type { AnalysisResult } from '../types/analysis'
import { FAILURE_DETAIL_COPY, SPEED_HOLD_FALLBACK } from './failureCopy'

/** 분석 신뢰도가 이보다 낮으면 다시 촬영을 권한다 (결과 화면 신뢰도 표시의 '낮음' 기준과 같다) */
export const LOW_CONFIDENCE = 0.5

export interface RetakeAdvice {
  /** 무엇이 부족했는지 */
  reasons: string[]
  /** 다시 촬영할 때 할 일 */
  tips: string[]
}

type RetakeFields = Pick<AnalysisResult, 'speed_kmh' | 'hold_reason' | 'goal_area' | 'confidence'>

/**
 * 결과 일부가 보류됐을 때 다시 촬영을 권한다 (10주차 발표 피드백).
 * 다시 찍으면 나아질 수 있는, 촬영 때문에 생긴 보류만 고른다.
 * - 속도 보류: 보류 이유(failure_detail)별 촬영 방법
 * - 골대를 찾지 못함: 골대 전체가 보이게
 * - 분석 신뢰도 낮음: 공이 잘 보이게
 * 골인 판정 보류는 골대 실측 정보가 없어서 생기므로 다시 찍어도 달라지지 않아 넣지 않는다.
 * 권할 것이 없으면 null.
 */
export function retakeAdvice(result: RetakeFields): RetakeAdvice | null {
  const reasons: string[] = []
  const tips: string[] = []
  if (result.speed_kmh === null) {
    reasons.push('속도를 계산하지 못했어요')
    tips.push((result.hold_reason && FAILURE_DETAIL_COPY[result.hold_reason]?.solution) || SPEED_HOLD_FALLBACK.solution)
  }
  if (!result.goal_area) {
    reasons.push('골대를 찾지 못했어요')
    tips.push('골대 전체가 화면 안에 들어오도록, 공이 골대에 닿을 때까지 촬영해주세요.')
  }
  if (result.confidence < LOW_CONFIDENCE) {
    reasons.push('공을 확실하게 찾은 장면이 적어요')
    tips.push('밝은 곳에서 흔들림 없이, 공이 배경과 잘 구분되도록 촬영해주세요.')
  }
  return reasons.length ? { reasons, tips } : null
}
