import type { Size } from '../types/analysis'
import type { CalibrationFailureCode, CalibrationResult } from '../types/calibration'

export type MockCalibrationScenario = 'success' | 'checkerboard-not-found' | 'not-enough-frames'

export const MOCK_CALIBRATION_FAILURE: Partial<Record<MockCalibrationScenario, CalibrationFailureCode>> = {
  'checkerboard-not-found': 'CHESSBOARD_NOT_FOUND',
  'not-enough-frames': 'NOT_ENOUGH_FRAMES',
}

/**
 * 보정 결과 예시. 해상도는 업로드한 영상 크기를 따르고,
 * 초점거리·주점은 스마트폰 기본 카메라 정도의 값으로 둔다(실제 보정값 아님).
 */
export function mockCalibrationResult(size: Size): CalibrationResult {
  const longSide = Math.max(size.width, size.height)
  return {
    calibration_id: `mock-cal-${Date.now()}`,
    image_size: size,
    fx: Math.round(longSide * 0.78 * 10) / 10,
    fy: Math.round(longSide * 0.78 * 10) / 10,
    cx: Math.round((size.width / 2 + 3.2) * 10) / 10,
    cy: Math.round((size.height / 2 - 2.6) * 10) / 10,
    dist_coeffs: [0.112, -0.231, 0.0004, -0.0007, 0.098],
    frames_used: 24,
    frames_total: 31,
    rms_error: 0.41,
    created_at: new Date().toISOString(),
  }
}
