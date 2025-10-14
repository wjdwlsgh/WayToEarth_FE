# PR: feat(running): 라이브/백그라운드 러닝 트래킹 및 running API 개선

- Branch: feat/running-live-background
- Base: main

## Summary
- useLiveRunTracker 및 백그라운드 트래킹 훅 보강
- 경로/지표 계산 및 일시정지 처리 개선
- utils/backgroundLocation, running API 에러/요청 정리

## Changes
- 러닝 실시간/백그라운드 트래킹 로직 정밀화
- 경로 렌더링 및 지표 계산 안정화(일시정지/재개 포함)
- running API 클라이언트 에러/요청 처리 보강

## Files
- Pages/LiveRunningScreen.tsx
- Pages/JourneyRunningScreen.tsx
- hooks/useLiveRunTracker.ts
- hooks/journey/useBackgroundRunning.ts
- utils/backgroundLocation.ts
- utils/api/running.ts

## Checklist
- [ ] Type check: `npx tsc --noEmit`
- [ ] 실기기 테스트(위치 권한/백그라운드 동작)

## PR Link
- https://github.com/wjdwlsgh/WayToEarth_FE/pull/new/feat/running-live-background

