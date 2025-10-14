# 랜드마크 스토리 페이지 구현 가이드

## 📋 목차
1. [개요](#개요)
2. [데이터 구조](#데이터-구조)
3. [API 엔드포인트](#api-엔드포인트)
4. [구현 로직 흐름](#구현-로직-흐름)
5. [프론트엔드 구현 예시](#프론트엔드-구현-예시)
6. [주요 기능](#주요-기능)

---

## 개요

랜드마크 스토리 페이지는 사용자가 여정(Journey) 중 특정 랜드마크에 도달했을 때, 해당 랜드마크의 상세 정보와 관련 스토리를 볼 수 있는 기능입니다.

### 핵심 개념
- **Landmark (랜드마크)**: 여정 경로 상의 특정 지점 (예: 경복궁, 남산타워 등)
- **Story Card (스토리 카드)**: 랜드마크와 관련된 역사/문화/자연 이야기
- **Stamp (스탬프)**: 사용자가 랜드마크에 도달하여 획득하는 수집 요소

---

## 데이터 구조

### 1. Entity 관계도

```
JourneyEntity (여정)
    ↓ 1:N
LandmarkEntity (랜드마크)
    ↓ 1:N
StoryCardEntity (스토리 카드)
```

### 2. LandmarkEntity (랜드마크)

**위치**: `com.waytoearth.entity.journey.LandmarkEntity`

**주요 필드**:
```java
- id: Long                      // 랜드마크 ID
- journey: JourneyEntity        // 소속 여정
- name: String                  // 랜드마크 이름 (예: "경복궁")
- description: String           // 설명
- latitude: Double              // 위도
- longitude: Double             // 경도
- distanceFromStart: Double     // 시작점으로부터 거리 (km)
- orderIndex: Integer           // 순서
- imageUrl: String              // 랜드마크 대표 이미지 URL
- countryCode: String           // 국가 코드 (예: "KR")
- cityName: String              // 도시명 (예: "서울")
- storyCards: List<StoryCardEntity>  // 연결된 스토리 카드들
```

### 3. StoryCardEntity (스토리 카드)

**위치**: `com.waytoearth.entity.journey.StoryCardEntity`

**주요 필드**:
```java
- id: Long                      // 스토리 카드 ID
- landmark: LandmarkEntity      // 소속 랜드마크
- title: String                 // 스토리 제목
- content: String               // 스토리 내용 (최대 2000자)
- imageUrl: String              // 스토리 이미지 URL
- type: StoryType               // 스토리 타입 (HISTORY/CULTURE/NATURE)
- orderIndex: Integer           // 표시 순서
```

### 4. StoryType (스토리 타입 Enum)

**위치**: `com.waytoearth.entity.enums.StoryType`

```java
public enum StoryType {
    HISTORY("HISTORY", "역사"),   // 역사 관련 스토리
    CULTURE("CULTURE", "문화"),   // 문화 관련 스토리
    NATURE("NATURE", "자연")      // 자연 관련 스토리
}
```

**사용 예시**:
- HISTORY: "경복궁의 창건 역사", "독립문의 역사적 의미"
- CULTURE: "한복 입는 풍습", "전통 음식 문화"
- NATURE: "북한산 생태계", "한강의 생태 환경"

---

## API 엔드포인트

### 1. 랜드마크 상세 조회 (스토리 포함)

**엔드포인트**: `GET /v1/landmarks/{landmarkId}`

**컨트롤러**: `LandmarkController.java:89-94`

**Query Parameters**:
- `userId` (선택): 사용자 ID - 스탬프 수집 여부 확인용

**응답 DTO**: `LandmarkDetailResponse`

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
    "distanceFromStart": 25.5,
    "orderIndex": 1,
    "imageUrl": "https://s3.amazonaws.com/waytoearth/landmarks/gyeongbokgung.jpg",
    "countryCode": "KR",
    "cityName": "서울",
    "hasStamp": true,
    "storyCards": [
      {
        "id": 1,
        "title": "경복궁의 창건",
        "content": "경복궁은 1395년 태조 이성계에 의해 창건된...",
        "imageUrl": "https://s3.amazonaws.com/waytoearth/stories/story1.jpg",
        "type": "HISTORY",
        "orderIndex": 1
      },
      {
        "id": 2,
        "title": "경복궁의 건축 문화",
        "content": "경복궁의 건축은 음양오행 사상을 기반으로...",
        "imageUrl": "https://s3.amazonaws.com/waytoearth/stories/story2.jpg",
        "type": "CULTURE",
        "orderIndex": 2
      }
    ]
  }
}
```

**구현 로직** (`LandmarkServiceImpl.java:40-60`):
1. 랜드마크 조회 (`findLandmarkWithStoryCards`) - JOIN FETCH로 스토리 카드 즉시 로딩
2. 스토리 카드를 DTO로 변환 (orderIndex 순서대로 정렬)
3. userId가 있으면 스탬프 수집 여부 확인
4. LandmarkDetailResponse로 변환하여 반환

### 2. 랜드마크의 스토리 카드 목록 조회

**엔드포인트**: `GET /v1/landmarks/{landmarkId}/stories`

**컨트롤러**: `LandmarkController.java:96-105`

**Query Parameters**:
- `type` (선택): 스토리 타입 필터 (HISTORY, CULTURE, NATURE)

**응답 예시** (타입 필터 없음):

```json
{
  "success": true,
  "message": "스토리 카드 목록을 성공적으로 조회했습니다.",
  "data": [
    {
      "id": 1,
      "title": "경복궁의 창건",
      "content": "경복궁은 1395년 태조 이성계에 의해 창건된...",
      "imageUrl": "https://s3.amazonaws.com/waytoearth/stories/story1.jpg",
      "type": "HISTORY",
      "orderIndex": 1
    },
    {
      "id": 2,
      "title": "경복궁의 건축 문화",
      "content": "경복궁의 건축은 음양오행 사상을 기반으로...",
      "imageUrl": "https://s3.amazonaws.com/waytoearth/stories/story2.jpg",
      "type": "CULTURE",
      "orderIndex": 2
    }
  ]
}
```

**응답 예시** (타입 필터: HISTORY):

```json
{
  "success": true,
  "message": "스토리 카드 목록을 성공적으로 조회했습니다.",
  "data": [
    {
      "id": 1,
      "title": "경복궁의 창건",
      "content": "경복궁은 1395년 태조 이성계에 의해 창건된...",
      "imageUrl": "https://s3.amazonaws.com/waytoearth/stories/story1.jpg",
      "type": "HISTORY",
      "orderIndex": 1
    }
  ]
}
```

**구현 로직** (`LandmarkServiceImpl.java:62-78`):
- 타입이 없으면: `findByLandmarkIdOrderByOrderIndex` 사용
- 타입이 있으면: `findByLandmarkIdAndTypeOrderByOrderIndex` 사용

### 3. 개별 스토리 카드 조회

**엔드포인트**: `GET /v1/story-cards/{storyCardId}`

**컨트롤러**: `StoryCardController.java`

**응답 예시**:

```json
{
  "success": true,
  "message": "스토리 카드를 성공적으로 조회했습니다.",
  "data": {
    "id": 1,
    "title": "경복궁의 창건",
    "content": "경복궁은 1395년 태조 이성계에 의해 창건된...",
    "imageUrl": "https://s3.amazonaws.com/waytoearth/stories/story1.jpg",
    "type": "HISTORY",
    "orderIndex": 1
  }
}
```

**구현 로직** (`LandmarkServiceImpl.java:80-86`):
- StoryCardRepository에서 ID로 조회
- StoryCardResponse로 변환하여 반환

### 4. 여정의 랜드마크 목록 조회

**엔드포인트**: `GET /v1/landmarks/journey/{journeyId}`

**컨트롤러**: `LandmarkController.java:77-87`

**응답 DTO**: `List<LandmarkSummaryResponse>`

```json
{
  "success": true,
  "message": "랜드마크 목록을 성공적으로 조회했습니다.",
  "data": [
    {
      "id": 1,
      "name": "경복궁",
      "description": "조선왕조의 법궁",
      "latitude": 37.5796,
      "longitude": 126.9770,
      "distanceFromStart": 25.5,
      "orderIndex": 1,
      "imageUrl": "https://s3.amazonaws.com/waytoearth/landmarks/gyeongbokgung.jpg"
    },
    {
      "id": 2,
      "name": "남산타워",
      "description": "서울의 상징",
      "latitude": 37.5512,
      "longitude": 126.9882,
      "distanceFromStart": 30.2,
      "orderIndex": 2,
      "imageUrl": "https://s3.amazonaws.com/waytoearth/landmarks/namsan.jpg"
    }
  ]
}
```

**구현 로직** (`LandmarkServiceImpl.java:31-38`):
- `findByJourneyIdOrderByOrderIndex`로 여정의 모든 랜드마크 조회
- orderIndex 순서대로 정렬되어 반환

---

## 구현 로직 흐름

### 시나리오 1: 랜드마크 상세 페이지 진입

```
사용자 요청: GET /v1/landmarks/123?userId=456
          ↓
LandmarkController.detail()
          ↓
LandmarkServiceImpl.getLandmarkDetail(123, 456)
          ↓
1. LandmarkRepository.findLandmarkWithStoryCards(123)
   → JOIN FETCH로 랜드마크 + 스토리 카드 조회
          ↓
2. 스토리 카드 → StoryCardResponse 변환
   (orderIndex 순서 유지)
          ↓
3. UserJourneyProgressRepository + StampRepository
   → 사용자의 스탬프 수집 여부 확인
          ↓
4. LandmarkDetailResponse 생성
   - 랜드마크 정보
   - 스토리 카드 리스트
   - hasStamp (스탬프 수집 여부)
          ↓
5. ApiResponse로 래핑하여 반환
```

**핵심 쿼리** (`LandmarkRepository.java:23-24`):
```java
@Query("SELECT l FROM LandmarkEntity l LEFT JOIN FETCH l.storyCards s WHERE l.id = :landmarkId ORDER BY s.orderIndex")
Optional<LandmarkEntity> findLandmarkWithStoryCards(@Param("landmarkId") Long landmarkId);
```

- `LEFT JOIN FETCH`: N+1 문제 방지 (한 번의 쿼리로 랜드마크 + 스토리 카드 조회)
- `ORDER BY s.orderIndex`: 스토리 카드를 순서대로 정렬

### 시나리오 2: 스토리 타입별 필터링

```
사용자 요청: GET /v1/landmarks/123/stories?type=HISTORY
          ↓
LandmarkController.getStories()
          ↓
LandmarkServiceImpl.getStoryCardsByType(123, StoryType.HISTORY)
          ↓
StoryCardRepository.findByLandmarkIdAndTypeOrderByOrderIndex(123, HISTORY)
          ↓
StoryCardResponse 리스트로 변환
          ↓
ApiResponse로 래핑하여 반환
```

**Repository 메서드** (`StoryCardRepository.java:21`):
```java
List<StoryCardEntity> findByLandmarkIdAndTypeOrderByOrderIndex(Long landmarkId, StoryType type);
```

---

## 프론트엔드 구현 예시

### 1. 랜드마크 상세 페이지 (React/TypeScript)

```typescript
import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface StoryCard {
  id: number;
  title: string;
  content: string;
  imageUrl: string | null;
  type: 'HISTORY' | 'CULTURE' | 'NATURE';
  orderIndex: number;
}

interface LandmarkDetail {
  id: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  distanceFromStart: number;
  imageUrl: string | null;
  hasStamp: boolean;
  storyCards: StoryCard[];
}

const LandmarkDetailPage: React.FC<{ landmarkId: number; userId: number }> = ({
  landmarkId,
  userId
}) => {
  const [landmark, setLandmark] = useState<LandmarkDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLandmark = async () => {
      try {
        const response = await axios.get(
          `/v1/landmarks/${landmarkId}?userId=${userId}`
        );
        setLandmark(response.data.data);
      } catch (error) {
        console.error('랜드마크 조회 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLandmark();
  }, [landmarkId, userId]);

  if (loading) return <div>로딩 중...</div>;
  if (!landmark) return <div>랜드마크를 찾을 수 없습니다.</div>;

  return (
    <div className="landmark-detail">
      {/* 랜드마크 헤더 */}
      <div className="landmark-header">
        {landmark.imageUrl && (
          <img src={landmark.imageUrl} alt={landmark.name} />
        )}
        <h1>{landmark.name}</h1>
        <p>{landmark.description}</p>
        {landmark.hasStamp && <span className="stamp-badge">스탬프 획득</span>}
      </div>

      {/* 스토리 카드 리스트 */}
      <div className="story-cards">
        <h2>스토리</h2>
        {landmark.storyCards.map((story) => (
          <div key={story.id} className="story-card">
            <span className="story-type-badge">{getTypeLabel(story.type)}</span>
            <h3>{story.title}</h3>
            {story.imageUrl && <img src={story.imageUrl} alt={story.title} />}
            <p>{story.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

function getTypeLabel(type: string): string {
  const labels = {
    HISTORY: '역사',
    CULTURE: '문화',
    NATURE: '자연'
  };
  return labels[type] || type;
}

export default LandmarkDetailPage;
```

### 2. 스토리 타입별 탭 필터링

```typescript
const LandmarkStoryTabs: React.FC<{ landmarkId: number }> = ({ landmarkId }) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [stories, setStories] = useState<StoryCard[]>([]);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const url = selectedType
          ? `/v1/landmarks/${landmarkId}/stories?type=${selectedType}`
          : `/v1/landmarks/${landmarkId}/stories`;

        const response = await axios.get(url);
        setStories(response.data.data);
      } catch (error) {
        console.error('스토리 조회 실패:', error);
      }
    };

    fetchStories();
  }, [landmarkId, selectedType]);

  return (
    <div>
      {/* 타입 필터 탭 */}
      <div className="story-type-tabs">
        <button
          onClick={() => setSelectedType(null)}
          className={selectedType === null ? 'active' : ''}
        >
          전체
        </button>
        <button
          onClick={() => setSelectedType('HISTORY')}
          className={selectedType === 'HISTORY' ? 'active' : ''}
        >
          역사
        </button>
        <button
          onClick={() => setSelectedType('CULTURE')}
          className={selectedType === 'CULTURE' ? 'active' : ''}
        >
          문화
        </button>
        <button
          onClick={() => setSelectedType('NATURE')}
          className={selectedType === 'NATURE' ? 'active' : ''}
        >
          자연
        </button>
      </div>

      {/* 스토리 리스트 */}
      <div className="story-list">
        {stories.map((story) => (
          <div key={story.id} className="story-item">
            <h3>{story.title}</h3>
            <p>{story.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 3. 여정 지도에 랜드마크 마커 표시

```typescript
const JourneyMapWithLandmarks: React.FC<{ journeyId: number }> = ({ journeyId }) => {
  const [landmarks, setLandmarks] = useState<LandmarkSummary[]>([]);

  useEffect(() => {
    const fetchLandmarks = async () => {
      try {
        const response = await axios.get(`/v1/landmarks/journey/${journeyId}`);
        setLandmarks(response.data.data);
      } catch (error) {
        console.error('랜드마크 목록 조회 실패:', error);
      }
    };

    fetchLandmarks();
  }, [journeyId]);

  return (
    <div className="journey-map">
      {/* 지도 라이브러리 (예: react-leaflet, google-maps-react 등) */}
      <Map center={[37.5665, 126.9780]} zoom={10}>
        {landmarks.map((landmark) => (
          <Marker
            key={landmark.id}
            position={[landmark.latitude, landmark.longitude]}
            onClick={() => navigateToLandmark(landmark.id)}
          >
            <Popup>
              <div>
                <h4>{landmark.name}</h4>
                <p>{landmark.description}</p>
                <p>거리: {landmark.distanceFromStart}km</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </Map>
    </div>
  );
};
```

---

## 주요 기능

### 1. 스토리 카드 순서 보장

- 모든 쿼리에서 `ORDER BY orderIndex` 사용
- `LandmarkRepository.findLandmarkWithStoryCards`: `ORDER BY s.orderIndex`
- `StoryCardRepository.findByLandmarkIdOrderByOrderIndex`
- `StoryCardRepository.findByLandmarkIdAndTypeOrderByOrderIndex`

**이유**: 스토리는 정해진 순서대로 표시되어야 함 (스토리텔링의 흐름)

### 2. N+1 문제 방지

**문제**: 랜드마크를 조회한 후, 각 랜드마크의 스토리 카드를 별도로 조회하면 N+1 쿼리 발생

**해결책**: JOIN FETCH 사용
```java
@Query("SELECT l FROM LandmarkEntity l LEFT JOIN FETCH l.storyCards s WHERE l.id = :landmarkId")
```

**결과**: 한 번의 쿼리로 랜드마크 + 모든 스토리 카드 조회

### 3. 스탬프 수집 여부 확인

**로직** (`LandmarkServiceImpl.java:50-57`):
```java
Boolean hasStamp = false;
if (userId != null) {
    hasStamp = progressRepository.findByUserIdAndJourneyId(userId, landmark.getJourney().getId())
        .map(progress -> stampRepository.findByUserJourneyProgressIdAndLandmarkId(
                progress.getId(), landmarkId).isPresent())
        .orElse(false);
}
```

**단계**:
1. userId가 없으면 → hasStamp = false (비로그인 사용자)
2. userId가 있으면:
   - 해당 여정에 대한 사용자 진행상황 조회
   - 진행상황이 있으면 → 스탬프 수집 여부 확인
   - 진행상황이 없으면 → hasStamp = false

### 4. 타입별 필터링

**용도**:
- 사용자가 특정 카테고리의 스토리만 보고 싶을 때
- 예: "역사 스토리만 보기", "문화 스토리만 보기"

**API 호출**:
```
전체: GET /v1/landmarks/123/stories
역사: GET /v1/landmarks/123/stories?type=HISTORY
문화: GET /v1/landmarks/123/stories?type=CULTURE
자연: GET /v1/landmarks/123/stories?type=NATURE
```

### 5. 순환 참조 방지

**문제**: JourneyEntity ↔ LandmarkEntity 양방향 관계로 인한 JSON 직렬화 무한 루프

**해결책**:
- `LandmarkEntity.journey`에 `@JsonBackReference` 추가
- `LandmarkEntity.storyCards`에 `@JsonIgnore` 추가
- `JourneyEntity.landmarks`에 `@JsonIgnore` 추가

**결과**: JSON 응답 시 순환 참조 발생하지 않음

### 6. Lazy Loading 예외 방지

**문제**: 트랜잭션 종료 후 lazy collection 접근 시 `LazyInitializationException` 발생

**해결책**:
1. 필요한 연관 엔티티는 JOIN FETCH로 즉시 로딩
2. API 응답에 필요 없는 컬렉션은 `@JsonIgnore` 처리
3. 모든 데이터는 DTO로 변환하여 반환 (Entity 직접 노출 안 함)

---

## 데이터 흐름 요약

```
1. 사용자가 랜드마크 클릭
   ↓
2. GET /v1/landmarks/{landmarkId}?userId={userId}
   ↓
3. LandmarkRepository.findLandmarkWithStoryCards()
   → JOIN FETCH로 랜드마크 + 스토리 카드 한 번에 조회
   ↓
4. 스탬프 수집 여부 확인
   → UserJourneyProgress + Stamp 테이블 조회
   ↓
5. LandmarkDetailResponse 생성
   - 랜드마크 정보 (이름, 설명, 위치, 이미지 등)
   - 스토리 카드 리스트 (orderIndex 순서)
   - hasStamp (스탬프 획득 여부)
   ↓
6. 프론트엔드에서 받아서 렌더링
   - 랜드마크 정보 표시
   - 스토리 카드를 카드 형태로 나열
   - 스탬프 뱃지 표시 (hasStamp = true일 경우)
```

---

## 추천 구현 패턴

### 1. 첫 진입 시: 랜드마크 상세 API 사용

```typescript
// 한 번의 API 호출로 모든 정보 가져오기
const response = await axios.get(`/v1/landmarks/${landmarkId}?userId=${userId}`);
// response.data.data에 랜드마크 정보 + 스토리 카드 + 스탬프 여부 모두 포함
```

**장점**:
- API 호출 1번으로 모든 데이터 획득
- 서버 부하 감소
- 사용자 경험 개선 (빠른 로딩)

### 2. 타입별 필터링이 필요한 경우: 스토리 목록 API 사용

```typescript
// 타입별로 스토리만 다시 조회
const response = await axios.get(`/v1/landmarks/${landmarkId}/stories?type=HISTORY`);
```

**장점**:
- 필요한 데이터만 조회
- 네트워크 트래픽 절감

### 3. 개별 스토리 상세 페이지: 스토리 카드 API 사용

```typescript
// 특정 스토리 카드만 조회 (모달, 상세 페이지 등)
const response = await axios.get(`/v1/story-cards/${storyCardId}`);
```

---

## 참고 파일 위치

### Backend 파일
- **Entity**:
  - `src/main/java/com/waytoearth/entity/journey/LandmarkEntity.java`
  - `src/main/java/com/waytoearth/entity/journey/StoryCardEntity.java`
  - `src/main/java/com/waytoearth/entity/enums/StoryType.java`

- **Repository**:
  - `src/main/java/com/waytoearth/repository/journey/LandmarkRepository.java`
  - `src/main/java/com/waytoearth/repository/journey/StoryCardRepository.java`

- **Service**:
  - `src/main/java/com/waytoearth/service/journey/LandmarkService.java`
  - `src/main/java/com/waytoearth/service/journey/LandmarkServiceImpl.java`

- **Controller**:
  - `src/main/java/com/waytoearth/controller/v1/journey/LandmarkController.java`
  - `src/main/java/com/waytoearth/controller/v1/journey/StoryCardController.java`

- **DTO**:
  - `src/main/java/com/waytoearth/dto/response/journey/LandmarkDetailResponse.java`
  - `src/main/java/com/waytoearth/dto/response/journey/LandmarkSummaryResponse.java`
  - `src/main/java/com/waytoearth/dto/response/journey/StoryCardResponse.java`

---

## 결론

랜드마크 스토리 페이지는 다음과 같은 구조로 구현되어 있습니다:

1. **데이터 구조**: Journey → Landmark → StoryCard (1:N:N 관계)
2. **API 설계**: RESTful 패턴, 필요한 데이터만 조회 가능
3. **성능 최적화**: JOIN FETCH로 N+1 문제 방지
4. **유연성**: 타입별 필터링, 개별 조회 등 다양한 사용 패턴 지원
5. **안전성**: 순환 참조 방지, Lazy Loading 예외 처리

프론트엔드에서는 제공된 API를 활용하여 사용자에게 풍부한 랜드마크 스토리 경험을 제공할 수 있습니다.
