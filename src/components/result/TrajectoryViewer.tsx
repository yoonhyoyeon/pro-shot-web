import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import type { GoalArea, Size, TrajectoryPoint } from '../../types/analysis'
import {
  boxToSource,
  frameToTime,
  interpolateAt,
  fitTransform,
  minRadiusInSource,
  pointsToDraw,
  scaleArea,
  scalePoints,
  timeToFrame,
  type FitMode,
} from '../../utils/coordinates'

interface TrajectoryViewerProps {
  /** 대표 프레임 이미지 (영상이 없을 때 배경) */
  frameUrl: string
  /** 분석에 사용된 원본 영상. 있으면 영상 위에 재생과 맞춰 궤적을 그림 */
  videoUrl?: string
  /** 좌표가 기준으로 삼는 분석 해상도 */
  frameSize: Size
  fps: number
  trajectory: TrajectoryPoint[]
  predicted?: TrajectoryPoint[]
  goalArea?: GoalArea
  framesTracked?: number
}

const toPoints = (points: TrajectoryPoint[]) => points.map((p) => `${p.x},${p.y}`).join(' ')

/**
 * 영상(또는 대표 프레임) 위에 공 궤적을 그린다.
 *
 * 좌표 변환 순서
 * 1. 분석 해상도(frameSize) → 실제 영상 해상도(videoWidth×videoHeight)로 환산 (scalePoints)
 * 2. SVG viewBox를 실제 영상 해상도와 같게 두고, preserveAspectRatio를 영상의 object-fit과 맞춤
 *    - 대표 프레임: object-cover ↔ slice / 영상: object-contain ↔ meet
 *    → 화면 크기가 바뀌어도 영상과 궤적이 같은 비율로 늘어나 어긋나지 않음
 * 3. 마우스 위치는 boxToSource로 역변환해 영상 좌표로 표시
 */
