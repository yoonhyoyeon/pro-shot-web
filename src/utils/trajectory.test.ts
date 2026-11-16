import { describe, expect, it } from 'vitest'
import { PENALTY_SPEED_HOLD } from '../mocks/realAnalysis'
import type { TrajectoryPoint } from '../types/analysis'
import { trimAfterFlight } from './trajectory'

const line = (count: number, dx: number, dy: number): TrajectoryPoint[] =>
  Array.from({ length: count }, (_, i) => ({ frame: i, x: 100 + dx * i, y: 600 + dy * i }))

describe('trimAfterFlight: 골망에 닿은 뒤의 점 빼기', () => {
  it('실제 페널티킥: 74개 중 골망에 닿은 뒤 골망·바닥에서 움직인 점을 빼고 67프레임까지 남긴다', () => {
    const trimmed = trimAfterFlight(PENALTY_SPEED_HOLD.trajectory)
    expect(PENALTY_SPEED_HOLD.trajectory).toHaveLength(74)
    expect(trimmed).toHaveLength(14)
    expect(trimmed[0].frame).toBe(53)
    expect(trimmed[trimmed.length - 1].frame).toBe(67)
  })

  it('끝까지 앞으로 날아간 궤적은 그대로 둔다', () => {
    const points = line(20, 12, -18)
    expect(trimAfterFlight(points)).toBe(points)
  })

  it('높이 뜬 슛처럼 방향이 꺾여도 빠르게 움직이면 자르지 않는다', () => {
    // 위로 10프레임 올라갔다가 같은 속도로 10프레임 내려옴
    const up = line(10, 10, -30)
    const top = up[up.length - 1]
    const down = Array.from({ length: 10 }, (_, i) => ({ frame: 10 + i, x: top.x + 10 * (i + 1), y: top.y + 30 * (i + 1) }))
    const points = [...up, ...down]
    expect(trimAfterFlight(points)).toBe(points)
  })

  it('가장 멀리 간 뒤 천천히 되돌아오면 그 점까지만 남긴다', () => {
    const flight = line(10, 10, -30)
    const last = flight[flight.length - 1]
    const settle = Array.from({ length: 20 }, (_, i) => ({ frame: 10 + i, x: last.x - 0.5 * (i + 1), y: last.y + 1 * (i + 1) }))
    expect(trimAfterFlight([...flight, ...settle])).toEqual(flight)
  })

  it('점이 적거나 앞쪽 점이 한자리에 있으면 그대로 둔다', () => {
    const short = line(3, 10, -10)
    expect(trimAfterFlight(short)).toBe(short)
    const still = [...line(4, 0, 0), ...line(4, 10, -10)]
    expect(trimAfterFlight(still)).toBe(still)
  })
})
