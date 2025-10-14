# 스탬프 수집 API 가이드

## 📋 개요

프론트엔드에서 랜드마크 스탬프를 수집하는 API 사용 방법을 정리한 문서입니다.

---

## API 엔드포인트 목록

### 1. 스탬프 수집
```
POST /v1/stamps/collect
```

### 2. 스탬프 수집 가능 여부 확인
```
GET /v1/stamps/check-collection
```

### 3. 사용자 스탬프 목록
```
GET /v1/stamps/users/{userId}
```

### 4. 여행별 스탬프 목록
```
GET /v1/stamps/progress/{progressId}
```

### 5. 스탬프 통계
```
GET /v1/stamps/users/{userId}/statistics
```

---

## 1. 스탬프 수집 (핵심 API)

### 엔드포인트
```
POST /v1/stamps/collect
```

**위치**: `StampController.java:26-46`

### Request Body

```json
{
  "progressId": 1,
  "landmarkId": 5,
  "collectionLocation": {
    "latitude": 37.5796,
    "longitude": 126.9770
  }
}
```

**필드 설명**:
- `progressId` (Long, 필수): 사용자 여행 진행 ID
- `landmarkId` (Long, 필수): 수집할 랜드마크 ID
- `collectionLocation` (Object, 필수): 현재 위치
  - `latitude` (Double, 필수): 현재 위도
  - `longitude` (Double, 필수): 현재 경도

### Response

**성공 시 (200 OK)**:
```json
{
  "id": 123,
  "landmark": {
    "id": 5,
    "name": "경복궁",
    "description": "조선왕조의 법궁",
    "latitude": 37.5796,
    "longitude": 126.9770,
    "distanceFromStart": 25.5,
    "orderIndex": 3,
    "imageUrl": "https://example.com/landmark.jpg"
  },
  "collectedAt": "2024-01-15T14:30:00",
  "stampImageUrl": "https://example.com/stamp.png"
}
```

### 수집 조건

스탬프 수집이 성공하려면 다음 조건을 모두 만족해야 합니다:

1. **거리 조건**: 랜드마크 500m 반경 내에 위치
2. **진행률 조건**: 여정 상에서 해당 랜드마크에 도달한 상태
3. **중복 방지**: 이미 수집한 스탬프는 재수집 불가

### 에러 응답

**400 Bad Request**:
```json
{
  "error": "DISTANCE_TOO_FAR",
  "message": "랜드마크에서 500m 이상 떨어져 있습니다."
}
```

**400 Bad Request**:
```json
{
  "error": "ALREADY_COLLECTED",
  "message": "이미 수집한 스탬프입니다."
}
```

**400 Bad Request**:
```json
{
  "error": "PROGRESS_NOT_REACHED",
  "message": "아직 이 랜드마크에 도달하지 않았습니다."
}
```

---

## 2. 스탬프 수집 가능 여부 확인

### 엔드포인트
```
GET /v1/stamps/check-collection
```

**위치**: `StampController.java:79-93`

### Query Parameters

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|----------|------|------|------|------|
| progressId | Long | 필수 | 여행 진행 ID | 1 |
| landmarkId | Long | 필수 | 랜드마크 ID | 5 |
| latitude | Double | 필수 | 현재 위도 | 37.5796 |
| longitude | Double | 필수 | 현재 경도 | 126.9770 |

### Request 예시

```
GET /v1/stamps/check-collection?progressId=1&landmarkId=5&latitude=37.5796&longitude=126.9770
```

### Response

**성공 시 (200 OK)**:
```json
true
```

또는

```json
false
```

**설명**:
- `true`: 현재 위치에서 스탬프 수집 가능
- `false`: 수집 조건 미충족 (거리 초과, 이미 수집, 진행률 부족 등)

---

## 3. 사용자 스탬프 목록

### 엔드포인트
```
GET /v1/stamps/users/{userId}
```

**위치**: `StampController.java:48-56`

### Response

```json
[
  {
    "id": 123,
    "landmark": {
      "id": 5,
      "name": "경복궁",
      "description": "조선왕조의 법궁",
      "latitude": 37.5796,
      "longitude": 126.9770,
      "distanceFromStart": 25.5,
      "orderIndex": 3,
      "imageUrl": "https://example.com/landmark.jpg"
    },
    "collectedAt": "2024-01-15T14:30:00",
    "stampImageUrl": "https://example.com/stamp.png"
  },
  {
    "id": 124,
    "landmark": {
      "id": 8,
      "name": "남산타워",
      "description": "서울의 상징",
      "latitude": 37.5512,
      "longitude": 126.9882,
      "distanceFromStart": 30.2,
      "orderIndex": 4,
      "imageUrl": "https://example.com/landmark2.jpg"
    },
    "collectedAt": "2024-01-16T10:15:00",
    "stampImageUrl": "https://example.com/stamp2.png"
  }
]
```

