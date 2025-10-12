# 여정 러닝 지도 기능 구현 완료

## 📋 구현 내용

FRONTEND_MAP_IMPLEMENTATION_GUIDE를 참고하여 여정 러닝 지도 기능을 구현했습니다.

### 1. 구현된 컴포넌트

#### `components/Journey/JourneyMapRoute.tsx`
- Google Maps(react-native-maps) 기반 여정 지도 컴포넌트
- **주요 기능:**
  - 여정 전체 경로 표시 (Polyline)
  - 진행률에 따른 경로 색상 구분 (완료: 초록색, 남은 구간: 회색 점선)
  - 사용자 실제 러닝 경로 표시 (파란색)
  - 랜드마크 마커 표시 (도달/미도달 상태 구분)
  - 현재 위치 실시간 추적 및 카메라 자동 이동
  - 지도 스냅샷 기능 (러닝 완료 후 요약용)

#### `components/Journey/JourneyProgressCard.tsx`
- 여정 진행률 표시 카드
- **표시 정보:**
  - 진행률 퍼센트 및 프로그레스 바
  - 완주 거리 / 남은 거리
  - 다음 랜드마크 정보 및 남은 거리

### 2. 핵심 로직 (Hooks)

#### `hooks/journey/useJourneyRunning.ts`
- 여정 러닝 추적 통합 훅
- **기능:**
  - 기존 `useLiveRunTracker` 훅 확장
  - 여정 진행률 실시간 계산
  - 랜드마크 도달 체크 및 상태 관리
  - 다음 랜드마크 자동 업데이트
  - 러닝 완료 시 서버 진행률 업데이트 (userJourneys API)

### 3. 메인 화면

#### `Pages/JourneyRunningScreen.tsx`
- 여정 러닝 메인 화면
- **구성:**
  - 지도 (JourneyMapRoute)
  - 진행률 카드 (러닝 전)
  - 러닝 통계 카드 (러닝 중)
  - 시작/정지/일시정지 컨트롤
  - 카운트다운 오버레이
  - 러닝 완료 후 진행률 자동 업데이트

### 4. 기존 화면 연동

#### `Pages/JourneyRouteDetailScreen.tsx` 수정
- "여정 계속하기" 버튼 클릭 시 `JourneyRunningScreen`으로 이동
- 여정 정보 전달 (journeyId, title, 총 거리, 랜드마크, 경로)

---

## 🎨 UI/UX 특징

### 지도 시각화
1. **완료된 구간**: 초록색 실선 (`#10B981`)
2. **남은 구간**: 회색 점선 (`#94A3B8`)
3. **실제 러닝 경로**: 파란색 실선 (`#3B82F6`)

### 랜드마크 마커
- **미도달**: 파란색 원형 마커 + 순서 번호
- **도달**: 초록색 원형 마커 + 체크 아이콘
- 클릭 시 랜드마크 이름 및 거리 표시

### 현재 위치
- 파란색 점 + 반투명 외곽선
- 러닝 중 자동으로 카메라가 현재 위치 추적

---

## 🔧 사용된 기술

- **지도**: Google Maps (`react-native-maps`)
- **상태 관리**: React Hooks (`useState`, `useEffect`, `useCallback`, `useMemo`)
- **위치 추적**: 기존 `useLiveRunTracker` 훅 재사용
- **API 연동**: `userJourneys` API (진행률 조회/업데이트)

---

## 📱 사용 방법

1. **여정 선택**: `JourneyRouteListScreen`에서 여정 선택
2. **상세 화면**: `JourneyRouteDetailScreen`에서 랜드마크 확인
3. **러닝 시작**: "여정 계속하기" 버튼 클릭
4. **여정 러닝**:
   - 카운트다운 후 자동으로 GPS 추적 시작
   - 지도에서 진행 상황 실시간 확인
   - 랜드마크 도달 시 자동으로 체크
5. **러닝 완료**:
   - 종료 버튼 길게 누르기
   - 진행률 자동 업데이트
   - 러닝 요약 화면으로 이동

---

## 🚀 향후 개선 사항

### 1. 실제 경로 데이터 연동
현재는 임시 좌표 사용 중:
```typescript
journeyRoute: [
  { latitude: 37.5665, longitude: 126.978 },
  { latitude: 37.5765, longitude: 126.988 },
  { latitude: 37.5865, longitude: 126.998 },
]
```

**TODO**: 백엔드 API에서 실제 여정 경로 데이터 가져오기
- `GET /v1/journeys/{journeyId}/routes` API 연동
- 경로 캐싱 및 최적화 (Douglas-Peucker 알고리즘)

### 2. 랜드마크 실제 좌표
현재는 임시 계산:
```typescript
position: {
  latitude: 37.5665 + idx * 0.01,
  longitude: 126.978 + idx * 0.01,
}
```

**TODO**: 백엔드 API에서 랜드마크 실제 좌표 가져오기
- `GET /v1/journeys/{journeyId}/landmarks` API 연동

### 3. 랜드마크 도달 알림
- 랜드마크 도달 시 축하 모달 표시
- 스탬프 획득 애니메이션
- 소셜 공유 기능

### 4. 경로 최적화
- 경로 포인트가 많을 경우 단순화 알고리즘 적용
- 줌 레벨에 따른 적응형 로딩

### 5. 오프라인 지원
- 경로 데이터 로컬 캐싱
- 네트워크 끊김 시에도 러닝 계속 가능
- 재연결 시 진행률 자동 동기화

---

## 📝 참고 문서

- `FRONTEND_MAP_IMPLEMENTATION_GUIDE.md`: 원본 가이드 문서
- 기존 구현:
  - `Pages/LiveRunningScreen.tsx`: 싱글 러닝 참고
  - `components/Running/MapRoute.tsx`: 지도 컴포넌트 참고
  - `hooks/useLiveRunTracker.ts`: 러닝 추적 로직 참고
