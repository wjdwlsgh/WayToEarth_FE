# 방명록(Guestbook) API 완벽 가이드

> 프론트엔드 개발자를 위한 WayToEarth 방명록 기능 백엔드 API 완벽 문서

---

## 📋 목차
1. [개요](#개요)
2. [데이터 모델](#데이터-모델)
3. [API 엔드포인트](#api-엔드포인트)
4. [요청/응답 예시](#요청응답-예시)
5. [에러 처리](#에러-처리)
6. [구현 체크리스트](#구현-체크리스트)

---

## 개요

### 방명록 기능이란?
사용자가 랜드마크를 방문했을 때, 해당 랜드마크에 메시지를 남길 수 있는 기능입니다.

### 주요 기능
- ✅ 랜드마크에 방명록 작성 (공개/비공개 설정 가능)
- ✅ 특정 랜드마크의 공개 방명록 목록 조회 (페이징)
- ✅ 사용자가 작성한 방명록 목록 조회
- ✅ 최근 작성된 전체 방명록 조회 (페이징)
- ✅ 랜드마크 통계 (방명록 수, 방문자 수)

### 베이스 URL
```
개발 서버: http://your-dev-server:8080/v1/guestbook
프로덕션: https://api.waytoearth.com/v1/guestbook
```

---

## 데이터 모델

### 1. GuestbookEntity (방명록 엔티티)

```java
{
  "id": Long,                    // 방명록 고유 ID
  "user": User,                  // 작성자 정보
  "landmark": LandmarkEntity,    // 랜드마크 정보
  "message": String,             // 방명록 메시지 (최대 500자)
  "isPublic": Boolean,           // 공개 여부 (기본값: true)
  "createdAt": LocalDateTime,    // 작성 시간
  "updatedAt": LocalDateTime     // 수정 시간
}
```

**필드 설명:**
- `id`: 자동 생성되는 방명록 고유 식별자
- `user`: 방명록 작성자 (ManyToOne 관계)
- `landmark`: 방명록이 작성된 랜드마크 (ManyToOne 관계)
- `message`: 사용자가 작성한 메시지 (필수, 최대 500자)
- `isPublic`: 공개 방명록인지 비공개 방명록인지 여부
  - `true`: 다른 사용자도 볼 수 있음
  - `false`: 본인만 볼 수 있음
- `createdAt`: 방명록 작성 시간 (자동 생성)
- `updatedAt`: 방명록 수정 시간 (자동 갱신)

### 2. GuestbookReportEntity (방명록 신고 엔티티)

```java
{
  "id": Long,                    // 신고 ID
  "user": User,                  // 신고자
  "guestbook": GuestbookEntity,  // 신고된 방명록
  "reason": ReportReason,        // 신고 사유
  "description": String,         // 추가 설명 (최대 500자)
  "status": ReportStatus,        // 처리 상태
  "createdAt": LocalDateTime     // 신고 시간
}
```

**신고 사유 (ReportReason):**
- `SPAM`: 스팸
- `INAPPROPRIATE`: 부적절한 내용
- `HARASSMENT`: 괴롭힘
- `FALSE_INFO`: 허위 정보
- `OTHER`: 기타

**처리 상태 (ReportStatus):**
- `PENDING`: 대기 중
- `REVIEWED`: 검토 완료
- `RESOLVED`: 해결됨

---

## API 엔드포인트

### 1. 방명록 작성 (POST)

**엔드포인트:**
```
POST /v1/guestbook?userId={userId}
```

**Request Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| userId | Long | ✅ | 사용자 ID |

**Request Body:**
```json
{
  "landmarkId": 1,
  "message": "정말 아름다운 곳이에요!",
  "isPublic": true
}
```

**Request Body 필드:**
| 필드 | 타입 | 필수 | 제약사항 | 설명 |
|------|------|------|----------|------|
| landmarkId | Long | ✅ | - | 랜드마크 ID |
| message | String | ✅ | 최대 500자 | 방명록 메시지 |
| isPublic | Boolean | ❌ | 기본값: true | 공개 여부 |

**Response (200 OK):**
```json
{
  "id": 123,
  "user": {
    "id": 1,
    "nickname": "러너123",
    "profileImageUrl": "https://example.com/profile.jpg"
  },
  "landmark": {
    "id": 1,
    "name": "경복궁",
    "latitude": 37.5796,
    "longitude": 126.9770,
    "distanceFromStart": 25.5,
    "imageUrl": "https://example.com/landmark.jpg",
    "countryCode": "KR",
    "cityName": "서울"
  },
  "message": "정말 아름다운 곳이에요!",
  "createdAt": "2024-01-15T14:30:00"
}
```

**비즈니스 로직:**
1. `userId`로 사용자 존재 여부 확인 → 없으면 에러
2. `landmarkId`로 랜드마크 존재 여부 확인 → 없으면 에러
3. `isPublic`이 null이면 기본값 `true` 적용
4. 방명록 엔티티 생성 및 저장
5. 생성된 방명록 정보 반환

---

### 2. 랜드마크별 방명록 조회 (GET)

**엔드포인트:**
```
GET /v1/guestbook/landmarks/{landmarkId}?page=0&size=20&sort=createdAt,desc
```

**Path Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| landmarkId | Long | ✅ | 랜드마크 ID |

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|--------|------|
| page | Integer | ❌ | 0 | 페이지 번호 (0부터 시작) |
| size | Integer | ❌ | 20 | 페이지당 항목 수 |
| sort | String | ❌ | createdAt,desc | 정렬 기준 |

**Response (200 OK):**
```json
{
  "content": [
    {
      "id": 123,
      "user": {
        "id": 1,
        "nickname": "러너123",
        "profileImageUrl": "https://example.com/profile.jpg"
      },
      "landmark": {
        "id": 1,
        "name": "경복궁",
        "latitude": 37.5796,
        "longitude": 126.9770,
        "distanceFromStart": 25.5,
        "imageUrl": "https://example.com/landmark.jpg",
        "countryCode": "KR",
        "cityName": "서울"
      },
      "message": "정말 아름다운 곳이에요!",
      "createdAt": "2024-01-15T14:30:00"
    },
    {
      "id": 124,
      "user": {
        "id": 2,
        "nickname": "트레커456",
        "profileImageUrl": "https://example.com/profile2.jpg"
      },
      "landmark": {
        "id": 1,
        "name": "경복궁",
        "latitude": 37.5796,
        "longitude": 126.9770,
        "distanceFromStart": 25.5,
        "imageUrl": "https://example.com/landmark.jpg",
        "countryCode": "KR",
        "cityName": "서울"
      },
      "message": "역사가 느껴지는 멋진 장소입니다.",
      "createdAt": "2024-01-15T13:20:00"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20,
    "sort": {
      "sorted": true,
      "unsorted": false,
      "empty": false
    },
    "offset": 0,
    "paged": true,
    "unpaged": false
  },
  "last": false,
  "totalElements": 45,
  "totalPages": 3,
  "size": 20,
  "number": 0,
  "sort": {
    "sorted": true,
    "unsorted": false,
    "empty": false
  },
  "first": true,
  "numberOfElements": 20,
  "empty": false
}
```

**Response 필드 설명:**
| 필드 | 타입 | 설명 |
|------|------|------|
| content | Array | 방명록 목록 |
| pageable | Object | 페이징 정보 |
| last | Boolean | 마지막 페이지 여부 |
| totalElements | Long | 전체 항목 수 |
| totalPages | Integer | 전체 페이지 수 |
| size | Integer | 페이지당 항목 수 |
| number | Integer | 현재 페이지 번호 (0부터 시작) |
| first | Boolean | 첫 페이지 여부 |
| numberOfElements | Integer | 현재 페이지의 항목 수 |
| empty | Boolean | 비어있는지 여부 |

**비즈니스 로직:**
1. `landmarkId`에 해당하는 **공개 방명록만** 조회
2. `createdAt` 기준 내림차순(최신순) 정렬
3. 페이징 처리하여 반환
4. JOIN FETCH로 User 정보 함께 조회 (N+1 문제 방지)

---

### 3. 내 방명록 목록 조회 (GET)

**엔드포인트:**
```
GET /v1/guestbook/users/{userId}
```

**Path Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| userId | Long | ✅ | 사용자 ID |

**Response (200 OK):**
```json
[
  {
    "id": 123,
    "user": {
      "id": 1,
      "nickname": "러너123",
      "profileImageUrl": "https://example.com/profile.jpg"
    },
    "landmark": {
      "id": 1,
      "name": "경복궁",
      "latitude": 37.5796,
      "longitude": 126.9770,
      "distanceFromStart": 25.5,
      "imageUrl": "https://example.com/landmark.jpg",
      "countryCode": "KR",
      "cityName": "서울"
    },
    "message": "정말 아름다운 곳이에요!",
    "createdAt": "2024-01-15T14:30:00"
  },
  {
    "id": 125,
    "user": {
      "id": 1,
      "nickname": "러너123",
      "profileImageUrl": "https://example.com/profile.jpg"
    },
    "landmark": {
      "id": 5,
      "name": "남산타워",
      "latitude": 37.5512,
      "longitude": 126.9882,
      "distanceFromStart": 30.2,
      "imageUrl": "https://example.com/namsan.jpg",
      "countryCode": "KR",
      "cityName": "서울"
    },
    "message": "야경이 너무 멋있어요!",
    "createdAt": "2024-01-14T19:45:00"
  }
]
```

**비즈니스 로직:**
1. `userId`로 사용자가 작성한 **모든 방명록** 조회 (공개/비공개 모두)
2. `createdAt` 기준 내림차순(최신순) 정렬
3. JOIN FETCH로 Landmark 정보 함께 조회 (N+1 문제 방지)
4. 배열로 반환 (페이징 없음)

**특징:**
- 본인이 작성한 방명록이므로 **공개/비공개 여부와 관계없이** 모두 반환
- 페이징 없이 전체 목록 반환

---

### 4. 최근 방명록 조회 (GET)

**엔드포인트:**
```
GET /v1/guestbook/recent?page=0&size=20&sort=createdAt,desc
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|--------|------|
| page | Integer | ❌ | 0 | 페이지 번호 (0부터 시작) |
| size | Integer | ❌ | 20 | 페이지당 항목 수 |
| sort | String | ❌ | createdAt,desc | 정렬 기준 |

**Response (200 OK):**
```json
{
  "content": [
    {
      "id": 150,
      "user": {
        "id": 5,
        "nickname": "워커789",
        "profileImageUrl": "https://example.com/profile5.jpg"
      },
      "landmark": {
        "id": 10,
        "name": "한라산",
        "latitude": 33.3616,
        "longitude": 126.5292,
        "distanceFromStart": 450.8,
        "imageUrl": "https://example.com/hallasan.jpg",
        "countryCode": "KR",
        "cityName": "제주"
      },
      "message": "드디어 정상 등정 성공!",
      "createdAt": "2024-01-15T16:00:00"
    },
    {
      "id": 149,
      "user": {
        "id": 3,
        "nickname": "하이커999",
        "profileImageUrl": "https://example.com/profile3.jpg"
      },
      "landmark": {
        "id": 8,
        "name": "북악산",
        "latitude": 37.5943,
        "longitude": 126.9808,
        "distanceFromStart": 28.3,
        "imageUrl": "https://example.com/bukak.jpg",
        "countryCode": "KR",
        "cityName": "서울"
      },
      "message": "서울 전경이 한눈에!",
      "createdAt": "2024-01-15T15:30:00"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20,
    "sort": {
      "sorted": true,
      "unsorted": false,
      "empty": false
    },
    "offset": 0,
    "paged": true,
    "unpaged": false
  },
  "last": false,
  "totalElements": 2847,
  "totalPages": 143,
  "size": 20,
  "number": 0,
  "sort": {
    "sorted": true,
    "unsorted": false,
    "empty": false
  },
  "first": true,
  "numberOfElements": 20,
  "empty": false
}
```

**비즈니스 로직:**
1. 전체 **공개 방명록만** 조회 (isPublic = true)
2. `createdAt` 기준 내림차순(최신순) 정렬
3. 페이징 처리하여 반환
4. JOIN FETCH로 User, Landmark 정보 함께 조회 (N+1 문제 방지)

**사용 사례:**
- 홈 화면에 최근 작성된 방명록 피드 표시
- 커뮤니티 활동 현황 표시

---

### 5. 랜드마크 통계 조회 (GET)

**엔드포인트:**
```
GET /v1/guestbook/landmarks/{landmarkId}/statistics
```

**Path Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| landmarkId | Long | ✅ | 랜드마크 ID |

**Response (200 OK):**
```json
{
  "totalGuestbook": 45,
  "totalVisitors": 128
}
```

**Response 필드:**
| 필드 | 타입 | 설명 |
|------|------|------|
| totalGuestbook | Long | 해당 랜드마크의 공개 방명록 총 개수 |
| totalVisitors | Long | 해당 랜드마크를 방문한 총 사용자 수 (스탬프 수집 기준) |

**비즈니스 로직:**
1. `totalGuestbook`: `countByLandmarkIdAndIsPublicTrue()`로 공개 방명록 수 계산
2. `totalVisitors`: StampRepository의 `countCollectorsByLandmarkId()`로 방문자 수 계산
3. 두 통계 정보를 묶어서 반환

**사용 사례:**
- 랜드마크 상세 페이지에서 통계 정보 표시
- "45개의 방명록 | 128명 방문" 형태로 UI 구성

---

## 요청/응답 예시

### 예시 1: 방명록 작성하기

**시나리오:** 사용자 ID 1번이 경복궁(랜드마크 ID 1번)에 공개 방명록 작성

**요청:**
```bash
curl -X POST "http://localhost:8080/v1/guestbook?userId=1" \
  -H "Content-Type: application/json" \
  -d '{
    "landmarkId": 1,
    "message": "정말 아름다운 곳이에요!",
    "isPublic": true
  }'
```

**응답:**
```json
{
  "id": 123,
  "user": {
    "id": 1,
    "nickname": "러너123",
    "profileImageUrl": "https://example.com/profile.jpg"
  },
  "landmark": {
    "id": 1,
    "name": "경복궁",
    "latitude": 37.5796,
    "longitude": 126.9770,
    "distanceFromStart": 25.5,
    "imageUrl": "https://example.com/landmark.jpg",
    "countryCode": "KR",
    "cityName": "서울"
  },
  "message": "정말 아름다운 곳이에요!",
  "createdAt": "2024-01-15T14:30:00"
}
```

---

### 예시 2: 비공개 방명록 작성하기

**시나리오:** 사용자 ID 2번이 남산타워에 비공개 방명록 작성

**요청:**
```bash
curl -X POST "http://localhost:8080/v1/guestbook?userId=2" \
  -H "Content-Type: application/json" \
  -d '{
    "landmarkId": 5,
    "message": "개인적인 기록으로 남깁니다.",
    "isPublic": false
  }'
```

**응답:**
```json
{
  "id": 126,
  "user": {
    "id": 2,
    "nickname": "트레커456",
    "profileImageUrl": "https://example.com/profile2.jpg"
  },
  "landmark": {
    "id": 5,
    "name": "남산타워",
    "latitude": 37.5512,
    "longitude": 126.9882,
    "distanceFromStart": 30.2,
    "imageUrl": "https://example.com/namsan.jpg",
    "countryCode": "KR",
    "cityName": "서울"
  },
  "message": "개인적인 기록으로 남깁니다.",
  "createdAt": "2024-01-15T15:00:00"
}
```

**참고:** 이 방명록은 비공개이므로:
- `GET /v1/guestbook/landmarks/5` (랜드마크별 조회)에서 **나타나지 않음**
- `GET /v1/guestbook/users/2` (내 방명록)에서는 **나타남**
- `GET /v1/guestbook/recent` (최근 방명록)에서 **나타나지 않음**

---

### 예시 3: 페이징으로 경복궁 방명록 조회

**시나리오:** 경복궁의 2페이지(페이지당 10개) 조회

**요청:**
```bash
curl -X GET "http://localhost:8080/v1/guestbook/landmarks/1?page=1&size=10&sort=createdAt,desc"
```

**응답:**
```json
{
  "content": [
    {
      "id": 113,
      "user": {
        "id": 8,
        "nickname": "여행러버",
        "profileImageUrl": "https://example.com/profile8.jpg"
      },
      "landmark": {
        "id": 1,
        "name": "경복궁",
        "latitude": 37.5796,
        "longitude": 126.9770,
        "distanceFromStart": 25.5,
        "imageUrl": "https://example.com/landmark.jpg",
        "countryCode": "KR",
        "cityName": "서울"
      },
      "message": "한복 입고 방문했어요!",
      "createdAt": "2024-01-14T16:20:00"
    }
    // ... 9개 더
  ],
  "pageable": {
    "pageNumber": 1,
    "pageSize": 10,
    "offset": 10
  },
  "last": false,
  "totalElements": 45,
  "totalPages": 5,
  "size": 10,
  "number": 1,
  "first": false,
  "numberOfElements": 10,
  "empty": false
}
```

---

### 예시 4: 내 방명록 전체 조회

**시나리오:** 사용자 ID 1번의 모든 방명록 조회

**요청:**
```bash
curl -X GET "http://localhost:8080/v1/guestbook/users/1"
```

**응답:**
```json
[
  {
    "id": 123,
    "user": {
      "id": 1,
      "nickname": "러너123",
      "profileImageUrl": "https://example.com/profile.jpg"
    },
    "landmark": {
      "id": 1,
      "name": "경복궁",
      "latitude": 37.5796,
      "longitude": 126.9770,
      "distanceFromStart": 25.5,
      "imageUrl": "https://example.com/landmark.jpg",
      "countryCode": "KR",
      "cityName": "서울"
    },
    "message": "정말 아름다운 곳이에요!",
    "createdAt": "2024-01-15T14:30:00"
  },
  {
    "id": 110,
    "user": {
      "id": 1,
      "nickname": "러너123",
      "profileImageUrl": "https://example.com/profile.jpg"
    },
    "landmark": {
      "id": 3,
      "name": "해운대",
      "latitude": 35.1587,
      "longitude": 129.1603,
      "distanceFromStart": 325.7,
      "imageUrl": "https://example.com/haeundae.jpg",
      "countryCode": "KR",
      "cityName": "부산"
    },
    "message": "바다가 정말 시원해요.",
    "createdAt": "2024-01-10T10:15:00"
  }
]
```

---

### 예시 5: 랜드마크 통계 조회

**시나리오:** 경복궁의 통계 정보 조회

**요청:**
```bash
curl -X GET "http://localhost:8080/v1/guestbook/landmarks/1/statistics"
```

**응답:**
```json
{
  "totalGuestbook": 45,
  "totalVisitors": 128
}
```

**UI 활용 예시:**
```typescript
// React 예시
function LandmarkStatistics({ statistics }) {
  return (
    <div className="stats">
      <div>
        <span className="icon">📝</span>
        <span>{statistics.totalGuestbook}개의 방명록</span>
      </div>
      <div>
        <span className="icon">👥</span>
        <span>{statistics.totalVisitors}명 방문</span>
      </div>
    </div>
  );
}
```

---

## 에러 처리

### 에러 응답 형식

모든 에러는 다음 형식으로 반환됩니다:

```json
{
  "timestamp": "2024-01-15T14:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "사용자를 찾을 수 없습니다: 999",
  "path": "/v1/guestbook"
}
```

### 주요 에러 케이스

#### 1. 사용자를 찾을 수 없음

**요청:**
```bash
curl -X POST "http://localhost:8080/v1/guestbook?userId=999" \
  -H "Content-Type: application/json" \
  -d '{
    "landmarkId": 1,
    "message": "테스트"
  }'
```

**응답 (400 Bad Request):**
```json
{
  "timestamp": "2024-01-15T14:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "사용자를 찾을 수 없습니다: 999",
  "path": "/v1/guestbook"
}
```

**처리 방법:**
```typescript
try {
  const response = await createGuestbook(userId, data);
} catch (error) {
  if (error.status === 400 && error.message.includes("사용자를 찾을 수 없습니다")) {
    // 사용자 재로그인 유도
    showLoginModal();
  }
}
```

---

#### 2. 랜드마크를 찾을 수 없음

**요청:**
```bash
curl -X POST "http://localhost:8080/v1/guestbook?userId=1" \
  -H "Content-Type: application/json" \
  -d '{
    "landmarkId": 999,
    "message": "테스트"
  }'
```

**응답 (400 Bad Request):**
```json
{
  "timestamp": "2024-01-15T14:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "랜드마크를 찾을 수 없습니다: 999",
  "path": "/v1/guestbook"
}
```

**처리 방법:**
```typescript
try {
  const response = await createGuestbook(userId, data);
} catch (error) {
  if (error.status === 400 && error.message.includes("랜드마크를 찾을 수 없습니다")) {
    // 랜드마크 목록 새로고침
    showErrorToast("해당 랜드마크를 찾을 수 없습니다.");
    refreshLandmarkList();
  }
}
```

---

#### 3. 메시지가 비어있거나 너무 긴 경우

**요청 1: 메시지 없음**
```bash
curl -X POST "http://localhost:8080/v1/guestbook?userId=1" \
  -H "Content-Type: application/json" \
  -d '{
    "landmarkId": 1,
    "message": ""
  }'
```

**응답 (400 Bad Request):**
```json
{
  "timestamp": "2024-01-15T14:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "메시지는 필수입니다",
  "path": "/v1/guestbook"
}
```

**요청 2: 메시지가 500자 초과**
```bash
curl -X POST "http://localhost:8080/v1/guestbook?userId=1" \
  -H "Content-Type: application/json" \
  -d '{
    "landmarkId": 1,
    "message": "너무 긴 메시지... (500자 초과)"
  }'
```

**응답 (400 Bad Request):**
```json
{
  "timestamp": "2024-01-15T14:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "메시지는 500자 이하여야 합니다",
  "path": "/v1/guestbook"
}
```

**프론트엔드 유효성 검사 예시:**
```typescript
function validateGuestbookMessage(message: string): string | null {
  if (!message || message.trim().length === 0) {
    return "메시지를 입력해주세요.";
  }

  if (message.length > 500) {
    return "메시지는 500자 이하로 입력해주세요.";
  }

  return null; // 유효함
}

// 사용 예시
const error = validateGuestbookMessage(inputMessage);
if (error) {
  showErrorToast(error);
  return;
}

// 유효성 검사 통과 후 API 호출
await createGuestbook(userId, {
  landmarkId,
  message: inputMessage,
  isPublic: true
});
```

---

#### 4. 랜드마크 ID가 누락된 경우

**요청:**
```bash
curl -X POST "http://localhost:8080/v1/guestbook?userId=1" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "테스트"
  }'
