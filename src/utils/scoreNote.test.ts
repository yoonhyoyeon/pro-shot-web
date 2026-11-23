import { describe, expect, it } from 'vitest'
import { formatScoreMax, scoreLabel, scoreNote } from './scoreNote'

describe('scoreLabel: 점수 이름', () => {
  it('골라인 판정 없이 매긴 점수는 영상 참고 점수, 판정된 경우는 슈팅 점수', () => {
    expect(scoreLabel('UNDETERMINED')).toBe('영상 참고 점수')
    expect(scoreLabel('GOAL')).toBe('슈팅 점수')
    expect(scoreLabel('OUTSIDE')).toBe('슈팅 점수')
  })
})

describe('scoreNote: 점수 아래 설명', () => {
  it('골대 면 기준 점수: 골인은 채점 기준을, 골대 밖 0점은 이유를', () => {
    expect(scoreNote({ score: 78, goal: 'GOAL', speed_kmh: 93.7, score_partial: false })).toBe(
      '속도 40% + 위치 60% (구석일수록 높음)',
    )
    expect(scoreNote({ score: 0, goal: 'OUTSIDE', speed_kmh: 79.4, score_partial: false })).toBe(
      '골대 밖으로 나간 슛은 0점이에요',
    )
  })
  it('영상 참고 점수: 모든 항목을 쟀으면 구성, 일부만 쟀으면 빠진 항목', () => {
    // 11/23 실제 페널티킥: 71.6km/h, 56/100
    expect(scoreNote({ score: 56, goal: 'UNDETERMINED', speed_kmh: 71.6, score_partial: false })).toBe(
      '속도 40점 + 화면상 골대 진입 위치 60점',
    )
    expect(scoreNote({ score: 34, goal: 'UNDETERMINED', speed_kmh: null, score_partial: true })).toBe(
      '속도를 재지 못해 골대 진입 위치만으로 계산했어요',
    )
    expect(scoreNote({ score: 30, goal: 'UNDETERMINED', speed_kmh: 71.6, score_partial: true })).toBe(
      '골대 진입 위치를 확인하지 못해 속도만으로 계산했어요',
    )
  })
  it('미평가는 속도 보류를 먼저 이유로 든다', () => {
    expect(scoreNote({ score: null, goal: 'UNDETERMINED', speed_kmh: null, score_partial: false })).toBe(
      '속도를 계산하지 못해 점수를 매기지 않았어요',
    )
    expect(scoreNote({ score: null, goal: 'UNDETERMINED', speed_kmh: 71.6, score_partial: false })).toBe(
      '점수를 매길 근거가 부족했어요',
    )
  })
})

describe('formatScoreMax: 만점 표시', () => {
  it('정수는 그대로, 소수는 한 자리', () => {
    expect(formatScoreMax(100)).toBe('100')
    expect(formatScoreMax(60)).toBe('60')
    expect(formatScoreMax(57.5)).toBe('57.5')
  })
})
