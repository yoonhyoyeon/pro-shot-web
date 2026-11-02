import { describe, expect, it } from 'vitest'
import { boxToSource, fitTransform, frameToTime, interpolateAt, minRadiusInSource, scalePoint, sourceToBox, timeToFrame } from './coordinates'

const FHD = { width: 1920, height: 1080 }
const HD = { width: 1280, height: 720 }

describe('scalePoint: 분석 해상도 → 실제 영상 해상도', () => {
  it('1280×720 기준 좌표를 1920×1080으로 1.5배 환산한다', () => {
    expect(scalePoint({ frame: 3, x: 640, y: 360 }, HD, FHD)).toEqual({ frame: 3, x: 960, y: 540 })
  })
  it('해상도가 같으면 그대로 둔다', () => {
    const p = { frame: 0, x: 10, y: 20 }
    expect(scalePoint(p, HD, HD)).toBe(p)
  })
})

describe('fitTransform: object-fit과 같은 배율 계산', () => {
  it('contain은 남는 쪽에 여백(레터박스)을 둔다', () => {
    // 16:9 영상을 정사각형 박스에 넣으면 위아래 여백
    const t = fitTransform(FHD, { width: 960, height: 960 }, 'contain')
    expect(t.scale).toBe(0.5)
    expect(t.offsetX).toBe(0)
    expect(t.offsetY).toBe(210)
  })
  it('cover는 넘치는 쪽을 잘라낸다', () => {
    const t = fitTransform(FHD, { width: 960, height: 960 }, 'cover')
    expect(t.scale).toBeCloseTo(0.8889, 3)
    expect(t.offsetY).toBe(0)
    expect(t.offsetX).toBeLessThan(0)
  })
})

describe('sourceToBox ↔ boxToSource', () => {
  const box = { width: 833, height: 496 }
  it('영상 좌표를 화면 좌표로 바꿨다가 되돌리면 원래 좌표가 된다', () => {
    for (const mode of ['cover', 'contain'] as const) {
      const onScreen = sourceToBox({ x: 1092, y: 291 }, FHD, box, mode)
      expect(boxToSource(onScreen, FHD, box, mode)).toEqual({ x: 1092, y: 291 })
    }
  })
  it('contain 여백(영상 밖)을 가리키면 null', () => {
    expect(boxToSource({ x: 5, y: 5 }, FHD, { width: 960, height: 960 }, 'contain')).toBeNull()
  })
  it('화면 크기가 달라져도 같은 영상 좌표는 박스 안에서 같은 비율 위치에 있다', () => {
    const big = sourceToBox({ x: 960, y: 540 }, FHD, { width: 1600, height: 900 }, 'contain')
    const small = sourceToBox({ x: 960, y: 540 }, FHD, { width: 400, height: 225 }, 'contain')
    expect(big.x / 1600).toBeCloseTo(small.x / 400)
    expect(big.y / 900).toBeCloseTo(small.y / 225)
  })
})

describe('프레임 ↔ 재생 시간', () => {
  it('30fps에서 15프레임은 0.5초', () => {
    expect(frameToTime(15, 30)).toBe(0.5)
    expect(timeToFrame(0.5, 30)).toBe(15)
  })
  it('프레임 사이 시간은 이전 프레임으로 내림', () => {
    expect(timeToFrame(0.51, 30)).toBe(15)
  })
})

describe('interpolateAt: 추적 점 사이 보간', () => {
  const points = [
    { frame: 0, x: 0, y: 100 },
    { frame: 10, x: 100, y: 0 },
  ]
  it('두 점 사이 프레임은 직선 위 위치', () => {
    expect(interpolateAt(points, 5)).toEqual({ frame: 5, x: 50, y: 50 })
  })
  it('추적 점과 같은 프레임은 그 점', () => {
    expect(interpolateAt(points, 10)).toEqual({ frame: 10, x: 100, y: 0 })
  })
  it('궤적 범위 밖이면 null', () => {
    expect(interpolateAt(points, 11)).toBeNull()
  })
})

describe('minRadiusInSource: 터치 영역 최소 크기', () => {
  it('영상이 크게 보이면 기본 반지름 유지', () => {
    expect(minRadiusInSource(22, 1)).toBe(22)
  })
  it('모바일처럼 0.2배로 작게 보이면 화면 22px(지름 44px)이 되도록 키운다', () => {
    // 1920px 영상을 384px 폭에 표시 → scale 0.2 → 22 / 0.2 = 110
    expect(minRadiusInSource(22, 0.2)).toBe(110)
    expect(minRadiusInSource(22, 0.2) * 0.2).toBe(22)
  })
})
