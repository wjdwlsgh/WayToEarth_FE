# 랜드마크 방문자 수 체크 로직 가이드

## 📋 개요

프론트엔드에서 랜드마크의 방문자 수와 방명록 수를 확인하는 방법을 정리한 문서입니다.

---

## API 엔드포인트

### 랜드마크 통계 조회

```
GET /v1/guestbook/landmarks/{landmarkId}/statistics
```

**설명**: 특정 랜드마크의 방명록 수와 방문자 수를 조회합니다.

**위치**: `GuestbookController.java:82-90`

---

## 요청 예시

### HTTP Request

```http
GET /v1/guestbook/landmarks/123/statistics
```

### cURL

```bash
curl -X GET "http://localhost:8080/v1/guestbook/landmarks/123/statistics" \
  -H "Authorization: Bearer {token}"
```

### JavaScript (Axios)

```javascript
const landmarkId = 123;

try {
  const response = await axios.get(
    `/v1/guestbook/landmarks/${landmarkId}/statistics`
  );

  console.log('방명록 수:', response.data.totalGuestbook);
  console.log('방문자 수:', response.data.totalVisitors);
} catch (error) {
  console.error('통계 조회 실패:', error);
}
```

---

## 응답 형식

### Response DTO

**위치**: `GuestbookService.java:42-45`

```java
record LandmarkStatistics(
    Long totalGuestbook,   // 공개 방명록 수
    Long totalVisitors     // 고유 방문자 수
) {}
```

### 응답 예시 (JSON)

```json
{
  "totalGuestbook": 45,
  "totalVisitors": 128
}
```

**필드 설명**:
- `totalGuestbook`: 해당 랜드마크에 작성된 **공개 방명록 수**
- `totalVisitors`: 해당 랜드마크를 방문한 **고유 사용자 수** (스탬프 수집자 수)

---

## 데이터 계산 로직

### 1. totalGuestbook (공개 방명록 수)

**쿼리 위치**: `GuestbookRepository`

**계산 방식**:
```sql
SELECT COUNT(*)
FROM guestbook
WHERE landmark_id = :landmarkId
  AND is_public = true
```

**특징**:
- `is_public = true`인 방명록만 카운트
- 비공개 방명록은 제외됨
- 동일 사용자가 여러 개 작성 가능 → 모두 카운트

### 2. totalVisitors (고유 방문자 수)

**쿼리 위치**: `StampRepository.java:41-42`

**계산 방식**:
```sql
SELECT COUNT(DISTINCT s.userJourneyProgress.user.id)
FROM StampEntity s
WHERE s.landmark.id = :landmarkId
```

**특징**:
- `COUNT(DISTINCT user.id)` 사용
- **고유 사용자만 카운트** (중복 제거)
- 동일 사용자가 여러 번 방문해도 1명으로 카운트

**예시**:
| 사용자 | 방문 횟수 | 스탬프 수 | 카운트 |
|--------|-----------|-----------|---------|
| A      | 3번       | 3개       | 1명     |
| B      | 1번       | 1개       | 1명     |
| C      | 2번       | 2개       | 1명     |
| **합계** | -       | **6개**   | **3명** |

→ `totalVisitors = 3` (고유 사용자 수)

---

## 구현 흐름

```
1. 프론트엔드 요청
   ↓
   GET /v1/guestbook/landmarks/{landmarkId}/statistics
   ↓
2. GuestbookController.getLandmarkStatistics()
   ↓
3. GuestbookService.getLandmarkStatistics()
   ↓
4-a. guestbookRepository.countByLandmarkIdAndIsPublicTrue(landmarkId)
     → 공개 방명록 수 계산
   ↓
4-b. stampRepository.countCollectorsByLandmarkId(landmarkId)
     → 고유 방문자 수 계산 (COUNT(DISTINCT user.id))
   ↓
5. LandmarkStatistics 객체 생성
   ↓
6. JSON 응답 반환
   {
     "totalGuestbook": 45,
     "totalVisitors": 128
   }
```

---

## 프론트엔드 구현 예시

### React/TypeScript