export function TrajectoryViewer({
  frameUrl,
  videoUrl,
  frameSize,
  fps,
  trajectory,
  predicted = [],
  goalArea,
  framesTracked,
}: TrajectoryViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoSize, setVideoSize] = useState<Size | null>(null)
  const [currentFrame, setCurrentFrame] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const [selectedFrame, setSelectedFrame] = useState<number | null>(null)
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const [boxSize, setBoxSize] = useState<Size | null>(null)

  const isVideo = Boolean(videoUrl)
  const fit: FitMode = isVideo ? 'contain' : 'cover'
  const source = (isVideo && videoSize) || frameSize

  // 1. 분석 해상도 → 실제 영상 해상도
  const points = useMemo(() => scalePoints(trajectory, frameSize, source), [trajectory, frameSize, source])
  const predictedPoints = useMemo(() => scalePoints(predicted, frameSize, source), [predicted, frameSize, source])
  const area = useMemo(() => goalArea && scaleArea(goalArea, frameSize, source), [goalArea, frameSize, source])

  // 재생 중에는 현재 프레임까지의 궤적만, 멈추면 전체 궤적을 표시
  const visible = pointsToDraw(points, currentFrame, playing)
  const head = playing ? visible[visible.length - 1] : undefined
  // 추적 점 사이에 있는 현재 프레임의 공 위치 (선이 공을 따라가도록)
  const ball = currentFrame === null ? null : interpolateAt(points, currentFrame)
  const linePoints = playing && ball && ball.frame !== head?.frame ? [...visible, ball] : visible

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    let raf = 0
    const tick = () => {
      setCurrentFrame(timeToFrame(video.currentTime, fps))
      if (!video.paused && !video.ended) raf = requestAnimationFrame(tick)
    }
    const onPlay = () => {
      setPlaying(true)
      setSelectedFrame(null)
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(tick)
    }
    const onPause = () => setPlaying(false)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('seeked', tick)
    return () => {
      cancelAnimationFrame(raf)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('seeked', tick)
    }
  }, [fps, videoUrl])

  // 컨테이너 크기를 추적해 화면 배율을 계산 (터치 영역 크기에 사용)
  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) =>
      setBoxSize({ width: entry.contentRect.width, height: entry.contentRect.height }),
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const unit = source.width / 892
  const screenScale = boxSize ? fitTransform(source, boxSize, fit).scale : 1
  // 화면에서 지름 44px 이상이 되도록 (WCAG 2.5.5 권장 터치 영역)
  const hitRadius = minRadiusInSource(22 * unit, screenScale)
  // 영상이 작게 표시되는 모바일에서도 점과 표시가 보이도록 화면 기준 최소 크기를 둔다
  const dotRadius = minRadiusInSource(6.2 * unit, screenScale, 5)
  const edgeDotRadius = minRadiusInSource(10.7 * unit, screenScale, 7)
  const haloRadius = minRadiusInSource(20 * unit, screenScale, 14)
  const ringRadius = minRadiusInSource(14 * unit, screenScale, 9)
  const ringStroke = minRadiusInSource(2.5 * unit, screenScale, 2)
  const first = visible[0]
  const last = visible[visible.length - 1]
  const selected = points.find((p) => p.frame === selectedFrame)

  const selectPoint = (p: TrajectoryPoint) => {
    const next = selectedFrame === p.frame ? null : p.frame
    setSelectedFrame(next)
    // 점을 고르면 영상도 그 프레임으로 이동
    if (next !== null && videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = frameToTime(p.frame, fps)
    }
  }

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    // 좌표 표시는 마우스에서만 (터치에서는 손가락이 화면을 가림)
    if (e.pointerType !== 'mouse') return
    const rect = e.currentTarget.getBoundingClientRect()
    setCursor(
      boxToSource({ x: e.clientX - rect.left, y: e.clientY - rect.top }, source, { width: rect.width, height: rect.height }, fit),
    )
  }

  return (
    <figure className="flex flex-col">
      <div
        ref={boxRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setCursor(null)}
        className="shadow-ring-strong relative aspect-[833/496] overflow-hidden rounded-2xl bg-black"
      >
        {isVideo ? (
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            muted
            playsInline
            onLoadedMetadata={(e) =>
              setVideoSize({ width: e.currentTarget.videoWidth, height: e.currentTarget.videoHeight })
            }
            className="absolute inset-0 size-full object-contain"
          />
        ) : (
          <img src={frameUrl} alt="분석에 사용된 슈팅 영상 프레임" className="absolute inset-0 size-full object-cover" />
        )}

        <svg
          viewBox={`0 0 ${source.width} ${source.height}`}
          preserveAspectRatio={fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet'}
          className="pointer-events-none absolute inset-0 size-full"
          role="img"
          aria-label={`공 궤적: ${points.length}개 추적 좌표`}
        >
          <defs>
            <linearGradient id="track-gradient" x1={points[0]?.x} x2={points[points.length - 1]?.x} y1="0" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3ECFEF" stopOpacity="0.3" />
              <stop offset="1" stopColor="#3ECFEF" stopOpacity="0.9" />
            </linearGradient>
            <filter id="track-blur" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation={5 * unit} />
            </filter>
          </defs>

          {area && (
            <rect
              x={area.x}
              y={area.y}
              width={area.width}
              height={area.height}
              fill="none"
              stroke="#3ECFEF"
              strokeOpacity={0.3}
              strokeWidth={4.5 * unit}
            />
          )}

          {predictedPoints.length > 1 && (
            <polyline
              points={toPoints(predictedPoints)}
              fill="none"
              stroke="#39E079"
              strokeOpacity={currentFrame === null ? 0.45 : 0.25}
              strokeWidth={4.9 * unit}
              strokeDasharray={`${17.9 * unit} ${16.1 * unit}`}
              strokeLinecap="round"
              className="animate-fade-in"
            />
          )}

          {/* 실제 추적 경로: 흐린 glow + 그라디언트 선 */}
          {linePoints.length > 1 && (
            <>
              <polyline
                points={toPoints(linePoints)}
                fill="none"
                stroke="url(#track-gradient)"
                strokeWidth={6.7 * unit}
                strokeLinejoin="round"
                filter="url(#track-blur)"
              />
              <polyline
                points={toPoints(linePoints)}
                fill="none"
                stroke="url(#track-gradient)"
                strokeWidth={2 * unit}
                strokeLinejoin="round"
                pathLength={currentFrame === null ? 1 : undefined}
                strokeDasharray={currentFrame === null ? 1 : undefined}
                className={currentFrame === null ? 'animate-draw' : ''}
              />
            </>
          )}

          {/* 프레임별 공 위치: 좌표 하나당 circle 하나 */}
          {visible.map((p, i) => {
            const isEdge = p === first || p === last
            const isSelected = p.frame === selectedFrame
            const opacity = 0.55 + (0.42 * i) / Math.max(1, points.length - 1)
            return (
              <g
                key={p.frame}
                role="button"
                tabIndex={0}
                aria-label={`${frameToTime(p.frame, fps).toFixed(2)}초 지점의 공 위치`}
                aria-pressed={isSelected}
                onClick={() => selectPoint(p)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    selectPoint(p)
                  }
                }}
                className="animate-fade-in pointer-events-auto cursor-pointer outline-none"
                style={{ animationDelay: currentFrame === null ? `${150 * i}ms` : '0ms' }}
              >
                {(isSelected || p === head) && (
                  <circle cx={p.x} cy={p.y} r={haloRadius} fill="#3ECFEF" opacity={isSelected ? 0.25 : 0.15} />
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isEdge ? edgeDotRadius : dotRadius}
                  fill="#3ECFEF"
                  fillOpacity={opacity}
                  stroke={isSelected ? '#F5F7F6' : 'none'}
                  strokeWidth={ringStroke}
                />
                {/* 클릭하기 쉽도록 넓힌 투명 히트 영역 */}
                <circle cx={p.x} cy={p.y} r={hitRadius} fill="transparent" />
              </g>
            )
          })}

          {/* 재생 중 현재 프레임의 공 위치 */}
          {ball && (
            <circle
              cx={ball.x}
              cy={ball.y}
              r={ringRadius}
              fill="none"
              stroke="#F5F7F6"
              strokeOpacity={0.9}
              strokeWidth={ringStroke}
              className="pointer-events-none"
            />
          )}
        </svg>

        <div className="pointer-events-none absolute top-3 right-3 flex flex-col items-end gap-1.5">
          {framesTracked !== undefined && (
            <span className="text-track rounded bg-black/50 px-2 py-[3px] font-mono text-[9px] leading-[13.5px] tracking-[0.9px]">
              {framesTracked} FRAMES TRACKED
            </span>
          )}
          {currentFrame !== null && (
            <span className="text-fg-muted rounded bg-black/50 px-2 py-[3px] font-mono text-[9px] leading-[13.5px] tracking-[0.9px] tabular-nums">
              FRAME {currentFrame} · {frameToTime(currentFrame, fps).toFixed(2)}s
            </span>
          )}
        </div>

        {cursor && (
          <span className="text-fg-muted pointer-events-none absolute top-3 left-3 rounded bg-black/55 px-2 py-[3px] font-mono text-[10px] leading-[15px] tabular-nums">
            x {cursor.x} · y {cursor.y}
            <span className="text-fg-subtle"> / {source.width}×{source.height}</span>
          </span>
        )}
      </div>

      <figcaption className="flex flex-wrap items-center gap-x-6 gap-y-2 px-1 py-3">
        <span className="flex items-center gap-2">
          <span className="flex gap-0.5" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span key={i} className="bg-track/70 size-1.5 rounded-full" />
            ))}
          </span>
          <span aria-hidden className="from-track/40 to-track h-px w-5 bg-gradient-to-r" />
          <span className="text-fg-muted text-xs leading-4">실제 추적 경로</span>
        </span>
        {predictedPoints.length > 1 && (
          <span className="flex items-center gap-2">
            <span aria-hidden className="border-accent/50 h-px w-5 border-t border-dashed" />
            <span className="text-fg-muted text-xs leading-4">예측 궤적</span>
          </span>
        )}
        {/* 선택 정보는 영상 크기와 상관없이 읽히도록 영상 밖에 표시. 문구가 바뀌어도 아래 내용이 밀리지 않게 모바일은 두 줄 높이를 확보 */}
        <span
          aria-live="polite"
          className={`min-h-8 w-full text-xs leading-4 break-keep sm:ml-auto sm:min-h-0 sm:w-auto ${selected ? 'text-fg' : 'text-fg-subtle'}`}
        >
          {selected
            ? `${frameToTime(selected.frame, fps).toFixed(2)}초 지점의 공 위치예요 · 다시 누르면 선택이 해제돼요`
            : isVideo
              ? '궤적의 점을 누르면 그 순간으로 이동해요 · 재생하면 영상과 함께 그려져요'
              : '궤적의 점을 누르면 그 순간의 시간을 볼 수 있어요'}
        </span>
      </figcaption>
    </figure>
  )
}
