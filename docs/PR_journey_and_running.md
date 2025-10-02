# feat: 여정(Journey) 타입/API/훅/스크린 추가 및 라이브 러닝 개선

## 요약

여정 기능(타입, API, 훅, 스크린)을 추가하고 라이브 러닝 트래커와 ArcMenu 동작을 개선합니다.

## 변경 사항

- 타입: `Journey` 관련 타입 추가
- API: `journeyRoutes`, `userJourneys`, `stamps` 클라이언트 추가
- 훅: `useJourneyRouteList`, `useJourneyRouteDetail` 추가
- 스크린: 라우트 리스트/디테일, 가이드, 로딩, 온보딩, 게스트북 추가
- 앱 셸: `App.tsx` / `Pages/Main.tsx`에 여정 라우트 연결
- 러닝: `LiveRunningScreen`, `useLiveRunTracker`, `ArcMenu` 개선

## 확인 방법

- `npm run start` (Expo) 실행 후 여정 관련 라우트로 이동
- 검증: 리스트 페치, 디테일 렌더, 가이드/로딩 전환이 정상 동작하는지
- 점검: 라이브 러닝 트래커가 거리/페이스/시간을 안정적으로 갱신하는지, ArcMenu 액션이 정상 동작하는지

## 참고 사항

- 환경별 `utils/api/client.ts`의 `baseURL` 값 확인 필요
- `.env`는 커밋하지 않음, 권한은 `app.config.js` 및 네이티브 설정 확인

## 스크린샷 / GIF (선택)

<!-- 있으면 첨부해주세요 -->

## 관련 이슈

Closes #<issue-number>