```

**응답 (400 Bad Request):**
```json
{
  "timestamp": "2024-01-15T14:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "랜드마크 ID는 필수입니다",
  "path": "/v1/guestbook"
}
```

---

### 에러 처리 통합 예시 (TypeScript + React)

```typescript
interface GuestbookError {
  status: number;
  message: string;
}

async function createGuestbook(
  userId: number,
  data: GuestbookCreateRequest
): Promise<GuestbookResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/v1/guestbook?userId=${userId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error: GuestbookError = await response.json();
      throw error;
    }

    return await response.json();
  } catch (error) {
    handleGuestbookError(error as GuestbookError);
    throw error;
  }
}

function handleGuestbookError(error: GuestbookError) {
  if (error.message.includes("사용자를 찾을 수 없습니다")) {
    showLoginModal();
  } else if (error.message.includes("랜드마크를 찾을 수 없습니다")) {
    showErrorToast("해당 랜드마크를 찾을 수 없습니다.");
  } else if (error.message.includes("메시지는 필수입니다")) {
    showErrorToast("메시지를 입력해주세요.");
  } else if (error.message.includes("500자 이하")) {
    showErrorToast("메시지는 500자 이하로 입력해주세요.");
  } else {
    showErrorToast("방명록 작성에 실패했습니다. 다시 시도해주세요.");
  }
}
```

---

## 구현 체크리스트

### 1. 방명록 작성 화면

#### UI 컴포넌트
- [ ] 랜드마크 정보 표시 (이름, 이미지)
- [ ] 메시지 입력 필드 (Textarea, 최대 500자)
- [ ] 글자 수 카운터 표시 (예: `125/500`)
- [ ] 공개/비공개 토글 스위치
- [ ] 작성 버튼
- [ ] 취소 버튼

#### 기능 구현
- [ ] 메시지 입력 시 실시간 글자 수 카운트
- [ ] 500자 초과 시 입력 차단 또는 경고
- [ ] 빈 메시지 제출 시 클라이언트 유효성 검사
- [ ] API 호출 및 응답 처리
- [ ] 성공 시 토스트 메시지 표시
- [ ] 에러 처리 (사용자 없음, 랜드마크 없음 등)
- [ ] 로딩 상태 표시

**샘플 코드:**
```tsx
import { useState } from 'react';

