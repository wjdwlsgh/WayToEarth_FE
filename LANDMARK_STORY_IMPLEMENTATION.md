# 랜드마크 스토리 페이지 구현 완료 ✅

## 🔗 연결된 화면 흐름

**여정 러닝 화면 → 랜드마크 마커 클릭 → 스토리 페이지 → 바텀시트 (방명록/통계)**

1. **JourneyRunningScreen**: 지도에서 랜드마크 마커 클릭
2. **LandmarkStoryScreen**: 스토리 메인 화면 (역사/문화/자연 필터링)
3. **바텀시트**: 우측 상단 메뉴(⋯) 클릭 → 방명록 작성/보기, 통계
4. **GuestbookCreateModal**: 방명록 작성 모달
5. **LandmarkGuestbookScreen**: 방명록 목록 화면

## 📋 구현 내역

### 1. 타입 정의
- **파일**: `types/landmark.ts`
- **내용**:
  - `StoryType`: 스토리 타입 ('HISTORY', 'CULTURE', 'NATURE')
  - `StoryCard`: 스토리 카드 데이터 구조
  - `LandmarkDetail`: 랜드마크 상세 정보 (스토리 카드 포함)
  - `LandmarkSummary`: 랜드마크 요약 정보
  - `STORY_TYPE_LABELS`: 타입별 한글 라벨 매핑
  - `STORY_TYPE_COLORS`: 타입별 컬러 매핑

### 2. API 유틸리티
- **파일**: `utils/api/landmarks.ts`
- **함수**:
  - `getLandmarkDetail(landmarkId, userId?)`: 랜드마크 상세 조회
  - `getLandmarkStories(landmarkId, type?)`: 스토리 목록 조회 (타입 필터 지원)
  - `getStoryCard(storyCardId)`: 개별 스토리 카드 조회
  - `getJourneyLandmarks(journeyId)`: 여정의 랜드마크 목록 조회

### 3. 컴포넌트
#### StoryCard 컴포넌트
- **파일**: `components/Landmark/StoryCard.tsx`
- **기능**:
  - 스토리 타입별 컬러 뱃지 표시
  - 스토리 제목, 이미지, 내용 표시
  - 여정 러닝 디자인과 일관된 스타일

#### StoryTypeTabs 컴포넌트
- **파일**: `components/Landmark/StoryTypeTabs.tsx`
- **기능**:
  - 전체/역사/문화/자연 필터 탭
  - 선택된 탭 하이라이트
  - 타입별 컬러 적용

### 4. 메인 화면
- **파일**: `Pages/LandmarkStoryScreen.tsx`
- **기능**:
  - 랜드마크 헤더 정보 표시 (이미지, 제목, 설명, 위치, 거리)
  - 스탬프 획득 여부 표시
  - 스토리 타입 필터링 (전체/역사/문화/자연)
  - 필터링된 스토리 카드 목록 표시
  - 로딩/에러 처리
  - 뒤로가기 버튼
  - **우측 상단 메뉴 버튼 (⋯)**: 바텀시트 열기
  - **바텀시트**: 방명록 작성, 방명록 보기, 랜드마크 통계
  - **방명록 작성 모달**: GuestbookCreateModal 통합

### 5. 네비게이션 연동
- **파일**: `App.tsx`, `JourneyRunningScreen.tsx`
- **변경사항**:
  - **App.tsx**: `LandmarkStoryScreen` 네비게이션 등록
  - **JourneyRunningScreen.tsx**:
    - 마커 클릭 시 스토리 페이지로 이동 (기존 바텀시트 제거)
    - `handleLandmarkMarkerPress` → `navigation.navigate('LandmarkStoryScreen')`

## 🎨 디자인 특징

### 색상 체계
- **HISTORY**: `#EF4444` (빨강) - 역사
- **CULTURE**: `#F59E0B` (주황) - 문화
- **NATURE**: `#10B981` (초록) - 자연
- **Primary**: `#6366F1` (보라) - 전체 탭
- **Stamp Badge**: `#10B981` (초록) - 스탬프 획득

