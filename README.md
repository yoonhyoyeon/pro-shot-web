# PRO SHOT Analyzer — Frontend

컴퓨터비전 기반 축구 슈팅 영상 분석 웹서비스의 React 프론트엔드입니다.
디자인: [Figma — ProShot-UI-UX](https://www.figma.com/design/zTsvoIMF8OsCbJkaU8Zstg/ProShot-UI-UX)

## 실행

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm test         # 단위 테스트 (파일 검증, 좌표 변환, 오류 코드)
```

백엔드 연결: `.env.example`을 `.env.local`로 복사한 뒤 `VITE_API_MODE=http`, `VITE_API_BASE_URL`을 설정합니다. 기본값은 Mock입니다.

- 배포 서버: `https://jun-3s--soccer-shot-api-fastapi-app.us-east.modal.run` (스웨거 `/docs`, 2026-11-16 Modal로 이전, 분석 모델 포함). 이전 Render 무료 서버는 메모리 512MB를 넘어 분석을 돌릴 수 없습니다.
- 서버는 작업을 메모리에만 두므로 서버가 내려가면(사용이 없을 때) 이전 분석 id는 404가 됩니다.
- 서버 재시작 없이 Mock으로 보기: `http://localhost:5173/?api=mock`
- 사용성 테스트용 주소: `?test=1` (Mock으로 동작하고 하단 PROTOTYPE 바를 숨김)
- 업로드 없이 결과 화면 확인: `http://localhost:5173/?analysis=sample-valid` (예시 작업 id: `sample-valid`, `sample-portrait`, `sample-no-ball`, `sample-low-confidence`, `sample-track-short`)
- 업로드 없이 보정 결과 확인: `http://localhost:5173/?calibration-id=sample-calibration-ok` (실패 예시: `sample-calibration-failed`)
- 서버 응답 → 화면 형태 변환은 `src/api/serverMapping.ts`에 모여 있습니다.

화면 하단 PROTOTYPE 바로 업로드 / 영상 선택 / 분석 중 / 결과 / 분석 실패 / 네트워크 오류 화면을 바로 전환할 수 있습니다.
`?scenario=ball-not-detected`, `goal-not-detected`, `network-error`를 붙이면 첫 분석이 해당 오류로 끝납니다(재시도는 성공).
`?scenario=partial`(속도 보류 부분 결과), `?scenario=undetermined`(골인 판정 보류·점수 미평가)는 결과만 바뀝니다.

## 구조

```
src/
├─ App.tsx                    화면 상태 전환 (upload → selected → analyzing → result / failed / network-error)
├─ api/                       AnalysisApi 인터페이스, httpApi(XHR 업로드 + SSE), mockApi
├─ hooks/useAnalysis.ts       업로드 → 분석 진행 → 결과/오류 상태 관리, 취소
├─ mocks/mockAnalysis.ts      Mock 결과·궤적 데이터, SSE를 흉내 낸 진행 이벤트
├─ utils/                     videoValidation(파일 검증), coordinates(좌표 변환)
├─ types/analysis.ts          API 응답 / SSE 이벤트 타입
├─ pages/                     UploadPage, AnalysisPage, ResultPage, ErrorPages
└─ components/
   ├─ layout/                 Header, ProtoNav
   ├─ common/                 Button, StatusBadge, Card
   ├─ upload/                 UploadZone(Drag & Drop), SelectedVideo, ShootingGuide
   ├─ analysis/               AnalysisProgress, StepIndicator
   └─ result/                 TrajectoryViewer(SVG), MetricCards, ConfidenceMeter
```

## SVG Trajectory Viewer

- SVG `viewBox`를 영상 원본 해상도와 같게 두고 `preserveAspectRatio="xMidYMid slice"`를 사용해
  배경 이미지의 `object-fit: cover`와 똑같이 잘리도록 맞춥니다. 화면 크기가 바뀌어도 영상과 궤적의 상대 위치가 유지됩니다.
- 실제 추적 좌표는 `<polyline>`으로 연결하고 각 좌표는 `<circle>`로 표시합니다. 점을 클릭(또는 Enter)하면 그 순간의 시간이 영상 아래에 표시되고 영상이 해당 프레임으로 이동합니다.
- 예측 궤적은 점선, 골대 영역은 사각형으로 표시합니다.

- 실제 영상이 있으면 분석 해상도 → 영상 해상도로 좌표를 환산하고(`scalePoints`), 재생 시간과 프레임을 맞춰
  재생 중에는 현재 프레임까지의 궤적만 그리고, 멈추면 전체 궤적을 보여줍니다. 추적 점 사이는 보간해 공 위치를 따라갑니다.

## 백엔드 API (실제 서버 기준)

| 요청 | 설명 |
|---|---|
| `POST /analyses` (multipart `file`, `calibration_id?`) | `202 { "id": "..." }` |
| `GET /analyses/{id}/events` (SSE) | 이름 없는 `data: {"type": "progress" \| "keepalive" \| "complete" \| "failed", ...}` |
| `GET /analyses/{id}/result` | `complete` 이벤트의 `data`와 같은 결과 |

결과를 화면으로 바꾸는 규칙 (`src/api/serverMapping.ts`)

- 골인: `goal_status` `GOAL` 골인 · `OUTSIDE` 노골 · `UNDETERMINED` 판정 보류 (`goal: false`만으로는 구분 불가)
- 점수: `score_status`가 `NOT_EVALUATED`면 미평가 (서버는 0을 보냄)
- 궤적: 공이 골대에 닿은 뒤 골망·바닥에서 움직인 점은 그리지 않음 (`src/utils/trajectory.ts`)
- `ANALYSIS_FAILED`라도 `failure_detail`이 속도 계산 단계의 보류(예: `SPEED_UNCERTAINTY_HIGH`)이고 궤적 점이 5개 이상이면
  실패 화면 대신 궤적을 보여 주고 속도·점수만 보류한 부분 결과(PARTIAL)로 표시
- 그 밖의 실패는 `failure_detail`(없으면 `failure_reason`)에 맞는 안내로 실패 화면 표시 (`src/utils/failureCopy.ts`)

## 백엔드 연동 시

환경변수만 바꾸면 `analysisApi`가 Mock에서 HTTP 구현으로 바뀌고, 화면 코드는 그대로 동작합니다.
