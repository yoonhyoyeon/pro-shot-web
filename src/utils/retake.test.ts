import { describe, expect, it } from 'vitest'
import { FAILURE_DETAIL_COPY } from './failureCopy'
import { retakeAdvice } from './retake'

const GOAL = { x: 348, y: 308, width: 479, height: 143 }
const ok = { speed_kmh: 71.6, hold_reason: undefined, goal_area: GOAL, confidence: 0.94 }

describe('retakeAdvice: 보류 시 재촬영 안내', () => {
  it('속도·골대·신뢰도가 모두 괜찮으면 권하지 않는다 (11/23 실제 페널티킥: 골인 판정만 보류)', () => {
    expect(retakeAdvice(ok)).toBeNull()
  })
  it('속도 보류: 보류 이유에 맞는 촬영 방법을 안내한다', () => {
    const advice = retakeAdvice({ ...ok, speed_kmh: null, hold_reason: 'SPEED_UNCERTAINTY_HIGH' })
    expect(advice?.reasons).toEqual(['속도를 계산하지 못했어요'])
    expect(advice?.tips).toEqual([FAILURE_DETAIL_COPY.SPEED_UNCERTAINTY_HIGH.solution])
  })
  it('보류 이유를 모르면 일반 촬영 방법으로', () => {
    expect(retakeAdvice({ ...ok, speed_kmh: null })?.tips[0]).toContain('촬영 가이드')
  })
  it('골대를 찾지 못했거나 신뢰도가 낮으면 각각 안내하고, 여러 개면 모두 보여 준다', () => {
    const advice = retakeAdvice({ ...ok, goal_area: undefined, confidence: 0.41 })
    expect(advice?.reasons).toEqual(['골대를 찾지 못했어요', '공을 확실하게 찾은 장면이 적어요'])
    expect(advice?.tips).toHaveLength(2)
  })
})
