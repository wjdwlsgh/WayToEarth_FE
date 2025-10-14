# 여정 러닝 API 문서

## 📋 목차
1. [API 개요](#api-개요)
2. [여정 관리 API](#1-여정-관리-api)
3. [여정 진행률 API](#2-여정-진행률-api)
4. [여정 경로 API](#3-여정-경로-api)
5. [랜드마크 API](#4-랜드마크-api)
6. [스탬프 API](#5-스탬프-api)
7. [스토리 카드 API](#6-스토리-카드-api)
8. [방명록 API](#7-방명록-api)
9. [사용 시나리오](#사용-시나리오)
10. [에러 처리](#에러-처리)

---

## API 개요

### Base URL
```
# 개발 환경
http://localhost:8080

# 운영 환경
https://api.waytoearth.com
```

### 인증
대부분의 API는 JWT 토큰 인증이 필요합니다.
```http
Authorization: Bearer {jwt_token}
```

### 공통 응답 형식
```json
{
  "success": true,
  "data": { ... },
  "message": "성공 메시지"
}
```

---

## 1. 여정 관리 API

### 1.1 여정 목록 조회
모든 활성화된 여정을 조회합니다.

```http
GET /v1/journeys
GET /v1/journeys?category=DOMESTIC
```

**Query Parameters:**
- `category` (optional): 여정 카테고리 필터
  - `DOMESTIC`: 국내 코스
  - `INTERNATIONAL`: 해외 코스
  - `FAMOUS_ROUTE`: 유명 루트

**응답 예시:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "한강 러닝 코스",
      "description": "여의도부터 반포까지 한강을 따라 달리는 코스",
      "totalDistanceKm": 10.0,
      "category": "DOMESTIC",
      "difficulty": "EASY",
      "estimatedDurationHours": 2.0,
      "thumbnailUrl": "https://...",
      "landmarkCount": 8,
      "completedUserCount": 1523
    }
  ]
}
```

---

### 1.2 여정 상세 조회
특정 여정의 상세 정보를 조회합니다.

```http
GET /v1/journeys/{journeyId}
```

**Path Parameters:**
- `journeyId`: 여정 ID

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "한강 러닝 코스",
    "description": "여의도부터 반포까지 한강을 따라 달리는 코스",
    "totalDistanceKm": 10.0,
    "category": "DOMESTIC",
    "difficulty": "EASY",
    "estimatedDurationHours": 2.0,
    "thumbnailUrl": "https://...",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00",
    "updatedAt": "2024-01-01T00:00:00"
  }
}
```

---

### 1.3 여정 시작
새로운 여정을 시작합니다.

```http
POST /v1/journeys/{journeyId}/start?userId={userId}
```

**Path Parameters:**
- `journeyId`: 여정 ID

**Query Parameters:**
- `userId`: 사용자 ID

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "progressId": 123,
    "journeyId": 1,
    "journeyName": "한강 러닝 코스",
    "totalDistanceKm": 10.0,
    "currentDistanceKm": 0.0,
    "progressPercentage": 0.0,
    "status": "IN_PROGRESS",
    "startedAt": "2024-01-15T10:00:00",
    "collectedStampsCount": 0,
    "totalLandmarksCount": 8,
    "nextLandmark": {
      "id": 1,
      "name": "여의도 한강공원",
      "distanceFromStart": 0.0
    }
  }
}
```

---

### 1.4 여정 검색
키워드로 여정을 검색합니다.

```http
GET /v1/journeys/search?keyword={keyword}
```

**Query Parameters:**
- `keyword`: 검색 키워드

**응답 예시:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "한강 러닝 코스",
      "description": "여의도부터 반포까지...",
      "totalDistanceKm": 10.0
    }
  ]
}
```

---

### 1.5 완주 예상 기간 계산
사용자의 러닝 패턴에 따른 완주 예상 기간을 계산합니다.

```http
GET /v1/journeys/{journeyId}/completion-estimate?runsPerWeek=3&averageDistancePerRun=5.0
```

**Path Parameters:**
- `journeyId`: 여정 ID

**Query Parameters:**
- `runsPerWeek`: 주당 러닝 횟수 (기본값: 3)
- `averageDistancePerRun`: 1회 평균 거리 (km, 기본값: 5.0)

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "totalDistanceKm": 10.0,
    "runsPerWeek": 3,
    "averageDistancePerRun": 5.0,
    "estimatedWeeks": 1,
    "estimatedRuns": 2,
    "message": "주 3회, 평균 5.0km 러닝 시 약 1주 내에 완주 가능합니다"
  }
}
```

---

## 2. 여정 진행률 API

### 2.1 진행률 업데이트
러닝 완료 후 여정 진행률을 업데이트합니다.

```http
PUT /v1/journey-progress/{progressId}
```

**Path Parameters:**
- `progressId`: 진행률 ID

**Request Body:**
```json
{
  "sessionId": "journey-123-1234567890",
  "distanceKm": 5.2,
  "currentLocation": {
    "latitude": 37.5665,
    "longitude": 126.9780
  },
  "durationSeconds": 1800,
  "calories": 250,
  "averagePaceSeconds": 360
}
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "progressId": 123,
    "journeyId": 1,
    "currentDistanceKm": 5.2,
    "progressPercentage": 52.0,
    "status": "IN_PROGRESS",
    "collectedStampsCount": 3,
    "totalLandmarksCount": 8,
    "nextLandmark": {
      "id": 4,
      "name": "반포대교",
      "distanceFromStart": 6.5
    }
  }
}
```

---

### 2.2 현재 진행률 조회
현재 여정의 진행 상황을 조회합니다.

```http
GET /v1/journey-progress/{progressId}
```

**Path Parameters:**
- `progressId`: 진행률 ID

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "progressId": 123,
    "journeyName": "한강 러닝 코스",
    "currentDistanceKm": 5.2,
    "totalDistanceKm": 10.0,
    "progressPercentage": 52.0,
    "status": "IN_PROGRESS",
    "startedAt": "2024-01-15T10:00:00",
    "completedAt": null,
    "collectedStampsCount": 3,
    "totalLandmarksCount": 8
  }
}
```

---

### 2.3 사용자 여정 목록
사용자의 모든 여정 진행 상황을 조회합니다.

```http
GET /v1/journey-progress/user/{userId}
```

**Path Parameters:**
- `userId`: 사용자 ID

**응답 예시:**
```json
{
  "success": true,
  "data": [
    {
      "progressId": 123,
      "journeyName": "한강 러닝 코스",
      "progressPercentage": 52.0,
      "status": "IN_PROGRESS",
      "startedAt": "2024-01-15T10:00:00"
    },
    {
      "progressId": 124,
      "journeyName": "제주 올레길 1코스",
      "progressPercentage": 100.0,
      "status": "COMPLETED",
      "startedAt": "2024-01-01T09:00:00",
      "completedAt": "2024-01-10T17:00:00"
    }
  ]
}
```

---

## 3. 여정 경로 API

### 3.1 여정 경로 조회 (페이징)
여정의 경로 좌표를 페이징으로 조회합니다.

```http
GET /v1/journeys/{journeyId}/routes?page=0&size=100
GET /v1/journeys/{journeyId}/routes?from=1&to=100
```

**Path Parameters:**
- `journeyId`: 여정 ID

**Query Parameters:**
- `page`: 페이지 번호 (기본값: 0)
- `size`: 페이지 크기 (기본값: 100)
- `from`: 시작 sequence 번호 (선택)
- `to`: 끝 sequence 번호 (선택)

**응답 예시:**
```json
{
  "content": [
    {
      "id": 1,
      "latitude": 37.5665,
      "longitude": 126.9780,
      "sequence": 1,
      "altitude": 120.5,
      "description": "한강대교 진입"
    },
    {
      "id": 2,
      "latitude": 37.5670,
      "longitude": 126.9785,
      "sequence": 2,
      "altitude": 121.0,
      "description": null
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 100
  },
  "totalElements": 1500,
  "totalPages": 15
}
```

---

### 3.2 여정 전체 경로 조회 (리스트)
전체 경로를 한번에 조회합니다.

```http
GET /v1/journeys/{journeyId}/routes/all
GET /v1/journeys/{journeyId}/routes/all?from=1&to=100
```

**Path Parameters:**
- `journeyId`: 여정 ID

**Query Parameters:**
- `from`: 시작 sequence 번호 (선택)
- `to`: 끝 sequence 번호 (선택)

**응답 예시:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "latitude": 37.5665,
      "longitude": 126.9780,
      "sequence": 1,
      "altitude": 120.5,
      "description": "한강대교 진입"
    },
    // ... 1500개 좌표
  ]
}
```

**⚠️ 주의사항:**
- 경로가 긴 여정의 경우 응답 크기가 클 수 있습니다
- 메모리 효율을 위해 가급적 페이징 API 사용 권장

---

### 3.3 여정 경로 통계
경로 관련 통계 정보를 조회합니다.

```http
GET /v1/journeys/{journeyId}/routes/statistics
```

**Path Parameters:**
- `journeyId`: 여정 ID

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "totalRoutePoints": 1500,
    "minSequence": 1,
    "maxSequence": 1500
  }
}
```

