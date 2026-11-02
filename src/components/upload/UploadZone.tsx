import { useRef, useState, type DragEvent, type ReactNode } from 'react'
import uploadIcon from '../../assets/icons/upload.svg'
import alertIcon from '../../assets/icons/alert-circle.svg'
import type { VideoMetadata } from '../../types/analysis'
import {
  ACCEPT_ATTR,
  VIDEO_RULES,
  validateVideoFile,
  type ValidationError,
  type VideoRules,
} from '../../utils/videoValidation'
import { Button } from '../common/Button'

interface UploadZoneProps {
  onFileSelect: (file: File, metadata: VideoMetadata) => void
  /** 검증 기준 (기본: 슈팅 영상) */
  rules?: VideoRules
  title?: string
  /** 형식·길이 안내 아래에 붙는 설명 */
  description?: ReactNode
}

export function UploadZone({
  onFileSelect,
  rules = VIDEO_RULES,
  title = '슈팅 영상을 업로드하세요',
  description = '축구공과 골대가 화면 안에 보이는 영상',
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<(ValidationError & { fileName: string }) | null>(null)

  const handleFile = async (file: File) => {
    setError(null)
    setChecking(true)
    const result = await validateVideoFile(file, rules)
    setChecking(false)
    if (result.ok) onFileSelect(file, result.metadata)
    else setError({ ...result.error, fileName: file.name })
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) void handleFile(file)
  }

  const borderClass = dragging
    ? 'bg-accent/5 shadow-[0_0_0_1.5px_rgb(57_224_121/0.6)]'
    : error
      ? 'bg-surface shadow-[0_0_0_1px_rgb(224_84_57/0.35)]'
      : 'bg-surface shadow-ring-strong'

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={(e) => {
        // 자식 요소 사이를 오갈 때는 무시
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false)
      }}
      onDrop={handleDrop}
      aria-busy={checking}
      className={`flex h-full min-h-[280px] flex-col sm:min-h-[360px] items-center justify-center gap-5 rounded-2xl p-8 text-center transition ${borderClass}`}
    >
      {checking ? (
        <span aria-hidden className="border-accent/20 border-t-accent size-10 animate-spin rounded-full border-2" />
      ) : (
        <img src={uploadIcon} alt="" width={40} height={40} className={dragging ? 'animate-bounce' : ''} />
      )}
      <div>
        <p className="text-fg text-base leading-6 font-medium" aria-live="polite">
          {checking ? '영상을 확인하고 있어요' : dragging ? '여기에 놓으면 업로드됩니다' : title}
        </p>
        <p className="text-fg-subtle pt-2 text-sm leading-[22.75px]">
          MP4, MOV · 최대 {rules.maxBytes / 1024 / 1024}MB · {rules.minDuration}~{rules.maxDuration}초 · {description}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="bg-danger/6 animate-fade-in flex max-w-md gap-3 rounded-xl p-4 text-left shadow-[0_0_0_1px_rgb(224_84_57/0.2)]"
        >
          <img src={alertIcon} alt="" width={16} height={16} className="mt-0.5 shrink-0 self-start" />
          <div className="min-w-0">
            <p className="text-danger text-sm leading-5 font-medium">{error.message}</p>
            <p className="text-fg-muted pt-1 text-xs leading-[19.5px]">{error.hint}</p>
            <p className="text-fg-subtle truncate pt-1 font-mono text-[11px] leading-4" title={error.fileName}>
              {error.fileName}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={() => inputRef.current?.click()} disabled={checking} className="shadow-none">
          {error ? '다른 영상 선택' : '영상 선택'}
        </Button>
        {/* 터치 기기(스마트폰)에서만: 카메라 앱을 바로 열어 촬영 */}
        <span className="hidden pointer-coarse:contents">
          <Button variant="secondary" onClick={() => cameraRef.current?.click()} disabled={checking}>
            바로 촬영하기
          </Button>
        </span>
      </div>
      <p className="text-fg-subtle hidden text-xs leading-4 sm:block pointer-coarse:hidden">또는 이 영역에 파일을 드래그하세요</p>
      <input
        ref={cameraRef}
        type="file"
        accept="video/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
          e.target.value = ''
        }}
      />
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
