import type { ConnectionErrorCode, Size } from './analysis'

/** 화면에서 쓰는 보정 결과. HTTP 응답은 api/serverMapping.ts에서 이 형태로 바꾼다 */
export interface CalibrationResult {
  calibration_id: string
  /** 보정 영상 해상도. 분석 영상과 화면 비율이 같아야 보정을 적용할 수 있다 */
  image_size: Size
  /** 초점거리 (px) */
  fx: number
  fy: number
  /** 주점 (px) */
  cx: number
  cy: number
  /** 렌즈 왜곡 계수 [k1, k2, p1, p2, k3]. 백엔드는 보내지 않음 (Mock에만 있음) */
  dist_coeffs?: number[]
  /** 체스보드를 찾아 계산에 사용한 프레임 수 */
  frames_used: number
  /** 검사한 프레임 수. 백엔드는 보내지 않음 (Mock에만 있음) */
  frames_total?: number
  /** 재투영 오차 RMS (px). 작을수록 보정이 잘 된 것 */
  rms_error: number
  created_at: string
}

/** 보정 자체가 실패한 경우(영상 문제) */
export type CalibrationFailureCode = 'CHESSBOARD_NOT_FOUND' | 'NOT_ENOUGH_FRAMES' | 'INVALID_VIDEO'
export type CalibrationErrorCode = CalibrationFailureCode | ConnectionErrorCode

/** 보정 작업 상태 (GET /calibrations/{id}) */
export type CalibrationStatus =
  | { status: 'processing'; progress: number }
  | { status: 'done'; result: CalibrationResult }
  | { status: 'failed'; code: string }

/** 분석 영상에 보정을 적용할 수 있는지 */
export type CalibrationMatch = 'same' | 'scaled' | 'mismatch'
