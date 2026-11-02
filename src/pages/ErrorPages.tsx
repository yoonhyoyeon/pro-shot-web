import type { ReactNode } from 'react'
import alertIcon from '../assets/icons/alert-circle.svg'
import refreshIcon from '../assets/icons/refresh.svg'
import warningIcon from '../assets/icons/warning-sm.svg'
import wifiOffIcon from '../assets/icons/wifi-off.svg'
import { Button } from '../components/common/Button'
import { Card } from '../components/common/Card'
import { StatusBadge } from '../components/common/StatusBadge'
import type { AnalysisFailureCode, ConnectionErrorCode } from '../types/analysis'

interface ErrorLayoutProps {
  icon: string
  iconBg: string
  badge: ReactNode
  title: string
  description: string
  /** 문의 시 확인할 수 있도록 표시하는 오류 코드 */
  code: string
  children: ReactNode
  primaryLabel: string
  secondaryLabel: string
  onPrimary: () => void
  onSecondary: () => void
}

function ErrorLayout({
  icon,
  iconBg,
  badge,
  title,
  description,
  code,
  children,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
}: ErrorLayoutProps) {
  return (
    <section role="alert" className="animate-fade-in mx-auto flex max-w-[576px] flex-col items-center py-16 text-center">
      <span className={`flex size-16 items-center justify-center rounded-full ${iconBg}`}>
        <img src={icon} alt="" width={28} height={28} />
      </span>
      <div className="pt-6">{badge}</div>
      <h1 className="font-display text-fg pt-2 text-[28px] leading-[48px] tracking-[1.28px] sm:text-[32px]">{title}</h1>
      <p className="text-fg-muted pt-2 text-sm leading-[22.75px]">{description}</p>
      <div className="w-full pt-6 text-left">{children}</div>
      <div className="flex flex-wrap justify-center gap-3 pt-6">
        <Button onClick={onPrimary}>
          <img src={refreshIcon} alt="" width={14} height={14} />
          {primaryLabel}
        </Button>
        <Button variant="secondary" onClick={onSecondary}>
          {secondaryLabel}
        </Button>
      </div>
      <p className="text-fg-faint pt-5 font-mono text-[10px] leading-[15px] tracking-[1px]">ERROR CODE · {code}</p>
    </section>
  )
}

interface ErrorPageProps<C> {
  code: C
  /** 서버가 보낸 원래 코드 (화면 코드와 다를 때) */
  rawCode?: string
  onRetry: () => void
  onBack: () => void
}

/** 분석 실패 원인별 안내 */
const FAILURE_COPY: Record<AnalysisFailureCode, { title: string; description: string; solution: string }> = {
  BALL_NOT_DETECTED: {
    title: '공을 인식하지 못했습니다',
    description: '영상에서 축구공을 충분히 검출하지 못해 분석을 완료할 수 없었습니다.',
    solution: '공이 선명하게 보이고, 화면 안에서 이동하는 구간이 충분한 영상을 사용해주세요.',
  },
  GOAL_NOT_DETECTED: {
    title: '골대를 인식하지 못했습니다',
    description: '골대를 찾지 못해 실제 거리와 속도를 환산할 수 없었습니다.',
    solution: '촬영 가이드처럼 공의 대각선 뒤 약 30°에서, 골대 전체가 화면 안에 들어오도록 다시 촬영해주세요.',
  },
  INVALID_VIDEO: {
    title: '영상을 분석할 수 없습니다',
    description: '서버에서 영상을 열 수 없거나 지원하지 않는 형식입니다.',
    solution: 'MP4 또는 MOV 형식의 30초 이하 영상으로 다시 시도해주세요.',
  },
}

/** 서버 업로드 검증이 거절한 이유별 해결 방법 (docs/백엔드_연동_가이드.md 5장) */
const REJECT_SOLUTION: Record<string, string> = {
  MISSING_FILE: '영상 파일이 전달되지 않았습니다. 영상을 다시 선택해서 올려주세요.',
  FILE_TOO_LARGE: '파일이 200MB보다 큽니다. 슈팅 장면만 잘라내거나 1080p로 다시 저장해서 올려주세요.',
  UNSUPPORTED_MEDIA_TYPE: '지원하지 않는 형식입니다. MP4 또는 MOV 영상으로 올려주세요.',
  VIDEO_TOO_SHORT: '영상이 1초보다 짧습니다. 공이 날아가는 장면이 모두 담기도록 다시 촬영해주세요.',
  VIDEO_TOO_LONG: '영상이 30초보다 깁니다. 슈팅 직전부터 공이 골대에 도달할 때까지만 잘라서 올려주세요.',
  RESOLUTION_TOO_LOW: '해상도가 너무 낮습니다. 짧은 변 480px 이상, 가능하면 1080p로 촬영해주세요.',
  UNREADABLE_VIDEO: '서버에서 영상 정보를 읽지 못했습니다. 파일이 손상되지 않았는지 확인하거나 다시 저장해서 올려주세요.',
}

/**
 * '공 인식 실패' 화면으로 함께 오는 백엔드 세부 코드별 문구.
 * 공을 찾긴 했지만 추적·계산 단계에서 실패한 경우라 '인식하지 못했다'와 다르게 안내한다
 */
