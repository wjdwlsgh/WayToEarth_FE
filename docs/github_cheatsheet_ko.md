# Git/GitHub 치트시트(한국어)

## 가장 많이 쓰는 명령

- 원격 확인: `git remote -v`
- 최신 가져오기: `git fetch upstream`
- 메인 정렬: `git switch main && git rebase upstream/main && git push origin main`
- 새 브랜치: `git switch -c feat/my-feature`
- 변경 확인: `git status`, `git diff --stat`
- 스테이지/커밋: `git add <파일들> && git commit -m "feat(...): ..."`
- 첫 푸시: `git push -u origin feat/my-feature`
- 일반 푸시: `git push`
- 안전 강제 푸시: `git push --force-with-lease`

## PR 관련

- 웹에서 PR 생성: 저장소 비교 화면 → 브랜치 선택
- Draft PR: 진행 중 공유용, 리뷰 요청 전 단계
- 이슈 연결: PR 본문에 `Closes #<번호>`
- 리뷰: 코멘트, 승인/변경 요청, 파일 단위 보기

## Rebase/충돌 처리

- rebase 시작: `git rebase upstream/main`
- 충돌 해결: 파일 수정 → `git add <파일>` → `git rebase --continue`
- 중단: `git rebase --abort`

## Cherry-pick

- 시작: `git cherry-pick <커밋해시>`
- 충돌 해결: 파일 수정 → `git add` → `git cherry-pick --continue`
- 중단: `git cherry-pick --abort` 또는 `--quit`

## Stash(임시 저장)

- 저장: `git stash push -m "메모"`
- 목록: `git stash list`
- 적용: `git stash apply` (또는 `pop`)

## Reset/Restore(주의)

- 파일 되돌리기(미스테이지): `git restore --source=HEAD -- <파일>`
- 브랜치 되돌리기(커밋 이동): `git reset --hard <커밋>` (파괴적 주의)

## 커밋 메시지 규칙(Conventional Commits)

- 형식: `type(scope): subject`
- 예: `feat(api): add journey routes client`
- types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `style`

## 브랜치 네이밍 예시

- 기능: `feat/journey-and-running`
- 버그: `fix/running-pace-nan`
- 리팩터: `refactor/pages-imports`

## 자주 하는 질문

- 첫 푸시 전에 pull 필요? → 새 브랜치는 필수 아님, PR 전 rebase 권장
- 여러 커밋 후 한 번에 푸시? → 가능, Draft PR도 유용
- 강제 푸시 위험? → `--force-with-lease`로 비교적 안전, 팀 공유 브랜치는 합의 후

## 유용한 옵션

- 변경 통계: `git diff --stat`
- 최근 커밋 로그: `git log --oneline --graph --decorate --all`
- 파일별 작성자 추적: `git blame <파일>`

끝. 필요한 항목을 자유롭게 추가해 사용하세요.
