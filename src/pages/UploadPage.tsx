import warningIcon from '../assets/icons/warning-sm.svg'
import { CalibrationNotice } from '../components/upload/CalibrationNotice'
import { SelectedVideo } from '../components/upload/SelectedVideo'
import { ShootingGuide } from '../components/upload/ShootingGuide'
import { UploadZone } from '../components/upload/UploadZone'
import type { SelectedVideo as SelectedVideoData, VideoMetadata } from '../types/analysis'
import type { CalibrationResult } from '../types/calibration'

interface UploadPageProps {
  video: SelectedVideoData | null
  onFileSelect: (file: File, metadata: VideoMetadata) => void
  onStart: () => void
  onReset: () => void
  onOpenGuide: () => void
  calibration: CalibrationResult | null
  onOpenCalibration: () => void
}

export function UploadPage({
  video,
  onFileSelect,
  onStart,
  onReset,
  onOpenGuide,
  calibration,
  onOpenCalibration,
}: UploadPageProps) {
  return (
    <div className="animate-fade-in">
      <section>
        <p className="text-accent font-mono text-[10px] leading-[15px] tracking-[1px] uppercase">
          AI SOCCER PERFORMANCE ANALYSIS
        </p>
        <h1 className="font-display text-fg pt-3 text-[40px] leading-[44px] tracking-[1.12px] sm:text-[56px] sm:leading-[56px]">
          내 슈팅을
          <br />
          데이터로 확인하세요
        </h1>
        <p className="text-fg-muted pt-3 text-sm leading-[22.75px]">
          슈팅 영상을 업로드하면 AI가 공의 움직임을 추적해 궤적과 속도를 분석합니다.
        </p>
        <p className="text-fg-subtle flex items-center gap-2 pt-3 text-xs leading-4">
          <img src={warningIcon} alt="" width={15} height={15} className="opacity-60 grayscale" />
          단일 카메라 영상을 기반으로 한 추정 결과이며 정밀 계측값이 아닙니다.
        </p>
      </section>

      <div className="grid gap-5 pt-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        {video ? (
          <SelectedVideo
            video={video}
            onStart={onStart}
            onReset={onReset}
            notice={<CalibrationNotice calibration={calibration} video={video} />}
          />
        ) : (
          <UploadZone onFileSelect={onFileSelect} />
        )}
        <ShootingGuide onOpenGuide={onOpenGuide} calibration={calibration} onOpenCalibration={onOpenCalibration} />
      </div>
    </div>
  )
}
