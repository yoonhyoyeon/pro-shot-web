import { describe, expect, it } from 'vitest'
import { errorCodeFromStatus } from './httpApi'

describe('errorCodeFromStatus: HTTP 상태 → 화면 오류 코드', () => {
  it.each([
    [0, 'NETWORK_ERROR'],
    [408, 'TIMEOUT'],
    [504, 'TIMEOUT'],
    [413, 'INVALID_VIDEO'],
    [415, 'INVALID_VIDEO'],
    [422, 'INVALID_VIDEO'],
    [500, 'SERVER_ERROR'],
    [503, 'SERVER_ERROR'],
  ])('%i → %s', (status, code) => {
    expect(errorCodeFromStatus(status)).toBe(code)
  })
})
