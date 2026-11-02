import arrowIcon from '../../assets/icons/arrow-right-dark.svg'
import checkIcon from '../../assets/icons/check.svg'
import type { ReactNode } from 'react'
import type { SelectedVideo as SelectedVideoData } from '../../types/analysis'
import { Button } from '../common/Button'
import { StatusBadge } from '../common/StatusBadge'

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatType(video: SelectedVideoData) {
  const ext = video.name.split('.').pop()
  return (ext ?? video.type).toUpperCase()
}

interface SelectedVideoProps {
  video: SelectedVideoData
  onStart: () => void
  onReset: () => void
  startLabel?: string
  /** 업로드 조건 확인 아래에 붙는 안내 (예: 카메라 보정 적용 여부) */
  notice?: ReactNode
}

/** 영상 선택 후 분석 시작 전 미리보기 */
export function SelectedVideo({ video, onStart, onReset, startLabel = '분석 시작', notice }: SelectedVideoProps) {
  const meta = video.metadata
  const specs = [
    { label: '형식', value: formatType(video) },
    { label: '크기', value: formatBytes(video.size) },
    ...(meta
      ? [
          { label: '길이', value: `${meta.duration.toFixed(1)}초` },
          { label: '해상도', value: `${meta.width}×${meta.height}` },
        ]
      : []),
  ]

  return (
    <div className="bg-surface shadow-ring-strong animate-fade-in flex h-full flex-col gap-5 rounded-2xl p-5 sm:p-6">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
        {video.kind === 'video' ? (
          <video src={video.previewUrl} controls muted playsInline className="size-full object-contain" />
        ) : (
          <img src={video.previewUrl} alt="선택한 영상 미리보기" className="size-full object-cover" />
        )}
        <span className="absolute top-3 left-3">
          <StatusBadge tone="accent" dot>
            READY
          </StatusBadge>
        </span>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-fg truncate text-base leading-6 font-medium" title={video.name}>
            {video.name}
          </p>
          <dl className="text-fg-subtle flex flex-wrap gap-x-3 gap-y-1 pt-1 font-mono text-xs leading-4">
            {specs.map((s) => (
              <div key={s.label} className="flex gap-1">
                <dt className="sr-only">{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
          <p className="text-accent flex items-center gap-1.5 pt-2 text-xs leading-4">
            <span className="bg-accent/70 flex size-3.5 items-center justify-center rounded-full">
              <img src={checkIcon} alt="" width={9} height={9} />
            </span>
            업로드 조건을 모두 충족했어요
          </p>
          {notice}
        </div>
        <div className="flex shrink-0 gap-3">
          <Button variant="secondary" onClick={onReset}>
            다른 영상 선택
          </Button>
          <Button onClick={onStart}>
            {startLabel}
            <img src={arrowIcon} alt="" width={14} height={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}
