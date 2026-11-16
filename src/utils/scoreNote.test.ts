import { describe, expect, it } from 'vitest'
import { scoreNote } from './scoreNote'

describe('scoreNote: 점수 아래 설명', () => {
  it('채점된 골인은 채점 기준을, 골대 밖 0점은 이유를 보여 준다', () => {
    expect(scoreNote(78, 'GOAL', 93.7)).toBe('속도 40% + 위치 60% (구석일수록 높음)')
    expect(scoreNote(0, 'OUTSIDE', 79.4)).toBe('골대 밖으로 나간 슛은 0점이에요')
  })
  it('미평가는 속도 보류를 먼저, 그다음 골인 미확정을 이유로 든다', () => {
    expect(scoreNote(null, 'UNDETERMINED', null)).toBe('속도를 계산하지 못해 점수를 매기지 않았어요')
    expect(scoreNote(null, 'UNDETERMINED', 81.8)).toBe('골인이 확인된 슛만 점수를 매겨요')
    expect(scoreNote(null, 'GOAL', 81.8)).toBe('점수를 계산하지 못했어요')
  })
})