---

## 4. 여행별 스탬프 목록

### 엔드포인트
```
GET /v1/stamps/progress/{progressId}
```

**위치**: `StampController.java:58-66`

### Response

사용자 스탬프 목록과 동일한 형식이지만, 특정 여행 진행(progress)에서 수집한 스탬프만 반환됩니다.

---

## 5. 스탬프 통계

### 엔드포인트
```
GET /v1/stamps/users/{userId}/statistics
```

**위치**: `StampController.java:69-77`

### Response

```json
{
  "totalStamps": 15,
  "totalJourneys": 3,
  "firstStampCollectedAt": "2024-01-01T10:00:00",
  "lastStampCollectedAt": "2024-01-15T14:30:00"
}
```

---

## 프론트엔드 구현 예시

### React/TypeScript - 스탬프 수집 컴포넌트

```typescript
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface StampCollectProps {
  progressId: number;
  landmarkId: number;
  landmarkName: string;
  landmarkLatitude: number;
  landmarkLongitude: number;
}

const StampCollectButton: React.FC<StampCollectProps> = ({
  progressId,
  landmarkId,
  landmarkName,
  landmarkLatitude,
  landmarkLongitude
}) => {
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [canCollect, setCanCollect] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 현재 위치 가져오기
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setCurrentLocation(location);
          checkCollectionAvailability(location);
        },
        (error) => {
          console.error('위치 정보를 가져올 수 없습니다:', error);
          setErrorMessage('위치 정보를 가져올 수 없습니다.');
        }
      );
    } else {
      setErrorMessage('위치 서비스가 지원되지 않습니다.');
    }
  }, []);

  // 스탬프 수집 가능 여부 확인
  const checkCollectionAvailability = async (location: {
    latitude: number;
    longitude: number;
  }) => {
    try {
      const response = await axios.get('/v1/stamps/check-collection', {
        params: {
          progressId,
          landmarkId,
          latitude: location.latitude,
          longitude: location.longitude
        }
      });

      setCanCollect(response.data);

      if (!response.data) {
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          landmarkLatitude,
          landmarkLongitude
        );
        if (distance > 500) {
          setErrorMessage(
            `랜드마크에서 ${Math.round(distance)}m 떨어져 있습니다. (최대 500m)`
          );
        }
      }
    } catch (error) {
      console.error('수집 가능 여부 확인 실패:', error);
    }
  };

  // 스탬프 수집
  const handleCollectStamp = async () => {
    if (!currentLocation || !canCollect) return;

    setIsCollecting(true);
    setErrorMessage(null);

    try {
      const response = await axios.post('/v1/stamps/collect', {
        progressId,
        landmarkId,
        collectionLocation: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude
        }
      });

      alert(`${landmarkName} 스탬프를 획득했습니다! 🎉`);
      console.log('수집된 스탬프:', response.data);

      // 스탬프 수집 후 처리 (예: 페이지 새로고침, 상태 업데이트 등)
      window.location.reload();
    } catch (error: any) {
      console.error('스탬프 수집 실패:', error);

      if (error.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage('스탬프 수집에 실패했습니다.');
      }
    } finally {
      setIsCollecting(false);
    }
  };

  // 거리 계산 (Haversine formula)
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371e3; // 지구 반지름 (미터)
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // 미터 단위
  };

  return (
    <div className="stamp-collect">
      {errorMessage && (
        <div className="error-message">{errorMessage}</div>
      )}

      <button
        onClick={handleCollectStamp}
        disabled={!canCollect || isCollecting || !currentLocation}
        className={`collect-button ${canCollect ? 'available' : 'unavailable'}`}
      >
        {isCollecting
          ? '수집 중...'
          : canCollect
          ? `${landmarkName} 스탬프 수집`
          : '스탬프 수집 불가'}
      </button>

      {!canCollect && currentLocation && (
        <p className="hint">
          랜드마크 500m 이내로 이동하세요
        </p>
      )}
    </div>
  );
};

export default StampCollectButton;
```

### Vue.js 3 - 스탬프 수집

