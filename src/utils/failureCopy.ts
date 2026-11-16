export interface FailureCopy {
  title: string
  description: string
  solution: string
}

/**
 * 서버 세부 실패 코드별 안내. 실패 화면과 결과 화면(속도 보류 이유)에서 함께 쓴다.
 * - 명세 코드(TRACK_TOO_SHORT 등): failure_reason. 세부 코드가 없을 때(예시 작업 등) 사용
 * - 세부 코드(SPEED_UNCERTAINTY_HIGH 등): failure_detail. 분석 쪽 원래 사유 (백엔드 result_adapter.py)
 */
export const FAILURE_DETAIL_COPY: Record<string, FailureCopy> = {
  // 명세 코드
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

  // 세부 코드: 공은 추적했지만 속도 계산 단계에서 보류
  INSUFFICIENT_FLIGHT_OBSERVATIONS: {
    title: '날아가는 공을 충분히 찾지 못했습니다',
    description: '공을 찬 직후 날아가는 장면에서 공이 보인 프레임이 적어 속도를 계산할 수 없었습니다.',
    solution: '공이 선수 몸에 가리지 않는 각도에서, 공을 찬 순간부터 골대에 닿을 때까지 촬영해주세요.',
  },
  FLIGHT_INTERVAL_TOO_SHORT: {
    title: '공이 날아가는 구간이 너무 짧습니다',
    description: '공을 찬 뒤 공을 따라간 시간이 너무 짧아 속도를 계산할 수 없었습니다.',
    solution: '공을 차기 1~2초 전부터 공이 골대에 닿은 뒤까지 끊지 말고 촬영해주세요.',
  },
  SPEED_UNCERTAINTY_HIGH: {
    title: '속도 계산 결과를 믿기 어렵습니다',
    description: '공은 추적했지만, 공의 크기와 위치로 계산한 속도의 오차가 너무 커서 속도를 보류했습니다.',
    solution:
      '공이 화면에서 너무 작게 보이지 않도록 조금 더 가까이에서, 카메라를 고정해 촬영해주세요. 카메라 보정을 해 두면 도움이 될 수 있어요.',
  },
  BALL_SIZE_INCONSISTENT: {
    title: '공 크기가 일정하게 잡히지 않았습니다',
    description: '프레임마다 공의 크기가 크게 달라져 카메라와 공 사이의 거리를 계산할 수 없었습니다.',
    solution: '밝은 곳에서 흔들림 없이, 공이 배경과 잘 구분되도록 촬영해주세요.',
  },
  REPROJECTION_MISMATCH: {
    title: '공의 움직임을 계산식에 맞추지 못했습니다',
    description: '추적한 공의 위치가 날아가는 공의 움직임과 맞지 않아 속도를 계산할 수 없었습니다.',
    solution: '촬영 가이드처럼 공의 대각선 뒤 약 30°에서, 카메라를 고정한 채 다시 촬영해주세요.',
  },
  INVALID_DEPTH_ESTIMATE: {
    title: '공까지의 거리를 계산하지 못했습니다',
    description: '공 크기로 추정한 카메라와 공 사이의 거리가 올바르지 않아 속도를 계산할 수 없었습니다.',
    solution: '공이 가려지지 않고 선명하게 보이도록, 공과 골대가 모두 화면에 들어오는 거리에서 촬영해주세요.',
  },

  // 세부 코드: 촬영·보정 자체의 문제라 분석 전체를 믿을 수 없음
  CAMERA_MOVING: {
    title: '촬영 중에 카메라가 움직였습니다',
    description: '카메라가 움직이면 공의 실제 움직임과 구분할 수 없어 분석할 수 없습니다.',
    solution: '삼각대나 고정된 곳에 휴대폰을 두고, 촬영하는 동안 움직이지 않게 해주세요.',
  },
  CALIBRATION_INVALID: {
    title: '카메라 보정값을 쓸 수 없습니다',
    description: '적용한 카메라 보정값이 이 영상과 맞지 않아 분석할 수 없었습니다.',
    solution: '보정할 때와 같은 휴대폰·렌즈·해상도로 촬영하거나, 카메라 보정을 다시 진행해주세요.',
  },
}

/** 세부 코드에 맞는 문구가 없을 때의 속도 보류 안내 */
export const SPEED_HOLD_FALLBACK: FailureCopy = {
  title: '속도를 계산하지 못했습니다',
  description: '공은 추적했지만 속도를 계산할 수 있을 만큼 관측이 충분하지 않았습니다.',
  solution: '촬영 가이드를 참고해 공과 골대가 모두 선명하게 보이도록 다시 촬영해주세요.',
}
