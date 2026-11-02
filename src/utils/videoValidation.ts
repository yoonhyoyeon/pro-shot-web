import type { VideoMetadata } from '../types/analysis'

export interface VideoRules {
  extensions: readonly string[]
  mimeTypes: readonly string[]
  maxBytes: number
  minDuration: number
  maxDuration: number
  minShortSide: number
  /** 영상 용도에 맞춘 해결 안내 (기본: 슈팅 영상 기준) */
  hints?: Partial<Record<ValidationErrorCode, string>>
}

export const VIDEO_RULES = {
  extensions: ['mp4', 'mov'],
  mimeTypes: ['video/mp4', 'video/quicktime'],
  maxBytes: 200 * 1024 * 1024,
  minDuration: 1,
  maxDuration: 30,
  minShortSide: 480,
} as const satisfies VideoRules

/** 체스보드 보정 영상: 여러 위치·각도의 프레임이 필요해 최소 길이가 더 길다 */
export const CALIBRATION_VIDEO_RULES: VideoRules = {
  ...VIDEO_RULES,
  minDuration: 5,
  hints: {
    TOO_SHORT: '체스보드를 화면 여러 위치와 각도로 움직이며 10초 이상 촬영해주세요.',
    TOO_LONG: '30초 이내로 촬영하거나, 체스보드가 보이는 구간만 잘라서 올려주세요.',
    LOW_RESOLUTION: '보정은 분석할 영상과 같은 해상도로 촬영해야 합니다. 카메라 설정을 확인해주세요.',
  },
}

export const ACCEPT_ATTR = [...VIDEO_RULES.mimeTypes, ...VIDEO_RULES.extensions.map((e) => `.${e}`)].join(',')

export type ValidationErrorCode = 'INVALID_TYPE' | 'TOO_LARGE' | 'EMPTY' | 'UNREADABLE' | 'TOO_SHORT' | 'TOO_LONG' | 'LOW_RESOLUTION'

export interface ValidationError {
  code: ValidationErrorCode
  message: string
  hint: string
}

export type ValidationResult = { ok: true; metadata: VideoMetadata } | { ok: false; error: ValidationError }

const MB = 1024 * 1024

function messages(rules: VideoRules): Record<ValidationErrorCode, Omit<ValidationError, 'code'>> {
  return {
    INVALID_TYPE: { message: '지원하지 않는 파일 형식입니다.', hint: 'MP4 또는 MOV 영상을 선택해주세요.' },
    TOO_LARGE: {
      message: `파일이 너무 큽니다. (최대 ${rules.maxBytes / MB}MB)`,
      hint: '슈팅 장면만 남도록 영상을 잘라서 올려주세요.',
    },
    EMPTY: { message: '빈 파일입니다.', hint: '영상 파일이 정상적으로 저장되었는지 확인해주세요.' },
    UNREADABLE: { message: '영상을 읽을 수 없습니다.', hint: '파일이 손상되지 않았는지 확인하거나 다른 영상을 선택해주세요.' },
    TOO_SHORT: {
      message: `영상이 너무 짧습니다. (최소 ${rules.minDuration}초)`,
      hint: '공이 날아가는 장면이 모두 담기도록 촬영해주세요.',
    },
    TOO_LONG: {
      message: `영상이 너무 깁니다. (최대 ${rules.maxDuration}초)`,
      hint: '슈팅 직전부터 공이 골대에 도달할 때까지만 잘라서 올려주세요.',
    },
    LOW_RESOLUTION: {
      message: `해상도가 너무 낮습니다. (최소 ${rules.minShortSide}p)`,
      hint: '공을 인식할 수 있도록 720p 이상으로 촬영하는 것을 권장합니다.',
    },
  }
}

function errorOf(code: ValidationErrorCode, rules: VideoRules): ValidationError {
  const base = messages(rules)[code]
  return { code, message: base.message, hint: rules.hints?.[code] ?? base.hint }
}

const fail = (code: ValidationErrorCode, rules: VideoRules): ValidationResult => ({ ok: false, error: errorOf(code, rules) })

function extensionOf(name: string) {
  return name.split('.').pop()?.toLowerCase() ?? ''
}

/** 파일을 열지 않고 확인할 수 있는 항목(형식·크기)을 먼저 검사 */
export function checkFileBasics(
  file: Pick<File, 'name' | 'type' | 'size'>,
  rules: VideoRules = VIDEO_RULES,
): ValidationError | null {
  const typeOk = rules.mimeTypes.includes(file.type) || rules.extensions.includes(extensionOf(file.name))
  if (!typeOk) return errorOf('INVALID_TYPE', rules)
  if (file.size === 0) return errorOf('EMPTY', rules)
  if (file.size > rules.maxBytes) return errorOf('TOO_LARGE', rules)
  return null
}

/** 메타데이터(길이·해상도) 검사 */
export function checkMetadata(metadata: VideoMetadata, rules: VideoRules = VIDEO_RULES): ValidationError | null {
  if (!Number.isFinite(metadata.duration) || metadata.width === 0) return errorOf('UNREADABLE', rules)
  if (metadata.duration < rules.minDuration) return errorOf('TOO_SHORT', rules)
  if (metadata.duration > rules.maxDuration) return errorOf('TOO_LONG', rules)
  if (Math.min(metadata.width, metadata.height) < rules.minShortSide) return errorOf('LOW_RESOLUTION', rules)
  return null
}

/** 브라우저 video 요소로 길이와 해상도를 읽는다 */
export function readVideoMetadata(file: File, timeoutMs = 8000): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    const cleanup = () => {
      window.clearTimeout(timer)
      video.removeAttribute('src')
      video.load()
      URL.revokeObjectURL(url)
    }
    const timer = window.setTimeout(() => {
      cleanup()
      reject(new Error('metadata timeout'))
    }, timeoutMs)
    video.preload = 'metadata'
    video.muted = true
    video.onloadedmetadata = () => {
      const metadata = { duration: video.duration, width: video.videoWidth, height: video.videoHeight }
      cleanup()
      resolve(metadata)
    }
    video.onerror = () => {
      cleanup()
      reject(new Error('metadata error'))
    }
    video.src = url
  })
}

export async function validateVideoFile(file: File, rules: VideoRules = VIDEO_RULES): Promise<ValidationResult> {
  const basicError = checkFileBasics(file, rules)
  if (basicError) return { ok: false, error: basicError }

  let metadata: VideoMetadata
  try {
    metadata = await readVideoMetadata(file)
  } catch {
    return fail('UNREADABLE', rules)
  }
  const metaError = checkMetadata(metadata, rules)
  return metaError ? { ok: false, error: metaError } : { ok: true, metadata }
}
