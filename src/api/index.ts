import { createHttpApi } from './httpApi'
import { createMockApi } from './mockApi'
import type { AnalysisApi, CalibrationApi } from './types'

export * from './types'

const params = new URLSearchParams(window.location.search)

/** 사용성 테스트용 주소(?test=1): Mock으로 동작하고 프로토타입 바를 숨겨 참가자가 실제 흐름대로만 이동하게 한다 */
export const USABILITY_TEST = params.has('test')

/** 개발용: 주소에 ?api=mock 을 붙이면 .env 설정과 상관없이 Mock으로 동작 (서버 재시작 없이 전환) */
const forceMock = params.get('api') === 'mock' || USABILITY_TEST

/**
 * VITE_API_MODE=http 이고 VITE_API_BASE_URL이 있으면 실제 백엔드(FastAPI)에 연결,
 * 아니면 Mock으로 동작한다. (.env.example 참고)
 */
export const API_MODE: 'mock' | 'http' =
  !forceMock && import.meta.env.VITE_API_MODE === 'http' && import.meta.env.VITE_API_BASE_URL ? 'http' : 'mock'

const api = API_MODE === 'http' ? createHttpApi(import.meta.env.VITE_API_BASE_URL) : createMockApi()

export const analysisApi: AnalysisApi = api
export const calibrationApi: CalibrationApi = api
