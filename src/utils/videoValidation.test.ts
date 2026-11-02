import { describe, expect, it } from 'vitest'
import { CALIBRATION_VIDEO_RULES, checkFileBasics, checkMetadata, VIDEO_RULES } from './videoValidation'

const MB = 1024 * 1024
const file = (name: string, type: string, size = 10 * MB) => ({ name, type, size })

describe('checkFileBasics: 형식·크기 검사', () => {
  it('MP4, MOV는 통과', () => {
    expect(checkFileBasics(file('shot.mp4', 'video/mp4'))).toBeNull()
    expect(checkFileBasics(file('IMG_0001.MOV', 'video/quicktime'))).toBeNull()
  })
  it('MIME 타입이 비어 있어도 확장자가 맞으면 통과', () => {
    expect(checkFileBasics(file('shot.mov', ''))).toBeNull()
  })
  it('이미지·기타 영상 형식은 거부', () => {
    expect(checkFileBasics(file('photo.jpg', 'image/jpeg'))?.code).toBe('INVALID_TYPE')
    expect(checkFileBasics(file('clip.avi', 'video/x-msvideo'))?.code).toBe('INVALID_TYPE')
  })
  it('0바이트 파일은 거부', () => {
    expect(checkFileBasics(file('shot.mp4', 'video/mp4', 0))?.code).toBe('EMPTY')
  })
  it('최대 크기를 넘으면 거부', () => {
    expect(checkFileBasics(file('shot.mp4', 'video/mp4', VIDEO_RULES.maxBytes))).toBeNull()
    expect(checkFileBasics(file('shot.mp4', 'video/mp4', VIDEO_RULES.maxBytes + 1))?.code).toBe('TOO_LARGE')
  })
})

describe('checkMetadata: 길이·해상도 검사', () => {
  const ok = { duration: 5, width: 1920, height: 1080 }
  it('조건을 만족하면 통과', () => {
    expect(checkMetadata(ok)).toBeNull()
  })
  it('너무 짧거나 긴 영상은 거부', () => {
    expect(checkMetadata({ ...ok, duration: 0.5 })?.code).toBe('TOO_SHORT')
    expect(checkMetadata({ ...ok, duration: 31 })?.code).toBe('TOO_LONG')
  })
  it('세로 영상도 짧은 변 기준으로 해상도를 본다', () => {
    expect(checkMetadata({ ...ok, width: 1080, height: 1920 })).toBeNull()
    expect(checkMetadata({ ...ok, width: 360, height: 640 })?.code).toBe('LOW_RESOLUTION')
  })
  it('길이를 읽지 못하면 손상된 영상으로 판단', () => {
    expect(checkMetadata({ ...ok, duration: Number.NaN })?.code).toBe('UNREADABLE')
  })
})

describe('CALIBRATION_VIDEO_RULES: 체스보드 보정 영상', () => {
  const ok = { duration: 12, width: 1920, height: 1080 }
  it('5초 미만은 거부하고 보정용 안내를 보여준다', () => {
    const error = checkMetadata({ ...ok, duration: 3 }, CALIBRATION_VIDEO_RULES)
    expect(error?.code).toBe('TOO_SHORT')
    expect(error?.message).toContain('최소 5초')
    expect(error?.hint).toContain('체스보드')
  })
  it('슈팅 영상 기준으로는 3초도 통과', () => {
    expect(checkMetadata({ ...ok, duration: 3 })).toBeNull()
  })
  it('형식·크기 기준은 슈팅 영상과 같다', () => {
    expect(checkFileBasics(file('board.mov', 'video/quicktime'), CALIBRATION_VIDEO_RULES)).toBeNull()
    expect(checkFileBasics(file('board.gif', 'image/gif'), CALIBRATION_VIDEO_RULES)?.code).toBe('INVALID_TYPE')
  })
})