```typescript
import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface LandmarkStatistics {
  totalGuestbook: number;
  totalVisitors: number;
}

const LandmarkStatisticsComponent: React.FC<{ landmarkId: number }> = ({
  landmarkId
}) => {
  const [stats, setStats] = useState<LandmarkStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatistics();
  }, [landmarkId]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/v1/guestbook/landmarks/${landmarkId}/statistics`
      );
      setStats(response.data);
      setError(null);
    } catch (err) {
      console.error('통계 조회 실패:', err);
      setError('통계를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!stats) return null;

  return (
    <div className="landmark-statistics">
      <h3>랜드마크 통계</h3>
      <div className="stat-item">
        <span className="label">방문자 수</span>
        <span className="value">{stats.totalVisitors.toLocaleString()}명</span>
      </div>
      <div className="stat-item">
        <span className="label">방명록 수</span>
        <span className="value">{stats.totalGuestbook.toLocaleString()}개</span>
      </div>
    </div>
  );
};

export default LandmarkStatisticsComponent;
```

### Vue.js 3 (Composition API)

```vue
<template>
  <div class="landmark-statistics">
    <h3>랜드마크 통계</h3>

    <div v-if="loading">로딩 중...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="stats">
      <div class="stat-item">
        <span class="label">방문자 수</span>
        <span class="value">{{ stats.totalVisitors.toLocaleString() }}명</span>
      </div>
      <div class="stat-item">
        <span class="label">방명록 수</span>
        <span class="value">{{ stats.totalGuestbook.toLocaleString() }}개</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';

interface LandmarkStatistics {
  totalGuestbook: number;
  totalVisitors: number;
}

const props = defineProps<{
  landmarkId: number;
}>();

const stats = ref<LandmarkStatistics | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const fetchStatistics = async () => {
  try {
    loading.value = true;
    const response = await axios.get(
      `/v1/guestbook/landmarks/${props.landmarkId}/statistics`
    );
    stats.value = response.data;
    error.value = null;
  } catch (err) {
    console.error('통계 조회 실패:', err);
    error.value = '통계를 불러올 수 없습니다.';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchStatistics();
});

watch(() => props.landmarkId, () => {
  fetchStatistics();
});
</script>

<style scoped>
.landmark-statistics {
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  margin: 8px 0;
}

.label {
  color: #666;
}

.value {
  font-weight: bold;
  color: #333;
}

.error {
  color: red;
}
</style>
```

---

## 사용 시나리오

### 1. 랜드마크 상세 페이지

```typescript
// LandmarkDetailPage.tsx
const LandmarkDetailPage: React.FC<{ landmarkId: number }> = ({ landmarkId }) => {
  const [landmark, setLandmark] = useState(null);
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    // 랜드마크 상세 정보 + 통계 동시 로드
    Promise.all([
      axios.get(`/v1/landmarks/${landmarkId}`),
      axios.get(`/v1/guestbook/landmarks/${landmarkId}/statistics`)
    ]).then(([landmarkRes, statsRes]) => {
      setLandmark(landmarkRes.data);
      setStatistics(statsRes.data);
    });
  }, [landmarkId]);

  return (
    <div>
      <h1>{landmark?.name}</h1>

      {/* 통계 표시 */}
      <div className="stats-banner">
        <div className="stat">
          <span className="icon">👥</span>
          <span className="count">{statistics?.totalVisitors}</span>
          <span className="label">명의 방문자</span>
        </div>
        <div className="stat">
          <span className="icon">📝</span>
          <span className="count">{statistics?.totalGuestbook}</span>
          <span className="label">개의 방명록</span>
        </div>
      </div>

      {/* 방명록 섹션 */}
      <GuestbookSection landmarkId={landmarkId} />
    </div>
  );
};
```

### 2. 랜드마크 카드 (목록)

```typescript
// LandmarkCard.tsx
const LandmarkCard: React.FC<{ landmark: Landmark }> = ({ landmark }) => {
  const [visitorCount, setVisitorCount] = useState<number | null>(null);

  useEffect(() => {
    // 방문자 수만 가져오기
    axios.get(`/v1/guestbook/landmarks/${landmark.id}/statistics`)
      .then(res => setVisitorCount(res.data.totalVisitors));
  }, [landmark.id]);

  return (
    <div className="landmark-card">
      <img src={landmark.imageUrl} alt={landmark.name} />
      <h3>{landmark.name}</h3>
      <p>{landmark.description}</p>

      {visitorCount !== null && (
        <div className="visitor-badge">
          👥 {visitorCount}명 방문
        </div>
      )}
    </div>
  );
};
```

### 3. 실시간 업데이트 (선택사항)

```typescript
// 스탬프 수집 후 통계 갱신
const collectStamp = async (landmarkId: number) => {
  try {
    // 스탬프 수집 API 호출
    await axios.post(`/v1/stamps/collect`, { landmarkId });

    // 통계 갱신
    const statsResponse = await axios.get(
      `/v1/guestbook/landmarks/${landmarkId}/statistics`
    );

    setStatistics(statsResponse.data);

    alert('스탬프를 획득했습니다!');
  } catch (error) {
    console.error('스탬프 수집 실패:', error);
  }
};
```

---

## 주의사항

### 1. totalVisitors는 고유 사용자 수

- 동일 사용자가 여러 번 방문해도 1명으로 카운트
- 스탬프를 수집한 사용자만 카운트 (스탬프 미수집 시 제외)

### 2. totalGuestbook은 공개 방명록만

- `isPublic = true`인 방명록만 카운트
- 비공개 방명록은 통계에서 제외

### 3. 실시간 동기화

- 통계는 데이터베이스에서 실시간 계산
- 캐싱 없음 (항상 최신 데이터)
- 스탬프 수집/방명록 작성 후 즉시 반영

### 4. 성능 고려사항

- 통계 API는 가벼운 COUNT 쿼리만 실행
- 인덱스가 있어 빠른 조회 가능:
  - `stamps` 테이블: `landmark_id` 인덱스
  - `guestbook` 테이블: `landmark_id, is_public` 복합 인덱스

---

## 관련 파일 위치

### Backend

**Controller**:
- `src/main/java/com/waytoearth/controller/v1/journey/GuestbookController.java:82-90`

**Service**:
- `src/main/java/com/waytoearth/service/journey/GuestbookService.java:42-45`
- `src/main/java/com/waytoearth/service/journey/GuestbookServiceImpl.java:82-91`

**Repository**:
- `src/main/java/com/waytoearth/repository/journey/StampRepository.java:41-42`
- `src/main/java/com/waytoearth/repository/journey/GuestbookRepository.java`

**Entity**:
- `src/main/java/com/waytoearth/entity/journey/StampEntity.java`
- `src/main/java/com/waytoearth/entity/journey/GuestbookEntity.java`

---

## 테스트 방법

### 1. API 직접 호출 (Postman/Insomnia)

```
GET http://localhost:8080/v1/guestbook/landmarks/1/statistics
```

**예상 응답**:
```json
{
  "totalGuestbook": 10,
  "totalVisitors": 25
}
```

### 2. 브라우저 개발자 도구

```javascript
// 콘솔에서 실행
fetch('/v1/guestbook/landmarks/1/statistics')
  .then(res => res.json())
  .then(data => console.log('통계:', data));
```

### 3. cURL 명령어

```bash
curl http://localhost:8080/v1/guestbook/landmarks/1/statistics
```

---

## 요약

| 항목 | 설명 |
|------|------|
| **엔드포인트** | `GET /v1/guestbook/landmarks/{landmarkId}/statistics` |
| **응답 형식** | `{ totalGuestbook: Long, totalVisitors: Long }` |
| **totalGuestbook** | 공개 방명록 수 (isPublic = true) |
| **totalVisitors** | 고유 방문자 수 (COUNT(DISTINCT user.id)) |
| **인증 필요** | 선택적 (공개 API) |
| **페이징** | 없음 (단순 통계 값) |
| **캐싱** | 없음 (실시간 계산) |

프론트엔드에서는 위 엔드포인트를 호출하여 랜드마크의 방문자 수와 방명록 수를 표시할 수 있습니다.