const TRACKING_FAILURE_COPY: Record<string, { title: string; description: string; solution: string }> = {
  TRACK_TOO_SHORT: {
    title: '공을 끝까지 추적하지 못했습니다',
    description: '공은 찾았지만 날아가는 구간을 충분히 따라가지 못해 속도를 계산할 수 없었습니다.',
    solution: '공이 골대에 닿을 때까지 화면 밖으로 나가지 않도록, 골대 전체가 보이게 촬영해주세요.',
  },
  LOW_CONFIDENCE: {
    title: '분석 결과를 신뢰하기 어렵습니다',
    description: '공 위치를 확실하게 찾은 장면이 적어 추정한 속도와 궤적을 믿기 어렵습니다.',
    solution: '밝은 곳에서 흔들림 없이 촬영하고, 공이 배경과 잘 구분되도록 해주세요.',
  },
  FIT_FAILED: {
    title: '공의 궤적을 계산하지 못했습니다',
    description: '추적한 공의 움직임으로 이동 경로를 계산하는 데 실패했습니다.',
    solution: '촬영 가이드처럼 공의 대각선 뒤 약 30°에서, 카메라를 고정한 채 다시 촬영해주세요.',
  },
}

/** AI 분석이 영상 문제로 실패한 경우 */
export function AnalysisFailedPage({ code, rawCode, onRetry, onBack }: ErrorPageProps<AnalysisFailureCode>) {
  const copy = (rawCode && TRACKING_FAILURE_COPY[rawCode]) || FAILURE_COPY[code]
  const solution = (rawCode && REJECT_SOLUTION[rawCode]) || copy.solution
  return (
    <ErrorLayout
      icon={alertIcon}
      iconBg="bg-danger/10"
      badge={<StatusBadge tone="danger">ANALYSIS FAILED</StatusBadge>}
      title={copy.title}
      description={copy.description}
      code={rawCode ?? code}
      primaryLabel="다시 분석하기"
      secondaryLabel="다른 영상 선택"
      onPrimary={onRetry}
      onSecondary={onBack}
    >
      <Card className="p-5 shadow-[0_0_0_1px_rgb(201_138_46/0.2)]">
        <div className="flex gap-3">
          <img src={warningIcon} alt="" width={15} height={15} className="mt-0.5 shrink-0 self-start" />
          <div>
            <p className="text-warn text-xs leading-4 font-medium">해결 방법</p>
            <p className="text-fg-muted pt-1 text-sm leading-[22.75px]">{solution}</p>
          </div>
        </div>
      </Card>
    </ErrorLayout>
  )
}

/** 통신 실패 원인별 안내 */
const CONNECTION_COPY: Record<ConnectionErrorCode, { badge: string; title: string; description: string }> = {
  NETWORK_ERROR: {
    badge: 'NETWORK ERROR',
    title: '연결에 실패했습니다',
    description: '서버와의 통신 중 문제가 발생했습니다. 네트워크 상태를 확인한 후 다시 시도해주세요.',
  },
  SERVER_ERROR: {
    badge: 'SERVER ERROR',
    title: '서버에 문제가 발생했습니다',
    description: '요청을 처리하는 중 서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  },
  TIMEOUT: {
    badge: 'TIMEOUT',
    title: '응답 시간이 초과되었습니다',
    description: '서버의 응답이 너무 늦어 연결을 종료했습니다. 잠시 후 다시 시도해주세요.',
  },
}

/** 서버가 보낸 코드에 따라 설명을 더 구체적으로 */
const CONNECTION_DESCRIPTION_BY_RAW: Record<string, string> = {
  ANALYSIS_UNAVAILABLE: '지금 연결된 서버에서는 영상 분석 기능을 사용할 수 없습니다. 분석 기능이 준비되면 다시 시도해주세요.',
}

const NETWORK_TIPS = [
  '인터넷 연결 상태를 확인해주세요',
  '잠시 후 다시 시도해도 문제가 지속되면 페이지를 새로고침해주세요',
  '영상 파일이 손상되지 않았는지 확인해주세요',
]

/** 서버·네트워크 통신에 실패한 경우 */
export function NetworkErrorPage({ code, rawCode, onRetry, onBack }: ErrorPageProps<ConnectionErrorCode>) {
  const copy = CONNECTION_COPY[code]
  return (
    <ErrorLayout
      icon={wifiOffIcon}
      iconBg="bg-white/5"
      badge={<StatusBadge>{copy.badge}</StatusBadge>}
      title={copy.title}
      description={(rawCode && CONNECTION_DESCRIPTION_BY_RAW[rawCode]) || copy.description}
      code={rawCode ?? code}
      primaryLabel="다시 시도"
      secondaryLabel="처음으로"
      onPrimary={onRetry}
      onSecondary={onBack}
    >
      <Card className="p-4">
        <ol className="flex flex-col gap-2.5">
          {NETWORK_TIPS.map((tip, i) => (
            <li key={tip} className="flex gap-2.5">
              <span className="text-fg-subtle mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-white/8 font-mono text-[9px] leading-[13.5px]">
                {i + 1}
              </span>
              <span className="text-fg-muted text-xs leading-[19.5px]">{tip}</span>
            </li>
          ))}
        </ol>
      </Card>
    </ErrorLayout>
  )
}