**활용 방안:**
- 구간별 조회를 위한 범위 설정
- 경로 데이터 존재 여부 확인
- 페이징 계산을 위한 기초 데이터

---

## 4. 랜드마크 API

### 4.1 랜드마크 상세 정보
랜드마크의 상세 정보를 조회합니다.

```http
GET /v1/landmarks/{landmarkId}?userId={userId}
```

**Path Parameters:**
- `landmarkId`: 랜드마크 ID

**Query Parameters:**
- `userId`: 사용자 ID (스탬프 수집 여부 확인용, 선택)

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "여의도 한강공원",
    "description": "한강 러닝의 시작점",
    "latitude": 37.5280,
    "longitude": 126.9240,
    "distanceFromStart": 0.0,
    "imageUrl": "https://...",
    "storyCardsCount": 3,
    "isStampCollected": false,
    "guestbookCount": 152
  }
}
```

---

### 4.2 랜드마크의 스토리 카드 목록
랜드마크의 모든 스토리 카드를 조회합니다.

```http
GET /v1/landmarks/{landmarkId}/stories
GET /v1/landmarks/{landmarkId}/stories?type=HISTORY
```

**Path Parameters:**
- `landmarkId`: 랜드마크 ID

**Query Parameters:**
- `type`: 스토리 타입 필터 (선택)
  - `HISTORY`: 역사
  - `CULTURE`: 문화
  - `NATURE`: 자연

**응답 예시:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "여의도의 역사",
      "content": "여의도는 원래 모래섬이었으나...",
      "imageUrl": "https://...",
      "storyType": "HISTORY",
      "orderIndex": 1
    },
    {
      "id": 2,
      "title": "한강의 생태계",
      "content": "한강에는 다양한 생물이...",
      "imageUrl": "https://...",
      "storyType": "NATURE",
      "orderIndex": 2
    }
  ]
}
```