function GuestbookCreateForm({ userId, landmark }) {
  const [message, setMessage] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 클라이언트 유효성 검사
    if (!message.trim()) {
      alert('메시지를 입력해주세요.');
      return;
    }

    if (message.length > 500) {
      alert('메시지는 500자 이하로 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/guestbook?userId=${userId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            landmarkId: landmark.id,
            message: message,
            isPublic: isPublic,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const result = await response.json();
      alert('방명록이 작성되었습니다!');
      setMessage(''); // 폼 초기화
      // 목록 새로고침 등 추가 동작
    } catch (error) {
      alert(`에러: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>{landmark.name} 방명록 작성</h2>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="이 장소에 대한 소감을 남겨주세요"
        maxLength={500}
        rows={5}
      />

      <div className="char-counter">
        {message.length}/500
      </div>

      <label>
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
        />
        공개 방명록
      </label>

      <button type="submit" disabled={loading}>
        {loading ? '작성 중...' : '작성하기'}
      </button>
    </form>
  );
}
```

---

### 2. 랜드마크별 방명록 목록

#### UI 컴포넌트
- [ ] 방명록 아이템 리스트
  - [ ] 작성자 프로필 이미지
  - [ ] 작성자 닉네임
  - [ ] 메시지 내용
  - [ ] 작성 시간 (상대 시간 표시 권장)
- [ ] 페이지네이션 컨트롤
  - [ ] 이전/다음 버튼
  - [ ] 페이지 번호 표시
  - [ ] 무한 스크롤 (선택사항)
- [ ] 빈 상태 (방명록 없을 때)

#### 기능 구현
- [ ] 초기 로드 시 첫 페이지 조회
- [ ] 페이지 변경 시 해당 페이지 조회
- [ ] 무한 스크롤 구현 (선택사항)
- [ ] 작성 시간 포맷팅 (예: "5분 전", "2시간 전")
- [ ] 로딩 스피너 표시
- [ ] 에러 처리

**샘플 코드:**
```tsx
import { useState, useEffect } from 'react';

function LandmarkGuestbookList({ landmarkId }) {
  const [guestbooks, setGuestbooks] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGuestbooks();
  }, [landmarkId, page]);

  const fetchGuestbooks = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/guestbook/landmarks/${landmarkId}?page=${page}&size=20`
      );
      const data = await response.json();
      setGuestbooks(data.content);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('방명록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatRelativeTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString();
  };

  if (loading) return <div>로딩 중...</div>;

  if (guestbooks.length === 0) {
    return <div>아직 작성된 방명록이 없습니다.</div>;
  }

  return (
    <div>
      <div className="guestbook-list">
        {guestbooks.map((item) => (
          <div key={item.id} className="guestbook-item">
            <img src={item.user.profileImageUrl} alt={item.user.nickname} />
            <div>
              <div className="nickname">{item.user.nickname}</div>
              <div className="message">{item.message}</div>
              <div className="timestamp">{formatRelativeTime(item.createdAt)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 페이지네이션 */}
      <div className="pagination">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 0}
        >
          이전
        </button>
        <span>
          {page + 1} / {totalPages}
        </span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPages - 1}
        >
          다음
        </button>
      </div>
    </div>
  );
}
```

---

### 3. 내 방명록 목록

#### UI 컴포넌트
- [ ] 방명록 아이템 리스트
  - [ ] 랜드마크 이미지
  - [ ] 랜드마크 이름
  - [ ] 메시지 내용
  - [ ] 작성 시간
  - [ ] 공개/비공개 배지
- [ ] 빈 상태 (방명록 없을 때)

#### 기능 구현
- [ ] 사용자 ID로 방명록 목록 조회
- [ ] 공개/비공개 구분 표시
- [ ] 랜드마크 클릭 시 상세 페이지 이동
- [ ] 로딩 스피너 표시

**샘플 코드:**
```tsx
import { useState, useEffect } from 'react';

function MyGuestbookList({ userId }) {
  const [guestbooks, setGuestbooks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMyGuestbooks();
  }, [userId]);

  const fetchMyGuestbooks = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/guestbook/users/${userId}`
      );
      const data = await response.json();
      setGuestbooks(data);
    } catch (error) {
      console.error('방명록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>로딩 중...</div>;

  if (guestbooks.length === 0) {
    return <div>아직 작성한 방명록이 없습니다.</div>;
  }

  return (
    <div className="my-guestbook-list">
      {guestbooks.map((item) => (
        <div key={item.id} className="guestbook-item">
          <img src={item.landmark.imageUrl} alt={item.landmark.name} />
          <div>
            <div className="landmark-name">{item.landmark.name}</div>
            <div className="message">{item.message}</div>
            <div className="meta">
              <span className="timestamp">
                {new Date(item.createdAt).toLocaleDateString()}
              </span>
              <span className={`badge ${item.isPublic ? 'public' : 'private'}`}>
                {item.isPublic ? '공개' : '비공개'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

### 4. 최근 방명록 피드

#### UI 컴포넌트
- [ ] 방명록 아이템 리스트
  - [ ] 작성자 정보 (프로필, 닉네임)
  - [ ] 랜드마크 정보 (이름, 위치)
  - [ ] 메시지 내용
  - [ ] 작성 시간
- [ ] 무한 스크롤 또는 페이지네이션

#### 기능 구현
- [ ] 최근 방명록 조회
- [ ] 페이징 또는 무한 스크롤
- [ ] 작성자/랜드마크 클릭 시 상세 페이지 이동

**샘플 코드 (무한 스크롤):**
```tsx
import { useState, useEffect, useRef, useCallback } from 'react';

function RecentGuestbookFeed() {
  const [guestbooks, setGuestbooks] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const observer = useRef();

  const lastGuestbookRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  useEffect(() => {
    fetchGuestbooks();
  }, [page]);

  const fetchGuestbooks = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/guestbook/recent?page=${page}&size=20`
      );
      const data = await response.json();

      setGuestbooks((prev) => [...prev, ...data.content]);
      setHasMore(!data.last);
    } catch (error) {
      console.error('방명록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feed">
      {guestbooks.map((item, index) => {
        if (guestbooks.length === index + 1) {
          return (
            <div ref={lastGuestbookRef} key={item.id} className="feed-item">
              <div className="user-info">
                <img src={item.user.profileImageUrl} alt={item.user.nickname} />
                <span>{item.user.nickname}</span>
              </div>
              <div className="landmark-info">
                📍 {item.landmark.name} ({item.landmark.cityName})
              </div>
              <div className="message">{item.message}</div>
              <div className="timestamp">
                {new Date(item.createdAt).toLocaleString()}
              </div>
            </div>
          );
        } else {
          return (
            <div key={item.id} className="feed-item">
              {/* 동일한 내용 */}
            </div>
          );
        }
      })}
      {loading && <div>로딩 중...</div>}
    </div>
  );
}
```

---

### 5. 랜드마크 통계 표시

#### UI 컴포넌트
- [ ] 방명록 수 표시 (아이콘 + 숫자)
- [ ] 방문자 수 표시 (아이콘 + 숫자)

#### 기능 구현
- [ ] 랜드마크 통계 조회
- [ ] 숫자 포맷팅 (1000 → 1k)

**샘플 코드:**
```tsx
import { useState, useEffect } from 'react';

function LandmarkStatistics({ landmarkId }) {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStatistics();
  }, [landmarkId]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/guestbook/landmarks/${landmarkId}/statistics`
      );
      const data = await response.json();
      setStatistics(data);
    } catch (error) {
      console.error('통계 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  if (loading || !statistics) return <div>로딩 중...</div>;

  return (
    <div className="statistics">
      <div className="stat-item">
        <span className="icon">📝</span>
        <span className="value">{formatNumber(statistics.totalGuestbook)}</span>
        <span className="label">방명록</span>
      </div>
      <div className="stat-item">
        <span className="icon">👥</span>
        <span className="value">{formatNumber(statistics.totalVisitors)}</span>
        <span className="label">방문자</span>
      </div>
    </div>
  );
}
```

---

## 추가 구현 권장사항

### 1. 타입 정의 (TypeScript)

```typescript
// types/guestbook.ts

export interface GuestbookCreateRequest {
  landmarkId: number;
  message: string;
  isPublic?: boolean;
}

export interface UserSummary {
  id: number;
  nickname: string;
  profileImageUrl: string;
}

export interface LandmarkSummary {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  distanceFromStart: number;
  imageUrl: string;
  countryCode: string;
  cityName: string;
}

export interface GuestbookResponse {
  id: number;
  user: UserSummary;
  landmark: LandmarkSummary;
  message: string;
  createdAt: string;
}

export interface PageableResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    offset: number;
  };
  last: boolean;
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface LandmarkStatistics {
  totalGuestbook: number;
  totalVisitors: number;
}
```

---

### 2. API 클라이언트 (Axios)

```typescript
// api/guestbook.ts

import axios from 'axios';
import type {
  GuestbookCreateRequest,
  GuestbookResponse,
  PageableResponse,
  LandmarkStatistics,
} from '@/types/guestbook';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export const guestbookApi = {
  /**
   * 방명록 작성
   */
  create: async (userId: number, request: GuestbookCreateRequest): Promise<GuestbookResponse> => {
    const { data } = await axios.post(
      `${API_BASE_URL}/v1/guestbook`,
      request,
      { params: { userId } }
    );
    return data;
  },

  /**
   * 랜드마크별 방명록 조회
   */
  getByLandmark: async (
    landmarkId: number,
    page: number = 0,
    size: number = 20
  ): Promise<PageableResponse<GuestbookResponse>> => {
    const { data } = await axios.get(
      `${API_BASE_URL}/v1/guestbook/landmarks/${landmarkId}`,
      { params: { page, size, sort: 'createdAt,desc' } }
    );
    return data;
  },

  /**
   * 내 방명록 목록 조회
   */
  getByUser: async (userId: number): Promise<GuestbookResponse[]> => {
    const { data } = await axios.get(
      `${API_BASE_URL}/v1/guestbook/users/${userId}`
    );
    return data;
  },

  /**
   * 최근 방명록 조회
   */
  getRecent: async (
    page: number = 0,
    size: number = 20
  ): Promise<PageableResponse<GuestbookResponse>> => {
    const { data } = await axios.get(
      `${API_BASE_URL}/v1/guestbook/recent`,
      { params: { page, size, sort: 'createdAt,desc' } }
    );
    return data;
  },

  /**
   * 랜드마크 통계 조회
   */
  getStatistics: async (landmarkId: number): Promise<LandmarkStatistics> => {
    const { data } = await axios.get(
      `${API_BASE_URL}/v1/guestbook/landmarks/${landmarkId}/statistics`
    );
    return data;
  },
};
```

---

### 3. React Query 활용 (권장)

```typescript
// hooks/useGuestbook.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { guestbookApi } from '@/api/guestbook';
import type { GuestbookCreateRequest } from '@/types/guestbook';

/**
 * 랜드마크별 방명록 조회 훅
 */
export function useLandmarkGuestbook(landmarkId: number, page: number = 0) {
  return useQuery({
    queryKey: ['guestbook', 'landmark', landmarkId, page],
    queryFn: () => guestbookApi.getByLandmark(landmarkId, page, 20),
  });
}

/**
 * 내 방명록 조회 훅
 */
export function useMyGuestbook(userId: number) {
  return useQuery({
    queryKey: ['guestbook', 'user', userId],
    queryFn: () => guestbookApi.getByUser(userId),
  });
}

/**
 * 최근 방명록 조회 훅
 */
export function useRecentGuestbook(page: number = 0) {
  return useQuery({
    queryKey: ['guestbook', 'recent', page],
    queryFn: () => guestbookApi.getRecent(page, 20),
  });
}

/**
 * 랜드마크 통계 조회 훅
 */
export function useLandmarkStatistics(landmarkId: number) {
  return useQuery({
    queryKey: ['guestbook', 'statistics', landmarkId],
    queryFn: () => guestbookApi.getStatistics(landmarkId),
  });
}

/**
 * 방명록 작성 훅
 */
export function useCreateGuestbook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, request }: { userId: number; request: GuestbookCreateRequest }) =>
      guestbookApi.create(userId, request),
    onSuccess: (data, variables) => {
      // 관련 쿼리 무효화하여 자동 새로고침
      queryClient.invalidateQueries({ queryKey: ['guestbook', 'landmark', variables.request.landmarkId] });
      queryClient.invalidateQueries({ queryKey: ['guestbook', 'user', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['guestbook', 'recent'] });
      queryClient.invalidateQueries({ queryKey: ['guestbook', 'statistics', variables.request.landmarkId] });
    },
  });
}

