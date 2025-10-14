# PR: feat(journey): 경로 목록/상세 및 관련 훅/API 연동

- Branch: feat/journey-routes
- Base: main

## Summary
- 경로 리스트/상세 화면 구현 및 최적화
- useJourneyRouteList/useJourneyRunning 훅 추가/보강
- journeyRoutes/landmarks/userJourneys API 클라이언트 정리

## Changes
- 여정 경로 목록/상세 UI 및 데이터 연동
- 랜드마크/유저여정 관련 API 사용 정리

## Files
- Pages/JourneyRouteListScreen.tsx
- Pages/JourneyRouteDetailScreen.tsx
- hooks/journey/useJourneyRouteList.ts
- hooks/journey/useJourneyRunning.ts
- utils/api/journeyRoutes.ts
- utils/api/landmarks.ts
- utils/api/userJourneys.ts

## Checklist
- [ ] Type check: `npx tsc --noEmit`
- [ ] 목록/상세 전환 및 로딩/에러 상태 확인

## PR Link
- https://github.com/wjdwlsgh/WayToEarth_FE/pull/new/feat/journey-routes

