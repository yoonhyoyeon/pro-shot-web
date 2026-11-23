import type { AnalysisResult, AnalysisStepId, GoalArea, GoalStatus, Size, TrajectoryPoint } from '../types/analysis'
import type { CalibrationStatus } from '../types/calibration'
import { trimAfterFlight } from '../utils/trajectory'

/*
 * 백엔드 응답 원본 형태와 화면용 형태 변환.
 * 기준 문서: docs/백엔드_연동_가이드.md, docs/백엔드_API_명세.md (backend/week7 브랜치)
 */

/** 분석 결과 원본. complete 이벤트의 data와 GET /analyses/{id}/result 200 응답이 같은 형태 */
export interface ServerAnalysisResult {
  status: 'VALID' | 'ANALYSIS_FAILED'
  /** 채점하지 못한 경우에도 0이 들어오므로 score_status로 구분한다 */
  score: number
  /** 11/15 추가. 없으면(이전 서버) 채점한 것으로 본다 */
  score_status?: 'EVALUATED' | 'NOT_EVALUATED'
  /** 11/16 추가. score의 만점. 측정하지 못한 항목이 빠지면 100보다 작아진다. 없으면 100 */
  score_max?: number
  /** 11/16 추가. 일부 근거로만 채점했는지 */
  score_partial?: boolean
  speed_kmh: number
  /** 골대 밖 통과와 판정 불가가 모두 false로 오므로 goal_status로 구분한다 */
  goal: boolean
  /** 11/15 추가. GOAL 골대 안쪽 통과 · OUTSIDE 바깥쪽 통과 · UNDETERMINED 판정 불가 */
  goal_status?: GoalStatus
  trajectory: TrajectoryPoint[]
  fps: number
  frame_size: Size
  confidence: number
  processing_time_sec: number
  trajectory_image: string
  comment: string
  /** status가 ANALYSIS_FAILED일 때만. 명세의 4가지 (BALL_NOT_DETECTED, TRACK_TOO_SHORT, FIT_FAILED, LOW_CONFIDENCE) */
  failure_reason?: string
  /** 분석 쪽 원래 실패 사유 (예: SPEED_UNCERTAINTY_HIGH). failure_reason보다 구체적이다 (9주차 추가) */
  failure_detail?: string
  /** 11/16 추가. 골대 사각형(왼쪽 위·오른쪽 아래). 궤적과 같은 원본 좌표계. 골대를 못 찾으면 null */
  goal_area?: { x1: number; y1: number; x2: number; y2: number } | null
}

/** 서버의 골대 사각형(두 꼭짓점) → 화면 형식(위치·크기). 없거나 크기가 0 이하면 그리지 않는다 */
export function toGoalArea(area: ServerAnalysisResult['goal_area']): GoalArea | undefined {
  if (!area) return undefined
  const width = area.x2 - area.x1
  const height = area.y2 - area.y1
  if (!(width > 0 && height > 0)) return undefined
  return { x: area.x1, y: area.y1, width, height }
}

/**
 * 공은 추적했지만 속도 계산 단계에서 보류된 세부 사유.
 * 서버는 실패(ANALYSIS_FAILED)로 보내지만 궤적은 믿을 수 있으므로, 실패 화면 대신
 * 궤적을 보여 주고 속도·점수만 보류한 부분 결과로 바꾼다.
 * 카메라 움직임(CAMERA_MOVING)·보정 오류(CALIBRATION_INVALID)는 궤적도 믿기 어려워 넣지 않는다.
 */
export const SPEED_HOLD_DETAILS = [
  'INSUFFICIENT_FLIGHT_OBSERVATIONS',
  'FLIGHT_INTERVAL_TOO_SHORT',
  'SPEED_UNCERTAINTY_HIGH',
  'BALL_SIZE_INCONSISTENT',
  'REPROJECTION_MISMATCH',
  'INVALID_DEPTH_ESTIMATE',
]

/** 부분 결과로 보여 줄 최소 궤적 점 개수. AI 속도 계산이 요구하는 최소 관측 수와 같다 */
export const MIN_PARTIAL_POINTS = 5

/** SSE 한 줄. event: 이름 없이 data: {"type": ...} 로 오므로 type 필드로 구분한다 */
export type ServerAnalysisEvent =
  | { type: 'progress'; value: number }
  | { type: 'keepalive' }
  | { type: 'complete'; data: ServerAnalysisResult }
  | { type: 'failed'; message?: string }

/** GET /calibrations/{id}. 진행 중은 202, 성공·실패는 둘 다 200 */
export type ServerCalibrationStatus =
  | { status: 'CALIBRATING'; progress: number }
  | {
      status: 'VALID'
      frame_size: Size
      used_frames: number
      reprojection_error: number
      focal_length: { fx: number; fy: number }
      principal_point: { cx: number; cy: number }
    }
  | { status: 'FAILED'; failure_reason: string; used_frames: number }