// 사용 예시
function GuestbookCreateForm({ userId, landmarkId }) {
  const createGuestbook = useCreateGuestbook();

  const handleSubmit = async (message: string, isPublic: boolean) => {
    try {
      await createGuestbook.mutateAsync({
        userId,
        request: { landmarkId, message, isPublic },
      });
      alert('방명록이 작성되었습니다!');
    } catch (error) {
      alert('작성 실패');
    }
  };

  return (
    // ... 폼 UI
  );
}
```

---

## 마무리

이 문서는 WayToEarth 백엔드의 방명록 기능을 완벽하게 이해하고 프론트엔드에서 구현하기 위한 모든 정보를 담고 있습니다.

### 핵심 요약
1. **5개의 API 엔드포인트**: 작성, 랜드마크별 조회, 내 방명록, 최근 방명록, 통계
2. **공개/비공개 구분**: `isPublic` 필드로 관리
3. **페이징 지원**: Spring Page 객체 활용
4. **N+1 문제 해결**: JOIN FETCH로 관련 엔티티 최적화
5. **유효성 검사**: 메시지 필수, 최대 500자

### 문의사항
- Swagger UI: `http://your-server:8080/swagger-ui.html`
- 백엔드 개발자에게 문의

---

**문서 버전:** 1.0
**최종 수정일:** 2025-01-15
**작성자:** Backend Team
