/** 영상 원본 좌표계 기준 공 위치 (px) */
export interface TrajectoryPoint {
  frame: number
  x: number
  y: number
  confidence?: number
}

export interface Size {
  width: number
  height: number
}

/** 영상 좌표계 기준 골대 영역 */
export interface GoalArea {
  x: number
  y: number
  width: number
  height: number
}

/**
 * VALID: 속도까지 계산한 결과
 * PARTIAL: 공은 추적했지만 속도를 계산하지 못해 속도·점수를 보류한 결과 (서버는 ANALYSIS_FAILED로 보냄)
 */
export type AnalysisStatus = 'VALID' | 'PARTIAL'

/** 골인 추정. 영상만으로 골라인 통과를 확정할 수 없으면 판정 보류(UNDETERMINED) */
export type GoalStatus = 'GOAL' | 'OUTSIDE' | 'UNDETERMINED'

/** 화면에서 쓰는 분석 결과. HTTP 응답은 api/serverMapping.ts에서 이 형태로 바꾼다 */
export interface AnalysisResult {
  status: AnalysisStatus
  /** null: 속도 보류 */
  speed_kmh: number | null
  /** null: 미평가 (골인 미확정이거나 속도 보류). 골대 밖은 0점 */
  score: number | null
  goal: GoalStatus
  /** 속도를 보류한 이유. 서버의 세부 실패 코드(failure_detail). PARTIAL일 때만 */
  hold_reason?: string
  confidence: number
  frames_tracked: number
  feedback: string
  /** 궤적 좌표가 기준으로 삼는 분석 해상도 */
  frame_size: Size
  /** 영상 프레임 레이트. 프레임 번호 → 재생 시간 변환에 사용 */
  fps: number
  /** 결과 화면 배경으로 쓰는 대표 프레임 */
  frame_url: string
  /** 분석에 사용된 원본 영상. 있으면 영상 위에 궤적을 재생과 맞춰 표시 */
  video_url?: string
  trajectory: TrajectoryPoint[]
  predicted_trajectory: TrajectoryPoint[]
  goal_area?: GoalArea
}

export type AnalysisStepId = 'validate' | 'track' | 'fit' | 'result'

export interface AnalysisStep {
  id: AnalysisStepId
  label: string
  /** 진행 중일 때 화면 중앙에 보여줄 설명 */
  message: string
}

/** 분석 자체가 실패한 경우(영상 문제) */
export type AnalysisFailureCode = 'BALL_NOT_DETECTED' | 'GOAL_NOT_DETECTED' | 'INVALID_VIDEO'
/** 통신이 실패한 경우(서버·네트워크 문제) */
export type ConnectionErrorCode = 'NETWORK_ERROR' | 'SERVER_ERROR' | 'TIMEOUT'
export type AnalysisErrorCode = AnalysisFailureCode | ConnectionErrorCode

/** 분석 진행 SSE 이벤트 (GET /analyses/{id}/events) */
export type AnalysisEvent =
  | { type: 'progress'; progress: number; step: AnalysisStepId }
  | { type: 'complete'; result: AnalysisResult }
  /** rawCode: 서버가 보낸 원래 코드 (화면 코드와 다를 때만) */
  | { type: 'error'; code: AnalysisErrorCode; rawCode?: string }

export interface VideoMetadata {
  /** 초 단위 길이 */
  duration: number
  width: number
  height: number
}

export interface SelectedVideo {
  /** 사용자가 고른 실제 파일. 프로토타입 이동으로 들어온 경우 없음 */
  file?: File
  name: string
  size: number
  type: string
  previewUrl: string
  kind: 'video' | 'image'
  metadata?: VideoMetadata
}
