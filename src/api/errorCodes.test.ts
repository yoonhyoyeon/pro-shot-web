import { describe, expect, it } from 'vitest'
import { codeFromBody, normalizeCalibrationCode, normalizeFailureCode } from './errorCodes'
import { uploadError } from './httpApi'

describe('normalizeFailureCode: 서버 실패 코드 → 화면 코드', () => {
  it('프론트가 아는 코드는 그대로', () => {
    expect(normalizeFailureCode('BALL_NOT_DETECTED')).toBe('BALL_NOT_DETECTED')
    expect(normalizeFailureCode('GOAL_NOT_DETECTED')).toBe('GOAL_NOT_DETECTED')
    expect(normalizeFailureCode('TIMEOUT')).toBe('TIMEOUT')
  })
  it('백엔드 업로드 거절 코드는 영상 문제 화면으로', () => {
    expect(normalizeFailureCode('VIDEO_TOO_SHORT')).toBe('INVALID_VIDEO')
    expect(normalizeFailureCode('RESOLUTION_TOO_LOW')).toBe('INVALID_VIDEO')
    expect(normalizeFailureCode('UNREADABLE_VIDEO')).toBe('INVALID_VIDEO')
  })
  it('프론트에 없는 추적 단계 실패 코드는 공 인식 실패 화면으로', () => {
    expect(normalizeFailureCode('TRACK_TOO_SHORT')).toBe('BALL_NOT_DETECTED')
  })
  it('코드가 없으면 서버 오류', () => {
    expect(normalizeFailureCode(undefined)).toBe('SERVER_ERROR')
    expect(normalizeFailureCode('')).toBe('SERVER_ERROR')
  })
})

describe('normalizeCalibrationCode: 보정 실패 코드', () => {
  it('보정 실패 코드는 그대로, 업로드 거절은 영상 문제, 모르는 코드는 서버 오류', () => {
    expect(normalizeCalibrationCode('NOT_ENOUGH_FRAMES')).toBe('NOT_ENOUGH_FRAMES')
    expect(normalizeCalibrationCode('VIDEO_TOO_LONG')).toBe('INVALID_VIDEO')
    expect(normalizeCalibrationCode('BALL_NOT_DETECTED')).toBe('SERVER_ERROR')
  })
})

describe('codeFromBody: 오류 응답 본문에서 코드 읽기', () => {
  it.each([
    [{ code: 'VIDEO_TOO_SHORT' }, 'VIDEO_TOO_SHORT'],
    [{ detail: 'RESOLUTION_TOO_LOW' }, 'RESOLUTION_TOO_LOW'],
    [{ detail: { code: 'UNREADABLE_VIDEO', message: '...' } }, 'UNREADABLE_VIDEO'],
    [{ detail: 'File too large' }, undefined],
    [null, undefined],
  ])('%j → %s', (body, code) => {
    expect(codeFromBody(body)).toBe(code)
  })
})

describe('uploadError: 업로드 거절 응답', () => {
  it('본문 코드가 상태 코드보다 우선하고 원래 코드를 남긴다', () => {
    const e = uploadError(413, { detail: 'VIDEO_TOO_SHORT' })
    expect(e.code).toBe('INVALID_VIDEO')
    expect(e.rawCode).toBe('VIDEO_TOO_SHORT')
  })
  it('본문에 코드가 없으면 상태 코드로 판단', () => {
    expect(uploadError(504, null).code).toBe('TIMEOUT')
    expect(uploadError(500, { detail: 'Internal Server Error' }).code).toBe('SERVER_ERROR')
  })
})
