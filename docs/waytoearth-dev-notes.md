# WayToEarth React Native — 개념/이론 + 실무 노트

본 문서는 현재 코드베이스를 빠르게 이해하고, 실무에서 문제를 덜 겪도록 돕는 요점 정리입니다. 파일 경로는 실제 리포지토리 기준으로 표기합니다.

---

## 1) 네비게이션 구조와 공통 탭

- 스택 등록: `App.tsx`
  - 주요 라우트는 `Stack.Screen name="..." component={...}`로 등록합니다. 새 화면은 반드시 여기 추가해야 `navigation.navigate(name)`가 동작합니다.
- 하단 탭(공통): `components/Layout/BottomNav.tsx`
  - 탭 리스트는 `navItems`에서 관리합니다. 현재 탭: 내정보(profile)/크루/러닝/피드/기록.
- 탭↔라우트 매핑: `hooks/useBottomNav.ts`
  - `TAB_TO_ROUTE`: 탭 키 → 라우트명. 예: `profile → 'Profile'`.
  - 화면 진입 시 현재 라우트명으로 활성 탭을 동기화(`useRoute()`).
- 실무 팁
  - 탭 누르면 화면이 안 바뀐다 → 해당 라우트가 `App.tsx`에 없거나, 중첩 네비에서 이름이 다름.
  - 탭은 “ScrollView 안”이 아닌 하단에 고정하세요. 겹침 방지를 위해 본문 하단에 충분한 `paddingBottom` 또는 별도 컨테이너 레이아웃을 둡니다.

---

## 2) 안전한 레이아웃 패턴(SafeArea)

- 공통 레이아웃: `components/Layout/SafeLayout.tsx`
  - Safe Area Insets(top/bottom)를 자동 반영하며, `flex:1`을 보장해 루트 높이 0 이슈를 회피합니다.
- 적용 예시
  - 화면 루트는 `SafeLayout` 또는 `SafeAreaView`로 감싸고, 스크롤 영역은 `flex:1` 래퍼 `View` 아래 `ScrollView`로 배치.
- 안티패턴
  - 음수 마진(`marginHorizontal: -16`) 남용은 iOS에서 레이아웃 깨짐 유발.
  - 가짜 상태바 UI(9:41 등) 대신 네이티브 `StatusBar` 사용.

---

## 3) 프로필(내정보) 화면 설계

- 파일: `Pages/ProfileScreen.tsx`
  - 상단 히어로(아바타/닉네임/지표) → 회색 섹션 구분 바 → 카드형 메뉴(엠블럼/기본정보).
  - 하단 공통 탭은 ScrollView 바깥(형제)으로 배치. 본문에는 `paddingBottom`으로 겹침 방지.
- 캐시 버스팅
  - 프로필 이미지 URL은 업로드 직후 최신 반영을 위해 `?v=...` 파라미터를 붙이되, 이미 `?`가 있으면 추가하지 않습니다(사전 서명 URL 보호).
- 데이터 조회
  - `Promise.all(getMyProfile, getMySummary)`로 병렬 조회 후 상태 세팅.
  - `useFocusEffect`로 재진입 시 재조회. 중복 호출 방지를 위해 렌더 시 콘솔 남발 금지.
- 트러블슈팅
  - 화면이 비어보이면: 루트 `flex:1` 확인, SafeLayout 적용, ScrollView를 `View flex:1`로 감싸기, 탭은 바깥에 두기.

---

## 4) 기록(Record) 화면과 주간 목표

- 파일: `Pages/RecordScreen.tsx`
  - 상단에 “주간 목표” 카드(TextInput + 저장 버튼)를 배치해 `/v1/users/me`의 `weekly_goal_distance`를 업데이트.
  - 최초 진입 시 `getMyProfile()`로 현재 목표 값을 가져와 입력에 채웁니다.
- 실무 팁
  - 숫자 입력은 `keyboardType="number-pad"`와 정규식을 함께 사용(불필요 문자 제거).
  - 저장 중 중복 탭 방지 → 버튼 비활성/opacity 처리.

---

## 5) 피드(Feed) 목록/상세와 작성자 아바타

- 목록: `Pages/FeedScreen2.tsx`, API: `utils/api/feeds.ts`
  - 다양한 백엔드 키에 대응해 아바타 URL을 다음 순서로 탐색: `item.profile_image_url → item.profileImageUrl → item.author.profile_image_url → item.author.profileImageUrl`.
  - 백엔드가 작성자 아바타를 포함하지 않는 경우를 대비해, “내가 올린 피드”는 `getMyProfile()`의 아바타를 fallback으로 사용.
  - 작성자 이름은 `item.nickname || item.author?.nickname`.
