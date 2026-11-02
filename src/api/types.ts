import type { AnalysisErrorCode, AnalysisEvent, SelectedVideo } from '../types/analysis'
import type { CalibrationErrorCode, CalibrationStatus } from '../types/calibration'

export interface UploadOptions {
  /** 업로드 진행률 0~100 */
  onProgress?: (percent: number) => void
  signal?: AbortSignal
}

export interface AnalysisUploadOptions extends UploadOptions {
  /** 적용할 카메라 보정. 없으면 백엔드 기본값으로 분석 */
  calibrationId?: string
}

/**
 * 프론트엔드가 백엔드에 기대하는 동작.
 * Mock 구현과 실제 HTTP 구현이 같은 인터페이스를 따르므로 화면 코드는 어느 쪽인지 모른다.
 */
export interface AnalysisApi {
  /** POST /analyses — 영상 업로드 후 분석 작업 생성 */
  createAnalysis(video: SelectedVideo, options?: AnalysisUploadOptions): Promise<{ analysisId: string }>
  /** GET /analyses/{id}/events (SSE) — 진행 이벤트 구독. 반환값은 구독 해제 함수 */
  subscribe(analysisId: string, onEvent: (event: AnalysisEvent) => void): () => void
}

/** 카메라 보정. 분석보다 짧고 단계 구분이 없어 SSE 대신 상태 조회(폴링)를 쓴다 */
export interface CalibrationApi {
  /** POST /calibrations — 체스보드 영상 업로드 후 보정 작업 생성 */
  createCalibration(video: SelectedVideo, options?: UploadOptions): Promise<{ calibrationId: string }>
  /** GET /calibrations/{id} — 보정 작업 상태 */
  getCalibration(calibrationId: string, signal?: AbortSignal): Promise<CalibrationStatus>
}

/** API 호출 실패를 화면에서 구분할 수 있도록 오류 코드를 담는다 */
export class ApiError<C extends string = AnalysisErrorCode | CalibrationErrorCode> extends Error {
  code: C
  /** 서버가 보낸 원래 코드 (있을 때만) */
  rawCode?: string
  constructor(code: C, message?: string, rawCode?: string) {
    super(message ?? code)
    this.name = 'ApiError'
    this.code = code
    this.rawCode = rawCode
  }
}

export const isAbortError = (e: unknown) => e instanceof DOMException && e.name === 'AbortError'
