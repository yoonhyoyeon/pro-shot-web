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

화면 하단 PROTOTYPE 바로 업로드 / 영상 선택 / 분석 중 / 결과 / 분석 실패 / 네트워크 오류 화면을 바로 전환할 수 있습니다.
`?scenario=ball-not-detected`, `goal-not-detected`, `network-error`를 붙이면 첫 분석이 해당 오류로 끝납니다(재시도는 성공).

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
- 실제 추적 좌표는 `<polyline>`으로 연결하고 각 좌표는 `<circle>`로 표시합니다. 점을 클릭(또는 Enter)하면 좌표와 프레임 번호가 표시됩니다.
- 예측 궤적은 점선, 골대 영역은 사각형으로 표시합니다.

- 실제 영상이 있으면 분석 해상도 → 영상 해상도로 좌표를 환산하고(`scalePoints`), 재생 시간과 프레임을 맞춰
  현재 프레임까지의 궤적만 그립니다. 추적 점 사이는 보간해 공 위치를 따라갑니다.

## 백엔드 API (프론트엔드가 기대하는 형태)

| 요청 | 설명 |
|---|---|
| `POST /analyses` (multipart `video`) | 업로드 후 `{ "analysis_id": "..." }` |
| `GET /analyses/{id}/events` (SSE) | `event: progress` `{progress, step}` / `event: complete` / `event: failed` `{code}` |
| `GET /analyses/{id}/result` | `AnalysisResult` (src/types/analysis.ts) |

## 백엔드 연동 시

환경변수만 바꾸면 `analysisApi`가 Mock에서 HTTP 구현으로 바뀌고, 화면 코드는 그대로 동작합니다.