### 스타일 일관성
- JourneyRunningScreen과 동일한 디자인 패턴
- 둥근 모서리 (borderRadius: 12-16)
- 그림자 효과 (elevation 및 shadowOpacity)
- 세련된 타이포그래피 (fontWeight: 700-900)

## 🚀 사용 방법

### 1. 기본 사용 (여정 러닝 화면에서)
```typescript
navigation.navigate('LandmarkStoryScreen', {
  landmarkId: 123,
  userId: 'user123', // 선택사항: 스탬프 수집 여부 확인
});
```

### 2. 방명록에서 연동
```typescript
// LandmarkGuestbookScreen에서 스토리 보기 버튼 추가
<TouchableOpacity
  onPress={() => {
    navigation.navigate('LandmarkStoryScreen', {
      landmarkId: landmarkId,
      userId: userId,
    });
  }}
>
  <Text>📚 스토리 보기</Text>
</TouchableOpacity>
```

### 3. 여정 진행 카드에서 연동
```typescript
// JourneyProgressCard에서 랜드마크 클릭 시
onPressLandmark={(landmarkId) => {
  navigation.navigate('LandmarkStoryScreen', {
    landmarkId: landmarkId,
    userId: userId,
  });
}}
```

## 🔧 API 응답 예시

### GET /v1/landmarks/{landmarkId}
```json
{
  "success": true,
  "message": "랜드마크 상세 정보를 성공적으로 조회했습니다.",
  "data": {
    "id": 1,
    "name": "경복궁",
    "description": "조선왕조의 법궁으로 600년 역사를 자랑하는 궁궐",
    "latitude": 37.5796,
    "longitude": 126.9770,
    "distanceFromStart": 25500,
    "orderIndex": 1,
    "imageUrl": "https://example.com/image.jpg",
    "countryCode": "KR",
    "cityName": "서울",
    "hasStamp": true,
    "storyCards": [
      {
        "id": 1,
        "title": "경복궁의 창건",
        "content": "경복궁은 1395년 태조 이성계에 의해 창건된...",
        "imageUrl": "https://example.com/story1.jpg",
        "type": "HISTORY",
        "orderIndex": 1
      }
    ]
  }
}
```

## ✅ 테스트 체크리스트

- [ ] 랜드마크 상세 정보 로드 확인
- [ ] 스토리 카드 목록 표시 확인
- [ ] 타입 필터 동작 확인 (전체/역사/문화/자연)
- [ ] 스탬프 획득 뱃지 표시 확인
- [ ] 이미지 로딩 확인
- [ ] 로딩/에러 상태 처리 확인
- [ ] 뒤로가기 버튼 동작 확인
- [ ] 네비게이션 연동 확인

## 📝 향후 개선 사항

1. **이미지 최적화**: 이미지 캐싱 및 lazy loading
2. **애니메이션**: 탭 전환 및 카드 로딩 애니메이션
3. **공유 기능**: 스토리 공유 버튼 추가
4. **오프라인 지원**: AsyncStorage를 활용한 스토리 캐싱
5. **접근성**: 스크린 리더 지원 및 키보드 네비게이션

## 🎯 완료된 기능

✅ 타입 정의 완료
✅ API 유틸리티 함수 구현
✅ StoryCard 컴포넌트 구현
✅ StoryTypeTabs 컴포넌트 구현
✅ LandmarkStoryScreen 메인 화면 구현
✅ 에러 처리 및 로딩 상태 처리
✅ 네비게이션 연동
✅ 디자인 일관성 유지

## 📌 참고 파일

- 가이드 문서: `LANDMARK_STORY_PAGE_GUIDE.md`
- 타입 정의: `types/landmark.ts`
- API 유틸: `utils/api/landmarks.ts`
- 컴포넌트: `components/Landmark/StoryCard.tsx`, `components/Landmark/StoryTypeTabs.tsx`
- 메인 화면: `Pages/LandmarkStoryScreen.tsx`
- 네비게이션: `App.tsx`