```vue
<template>
  <div class="stamp-collect">
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <button
      @click="collectStamp"
      :disabled="!canCollect || isCollecting || !currentLocation"
      :class="['collect-button', canCollect ? 'available' : 'unavailable']"
    >
      {{
        isCollecting
          ? '수집 중...'
          : canCollect
          ? `${landmarkName} 스탬프 수집`
          : '스탬프 수집 불가'
      }}
    </button>

    <p v-if="!canCollect && currentLocation" class="hint">
      랜드마크 500m 이내로 이동하세요
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

const props = defineProps<{
  progressId: number;
  landmarkId: number;
  landmarkName: string;
  landmarkLatitude: number;
  landmarkLongitude: number;
}>();

const currentLocation = ref<{ latitude: number; longitude: number } | null>(null);
const canCollect = ref(false);
const isCollecting = ref(false);
const errorMessage = ref<string | null>(null);

onMounted(() => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        currentLocation.value = location;
        checkCollectionAvailability(location);
      },
      (error) => {
        console.error('위치 정보를 가져올 수 없습니다:', error);
        errorMessage.value = '위치 정보를 가져올 수 없습니다.';
      }
    );
  } else {
    errorMessage.value = '위치 서비스가 지원되지 않습니다.';
  }
});

const checkCollectionAvailability = async (location: {
  latitude: number;
  longitude: number;
}) => {
  try {
    const response = await axios.get('/v1/stamps/check-collection', {
      params: {
        progressId: props.progressId,
        landmarkId: props.landmarkId,
        latitude: location.latitude,
        longitude: location.longitude
      }
    });

    canCollect.value = response.data;

    if (!response.data) {
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        props.landmarkLatitude,
        props.landmarkLongitude
      );
      if (distance > 500) {
        errorMessage.value = `랜드마크에서 ${Math.round(distance)}m 떨어져 있습니다. (최대 500m)`;
      }
    }
  } catch (error) {
    console.error('수집 가능 여부 확인 실패:', error);
  }
};

const collectStamp = async () => {
  if (!currentLocation.value || !canCollect.value) return;

  isCollecting.value = true;
  errorMessage.value = null;

  try {
    const response = await axios.post('/v1/stamps/collect', {
      progressId: props.progressId,
      landmarkId: props.landmarkId,
      collectionLocation: {
        latitude: currentLocation.value.latitude,
        longitude: currentLocation.value.longitude
      }
    });

    alert(`${props.landmarkName} 스탬프를 획득했습니다! 🎉`);
    console.log('수집된 스탬프:', response.data);

    window.location.reload();
  } catch (error: any) {
    console.error('스탬프 수집 실패:', error);

    if (error.response?.data?.message) {
      errorMessage.value = error.response.data.message;
    } else {
      errorMessage.value = '스탬프 수집에 실패했습니다.';
    }
  } finally {
    isCollecting.value = false;
  }
};

const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};
</script>

<style scoped>
.stamp-collect {
  padding: 16px;
}

.collect-button {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
}

.collect-button.available {
  background-color: #4caf50;
  color: white;
}

.collect-button.unavailable {
  background-color: #ccc;
  color: #666;
  cursor: not-allowed;
}

.error-message {
  color: red;
  margin-bottom: 8px;
}

.hint {
  color: #666;
  font-size: 14px;
  margin-top: 8px;
}
</style>
```

---

## 사용 시나리오

### 1. 랜드마크 상세 페이지에서 스탬프 수집

```typescript
// LandmarkDetailPage.tsx
const LandmarkDetailPage: React.FC = () => {
  const { landmarkId } = useParams();
  const [landmark, setLandmark] = useState(null);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    // 랜드마크 정보 + 사용자 진행 정보 로드
    Promise.all([
      axios.get(`/v1/landmarks/${landmarkId}`),
      axios.get(`/v1/journey/progress/current`) // 현재 진행 중인 여정
    ]).then(([landmarkRes, progressRes]) => {
      setLandmark(landmarkRes.data);
      setProgress(progressRes.data);
    });
  }, [landmarkId]);

  if (!landmark || !progress) return <div>로딩 중...</div>;

  return (
    <div>
      <h1>{landmark.name}</h1>
      <p>{landmark.description}</p>

      {/* 스탬프 수집 버튼 */}
      <StampCollectButton
        progressId={progress.id}
        landmarkId={landmark.id}
        landmarkName={landmark.name}
        landmarkLatitude={landmark.latitude}
        landmarkLongitude={landmark.longitude}
      />

      {/* 기타 랜드마크 정보 */}
    </div>
  );
};
```

### 2. 지도에서 실시간 거리 체크

