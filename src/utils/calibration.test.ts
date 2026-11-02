import { describe, expect, it } from 'vitest'
import { mockCalibrationResult } from '../mocks/mockCalibration'
import { calibrationIdFor, calibrationQuality, checkerboardSvg, compareCalibration, parseStoredCalibration } from './calibration'

const FHD = { width: 1920, height: 1080 }

describe('compareCalibration: 보정 해상도와 분석 영상 비교', () => {
  it('해상도가 같으면 그대로 적용', () => {
    expect(compareCalibration(FHD, FHD)).toBe('same')
  })
  it('화면 비율이 같고 크기만 다르면 비율에 맞춰 조정', () => {
    expect(compareCalibration(FHD, { width: 1280, height: 720 })).toBe('scaled')
    expect(compareCalibration(FHD, { width: 3840, height: 2160 })).toBe('scaled')
  })
  it('가로·세로 방향이 다르면 적용하지 않음', () => {
    expect(compareCalibration(FHD, { width: 1080, height: 1920 })).toBe('mismatch')
  })
  it('화면 비율이 다르면(촬영 모드 변경·잘림) 적용하지 않음', () => {
    expect(compareCalibration(FHD, { width: 1440, height: 1080 })).toBe('mismatch')
  })
  it('인코딩 때문에 생기는 작은 비율 차이(1% 이내)는 같은 비율로 본다', () => {
    expect(compareCalibration(FHD, { width: 1920, height: 1088 })).toBe('scaled')
  })
})

describe('calibrationIdFor: 분석 요청에 보정 ID를 붙일지', () => {
  const cal = mockCalibrationResult(FHD)
  it('맞는 영상에는 붙이고, 비율이 다르거나 보정이 없으면 붙이지 않음', () => {
    expect(calibrationIdFor(cal, { metadata: { width: 1280, height: 720 } })).toBe(cal.calibration_id)
    expect(calibrationIdFor(cal, { metadata: { width: 1080, height: 1920 } })).toBeUndefined()
    expect(calibrationIdFor(null, { metadata: FHD })).toBeUndefined()
  })
})

describe('calibrationQuality: 재투영 오차 안내', () => {
  it.each([
    [0.32, 'good'],
    [0.5, 'fair'],
    [0.99, 'fair'],
    [1.4, 'poor'],
  ])('%f px → %s', (rms, quality) => {
    expect(calibrationQuality(rms)).toBe(quality)
  })
})

describe('parseStoredCalibration: 저장된 보정 불러오기', () => {
  it('정상 값은 복원', () => {
    const cal = mockCalibrationResult(FHD)
    expect(parseStoredCalibration(JSON.stringify(cal))?.calibration_id).toBe(cal.calibration_id)
  })
  it('없거나 손상된 값은 무시', () => {
    expect(parseStoredCalibration(null)).toBeNull()
    expect(parseStoredCalibration('{broken')).toBeNull()
    expect(parseStoredCalibration(JSON.stringify({ calibration_id: 'x' }))).toBeNull()
  })
})

describe('checkerboardSvg: 인쇄용 체스보드', () => {
  it('내부 코너 9×6이면 10×7칸 중 검은 칸 35개, A4 가로 크기', () => {
    const svg = checkerboardSvg()
    expect(svg.match(/<rect x=/g)).toHaveLength(35)
    expect(svg).toContain('width="297mm" height="210mm"')
  })
})
