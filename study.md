# WayToEarth 코드 리딩 스터디 노트 (study)

본 문서는 현재 프로젝트 코드를 기반으로 학습 포인트를 정리한 메모입니다. 특히 소셜 로그인(Kakao SDK) 흐름과 실무에서 중요하게 보는 구현/운영 포인트에 집중했습니다.

## 개요

- 앱 성격: 러닝 트래킹 + 피드/엠블럼/여정 기능이 있는 모바일 앱(Expo/React Native).
- 네이티브/플랫폼: Expo Dev/Build + iOS/Android, Hermes, EAS 사용.
- 주요 기술스택: React Navigation, Expo Location, Axios, NativeModules(Kakao), AsyncStorage.
- 베이스 URL: `utils/api/client.ts` → `https://api.waytoearth.cloud`.
- 딥링크 스킴: `waytoearth://` (`app.config.js` → `scheme: "waytoearth"`).

## 코드 구조(요점)

- 화면: `Pages/` (예: `Login.tsx`, `LiveRunningScreen.tsx`, `Onboading.tsx` 등)
- 재사용 컴포넌트: `components/` (예: `KakaoLoginButton.tsx`, `Running/…`)
- 훅: `hooks/` (예: `useKakaoLogin.ts`, `useLiveRunTracker.ts`)
- API 모듈: `utils/api/*.ts` (`client.ts`, `auth.ts`, `running.ts`, `users.ts`, `feeds.ts`)
- 유틸: `utils/geo.ts`, `utils/run.ts` (거리, 페이스 계산 등)
- 타입: `types/types.ts`, `utils/api/types.ts`
- 설정: `app.config.js`, `app.plugin.js`, `eas.json`, `tsconfig.json`

---

## 소셜 로그인(Kakao SDK) 설계와 흐름

### 전반 흐름

1. 사용자가 `Pages/Login.tsx`에서 카카오 버튼 탭 → `useKakaoLogin()` 호출
2. `hooks/useKakaoLogin.ts`
   - `NativeModules.RNKakaoLogins` 로드/검사 (네이티브 모듈 가용성 확인)
   - 카카오톡 로그인 가능 여부 체크 → 가능 시 `login()`, 불가 시 `loginWithKakaoAccount()`로 액세스 토큰 획득
   - 서버 로그인: `utils/api/auth.ts`의 `kakaoLoginWithSDK(accessToken)` 호출
3. `kakaoLoginWithSDK`
   - Kakao API `GET https://kapi.kakao.com/v2/user/me`로 `kakaoId` 확보
   - 백엔드 `POST /v1/auth/kakao`로 `kakaoId`, `accessToken` 전달(모바일 플래그 포함)
   - 응답에서 `jwtToken` 추출(서버 래핑 유무를 모두 커버)
4. JWT 저장 및 라우팅
   - `AsyncStorage.setItem("jwtToken", …)` 저장
   - `isOnboardingCompleted`에 따라 `Register` 또는 `LiveRunningScreen`으로 이동

### 핵심 코드 포인트

- 훅: `hooks/useKakaoLogin.ts`
  - 네이티브 모듈 가드: RNKakao 존재/메서드 체크 → 의미있는 오류 메시지 제공(개발 빌드/APK 재설치 안내 포함)
  - `getKeyHash()`(Android) 지원 시 키해시 표시(개발 편의)
  - 카카오톡 설치/가용성 분기 → `login()` vs `loginWithKakaoAccount()` 폴백
  - 실패 시 `Alert` + 안전한 `logout()` 시도
- API: `utils/api/auth.ts`
  - Kakao `user/me` 재조회로 `kakaoId` 신뢰성 확보 후 서버 로그인 요청
  - 서버 응답의 래퍼({ success, data }) 또는 직접 페이로드를 모두 수용하는 언래핑 로직
- 클라이언트: `utils/api/client.ts`
  - 요청 인터셉터: `AsyncStorage`의 JWT를 `Authorization: Bearer`로 자동 주입
  - 응답 인터셉터: `{ success, data, message }` 래퍼를 자동 언래핑 → 모듈별 코드 단순화
