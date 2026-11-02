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

export type AnalysisStatus = 'VALID' | 'BALL_NOT_DETECTED'

/** 화면에서 쓰는 분석 결과. HTTP 응답은 api/serverMapping.ts에서 이 형태로 바꾼다 */
export interface AnalysisResult {
  status: AnalysisStatus
  speed_kmh: number
  score: number
  goal: boolean
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
