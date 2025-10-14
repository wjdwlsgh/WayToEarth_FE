# Git/GitHub 워크플로 가이드(한국어)

이 문서는 개인/팀 프로젝트에서 권장되는 Git/GitHub 사용 패턴을 실전 예시와 함께 설명합니다. 포크 기반 협업(원격 `origin`=내 포크, `upstream`=팀 저장소)을 가정합니다.

## 개념 정리
- 원격 저장소(remote)
  - `origin`: 내 포크(푸시 권한 O)
  - `upstream`: 팀/원본 저장소(푸시 권한 보통 X)
- 브랜치(branch)
  - `main`: 배포/기준 브랜치
  - `feat/...`, `fix/...`: 기능/버그 브랜치(작업용)
- 커밋(commit)
  - 논리(의도) 단위로 작게, 메시지는 의미 있게(Conventional Commits 권장)
- PR(Pull Request)
  - 작업 브랜치를 리뷰/머지하기 위한 요청. 이슈에 연결하면 자동 닫힘 키워드 사용 가능(Closes #123)
- 이슈(Issue)
  - 작업의 목적/요구사항(AC)/메모를 기록하는 티켓

## 브랜치 전략(권장)
- 네이밍: `feat/<스코프-핵심명>`, `fix/<스코프-핵심명>`
  - 예: `feat/journey-and-running`, `fix/running-pause-bug`
- 스코프 예시: `pages`, `api`, `hooks`, `app`, `running`

## 커밋 전략(의도 단위)
- 각 커밋은 하나의 목적만: 타입 추가, API 추가, 훅 추가, 화면 추가, 라우팅 연결, 버그 수정 등
- 메시지: Conventional Commits
  - `feat(api): add journey API clients`
  - `fix(running): prevent NaN pace when paused`
  - `refactor(pages): simplify props`
  - `docs: add usage guide`

## 일상적인 작업 흐름(TL;DR)
1) 최신 반영
```
git fetch upstream
git switch main
git rebase upstream/main
git push origin main  # 필요 시(FF 갱신)
```
2) 기능 브랜치 생성
```
git switch -c feat/my-feature
```
3) 작업 + 의도 단위 커밋 반복
```
# 변경 후
git add <파일들>
git commit -m "feat(...): ..."
```
4) 원격 푸시(처음 1회 upstream 설정)
```
git push -u origin feat/my-feature
```
5) PR 생성(웹/CLI/VS Code)
- 제목/본문 템플릿 활용, 이슈 연결: `Closes #<번호>`
6) PR 업데이트
```
# main이 업데이트되었으면 최신화
git fetch upstream
git switch feat/my-feature
git rebase upstream/main
# 충돌 해결 후
git add <해결파일>
git rebase --continue
# 강제 푸시(안전)
git push --force-with-lease
```

## 일상적인 작업 흐름: 명령 설명
- `git fetch upstream`: 팀 저장소(upstream)의 최신 참조만 받아옵니다. 워킹 트리는 바뀌지 않습니다.
- `git switch main`: 현재 작업 브랜치를 `main`으로 전환합니다.
- `git rebase upstream/main`: 로컬 커밋을 최신 `upstream/main` 위로 재적용해 직선 히스토리를 만듭니다.
- `git push origin main`: 내 포크(origin)의 `main`을 최신 상태로 업데이트합니다(필요 시).
- `git switch -c feat/my-feature`: 새 기능 브랜치를 생성하고 해당 브랜치로 전환합니다.
- `git add <파일들>`: 변경 파일을 스테이징 영역에 올립니다(커밋 후보로 준비).
- `git commit -m "..."`: 스테이징된 변경을 하나의 스냅샷(커밋)으로 기록합니다.
- `git push -u origin feat/my-feature`: 원격에 새 브랜치를 만들고, 추적(upstream) 설정까지 완료합니다.
- PR 생성(웹/VS Code/CLI): 비교 화면에서 `feat/my-feature` → `main`으로 PR을 엽니다.
- `git rebase upstream/main`(기능 브랜치에서): 기능 브랜치를 최신 기준으로 재정렬합니다. 충돌 시 수정 → `git add` → `git rebase --continue`.
- `git push --force-with-lease`: 리베이스로 바뀐 커밋을 안전하게 강제 푸시합니다(원격에 예상치 못한 변경이 있으면 차단).

## Rebase vs Merge
- Rebase(권장): 깔끔한 직선 히스토리, 리뷰 용이, 강제 푸시 필요
- Merge: 강제 푸시 불필요, 대신 merge 커밋이 쌓여 히스토리가 복잡해질 수 있음

## PR 베스트 프랙티스
- 작은 단위(리뷰 10–15분 내)로 구성
- 제목은 한 줄로 요약, 본문에 배경/변경점/검증 방법/리스크/관련 이슈
- Draft로 먼저 열고 진행 상황 공유 가능
- 라벨/리뷰어/프로젝트 보드 연결

## 이슈 베스트 프랙티스
- 제목은 문제/목표 중심
- 내용: Summary, Acceptance Criteria(완료 기준 체크리스트), Tech Notes, Risks, Test Plan
- 스크린샷/로그/재현 절차 포함 시 해결 속도↑

## VS Code로 PR/이슈
- 확장: “GitHub Pull Requests and Issues” 설치 → GitHub 로그인
- 기능: 이슈/PR 생성, 리뷰, 코멘트, 체크아웃 등 에디터 내 처리 가능

## GitHub CLI(선택)
- 설치: https://cli.github.com/
- 로그인: `gh auth login`
- 주요 명령:
```
gh issue create -t "제목" -b "내용" -l feature
gh pr create -t "제목" -b "본문" -B main -H feat/my-feature
gh pr status
gh pr checkout <번호>
```

## 자주 하는 질문(FAQ)
- Q. 새 브랜치 첫 푸시 전에 pull 필수인가요?
  - A. 아니요. 새 브랜치를 처음 올릴 때는 pull 선행이 필수는 아님. 다만 PR 전 `upstream/main`에 rebase 권장.
- Q. 여러 번 커밋 후 한 번에 푸시해도 되나요?
  - A. 네. 또는 작업 중 수시로 푸시해도 됩니다(Draft PR 유용).
- Q. 강제 푸시 위험하지 않나요?
  - A. `--force-with-lease`를 쓰면 비교적 안전. 팀 공유 브랜치면 사전 합의 필요.

## 문제 해결(트러블슈팅)
- rebase 중단: `git rebase --abort`
- cherry-pick 중단: `git cherry-pick --abort` 또는 상태 종료 `git cherry-pick --quit`
- 인덱스 락 에러: `.git/index.lock` 존재 시 Git 프로세스 종료 후 파일 삭제(주의) 또는 잠시 후 재시도
- 충돌 해결 순서:
```
# 충돌 파일 고침 →
git add <파일들>
# rebase면
git rebase --continue
# merge면
git commit
```

## 커밋/브랜치 예시 모음
- 커밋
  - `feat(types): add Journey types`
  - `feat(api): add journey API clients (routes, user journeys, stamps)`
  - `feat(hooks): add journey route hooks (list, detail)`
  - `feat(pages): add Journey screens (list/detail/guide/loading/onboarding/guestbook)`
  - `feat(app): wire Journey routes in App/Main`
  - `feat(running): improve live running tracker and ArcMenu`
- 브랜치
  - `feat/journey-and-running`
  - `fix/running-pace-nan`

---
이 문서는 실제 팀 상황에 맞게 자유롭게 수정/보완해 사용하세요.
