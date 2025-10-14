# 추천 Git 워크플로우 (디자인 WIP)

목표: 작은 단위로 안정적으로 공유하고, 리뷰/롤백/충돌 관리를 쉽게 한다.

## 현재 로컬 커밋(분리됨)

- 5730cb9 refactor(layout): 하단 탭 아이콘 통일 및 네비 데이터 정리
- bacc21e refactor(feed): 기존 FeedScreen을 SendFeed로 대체하고 라우트 정리
- dec2980 refactor(profile): 프로필 화면 UI 다듬기 및 ProfileScreen1 제거
- 4a8c239 refactor(running): 라이브/완료 화면 시각 요소 조정
- ac9de2c refactor(record): 기록 화면 UI 정리
- 65c239f chore(docs): 개발 노트/참고 문서 업데이트

현재 이 커밋들은 `feat/journey-and-running` 브랜치에 쌓여 있습니다. 분산 푸시하려면 체리픽이 필요합니다.

## 1) Draft PR로 빠르게 공유 (메인 흐름)

1. 푸시: `git push origin feat/journey-and-running`
2. GitHub에서 Draft PR 생성(기본 브랜치 대상)
3. 설명: 변경 요약, 스크린샷/GIF, 영향 범위, 체크리스트(타입체크/부팅/네비 이동)
4. 진행: 작은 단위로 계속 커밋 → CI/리뷰 반영 → 완료 시 Draft 해제

장점
- 전체 흐름을 한곳에서 리뷰, 팀 가시성↑, CI 조기 검증
단점
- 스코프가 커지면 리뷰 부담↑ → 필요 시 일부를 분리

## 2) 독립 변경은 분리 PR 권장 (예: BottomNav)

BottomNav 커밋만 별도 브랜치/PR로 분리해 리뷰 가속화.

```
git checkout feat/BottomNav
git cherry-pick 5730cb9
git push origin feat/BottomNav
```

언제 더 분리하나?
- 리뷰어가 다르거나, 영향 범위가 작고 명확할 때
- 급하게 먼저 머지하고 싶은 개선일 때

체리픽 중 충돌이 나면:

- 충돌 파일 수정 → `git add .` → `git cherry-pick --continue`
- 취소하려면: `git cherry-pick --abort`

## 3) 데일리 루프(권장 습관)

- 작은 단위 커밋: 한 커밋 = 한 의도(예: “메인 이미지 크기 조정”)
- 푸시 전 기본 점검: `npx tsc --noEmit`, 앱 부팅, 주요 화면 이동
- 리베이스로 최신화: `git fetch upstream && git rebase upstream/main`
- 충돌 시 빠르게 해결 후 계속 진행

## 커밋 메시지(한국어) 가이드

- 디자인/레이아웃: `refactor(layout|ui|pages): ...`
- 문서/환경: `chore(docs|build): ...`
- 버그 수정: `fix(scope): ...`

예시(작은 단위 커밋 OK)

- `refactor(ui): 메인 이미지 크기 조정`
- `refactor(ui): 탭 아이콘 크기 20→22로 조정`
- `refactor(pages): Profile 헤더 폰트 굵기 통일`
- `chore(docs): PR 템플릿에 디자인 검증 항목 추가`

## 6) 참고/주의

- 현재 브랜치: `feat/journey-and-running`
- 원격: `origin`(포크), `upstream`(메인)
- 메인 브랜치에 직접 푸시 금지 → 항상 기능 브랜치에서 PR

## PR 메모(선택)

- 제목(예): `refactor(layout): 하단 탭 아이콘 통일`
- 본문: 변경 요약, 스크린샷/GIF, 영향 범위(네비/탭), 검증 방법, 체크리스트(타입체크/부팅/네비 이동)

## 참고

- 현재 브랜치: `feat/journey-and-running`
- 원격: `origin`(개인 포크), `upstream`(메인 리포)
- 메인 브랜치에 바로 푸시하지 말 것. 항상 기능 브랜치에서 PR 생성.