- 상세: `Pages/FeedDetail.tsx`
  - 현재는 로그인 사용자(me) 프로필을 사용. 필요 시 상세 데이터에 포함된 작성자 아바타를 반영하도록 구조 확장 권장.
- 실무 팁
  - `FlatList`는 `keyExtractor` 고정, `ItemSeparatorComponent`로 간격 관리.

---

## 6) API 클라이언트와 응답 표준화

- 파일: `utils/api/client.ts`(기반), `utils/api/users.ts`, `utils/api/feeds.ts`
- `users.ts`
  - `unwrap()`로 `{ success, data }` 포맷/직접 데이터 포맷을 흡수.
  - 닉네임 중복 API는 `available/isDuplicate` 양쪽 포맷을 표준화.
  - `getMyProfile()`, `getMySummary()` 제공. 스네이크/카멜 혼용을 코드에서 흡수.
- 실무 팁
  - 서버 스펙이 가끔 변동되는 경우 타입에 선택 필드를 추가해 안전하게 파싱.
  - 에러 메시지는 `e.response?.data?.message`를 우선 사용하고, 없으면 일반 메시지로 대체.

---

## 7) 이미지 업로드(S3 Presign) 패턴

- 프로필: `Pages/ProfileEditScreen.tsx`
- 피드: `utils/api/feeds.ts`의 `ensureRemoteObject()`
- 공통 흐름
  1) 서버에 presign 요청(`upload_url`, `download_url`, `key`).
  2) `FileSystem.uploadAsync(…, httpMethod: 'PUT')`로 S3 업로드.
  3) 성공 시 `download_url`을 DB에 저장(프로필) 또는 그대로 사용(피드 이미지).
- 주의
  - Content-Type/Length 설정 필수.
  - 용량 상한(예: 5MB) 체크.

---

## 8) 상태/렌더/로깅 가이드

- `useFocusEffect`로 화면 재진입 시 재조회. 초기 `useEffect`와 중복 호출 피하기.
- 로깅은 개발환경(`__DEV__`) 한정 + 변화 시점에만. 렌더 내부에서 콘솔 남발 금지.
- 로딩 스피너 무한 방지: 타임아웃 가드(예: 5초 후 강제 해제) 도입.

---

## 9) 스타일링 원칙과 분리선

- 카드: 흰 배경 + 얇은 보더 + 낮은 그림자(`shadowOpacity ~0.06`, `elevation ~3`).
- 섹션 분리: 전체 폭 회색 바(`height: 12`, `#F3F4F6`)로 상/하 영역을 분명히 구분.
- 레이아웃 간격은 음수 마진 대신 패딩/여백/분리 바로 해결.

---

## 10) 타입스크립트 실전 팁

- 서버 키 변주 대응: 타입에 선택 필드 추가(`profile_image_url | profileImageUrl`) 후 안전한 OR 체인으로 접근.
- `setState` 타입: `useState<null | number>` 등 정확히 지정. `SetStateAction<null>` 오류를 예방.
- 암묵적 any 경고(`noImplicitAny`): 콜백 파라미터 타입 지정.

---

## 11) 테스트 전략(권장)

- 스크린 렌더 스냅샷: RTN(Testing Library)로 주요 컴포넌트 UI 스냅샷.
- 훅/비즈니스 로직: 비동기 API 호출 mock 후 상태 전이 테스트.
- 업로드 로직: presign/mock 업로드 경로 검증.

---

## 12) 운영/트러블슈팅 체크리스트

- 탭 누르면 이동 안 됨 → `App.tsx`에 라우트 등록 여부, `TAB_TO_ROUTE` 매핑 확인.
- 프로필 화면 빈 화면 → SafeLayout 루트, ScrollView 래핑, 하단 탭 위치(바깥) 확인.
- 아바타 안 보임 → 목록 응답의 작성자 아바타 키 확인 후 매핑 추가.
- 이미지 변경 직후 반영 늦음 → 캐시 버스팅 파라미터 확인.

---

## 13) Git(협업) 팁

- 로컬 전용 문서/메모: `.git/info/exclude`에 `docs/` 추가하면 팀 영향 없이 무시됩니다.
- 추적 중 파일 로컬만 무시: `git update-index --skip-worktree path/to/file` (`--no-skip-worktree`로 해제).
- 안전한 Pull: `git stash -u` → `git pull --rebase` → `git stash pop`.

---

## 14) 다음 개선 아이디어

- 색상/치수 토큰화: 공통 색/여백을 theme/constants로 중앙관리.
- Emblem 상세/목록: 작성자/완성도 진행률 등 UI 확장.
- 오류/로딩 상태 컴포넌트 공용화.
- 이미지 캐시 정책/프리로드 도입.

---

문의/확장 요청: 필요한 섹션을 지정해주시면 더 자세한 실무 예제/코드 스니펫을 추가해드릴게요.

