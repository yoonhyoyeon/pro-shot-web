import { describe, expect, it } from 'vitest'
import {
  parseServerEvent,
  stepFromProgress,
  toAnalysisResult,
  toCalibrationStatus,
  type ServerAnalysisResult,
  type ServerCalibrationStatus,
} from './serverMapping'

// 배포 서버 예시 작업(sample-valid, sample-calibration-ok 등)의 실제 응답 (궤적은 앞부분만)
const VALID: ServerAnalysisResult = {
  status: 'VALID',
  score: 78,
  speed_kmh: 93.7,
  goal: false,
  trajectory: [
    { x: 940.0, y: 905.0, frame: 0 },
    { x: 962.8, y: 862.2, frame: 1 },
    { x: 985.5, y: 821.4, frame: 2 },
  ],
  fps: 29.97,
  frame_size: { width: 1920, height: 1080 },
  confidence: 0.82,
  processing_time_sec: 34.2,
  trajectory_image: 'sample_valid_result.jpg',
  comment: '아마추어를 뛰어넘은 멋진 슈팅! 🔥',
}

describe('parseServerEvent: SSE data 한 줄', () => {
  it('type 필드로 이벤트를 구분한다', () => {
    expect(parseServerEvent('{"type": "progress", "value": 45}')).toEqual({ type: 'progress', value: 45 })
    expect(parseServerEvent('{"type": "keepalive"}')).toEqual({ type: 'keepalive' })
    expect(parseServerEvent(JSON.stringify({ type: 'complete', data: VALID }))).toEqual({ type: 'complete', data: VALID })
  })
  it('JSON이 아니거나 type이 없으면 무시', () => {
    expect(parseServerEvent('not json')).toBeNull()
    expect(parseServerEvent('{"value": 45}')).toBeNull()
    expect(parseServerEvent('null')).toBeNull()
  })
})

describe('stepFromProgress: 백엔드 진행률 구간 → 화면 단계', () => {
  it.each([
    [0, 'validate'],
    [14, 'validate'],
    [15, 'track'],
    [89, 'track'],
    [90, 'fit'],
    [99, 'fit'],
    [100, 'result'],
  ])('%i → %s', (value, step) => {
    expect(stepFromProgress(value)).toBe(step)
  })
})

describe('toAnalysisResult: 백엔드 결과 → 화면 결과', () => {
  const media = { videoUrl: 'blob:local-video', imageUrl: 'https://api/results/sample_valid_result.jpg' }
  const result = toAnalysisResult(VALID, media)

  it('수치와 좌표는 그대로 옮긴다', () => {
    expect(result).toMatchObject({
      status: 'VALID',
      score: 78,
      speed_kmh: 93.7,
      goal: false,
      confidence: 0.82,
      fps: 29.97,
      frame_size: { width: 1920, height: 1080 },
      trajectory: VALID.trajectory,
    })
  })
  it('comment는 피드백 문구로, 추적 점 개수는 추적 프레임 수로', () => {
    expect(result.feedback).toBe(VALID.comment)
    expect(result.frames_tracked).toBe(3)
  })
  it('영상·이미지 주소를 붙이고 백엔드에 없는 예측 궤적·골대 영역은 비운다', () => {
    expect(result.video_url).toBe(media.videoUrl)
    expect(result.frame_url).toBe(media.imageUrl)
    expect(result.predicted_trajectory).toEqual([])
    expect(result.goal_area).toBeUndefined()
  })
})

describe('toCalibrationStatus: 보정 상태 → 화면 상태', () => {
  const now = new Date('2026-11-02T07:00:00Z')

  it('진행 중', () => {
    expect(toCalibrationStatus({ status: 'CALIBRATING', progress: 40 }, 'c1', now)).toEqual({
      status: 'processing',
      progress: 40,
    })
  })
  it('성공: 중첩된 값을 펼치고 id와 받은 시각을 붙인다', () => {
    const raw: ServerCalibrationStatus = {
      status: 'VALID',
      frame_size: { width: 1920, height: 1080 },
      used_frames: 23,
      reprojection_error: 0.418,
      focal_length: { fx: 1452.31, fy: 1449.87 },
      principal_point: { cx: 963.52, cy: 539.11 },
    }
    expect(toCalibrationStatus(raw, 'sample-calibration-ok', now)).toEqual({
      status: 'done',
      result: {
        calibration_id: 'sample-calibration-ok',
        image_size: { width: 1920, height: 1080 },
        fx: 1452.31,
        fy: 1449.87,
        cx: 963.52,
        cy: 539.11,
        frames_used: 23,
        rms_error: 0.418,
        created_at: '2026-11-02T07:00:00.000Z',
      },
    })
  })
  it('실패: 200으로 오지만 실패 코드를 넘긴다', () => {
    const raw: ServerCalibrationStatus = { status: 'FAILED', failure_reason: 'CHESSBOARD_NOT_FOUND', used_frames: 0 }
    expect(toCalibrationStatus(raw, 'c1', now)).toEqual({ status: 'failed', code: 'CHESSBOARD_NOT_FOUND' })
  })
})