```typescript
// MapWithStampCollection.tsx
const MapWithStampCollection: React.FC = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyLandmarks, setNearbyLandmarks] = useState([]);

  useEffect(() => {
    // 실시간 위치 추적
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setUserLocation(location);

        // 500m 이내 랜드마크 필터링
        checkNearbyLandmarks(location);
      },
      (error) => console.error('위치 추적 실패:', error),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const checkNearbyLandmarks = async (location) => {
    // 모든 랜드마크를 가져와서 거리 계산
    const response = await axios.get('/v1/landmarks');
    const landmarks = response.data;

    const nearby = landmarks.filter((landmark) => {
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        landmark.latitude,
        landmark.longitude
      );
      return distance <= 500;
    });

    setNearbyLandmarks(nearby);

    // 알림
    if (nearby.length > 0) {
      alert(`${nearby[0].name}에 도착했습니다! 스탬프를 수집하세요.`);
    }
  };

  return (
    <div>
      <Map userLocation={userLocation} landmarks={nearbyLandmarks} />

      {nearbyLandmarks.map((landmark) => (
        <StampCollectButton
          key={landmark.id}
          progressId={currentProgress.id}
          landmarkId={landmark.id}
          landmarkName={landmark.name}
          landmarkLatitude={landmark.latitude}
          landmarkLongitude={landmark.longitude}
        />
      ))}
    </div>
  );
};
```

---

## 주의사항

### 1. 위치 권한 필요

사용자의 현재 위치를 가져오려면 브라우저에서 위치 권한이 필요합니다.

```javascript
// 위치 권한 요청
navigator.geolocation.getCurrentPosition(
  (position) => {
    // 성공
  },
  (error) => {
    // 실패: 권한 거부, 위치 서비스 비활성화 등
  }
);
```

### 2. HTTPS 필수

Geolocation API는 보안상 HTTPS 환경에서만 작동합니다.

### 3. 500m 반경 체크

스탬프는 랜드마크에서 **500m 이내**에서만 수집 가능합니다.

### 4. 중복 수집 방지

동일한 랜드마크의 스탬프는 한 번만 수집 가능합니다.

### 5. 진행률 체크

여정 상에서 해당 랜드마크에 **도달한 상태**여야 수집 가능합니다.

---

## 테스트 방법

### 1. Postman/Insomnia

```
POST http://localhost:8080/v1/stamps/collect
Content-Type: application/json

{
  "progressId": 1,
  "landmarkId": 5,
  "collectionLocation": {
    "latitude": 37.5796,
    "longitude": 126.9770
  }
}
```

### 2. cURL

```bash
curl -X POST http://localhost:8080/v1/stamps/collect \
  -H "Content-Type: application/json" \
  -d '{
    "progressId": 1,
    "landmarkId": 5,
    "collectionLocation": {
      "latitude": 37.5796,
      "longitude": 126.9770
    }
  }'
```

### 3. 브라우저 개발자 도구

```javascript
fetch('/v1/stamps/collect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    progressId: 1,
    landmarkId: 5,
    collectionLocation: {
      latitude: 37.5796,
      longitude: 126.9770
    }
  })
})
  .then((res) => res.json())
  .then((data) => console.log('스탬프 수집 성공:', data));
```

---

## 관련 파일 위치

### Backend

**Controller**:
- `src/main/java/com/waytoearth/controller/v1/journey/StampController.java`

**Service**:
- `src/main/java/com/waytoearth/service/journey/StampService.java`
- `src/main/java/com/waytoearth/service/journey/StampServiceImpl.java`

**Repository**:
- `src/main/java/com/waytoearth/repository/journey/StampRepository.java`

**DTO**:
- Request: `src/main/java/com/waytoearth/dto/request/journey/StampCollectRequest.java`
- Response: `src/main/java/com/waytoearth/dto/response/journey/StampResponse.java`

**Entity**:
- `src/main/java/com/waytoearth/entity/journey/StampEntity.java`

---

## 요약

| API | Method | 엔드포인트 | 설명 |
|-----|--------|------------|------|
| 스탬프 수집 | POST | `/v1/stamps/collect` | 랜드마크에서 스탬프 수집 |
| 수집 가능 확인 | GET | `/v1/stamps/check-collection` | 현재 위치에서 수집 가능 여부 |
| 사용자 스탬프 | GET | `/v1/stamps/users/{userId}` | 사용자가 수집한 모든 스탬프 |
| 여행별 스탬프 | GET | `/v1/stamps/progress/{progressId}` | 특정 여행의 스탬프 목록 |
| 스탬프 통계 | GET | `/v1/stamps/users/{userId}/statistics` | 스탬프 수집 통계 |

프론트엔드에서는 위 API들을 활용하여 스탬프 수집 기능을 구현할 수 있습니다.
