import arrowIcon from '../assets/icons/arrow-right-dark.svg'
import warningIcon from '../assets/icons/warning.svg'
import { Button } from '../components/common/Button'
import { Card } from '../components/common/Card'
import { StatusBadge } from '../components/common/StatusBadge'
import { ConfidenceMeter } from '../components/result/ConfidenceMeter'
import { FeedbackCard, GoalResult, HoldReasonCard, ScoreCard, SpeedCard } from '../components/result/MetricCards'
import { TrajectoryViewer } from '../components/result/TrajectoryViewer'
import { RetakePrompt } from '../components/result/RetakePrompt'
import type { AnalysisResult } from '../types/analysis'
import { retakeAdvice } from '../utils/retake'
import { scoreLabel, scoreNote } from '../utils/scoreNote'

interface ResultPageProps {
  result: AnalysisResult
  onRestart: () => void
  onGuideClick: () => void
}

export function ResultPage({ result, onRestart, onGuideClick }: ResultPageProps) {
  // 공은 추적했지만 속도를 계산하지 못한 부분 결과
  const partial = result.status === 'PARTIAL'
  // 촬영 때문에 결과 일부가 보류됐으면 다시 촬영을 권한다
  const advice = retakeAdvice(result)
  return (
    <div className="animate-fade-in">
      <section>
        {partial ? (
          <StatusBadge tone="warn" dot>
            PARTIAL RESULT
          </StatusBadge>
        ) : (
          <StatusBadge tone="accent" dot>
            ANALYSIS COMPLETE
          </StatusBadge>
        )}
        <h1 className="font-display text-fg pt-2 text-[36px] leading-[44px] tracking-[1.1px] sm:text-[44px]">
          슈팅 분석 결과
        </h1>
        <p className="text-fg-subtle pt-2 text-sm leading-5">
          {partial
            ? '공의 궤적은 추적했지만 속도는 계산하지 못했어요. 속도를 보류한 이유를 확인하세요.'
            : 'AI가 추적한 공의 이동 경로와 추정 속도를 확인하세요.'}
        </p>
      </section>

      {advice && <RetakePrompt advice={advice} onRetake={onRestart} onGuideClick={onGuideClick} />}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-7 pb-3">
        <GoalResult goal={result.goal} />
        <ConfidenceMeter confidence={result.confidence} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <TrajectoryViewer
          frameUrl={result.frame_url}
          videoUrl={result.video_url}
          frameSize={result.frame_size}
          fps={result.fps}
          trajectory={result.trajectory}
          predicted={result.predicted_trajectory}
          goalArea={result.goal_area}
          framesTracked={result.frames_tracked}
        />
        {/* 모바일: 속도·점수를 나란히 두어 스크롤을 줄임 */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:flex lg:flex-col lg:pb-10">
          <SpeedCard speedKmh={result.speed_kmh} />
          <ScoreCard
            score={result.score}
            max={result.score_max}
            partial={result.score_partial}
            label={scoreLabel(result.goal)}
            note={scoreNote(result)}
          />
          {partial && result.hold_reason ? (
            <HoldReasonCard reason={result.hold_reason} />
          ) : (
            <FeedbackCard feedback={result.feedback} />
          )}
        </div>
      </div>

      <Card className="mt-7 p-5 shadow-[0_0_0_1px_rgb(201_138_46/0.18)]">
        <div className="flex gap-3">
          <img src={warningIcon} alt="" width={16} height={16} className="mt-0.5 shrink-0 self-start" />
          <div>
            <p className="text-warn text-sm leading-5 font-medium">결과를 이렇게 이해해주세요</p>
            <p className="text-fg-muted pt-1.5 text-xs leading-[19.5px]">
              현재 분석 결과는 단일 카메라 영상에서 공의 움직임과 촬영 환경을 추정해 계산합니다. 레이더건·IMU·멀티뷰
              카메라로 검증된 정밀 계측값이 아니며 촬영 각도, 조명, 모션 블러 등에 따라 오차가 발생할 수 있습니다.
            </p>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap gap-3 pt-7">
        <Button onClick={onRestart}>
          {advice ? '다시 촬영하기' : '다른 영상 분석하기'}
          <img src={arrowIcon} alt="" width={14} height={14} />
        </Button>
        <Button variant="secondary" onClick={onGuideClick}>
          촬영 가이드 보기
        </Button>
      </div>
    </div>
  )
}
