import type { AnalysisResult, AnalysisStepId, Size, TrajectoryPoint } from '../types/analysis'
import type { CalibrationStatus } from '../types/calibration'

/*
 * 백엔드 응답 원본 형태와 화면용 형태 변환.
 * 기준 문서: docs/백엔드_연동_가이드.md, docs/백엔드_API_명세.md (backend/week7 브랜치)
 */

/** 분석 결과 원본. complete 이벤트의 data와 GET /analyses/{id}/result 200 응답이 같은 형태 */
export interface ServerAnalysisResult {
  status: 'VALID' | 'ANALYSIS_FAILED'
  score: number
  speed_kmh: number
  goal: boolean
  trajectory: TrajectoryPoint[]
  fps: number
  frame_size: Size
  confidence: number
  processing_time_sec: number
  trajectory_image: string
  comment: string
  /** status가 ANALYSIS_FAILED일 때만 */
  failure_reason?: string
}

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

/**
 * 성공한 분석 결과 → 화면 결과.
 * 백엔드에 없는 값(예측 궤적, 골대 영역)은 비워 두고, comment를 피드백 문구로 쓴다.
 */
export function toAnalysisResult(
  raw: ServerAnalysisResult,
  media: { videoUrl: string; imageUrl: string },
): AnalysisResult {
  return {
    status: 'VALID',
    speed_kmh: raw.speed_kmh,
    score: raw.score,
    goal: raw.goal,
    confidence: raw.confidence,
    frames_tracked: raw.trajectory.length,
    feedback: raw.comment,
    frame_size: raw.frame_size,
    fps: raw.fps,
    frame_url: media.imageUrl,
    video_url: media.videoUrl,
    trajectory: raw.trajectory,
    predicted_trajectory: [],
  }
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