---

### 4.3 여정의 랜드마크 목록
특정 여정의 모든 랜드마크를 조회합니다.

```http
GET /v1/landmarks/journey/{journeyId}
```

**Path Parameters:**
- `journeyId`: 여정 ID

**응답 예시:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "여의도 한강공원",
      "distanceFromStart": 0.0,
      "latitude": 37.5280,
      "longitude": 126.9240
    },
    {
      "id": 2,
      "name": "63빌딩",
      "distanceFromStart": 2.5,
      "latitude": 37.5195,
      "longitude": 126.9414
    }
  ]
}
```

---

## 5. 스탬프 API

### 5.1 스탬프 수집
랜드마크에서 스탬프를 수집합니다.

```http
POST /v1/stamps/collect
```

**Request Body:**
```json
{
  "progressId": 123,
  "landmarkId": 1,
  "collectionLocation": {
    "latitude": 37.5280,
    "longitude": 126.9240
  }
}
```

**수집 조건:**
- 랜드마크 500m 반경 내에 위치
- 해당 랜드마크에 진행률상 도달
- 중복 수집 불가

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "stampId": 456,
    "landmarkId": 1,
    "landmarkName": "여의도 한강공원",
    "collectedAt": "2024-01-15T10:30:00",
    "isSpecial": true,
    "specialReason": "여정의 첫 번째 스탬프"
  }
}
```

---

### 5.2 스탬프 수집 가능 여부 확인
현재 위치에서 스탬프 수집이 가능한지 확인합니다.

