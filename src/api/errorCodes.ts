import type { AnalysisErrorCode, AnalysisFailureCode, ConnectionErrorCode } from '../types/analysis'
import type { CalibrationErrorCode, CalibrationFailureCode } from '../types/calibration'

const FAILURE_CODES: AnalysisFailureCode[] = ['BALL_NOT_DETECTED', 'GOAL_NOT_DETECTED', 'INVALID_VIDEO']
const CONNECTION_CODES: ConnectionErrorCode[] = ['NETWORK_ERROR', 'SERVER_ERROR', 'TIMEOUT']
const CALIBRATION_FAILURE_CODES: CalibrationFailureCode[] = ['CHECKERBOARD_NOT_FOUND', 'NOT_ENOUGH_FRAMES', 'INVALID_VIDEO']

/** 백엔드 업로드 검증(6주차)이 거절할 때 보내는 코드. 화면은 모두 '영상을 분석할 수 없습니다' */
export const UPLOAD_REJECT_CODES = ['VIDEO_TOO_SHORT', 'VIDEO_TOO_LONG', 'RESOLUTION_TOO_LOW', 'UNREADABLE_VIDEO'] as const

export const isFailureCode = (code: string): code is AnalysisFailureCode =>
  (FAILURE_CODES as string[]).includes(code)

const isConnectionCode = (code: string): code is ConnectionErrorCode => (CONNECTION_CODES as string[]).includes(code)

/**
 * 서버가 보낸 실패 코드 → 화면 오류 코드.
 * 백엔드에는 프론트에 없는 추적 단계별 실패 코드가 있는데, 사용자에게는 모두 '공을 인식하지 못함'과
 * 같은 상황이므로 같은 화면으로 보낸다(백엔드 설계 문서의 대응표). 원래 코드는 화면에 따로 표시한다.
 */
export function normalizeFailureCode(raw: string | null | undefined): AnalysisErrorCode {
  if (!raw) return 'SERVER_ERROR'
  if (isFailureCode(raw) || isConnectionCode(raw)) return raw
  if ((UPLOAD_REJECT_CODES as readonly string[]).includes(raw)) return 'INVALID_VIDEO'
  return 'BALL_NOT_DETECTED'
}

/** 보정 실패 코드 → 화면 오류 코드. 업로드 거절은 영상 문제로, 모르는 코드는 서버 오류로 본다 */
export function normalizeCalibrationCode(raw: string | null | undefined): CalibrationErrorCode {
  if (!raw) return 'SERVER_ERROR'
  if ((CALIBRATION_FAILURE_CODES as string[]).includes(raw) || isConnectionCode(raw)) return raw as CalibrationErrorCode
  if ((UPLOAD_REJECT_CODES as readonly string[]).includes(raw)) return 'INVALID_VIDEO'
  return 'SERVER_ERROR'
}

/** 오류 응답 본문에서 코드를 꺼낸다. {"code": "..."} 또는 FastAPI 기본 형식 {"detail": "..."} */
export function codeFromBody(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined
  const { code, detail } = body as { code?: unknown; detail?: unknown }
  if (typeof code === 'string') return code
  if (typeof detail === 'string' && /^[A-Z_]+$/.test(detail)) return detail
  if (detail && typeof detail === 'object' && typeof (detail as { code?: unknown }).code === 'string')
    return (detail as { code: string }).code
  return undefined
}
