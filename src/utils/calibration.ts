import type { Size } from '../types/analysis'
import type { CalibrationMatch, CalibrationResult } from '../types/calibration'

/**
 * 체스보드 규격. AI 파트 보정 코드(calibrate.py)의 패턴 설정과 같아야 코너를 찾을 수 있다.
 * 내부 코너 9×6 = 가로 10칸 × 세로 7칸. 칸 크기는 내부 파라미터(fx, fy, cx, cy) 계산에는 영향이 없다.
 */
export const CHECKERBOARD = { innerCols: 9, innerRows: 6, squareMm: 25 } as const

/** 화면 비율 차이를 같은 비율로 볼 허용 오차 (1%) */
const ASPECT_TOLERANCE = 0.01

/**
 * 보정 해상도와 분석 영상 해상도를 비교한다.
 * - same: 그대로 적용
 * - scaled: 같은 비율로 크기만 다름 → 백엔드가 내부 파라미터를 비율에 맞춰 조정
 * - mismatch: 가로·세로 방향이나 화면 비율이 다름(다른 촬영 모드·잘림) → 같은 보정을 쓸 수 없음
 */
export function compareCalibration(calibration: Size, video: Size): CalibrationMatch {
  if (calibration.width === video.width && calibration.height === video.height) return 'same'
  const landscape = (s: Size) => s.width >= s.height
  if (landscape(calibration) !== landscape(video)) return 'mismatch'
  const ratio = (s: Size) => s.width / s.height
  const diff = Math.abs(ratio(calibration) - ratio(video)) / ratio(calibration)
  return diff <= ASPECT_TOLERANCE ? 'scaled' : 'mismatch'
}

export type CalibrationQuality = 'good' | 'fair' | 'poor'

/**
 * 재투영 오차(RMS, px)로 보정 품질을 안내한다.
 * 일반적으로 1px 미만이면 쓸 만하고 0.5px 미만이면 양호하다고 본다(화면 안내용 잠정 기준).
 */
export function calibrationQuality(rmsError: number): CalibrationQuality {
  if (rmsError < 0.5) return 'good'
  if (rmsError < 1) return 'fair'
  return 'poor'
}

export const QUALITY_LABEL: Record<CalibrationQuality, string> = {
  good: '양호',
  fair: '보통',
  poor: '다시 촬영 권장',
}

const STORAGE_KEY = 'proshot.calibration.v1'

/** 저장된 값이 보정 결과 형태인지 확인 (다른 버전이나 손상된 값은 무시) */
export function parseStoredCalibration(raw: string | null): CalibrationResult | null {
  if (!raw) return null
  try {
    const value = JSON.parse(raw) as Partial<CalibrationResult>
    const size = value.image_size
    if (
      typeof value.calibration_id === 'string' &&
      size &&
      Number.isFinite(size.width) &&
      Number.isFinite(size.height) &&
      typeof value.rms_error === 'number'
    )
      return value as CalibrationResult
  } catch {
    // 무시
  }
  return null
}

/** 보정은 휴대폰(카메라)마다 다르므로 이 브라우저에 저장해 다음 분석에도 쓴다 */
export function loadCalibration(): CalibrationResult | null {
  try {
    return parseStoredCalibration(window.localStorage.getItem(STORAGE_KEY))
  } catch {
    return null
  }
}

export function saveCalibration(calibration: CalibrationResult | null) {
  try {
    if (calibration) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(calibration))
    else window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // 저장소를 쓸 수 없는 환경(사생활 보호 모드 등)에서는 이번 방문 동안만 유지
  }
}

/** A4 가로(297×210mm)에 맞춘 인쇄용 체스보드 SVG. 실제 크기(mm)로 출력된다 */
export function checkerboardSvg({ innerCols, innerRows, squareMm } = CHECKERBOARD): string {
  const cols = innerCols + 1
  const rows = innerRows + 1
  const pageW = 297
  const pageH = 210
  const x0 = (pageW - cols * squareMm) / 2
  const y0 = (pageH - rows * squareMm) / 2
  const squares: string[] = []
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if ((r + c) % 2 === 0)
        squares.push(`<rect x="${x0 + c * squareMm}" y="${y0 + r * squareMm}" width="${squareMm}" height="${squareMm}"/>`)
  const caption = `PRO SHOT calibration · inner corners ${innerCols}x${innerRows} · square ${squareMm}mm · print at 100%`
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${pageW}mm" height="${pageH}mm" viewBox="0 0 ${pageW} ${pageH}">`,
    `<rect width="${pageW}" height="${pageH}" fill="#fff"/>`,
    `<g fill="#000">${squares.join('')}</g>`,
    `<text x="${pageW / 2}" y="${pageH - 6}" font-size="4" text-anchor="middle" fill="#888" font-family="sans-serif">${caption}</text>`,
    '</svg>',
  ].join('')
}

/** 분석 요청에 붙일 보정 ID. 화면 비율·방향이 달라 같은 보정을 쓸 수 없으면 보내지 않는다 */
export function calibrationIdFor(calibration: CalibrationResult | null, video: { metadata?: Size }): string | undefined {
  if (!calibration || !video.metadata) return undefined
  return compareCalibration(calibration.image_size, video.metadata) === 'mismatch' ? undefined : calibration.calibration_id
}