```http
GET /v1/stamps/check-collection?progressId=123&landmarkId=1&latitude=37.5280&longitude=126.9240
```

**Query Parameters:**
- `progressId`: 진행률 ID
- `landmarkId`: 랜드마크 ID
- `latitude`: 현재 위도
- `longitude`: 현재 경도

**응답 예시:**
```json
{
  "success": true,
  "data": true
}
```

---

### 5.3 사용자 스탬프 목록
사용자가 수집한 모든 스탬프를 조회합니다.

```http
GET /v1/stamps/users/{userId}
```

**Path Parameters:**
- `userId`: 사용자 ID

**응답 예시:**
```json
{
  "success": true,
  "data": [
    {
      "stampId": 456,
      "landmarkName": "여의도 한강공원",
      "journeyName": "한강 러닝 코스",
      "collectedAt": "2024-01-15T10:30:00",
      "isSpecial": true
    }
  ]
}
```

---

### 5.4 여정별 스탬프 목록
특정 여정에서 수집한 스탬프를 조회합니다.

```http
GET /v1/stamps/progress/{progressId}
```

**Path Parameters:**
- `progressId`: 진행률 ID

**응답 예시:**
```json
{
  "success": true,
  "data": [
    {
      "stampId": 456,
      "landmarkId": 1,
      "landmarkName": "여의도 한강공원",
      "collectedAt": "2024-01-15T10:30:00"
    }
  ]
}
```

---

### 5.5 스탬프 통계
사용자의 스탬프 수집 통계를 조회합니다.

```http
GET /v1/stamps/users/{userId}/statistics
```

**Path Parameters:**
- `userId`: 사용자 ID

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "totalStamps": 25,
    "specialStamps": 5,
    "journeysCompleted": 2,
    "uniqueLandmarks": 23
  }
}
```

---

## 6. 스토리 카드 API

### 6.1 스토리 카드 상세
스토리 카드의 상세 정보를 조회합니다.

```http
GET /v1/story-cards/{storyCardId}
```

**Path Parameters:**
- `storyCardId`: 스토리 카드 ID

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "여의도의 역사",
    "content": "여의도는 원래 모래섬이었으나 1970년대 개발되어...",
    "imageUrl": "https://...",
    "storyType": "HISTORY",
    "orderIndex": 1,
    "landmarkId": 1,
    "landmarkName": "여의도 한강공원"
  }
}
```

---

## 7. 방명록 API

### 7.1 방명록 작성
랜드마크에 방명록을 작성합니다.

```http
POST /v1/guestbook?userId={userId}
```

**Query Parameters:**
- `userId`: 사용자 ID

**Request Body:**
```json
{
  "landmarkId": 1,
  "message": "정말 아름다운 곳이에요! 다시 오고 싶습니다.",
  "isPublic": true
}
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "guestbookId": 789,
    "landmarkId": 1,
    "landmarkName": "여의도 한강공원",
    "userId": 100,
    "userName": "김러너",
    "message": "정말 아름다운 곳이에요!",
    "isPublic": true,
    "createdAt": "2024-01-15T11:00:00"
  }
}
```

---

### 7.2 랜드마크별 방명록 조회
특정 랜드마크의 공개 방명록을 조회합니다.

```http
GET /v1/guestbook/landmarks/{landmarkId}?page=0&size=20
```

**Path Parameters:**
- `landmarkId`: 랜드마크 ID

**Query Parameters:**
- `page`: 페이지 번호 (기본값: 0)
- `size`: 페이지 크기 (기본값: 20)

**응답 예시:**
```json
{
  "content": [
    {
      "guestbookId": 789,
      "userName": "김러너",
      "message": "정말 아름다운 곳이에요!",
      "createdAt": "2024-01-15T11:00:00"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20
  },
  "totalElements": 152,
  "totalPages": 8
}
```

---

### 7.3 내 방명록 목록
사용자가 작성한 모든 방명록을 조회합니다.

```http
GET /v1/guestbook/users/{userId}
```

**Path Parameters:**
- `userId`: 사용자 ID

**응답 예시:**
```json
{
  "success": true,
  "data": [
    {
      "guestbookId": 789,
      "landmarkName": "여의도 한강공원",
      "message": "정말 아름다운 곳이에요!",
      "isPublic": true,
      "createdAt": "2024-01-15T11:00:00"
    }
  ]
}
```