- 설정: `app.config.js` + `app.plugin.js`
  - `@react-native-seoul/kakao-login` 플러그인 사용, Android 빌드 시 Kakao Maven, `queries`(Android 11+) 및 `kakao_app_key` 자동 주입
  - EAS에서 `KAKAO_NATIVE_APP_KEY` 환경변수 주입

### SDK 방식 vs. OAuth 코드(웹뷰/리디렉트) 방식

- 현재는 SDK 직접 로그인 방식(네이티브 KakaoTalk 앱 또는 계정 로그인)을 사용
- 장점: 사용자 경험(원탭), 안정적인 액세스 토큰 확보, 딥링크/리디렉트 복잡도↓
- 대안으로 `kakaoLogin(code, redirectUri)` 함수도 준비되어 있으나 현재 경로는 `kakaoLoginWithSDK`가 주 경로

### 디버깅/운영 체크리스트(실무 중요)

- 개발 빌드 필수: Kakao SDK는 Expo Go가 아닌 Dev/Production 빌드에서 동작
- 키해시 등록: Android는 콘솔에 올바른 KeyHash 등록 필요(`useKakaoLogin`, `Login.tsx`에서 로그 확인)
- Kakao App Key: `app.config.js`/`eas.json`에서 환경변수 연결 확인(EAS Secrets 권장)
- Android Manifest `queries`: `com.kakao.talk` 조회 설정(플러그인이 처리)
- 딥링크 스킴: `scheme: "waytoearth"` 유지, iOS URL Types/Android Intent Filter 빌드 확인
- 서버 응답 포맷: 인터셉터 언래핑/`auth.ts`의 다형적 키(`jwtToken|accessToken|token`) 커버 여부 점검

### 보강 포인트 제안(실무 관점)

- 토큰 보관: `AsyncStorage` → 필요 시 `expo-secure-store`/Keychain 전환 검토(위협 모델에 따라)
- 토큰 갱신: 401 인터셉터에서 Refresh 흐름 추가(지금은 없음)
- 모듈 분리: Kakao SDK 에러코드 매핑/사용자 친화 메시지 테이블화
- 재시도/백오프: 일시 네트워크 이슈에 대한 안정성(특히 로그인 첫 진입)
- 로깅/트래킹: 실패율, 에러사유 대시보드화(Sentry/Ampli 등)

---

## 러닝 트래킹 설계(Expo Location)와 실무 포인트

### 흐름과 책임

- 훅: `hooks/useLiveRunTracker.ts`
  - 권한 요청/준비(`getForegroundPermissionsAsync`, 초기 위치 캐시)
  - 위치 스트림 구독(`watchPositionAsync`) + 노이즈 필터링
  - 거리/속도/페이스/칼로리 계산(`utils/geo.ts`, `utils/run.ts`)
  - 주기 업데이트(최소 5초 또는 50m 변화) 시 서버로 전송(`utils/api/running.ts`)
  - 세션 생성: 서버 미구현 시 로컬 세션(`local_…`)로 동작, 운영 전 제거 주석 있음
- 화면: `Pages/LiveRunningScreen.tsx`
  - `useLiveRunTracker` 상태/제어(start/pause/resume/stop) 바인딩

### 노이즈/정확도 처리(중요)

- 정확도 임계치: `accuracy > 60m` 샘플 제외
- 최소 이동: 정확도 기반 하한(예: `max(acc*0.5, 5m)`) 미만 이동 제외
- 저속(정지 근처) 흔들림: `speed < 0.6 m/s`에서 더 강한 최소 이동
- 속도 스파이크: `> 6.5 m/s` 구간은 거리 반영 제외(달리기 합리 범위)
- 거리 보정: 이전/현재 정확도의 평균 50%를 노이즈 허용치로 차감 후 반영

### 세션/업데이트 전송

- 쓰로틀: `UPDATE_MIN_MS=5000`, `UPDATE_MIN_KM=0.05` 만족 시 `apiUpdate`
- 전송 페이로드: 누적거리(m), 경과(sec), 평균 페이스(sec/km), 칼로리, `currentPoint{lat,lng,sequence,t}`
- 완료 전송: `apiComplete`에서 `routePoints` 시퀀싱/타임스탬프 보정, `endedAt` ISO 표준화