export function parseServerEvent(data: string): ServerAnalysisEvent | null {
  try {
    const value = JSON.parse(data) as { type?: unknown } | null
    return value && typeof value.type === 'string' ? (value as ServerAnalysisEvent) : null
  } catch {
    return null
  }
}

/**
 * 백엔드는 진행률 숫자만 보내고 단계 이름은 보내지 않는다. 백엔드 분석 구간으로 화면 단계를 정한다.
 * 0~15 정지 공 탐색 · 15~90 프레임별 탐지·추적 · 90~100 궤적 계산·시각화
 */
export function stepFromProgress(value: number): AnalysisStepId {
  if (value < 15) return 'validate'
  if (value < 90) return 'track'
  if (value < 100) return 'fit'
  return 'result'
}

export interface ResultMedia {
  videoUrl: string
  imageUrl: string
}

/**
 * 성공한 분석 결과 → 화면 결과.
 * - 골인: goal_status로 골인·골대 밖·판정 보류를 구분 (없으면 goal 값으로, false는 판정 보류로 본다)
 * - 점수: 미평가면 null (서버는 0을 보냄). 만점(score_max)과 일부 채점 여부를 함께 옮긴다
 * - 궤적: 공이 골대에 닿은 뒤 골망·바닥에서 움직인 점은 뺀다 (trimAfterFlight)
 * - 골대 영역: 두 꼭짓점 → 위치·크기
 * 백엔드에 없는 값(예측 궤적)은 비워 두고, comment를 피드백 문구로 쓴다.
 */
export function toAnalysisResult(raw: ServerAnalysisResult, media: ResultMedia): AnalysisResult {
  const trajectory = trimAfterFlight(raw.trajectory)
  return {
    status: 'VALID',
    speed_kmh: raw.speed_kmh,
    score: raw.score_status === 'NOT_EVALUATED' ? null : raw.score,
    score_max: raw.score_max ?? 100,
    score_partial: raw.score_partial ?? false,
    goal: raw.goal_status ?? (raw.goal ? 'GOAL' : 'UNDETERMINED'),
    goal_area: toGoalArea(raw.goal_area),
    confidence: raw.confidence,
    frames_tracked: trajectory.length,
    feedback: raw.comment,
    frame_size: raw.frame_size,
    fps: raw.fps,
    frame_url: media.imageUrl,
    video_url: media.videoUrl,
    trajectory,
    predicted_trajectory: [],
  }
}

/** 분석이 끝난 결과를 화면에 어떻게 보여 줄지 */
export type ResultOutcome =
  | { type: 'result'; result: AnalysisResult }
  /** reason: 명세 실패 코드 · detail: 분석 쪽 세부 코드 */
  | { type: 'failure'; reason?: string; detail?: string }

/**
 * 완료된 분석(complete 이벤트) → 결과 화면 또는 실패 화면.
 * 속도 계산 단계에서만 보류된 실패는 궤적이 충분하면 부분 결과(PARTIAL)로 보여 준다.
 * 이때도 속도 없이 매긴 참고 점수(예: 60점 만점에 34점)가 오면 그대로 보여 준다.
 */
export function interpretResult(raw: ServerAnalysisResult, media: ResultMedia): ResultOutcome {
  if (raw.status === 'VALID') return { type: 'result', result: toAnalysisResult(raw, media) }

  const detail = raw.failure_detail
  if (detail && SPEED_HOLD_DETAILS.includes(detail)) {
    const result = toAnalysisResult(raw, media)
    if (result.trajectory.length >= MIN_PARTIAL_POINTS) {
      return {
        type: 'result',
        result: { ...result, status: 'PARTIAL', speed_kmh: null, hold_reason: detail },
      }
    }
  }
  return { type: 'failure', reason: raw.failure_reason, detail }
}

/** 보정 상태 원본 → 화면 상태. 백엔드에 없는 측정일은 결과를 받은 시각으로 둔다 */
export function toCalibrationStatus(
  raw: ServerCalibrationStatus,
  calibrationId: string,
  now: Date = new Date(),
): CalibrationStatus {
  switch (raw.status) {
    case 'CALIBRATING':
      return { status: 'processing', progress: raw.progress }
    case 'FAILED':
      return { status: 'failed', code: raw.failure_reason }
    case 'VALID':
      return {
        status: 'done',
        result: {
          calibration_id: calibrationId,
          image_size: raw.frame_size,
          fx: raw.focal_length.fx,
          fy: raw.focal_length.fy,
          cx: raw.principal_point.cx,
          cy: raw.principal_point.cy,
          frames_used: raw.used_frames,
          rms_error: raw.reprojection_error,
          created_at: now.toISOString(),
        },
      }
    default:
      // 문서에 없는 상태 → 모르는 코드로 넘겨 서버 오류 화면으로
      return { status: 'failed', code: String((raw as { status?: unknown }).status) }
  }
}