---

### 7.4 최근 방명록 조회
전체 공개 방명록을 최신순으로 조회합니다.

```http
GET /v1/guestbook/recent?page=0&size=20
```

**Query Parameters:**
- `page`: 페이지 번호 (기본값: 0)
- `size`: 페이지 크기 (기본값: 20)

**응답 예시:**
```json
{
  "content": [
    {
      "guestbookId": 790,
      "userName": "이러너",
      "landmarkName": "반포대교",
      "message": "야경이 정말 예뻐요!",
      "createdAt": "2024-01-15T14:00:00"
    },
    {
      "guestbookId": 789,
      "userName": "김러너",
      "landmarkName": "여의도 한강공원",
      "message": "정말 아름다운 곳이에요!",
      "createdAt": "2024-01-15T11:00:00"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20
  },
  "totalElements": 523,
  "totalPages": 27
}
```

---

### 7.5 랜드마크 통계
랜드마크의 방명록 및 방문자 통계를 조회합니다.

```http
GET /v1/guestbook/landmarks/{landmarkId}/statistics
```

**Path Parameters:**
- `landmarkId`: 랜드마크 ID

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "totalGuestbooks": 152,
    "totalVisitors": 523,
    "publicGuestbooks": 140,
    "privateGuestbooks": 12
  }
}
```

---

## 사용 시나리오

### 시나리오 1: 여정 시작부터 스탬프 수집까지

#### 1단계: 여정 목록 조회
```http
GET /v1/journeys
```

#### 2단계: 여정 상세 정보 확인
```http
GET /v1/journeys/1
```

#### 3단계: 여정 시작
```http
POST /v1/journeys/1/start?userId=100
```
→ `progressId: 123` 획득

#### 4단계: 경로 데이터 조회 (지도 렌더링)
```http
GET /v1/journeys/1/routes/all
```

#### 5단계: 러닝 완료 후 진행률 업데이트
```http
PUT /v1/journey-progress/123
{
  "sessionId": "journey-123-1234567890",
  "distanceKm": 3.5,
  "currentLocation": {"latitude": 37.5195, "longitude": 126.9414}
}
```

#### 6단계: 랜드마크 근처 도착 시 스탬프 수집 가능 여부 확인
```http
GET /v1/stamps/check-collection?progressId=123&landmarkId=2&latitude=37.5195&longitude=126.9414
```

#### 7단계: 스탬프 수집
```http
POST /v1/stamps/collect
{
  "progressId": 123,
  "landmarkId": 2,
  "collectionLocation": {"latitude": 37.5195, "longitude": 126.9414}
}
```

#### 8단계: 방명록 작성
```http
POST /v1/guestbook?userId=100
{
  "landmarkId": 2,
  "message": "63빌딩 야경이 정말 멋져요!",
  "isPublic": true
}
```

---

### 시나리오 2: 경로 데이터 점진적 로딩

#### 1단계: 경로 통계 확인
```http
GET /v1/journeys/1/routes/statistics
```
→ `totalRoutePoints: 1500`

#### 2단계: 첫 100개 포인트 로드
```http
GET /v1/journeys/1/routes?page=0&size=100
```

#### 3단계: 사용자 위치 기준 주변 경로만 로드
```http
GET /v1/journeys/1/routes?from=500&to=600
```

---

### 시나리오 3: 진행 중인 여정 확인

#### 1단계: 사용자의 모든 여정 조회
```http
GET /v1/journey-progress/user/100
```

#### 2단계: 진행 중인 여정 상세 조회
```http
GET /v1/journey-progress/123
```

#### 3단계: 수집한 스탬프 확인
```http
GET /v1/stamps/progress/123
```

---

## 에러 처리

### 공통 에러 응답
```json
{
  "success": false,
  "message": "에러 메시지",
  "errorCode": "ERROR_CODE"
}
```

### 주요 에러 코드

| HTTP Status | Error Code | 설명 |
|-------------|------------|------|
| 400 | INVALID_REQUEST | 잘못된 요청 |
| 401 | UNAUTHORIZED | 인증 필요 |
| 403 | FORBIDDEN | 권한 없음 |
| 404 | JOURNEY_NOT_FOUND | 여정을 찾을 수 없음 |
| 404 | LANDMARK_NOT_FOUND | 랜드마크를 찾을 수 없음 |
| 404 | PROGRESS_NOT_FOUND | 진행률을 찾을 수 없음 |
| 400 | ALREADY_COLLECTED | 이미 수집한 스탬프 |
| 400 | OUT_OF_RANGE | 스탬프 수집 범위 밖 (500m 초과) |
| 400 | JOURNEY_ALREADY_STARTED | 이미 시작한 여정 |
| 500 | INTERNAL_SERVER_ERROR | 서버 내부 오류 |

### 에러 예시

#### 스탬프 수집 범위 밖
```json
{
  "success": false,
  "message": "랜드마크로부터 500m 이내에 있어야 합니다. 현재 거리: 752m",
  "errorCode": "OUT_OF_RANGE"
}
```

#### 중복 스탬프 수집
```json
{
  "success": false,
  "message": "이미 수집한 스탬프입니다.",
  "errorCode": "ALREADY_COLLECTED"
}
```

---

## API 요약표

| 카테고리 | 엔드포인트 | 메서드 | 설명 |
|---------|-----------|--------|------|
| **여정** | `/v1/journeys` | GET | 여정 목록 조회 |
| | `/v1/journeys/{id}` | GET | 여정 상세 조회 |
| | `/v1/journeys/{id}/start` | POST | 여정 시작 |
| | `/v1/journeys/search` | GET | 여정 검색 |
| | `/v1/journeys/{id}/completion-estimate` | GET | 완주 예상 기간 |
| **진행률** | `/v1/journey-progress/{id}` | PUT | 진행률 업데이트 |
| | `/v1/journey-progress/{id}` | GET | 현재 진행률 조회 |
| | `/v1/journey-progress/user/{userId}` | GET | 사용자 여정 목록 |
| **경로** | `/v1/journeys/{id}/routes` | GET | 경로 조회 (페이징) |
| | `/v1/journeys/{id}/routes/all` | GET | 전체 경로 조회 |
| | `/v1/journeys/{id}/routes/statistics` | GET | 경로 통계 |
| **랜드마크** | `/v1/landmarks/{id}` | GET | 랜드마크 상세 |
| | `/v1/landmarks/{id}/stories` | GET | 스토리 카드 목록 |
| | `/v1/landmarks/journey/{id}` | GET | 여정의 랜드마크 목록 |
| **스탬프** | `/v1/stamps/collect` | POST | 스탬프 수집 |
| | `/v1/stamps/check-collection` | GET | 수집 가능 여부 확인 |
| | `/v1/stamps/users/{userId}` | GET | 사용자 스탬프 목록 |
| | `/v1/stamps/progress/{id}` | GET | 여정별 스탬프 목록 |
| | `/v1/stamps/users/{userId}/statistics` | GET | 스탬프 통계 |
| **스토리** | `/v1/story-cards/{id}` | GET | 스토리 카드 상세 |
| **방명록** | `/v1/guestbook` | POST | 방명록 작성 |
| | `/v1/guestbook/landmarks/{id}` | GET | 랜드마크별 방명록 |
| | `/v1/guestbook/users/{userId}` | GET | 내 방명록 목록 |
| | `/v1/guestbook/recent` | GET | 최근 방명록 |
| | `/v1/guestbook/landmarks/{id}/statistics` | GET | 랜드마크 통계 |

**총 API 개수: 24개**

---

## 참고 사항

### 페이징 공통 규칙
- `page`: 0부터 시작
- `size`: 기본값은 엔드포인트마다 다름
  - 경로: 100
  - 방명록: 20
- 정렬: `sort` 파라미터로 지정 가능

### 좌표 정밀도
- 위도/경도: 소수점 6자리 (약 0.1m 정확도)
- 고도: 소수점 1자리 (m 단위)

### 거리 계산
- Haversine 공식 사용
- 단위: km (킬로미터)
- 스탬프 수집 반경: 500m

---

**작성일**: 2025-01-07
**마지막 수정**: 2025-01-07
**API 버전**: v1
**작성자**: WayToEarth Backend Team