### 운영상 고려사항

- 배터리: 정확도/주기 조정으로 소모 관리(정확도 High ↔ Balanced, distanceInterval/timeInterval)
- 백그라운드: iOS `setActivityTypeAsync(Fitness)` 사용 시 힌트 제공, 실제 백그라운드 정책은 프로젝트 요구에 맞춰 테스트 필요
- 권한 UX: 사전 안내/거부 시 대체 UX, 설정 이동 안내
- 데이터 일관성: 업로드 실패 시 로컬 큐/재시도(현재는 조용히 무시, 개선 여지)

---

## API/네트워킹 패턴(실무 관점)

- 인터셉터 언래핑: 다양한 서버 응답 래퍼를 흡수 → 모듈 코드 단순, 테스트 용이
- 에러 로깅: `[API ERR]` 상태/바디 로깅, 필요 시 사용자 메시지와 분리된 내부 로깅 체계 권장
- 타입 다형성 흡수: `auth.ts`, `running.ts`가 여러 키 후보를 안전히 매핑(마이그레이션/스웨거 불일치 대응)
- 이미지 업로드: `utils/api/feeds.ts`
  - presign → S3 PUT → `download/public url` 사용(운영 표준 패턴)
  - `FileSystem.uploadAsync`로 Content-Type/Length 설정

---

## 보안/설정 체크(중요)

- .env 비공개: 현재 `.env`에 키 노출됨 → 즉시 레포 제외(.gitignore), 키 로테이션, EAS Secrets로 이관 권장
- HTTPS 고정: `baseURL`은 https, OK
- 권한 선언: 위치 권한은 Expo가 관리하지만, 앱스토어 제출 전 플랫폼별 설명 문구/권한 항목 재검증 필요
- 딥링크/스킴: `scheme: waytoearth` 유지, 카카오 설정과 충돌 없는지 확인

---

## 개선 로드맵 제안

- 인증
  - Refresh 토큰 흐름 + 401 자동 재발급/재시도
  - 토큰 저장소 보안 레벨 상향(필요 시 SecureStore)
- 트래킹 안정화
  - 업로드 실패 큐잉/재시도(백오프), 오프라인 일괄 동기화
  - 배터리/정확도 프로파일 프리셋(절약/균형/정밀)
- DX/관측성
  - 에러/이벤트 로깅 표준화(Sentry), 주요 퍼널(로그인/세션시작/완료) 지표화
  - Jest + RNTL 기본 테스트 추가(훅 단위: `useKakaoLogin`, `useLiveRunTracker`)
- 코드 정돈
  - `utils/api/weather.ts`의 `callOrMock` 등 미정의 유틸 검토/정리
  - NativeWind 도입범위 확대 시 `className` 일관 적용

---

## 빠른 레퍼런스(파일 경로)

- Kakao 로그인 훅: `hooks/useKakaoLogin.ts`
- 로그인 화면: `Pages/Login.tsx`
- 인증 API: `utils/api/auth.ts`, 클라이언트 `utils/api/client.ts`
- 러닝 훅: `hooks/useLiveRunTracker.ts`
- 러닝 API: `utils/api/running.ts`
- 거리/페이스 유틸: `utils/geo.ts`, `utils/run.ts`
- Kakao 설정: `app.config.js`, `app.plugin.js`, `eas.json`

필요 시 위 항목 중 원하는 부분을 더 깊게 확장해 드리겠습니다.


> 좋은 질문이에요. “세세하게”는 맞지만, 파일 단위가 아니라 “의도 단위(하나의 논리 변화)”로 쪼개는 게 베스트입니다. 각 커밋은 다음을 만족하면 좋아요:
  
  - 빌드/테스트가 통과한다.
  - 하나의 목적만 담는다(기능 추가, 버그 수정, 리팩터 등).
  - 커밋 메시지만 읽어도 의도가 명확하다.
  - PR에서는 필요시 스쿼시 가능하지만, 로컬 히스토리는 의미 있게 남는다.