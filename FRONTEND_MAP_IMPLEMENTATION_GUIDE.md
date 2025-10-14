# 여정러닝 프론트엔드 지도 구현 가이드

## 📋 목차
1. [개요](#개요)
2. [백엔드 API 구조 분석](#백엔드-api-구조-분석)
3. [지도 라이브러리 선택](#지도-라이브러리-선택)
4. [데이터 모델 설계](#데이터-모델-설계)
5. [컴포넌트 구조 설계](#컴포넌트-구조-설계)
6. [핵심 기능 구현 가이드](#핵심-기능-구현-가이드)
7. [성능 최적화 전략](#성능-최적화-전략)
8. [상태 관리 전략](#상태-관리-전략)
9. [실시간 러닝 추적 구현](#실시간-러닝-추적-구현)
10. [UI/UX 권장사항](#uiux-권장사항)

---

## 개요

여정러닝은 가상의 장거리 여정(예: 서울-부산)을 실제 러닝으로 완주하는 서비스입니다. 지도는 다음 3가지 핵심 기능을 제공해야 합니다:

### 핵심 기능
1. **여정 경로 시각화**: 미리 정의된 여정 경로를 지도에 표시
2. **실시간 러닝 추적**: 사용자의 현재 러닝 경로를 실시간으로 지도에 표시
3. **진행률 시각화**: 여정 내 사용자의 현재 위치와 다음 랜드마크 표시

---

## 백엔드 API 구조 분석

### 1. 여정 경로 API

#### GET `/v1/journeys/{journeyId}/routes`
여정의 경로 좌표들을 페이징하여 조회합니다.

**요청 파라미터:**
```typescript
{
  journeyId: number;      // 여정 ID
  page?: number;          // 페이지 번호 (기본값: 0)
  size?: number;          // 페이지 크기 (기본값: 100)
  from?: number;          // 시작 sequence (구간 조회용)
  to?: number;            // 끝 sequence (구간 조회용)
}
```

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
      "altitude": 118.2,
      "description": "한강대교 중앙"
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

#### GET `/v1/journeys/{journeyId}/routes/all`
페이징 없이 전체 경로를 한 번에 조회합니다.

**사용 시나리오:**
- 초기 전체 경로를 지도에 그릴 때
- 경로 데이터를 로컬에 캐싱할 때

**주의사항:**
- 경로가 긴 여정의 경우 응답 크기가 클 수 있음
- 가급적 페이징 API 사용 권장

#### GET `/v1/journeys/{journeyId}/routes/statistics`
여정 경로의 통계 정보를 조회합니다.

**응답 예시:**
```json
{
  "totalRoutePoints": 1500,
  "maxSequence": 1500,
  "minSequence": 1
}
```

### 2. 랜드마크 API

#### GET `/v1/journeys/{journeyId}/landmarks`
여정의 랜드마크 목록을 조회합니다.

**응답 데이터:**
```typescript
interface LandmarkSummary {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  distanceFromStart: number;  // km
  imageUrl: string;
  countryCode: string;
  cityName: string;
}
```

### 3. 사용자 진행률 API

#### GET `/v1/journeys/progress/{userId}/{journeyId}`
사용자의 여정 진행률을 조회합니다.

**응답 데이터:**
```typescript
interface JourneyProgress {
  progressId: number;
  currentDistanceKm: number;
  progressPercent: number;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  nextLandmark: LandmarkSummary;
  collectedStamps: number;
  totalLandmarks: number;
}
```

### 4. 실시간 러닝 API

#### POST `/v1/running/start`
러닝을 시작합니다.

**요청 본문:**
```typescript
interface RunningStartRequest {
  journeyId?: number;  // 여정과 연동하는 경우
  startLatitude: number;
  startLongitude: number;
  startTime: string;  // ISO 8601 형식
}
```

#### POST `/v1/running/update`
러닝 중 주기적으로 위치를 업데이트합니다.

**요청 본문:**
```typescript
interface RunningUpdateRequest {
  sessionId: string;
  routes: Array<{
    latitude: number;
    longitude: number;
    sequence: number;
    timestamp: string;
  }>;
  currentDistance: number;  // 미터
  currentPace: number;      // 분/km
  currentSpeed: number;     // km/h
}
```

#### POST `/v1/running/complete`
러닝을 완료합니다.

**응답 데이터:**
```typescript
interface RunningCompleteResponse {
  recordId: number;
  totalDistance: number;
  totalTime: number;  // 초
  averagePace: number;
  routes: Array<{
    latitude: number;
    longitude: number;
    sequence: number;
  }>;
  journeyProgressUpdated: boolean;
}
```

---

## 지도 라이브러리 선택

### 추천 라이브러리

#### 1. **Mapbox GL JS** (추천)

**장점:**
- 성능이 뛰어남 (WebGL 기반)
- 스타일 커스터마이징이 자유로움
- 실시간 경로 업데이트에 최적화
- React Native와도 호환 가능

**단점:**
- 무료 플랜 제한 있음 (월 50,000 로드)
- 학습 곡선이 있음

**설치:**
```bash
npm install mapbox-gl
npm install @types/mapbox-gl -D
```

**기본 설정:**
```typescript
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN';
```

#### 2. **Google Maps API**

**장점:**
- 친숙한 UI/UX
- 풍부한 문서와 예제
- 한국 지도 데이터 우수

**단점:**
- 비용이 높음
- 커스터마이징 제한적

#### 3. **Leaflet** (오픈소스 대안)

**장점:**
- 완전 무료
- 가볍고 간단함
- 플러그인 생태계 풍부

**단점:**
- 대량 데이터 처리 시 성능 저하
- 실시간 업데이트에 최적화되지 않음

### 권장: Mapbox GL JS
여정러닝의 요구사항(실시간 추적, 긴 경로 렌더링, 부드러운 애니메이션)을 고려할 때 **Mapbox GL JS**를 추천합니다.

---

## 데이터 모델 설계

### TypeScript 인터페이스

```typescript
// 여정 경로 포인트
interface JourneyRoutePoint {
  id: number;
  latitude: number;
  longitude: number;
  sequence: number;
  altitude?: number;
  description?: string;
}

// 여정 정보
interface Journey {
  id: number;
  title: string;
  description: string;
  thumbnailUrl: string;
  totalDistanceKm: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  category: 'DOMESTIC' | 'INTERNATIONAL';
  estimatedDays: number;
  isActive: boolean;
}

// 랜드마크
interface Landmark {
  id: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  distanceFromStart: number;
  orderIndex: number;
  imageUrl: string;
  countryCode: string;
  cityName: string;
}

// 사용자 진행률
interface UserJourneyProgress {
  progressId: number;
  currentDistanceKm: number;
  progressPercent: number;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  nextLandmark: Landmark | null;
  collectedStamps: number;
  totalLandmarks: number;
}

// 러닝 경로 포인트
interface RunningRoutePoint {
  latitude: number;
  longitude: number;
  sequence: number;
  timestamp: string;
}

// 러닝 세션
interface RunningSession {
  sessionId: string;
  journeyId?: number;
  startTime: Date;
  routes: RunningRoutePoint[];
  currentDistance: number;
  currentPace: number;
  currentSpeed: number;
  status: 'RUNNING' | 'PAUSED' | 'COMPLETED';
}
```

---

## 컴포넌트 구조 설계

### 1. 전체 구조

```
src/
├── components/
│   ├── map/
│   │   ├── JourneyMap/
│   │   │   ├── JourneyMap.tsx              // 여정 경로 표시 지도
│   │   │   ├── JourneyMap.styles.ts
│   │   │   └── useJourneyMap.ts            // 지도 로직 Hook
│   │   ├── RunningMap/
│   │   │   ├── RunningMap.tsx              // 실시간 러닝 지도
│   │   │   ├── RunningMap.styles.ts
│   │   │   └── useRunningMap.ts
│   │   ├── ProgressMap/
│   │   │   ├── ProgressMap.tsx             // 진행률 표시 지도
│   │   │   ├── ProgressMap.styles.ts
│   │   │   └── useProgressMap.ts
│   │   └── shared/
│   │       ├── MapContainer.tsx            // 공통 지도 컨테이너
│   │       ├── LandmarkMarker.tsx          // 랜드마크 마커
│   │       ├── RouteLayer.tsx              // 경로 레이어
│   │       ├── UserLocationMarker.tsx      // 사용자 위치 마커
│   │       └── MapControls.tsx             // 지도 컨트롤
│   └── journey/
│       ├── JourneyDetail/
│       ├── JourneyProgress/
│       └── LandmarkCard/
├── hooks/
│   ├── useGeolocation.ts                   // 위치 추적 Hook
│   ├── useJourneyRoutes.ts                 // 여정 경로 데이터 Hook
│   ├── useRunningTracker.ts                // 러닝 추적 Hook
│   └── useMapAnimation.ts                  // 지도 애니메이션 Hook
├── services/
│   ├── api/
│   │   ├── journeyApi.ts
│   │   ├── runningApi.ts
│   │   └── landmarkApi.ts
│   ├── map/
│   │   ├── mapboxService.ts                // Mapbox 서비스
│   │   ├── routeRenderer.ts                // 경로 렌더링 로직
│   │   ├── markerManager.ts                // 마커 관리
│   │   └── animationService.ts             // 애니메이션 로직
│   └── storage/
│       └── routeCache.ts                   // 경로 캐싱
├── store/
│   ├── journeyStore.ts                     // 여정 상태 관리
│   ├── runningStore.ts                     // 러닝 상태 관리
│   └── mapStore.ts                         // 지도 상태 관리
└── utils/
    ├── geoCalculations.ts                  // 지리 계산 유틸
    ├── routeSimplification.ts              // 경로 단순화
    └── constants.ts                        // 상수
```

### 2. 핵심 컴포넌트 설계

#### MapContainer (공통 컨테이너)

```typescript
// components/map/shared/MapContainer.tsx
import React, { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

interface MapContainerProps {
  initialCenter?: [number, number];  // [longitude, latitude]
  initialZoom?: number;
  onMapLoad?: (map: mapboxgl.Map) => void;
  children?: React.ReactNode;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  initialCenter = [126.9780, 37.5665],  // 서울 기본값
  initialZoom = 12,
  onMapLoad,
  children
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN!;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialCenter,
      zoom: initialZoom,
      pitch: 0,
      bearing: 0
    });

    mapRef.current.on('load', () => {
      if (mapRef.current && onMapLoad) {
        onMapLoad(mapRef.current);
      }
    });

    // 컨트롤 추가
    mapRef.current.addControl(new mapboxgl.NavigationControl());
    mapRef.current.addControl(new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true
    }));

    return () => {
      mapRef.current?.remove();
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      {children}
    </div>
  );
};
```

#### JourneyMap (여정 경로 표시)

```typescript
// components/map/JourneyMap/JourneyMap.tsx
import React, { useEffect } from 'react';
import { MapContainer } from '../shared/MapContainer';
import { useJourneyMap } from './useJourneyMap';
import { LandmarkMarker } from '../shared/LandmarkMarker';

interface JourneyMapProps {
  journeyId: number;
  showLandmarks?: boolean;
  showProgress?: boolean;
  userId?: number;
}

export const JourneyMap: React.FC<JourneyMapProps> = ({
  journeyId,
  showLandmarks = true,
  showProgress = false,
  userId
}) => {
  const {
    map,
    routes,
    landmarks,
    progress,
    isLoading,
    handleMapLoad,
    fitBounds
  } = useJourneyMap(journeyId, userId);

  useEffect(() => {
    if (routes.length > 0) {
      fitBounds();
    }
  }, [routes, fitBounds]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <MapContainer onMapLoad={handleMapLoad}>
        {isLoading && <LoadingOverlay />}
      </MapContainer>

      {showLandmarks && landmarks.map(landmark => (
        <LandmarkMarker
          key={landmark.id}
          landmark={landmark}
          isReached={progress ?
            progress.currentDistanceKm >= landmark.distanceFromStart :
            false}
        />
      ))}
    </div>
  );
};
```

#### RunningMap (실시간 러닝 추적)

```typescript
// components/map/RunningMap/RunningMap.tsx
import React, { useEffect } from 'react';
import { MapContainer } from '../shared/MapContainer';
import { useRunningMap } from './useRunningMap';
import { UserLocationMarker } from '../shared/UserLocationMarker';

interface RunningMapProps {
  sessionId: string;
  journeyId?: number;
  onLocationUpdate?: (location: GeolocationPosition) => void;
}

export const RunningMap: React.FC<RunningMapProps> = ({
  sessionId,
  journeyId,
  onLocationUpdate
}) => {
  const {
    map,
    currentLocation,
    runningRoute,
    journeyRoute,
    handleMapLoad,
    updateLocation,
    isTracking,
    startTracking,
    stopTracking
  } = useRunningMap(sessionId, journeyId);

  useEffect(() => {
    if (currentLocation && onLocationUpdate) {
      onLocationUpdate(currentLocation);
    }
  }, [currentLocation, onLocationUpdate]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <MapContainer onMapLoad={handleMapLoad}>
        {currentLocation && (
          <UserLocationMarker
            latitude={currentLocation.coords.latitude}
            longitude={currentLocation.coords.longitude}
            accuracy={currentLocation.coords.accuracy}
          />
        )}

        <RunningControls
          isTracking={isTracking}
          onStart={startTracking}
          onStop={stopTracking}
        />
      </MapContainer>
    </div>
  );
};
```

---

## 핵심 기능 구현 가이드

### 1. 여정 경로 렌더링

#### Hook: useJourneyMap

```typescript
// components/map/JourneyMap/useJourneyMap.ts
import { useState, useCallback, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { useJourneyRoutes } from '../../../hooks/useJourneyRoutes';
import { useLandmarks } from '../../../hooks/useLandmarks';
import { useUserProgress } from '../../../hooks/useUserProgress';

export const useJourneyMap = (journeyId: number, userId?: number) => {
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const routeLayerIdRef = useRef<string>('journey-route');

  const { routes, isLoading: routesLoading } = useJourneyRoutes(journeyId);
  const { landmarks, isLoading: landmarksLoading } = useLandmarks(journeyId);
  const { progress, isLoading: progressLoading } = useUserProgress(
    userId,
    journeyId
  );

  // 지도 로드 핸들러
  const handleMapLoad = useCallback((loadedMap: mapboxgl.Map) => {
    setMap(loadedMap);

    // 경로 소스 추가
    if (!loadedMap.getSource('journey-route-source')) {
      loadedMap.addSource('journey-route-source', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: []
          }
        }
      });
    }

    // 경로 레이어 추가
    if (!loadedMap.getLayer(routeLayerIdRef.current)) {
      loadedMap.addLayer({
        id: routeLayerIdRef.current,
        type: 'line',
        source: 'journey-route-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3887be',
          'line-width': 5,
          'line-opacity': 0.8
        }
      });
    }
  }, []);

  // 경로 데이터 업데이트
  useEffect(() => {
    if (!map || routes.length === 0) return;

    const coordinates = routes.map(route => [
      route.longitude,
      route.latitude
    ]);

    const source = map.getSource('journey-route-source') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates
        }
      });
    }
  }, [map, routes]);

  // 진행률에 따른 경로 색상 업데이트
  useEffect(() => {
    if (!map || !progress || routes.length === 0) return;

    const completedDistance = progress.currentDistanceKm;
    const totalDistance = routes[routes.length - 1].sequence;
    const completedIndex = Math.floor(
      (completedDistance / totalDistance) * routes.length
    );

    // 완료된 경로와 남은 경로를 다른 색상으로 표시
    addProgressLayers(map, routes, completedIndex);
  }, [map, progress, routes]);

  // 지도 범위 맞추기
  const fitBounds = useCallback(() => {
    if (!map || routes.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    routes.forEach(route => {
      bounds.extend([route.longitude, route.latitude]);
    });

    map.fitBounds(bounds, {
      padding: 50,
      duration: 1000
    });
  }, [map, routes]);

  return {
    map,
    routes,
    landmarks,
    progress,
    isLoading: routesLoading || landmarksLoading || progressLoading,
    handleMapLoad,
    fitBounds
  };
};

// 진행률 레이어 추가 헬퍼 함수
function addProgressLayers(
  map: mapboxgl.Map,
  routes: JourneyRoutePoint[],
  completedIndex: number
) {
  const completedCoordinates = routes
    .slice(0, completedIndex)
    .map(r => [r.longitude, r.latitude]);

  const remainingCoordinates = routes
    .slice(completedIndex)
    .map(r => [r.longitude, r.latitude]);

  // 완료된 경로 레이어
  if (!map.getSource('completed-route')) {
    map.addSource('completed-route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: completedCoordinates
        }
      }
    });

    map.addLayer({
      id: 'completed-route-layer',
      type: 'line',
      source: 'completed-route',
      paint: {
        'line-color': '#22c55e',  // 초록색
        'line-width': 6
      }
    });
  }

  // 남은 경로 레이어
  if (!map.getSource('remaining-route')) {
    map.addSource('remaining-route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: remainingCoordinates
        }
      }
    });

    map.addLayer({
      id: 'remaining-route-layer',
      type: 'line',
      source: 'remaining-route',
      paint: {
        'line-color': '#94a3b8',  // 회색
        'line-width': 5,
        'line-dasharray': [2, 2]
      }
    });
  }
}
```

### 2. 실시간 러닝 추적

#### Hook: useRunningMap

```typescript
// components/map/RunningMap/useRunningMap.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { useGeolocation } from '../../../hooks/useGeolocation';
import { useRunningTracker } from '../../../hooks/useRunningTracker';

export const useRunningMap = (sessionId: string, journeyId?: number) => {
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  const {
    location: currentLocation,
    startTracking: startGeoTracking,
    stopTracking: stopGeoTracking
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
  });

  const {
    runningRoute,
    addRoutePoint,
    clearRoute
  } = useRunningTracker(sessionId);

  const routeCoordinatesRef = useRef<[number, number][]>([]);

  // 지도 로드
  const handleMapLoad = useCallback((loadedMap: mapboxgl.Map) => {
    setMap(loadedMap);

    // 러닝 경로 소스 추가
    loadedMap.addSource('running-route-source', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: []
        }
      }
    });

    // 러닝 경로 레이어 추가
    loadedMap.addLayer({
      id: 'running-route-layer',
      type: 'line',
      source: 'running-route-source',
      paint: {
        'line-color': '#f59e0b',  // 주황색
        'line-width': 6,
        'line-opacity': 0.9
      }
    });

    // 경로 외곽선 레이어
    loadedMap.addLayer({
      id: 'running-route-outline',
      type: 'line',
      source: 'running-route-source',
      paint: {
        'line-color': '#ffffff',
        'line-width': 8,
        'line-opacity': 0.5
      }
    }, 'running-route-layer');
  }, []);

  // 위치 업데이트 시 경로 추가
  useEffect(() => {
    if (!currentLocation || !isTracking) return;

    const { latitude, longitude } = currentLocation.coords;

    // 경로에 추가
    routeCoordinatesRef.current.push([longitude, latitude]);

    // 백엔드에 전송할 포인트 추가
    addRoutePoint({
      latitude,
      longitude,
      sequence: routeCoordinatesRef.current.length,
      timestamp: new Date().toISOString()
    });

    // 지도 업데이트
    updateRunningRoute();

    // 지도 중심을 현재 위치로 이동
    map?.flyTo({
      center: [longitude, latitude],
      duration: 500
    });
  }, [currentLocation, isTracking, map, addRoutePoint]);

  // 러닝 경로 지도 업데이트
  const updateRunningRoute = useCallback(() => {
    if (!map) return;

    const source = map.getSource('running-route-source') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: routeCoordinatesRef.current
        }
      });
    }
  }, [map]);

  // 추적 시작
  const startTracking = useCallback(() => {
    setIsTracking(true);
    startGeoTracking();
    routeCoordinatesRef.current = [];
  }, [startGeoTracking]);

  // 추적 중지
  const stopTracking = useCallback(() => {
    setIsTracking(false);
    stopGeoTracking();
  }, [stopGeoTracking]);

  return {
    map,
    currentLocation,
    runningRoute,
    handleMapLoad,
    isTracking,
    startTracking,
    stopTracking,
    updateLocation: updateRunningRoute
  };
};
```

#### Hook: useGeolocation

```typescript
// hooks/useGeolocation.ts
import { useState, useEffect, useCallback } from 'react';

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export const useGeolocation = (options: GeolocationOptions = {}) => {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: 'Geolocation is not supported',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3
      } as GeolocationPositionError);
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        setLocation(position);
        setError(null);
      },
      (err) => {
        setError(err);
      },
      {
        enableHighAccuracy: options.enableHighAccuracy ?? true,
        timeout: options.timeout ?? 5000,
        maximumAge: options.maximumAge ?? 0
      }
    );

    setWatchId(id);
    setIsTracking(true);
  }, [options]);

  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsTracking(false);
    }
  }, [watchId]);

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return {
    location,
    error,
    isTracking,
    startTracking,
    stopTracking
  };
};
```

### 3. 랜드마크 마커 렌더링

```typescript
// components/map/shared/LandmarkMarker.tsx
import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { Landmark } from '../../../types/journey';

interface LandmarkMarkerProps {
  landmark: Landmark;
  map: mapboxgl.Map;
  isReached?: boolean;
  onClick?: (landmark: Landmark) => void;
}

export const LandmarkMarker: React.FC<LandmarkMarkerProps> = ({
  landmark,
  map,
  isReached = false,
  onClick
}) => {
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!map) return;

    // 마커 요소 생성
    const el = document.createElement('div');
    el.className = 'landmark-marker';
    el.style.width = '40px';
    el.style.height = '40px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = isReached ? '#22c55e' : '#3b82f6';
    el.style.border = '3px solid white';
    el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    el.style.cursor = 'pointer';
    el.style.backgroundImage = landmark.imageUrl ?
      `url(${landmark.imageUrl})` :
      'none';
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';

    // 아이콘 추가 (이미지가 없는 경우)
    if (!landmark.imageUrl) {
      el.innerHTML = `
        <svg viewBox="0 0 24 24" fill="white" width="24" height="24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        </svg>
      `;
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
    }

    // 클릭 이벤트
    el.addEventListener('click', () => {
      if (onClick) onClick(landmark);
    });

    // 마커 생성
    const marker = new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat([landmark.longitude, landmark.latitude])
      .addTo(map);

    // 팝업 추가
    const popup = new mapboxgl.Popup({
      offset: 25,
      closeButton: false
    }).setHTML(`
      <div style="padding: 8px;">
        <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">
          ${landmark.name}
        </h3>
        <p style="margin: 0; font-size: 12px; color: #666;">
          ${landmark.distanceFromStart.toFixed(1)} km
        </p>
      </div>
    `);

    marker.setPopup(popup);
    markerRef.current = marker;

    return () => {
      marker.remove();
    };
  }, [map, landmark, isReached, onClick]);

  return null;
};
```

### 4. 경로 데이터 페칭 및 캐싱

```typescript
// hooks/useJourneyRoutes.ts
import { useState, useEffect, useCallback } from 'react';
import { JourneyRoutePoint } from '../types/journey';
import { journeyApi } from '../services/api/journeyApi';
import { routeCache } from '../services/storage/routeCache';

export const useJourneyRoutes = (journeyId: number) => {
  const [routes, setRoutes] = useState<JourneyRoutePoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 경로 데이터 로드
  const loadRoutes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 캐시 확인
      const cachedRoutes = routeCache.get(journeyId);
      if (cachedRoutes) {
        setRoutes(cachedRoutes);
        setIsLoading(false);
        return;
      }

      // 통계 먼저 조회하여 데이터 크기 확인
      const stats = await journeyApi.getRouteStatistics(journeyId);

      let allRoutes: JourneyRoutePoint[] = [];

      if (stats.totalRoutePoints <= 1000) {
        // 포인트가 적으면 한 번에 조회
        allRoutes = await journeyApi.getAllRoutes(journeyId);
      } else {
        // 포인트가 많으면 페이징으로 조회
        const pageSize = 500;
        const totalPages = Math.ceil(stats.totalRoutePoints / pageSize);

        for (let page = 0; page < totalPages; page++) {
          const pageData = await journeyApi.getRoutes(journeyId, {
            page,
            size: pageSize
          });
          allRoutes = [...allRoutes, ...pageData.content];
        }
      }

      // 경로 단순화 (선택적)
      const simplifiedRoutes = simplifyRoute(allRoutes, 0.0001);

      // 캐시에 저장
      routeCache.set(journeyId, simplifiedRoutes);

      setRoutes(simplifiedRoutes);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [journeyId]);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  return {
    routes,
    isLoading,
    error,
    reload: loadRoutes
  };
};

// 경로 단순화 (Douglas-Peucker 알고리즘)
function simplifyRoute(
  points: JourneyRoutePoint[],
  tolerance: number
): JourneyRoutePoint[] {
  // 포인트가 적으면 그대로 반환
  if (points.length <= 100) return points;

  // 단순화 로직 구현
  // ... (Douglas-Peucker 알고리즘 또는 Ramer-Douglas-Peucker)

  return points;  // 임시
}
```

```typescript
// services/storage/routeCache.ts
import { JourneyRoutePoint } from '../../types/journey';

class RouteCache {
  private cache = new Map<number, JourneyRoutePoint[]>();
  private timestamps = new Map<number, number>();
  private readonly MAX_AGE = 1000 * 60 * 60; // 1시간

  get(journeyId: number): JourneyRoutePoint[] | null {
    const timestamp = this.timestamps.get(journeyId);

    // 캐시 만료 확인
    if (timestamp && Date.now() - timestamp > this.MAX_AGE) {
      this.delete(journeyId);
      return null;
    }

    return this.cache.get(journeyId) || null;
  }

  set(journeyId: number, routes: JourneyRoutePoint[]): void {
    this.cache.set(journeyId, routes);
    this.timestamps.set(journeyId, Date.now());
  }

  delete(journeyId: number): void {
    this.cache.delete(journeyId);
    this.timestamps.delete(journeyId);
  }

  clear(): void {
    this.cache.clear();
    this.timestamps.clear();
  }
}

export const routeCache = new RouteCache();
```

---

## 성능 최적화 전략

### 1. 경로 데이터 최적화

#### 경로 단순화 (Douglas-Peucker 알고리즘)

```typescript
// utils/routeSimplification.ts
import { JourneyRoutePoint } from '../types/journey';

/**
 * Douglas-Peucker 알고리즘을 사용한 경로 단순화
 * @param points 원본 경로 포인트
 * @param tolerance 허용 오차 (도 단위, 기본값 0.0001 ≈ 11m)
 */
export function simplifyRoute(
  points: JourneyRoutePoint[],
  tolerance: number = 0.0001
): JourneyRoutePoint[] {
  if (points.length <= 2) return points;

  // 시작점과 끝점 사이의 선분을 기준으로
  const start = points[0];
  const end = points[points.length - 1];

  let maxDistance = 0;
  let maxIndex = 0;

  // 각 포인트와 선분 사이의 수직 거리 계산
  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(
      points[i],
      start,
      end
    );

    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }

  // 최대 거리가 허용 오차보다 크면 재귀적으로 분할
  if (maxDistance > tolerance) {
    const left = simplifyRoute(points.slice(0, maxIndex + 1), tolerance);
    const right = simplifyRoute(points.slice(maxIndex), tolerance);

    // 중복 제거하고 합치기
    return [...left.slice(0, -1), ...right];
  }

  // 허용 오차 이내면 시작점과 끝점만 반환
  return [start, end];
}

// 점과 선분 사이의 수직 거리 계산
function perpendicularDistance(
  point: JourneyRoutePoint,
  lineStart: JourneyRoutePoint,
  lineEnd: JourneyRoutePoint
): number {
  const x = point.latitude;
  const y = point.longitude;
  const x1 = lineStart.latitude;
  const y1 = lineStart.longitude;
  const x2 = lineEnd.latitude;
  const y2 = lineEnd.longitude;

  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = x - xx;
  const dy = y - yy;

  return Math.sqrt(dx * dx + dy * dy);
}
```

#### 적응형 로딩 (Adaptive Loading)

```typescript
// hooks/useAdaptiveRouteLoading.ts
import { useState, useEffect } from 'react';
import { JourneyRoutePoint } from '../types/journey';
import { journeyApi } from '../services/api/journeyApi';

/**
 * 줌 레벨에 따라 적절한 상세도의 경로를 로드
 */
export const useAdaptiveRouteLoading = (
  journeyId: number,
  currentZoom: number
) => {
  const [routes, setRoutes] = useState<JourneyRoutePoint[]>([]);

  useEffect(() => {
    const loadRoutes = async () => {
      let tolerance = 0.001;  // 기본 단순화 수준

      if (currentZoom < 10) {
        // 낮은 줌: 매우 단순화
        tolerance = 0.01;
      } else if (currentZoom < 14) {
        // 중간 줌: 보통 단순화
        tolerance = 0.001;
      } else {
        // 높은 줌: 상세한 경로
        tolerance = 0.0001;
      }

      const allRoutes = await journeyApi.getAllRoutes(journeyId);
      const simplified = simplifyRoute(allRoutes, tolerance);
      setRoutes(simplified);
    };

    loadRoutes();
  }, [journeyId, currentZoom]);

  return routes;
};
```

### 2. 렌더링 최적화

#### Virtual Markers (많은 랜드마크 처리)

```typescript
// hooks/useVirtualMarkers.ts
import { useState, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { Landmark } from '../types/journey';

/**
 * 뷰포트 내의 랜드마크만 렌더링
 */
export const useVirtualMarkers = (
  map: mapboxgl.Map | null,
  landmarks: Landmark[]
) => {
  const [visibleLandmarks, setVisibleLandmarks] = useState<Landmark[]>([]);

  useEffect(() => {
    if (!map) return;

    const updateVisibleLandmarks = () => {
      const bounds = map.getBounds();

      const visible = landmarks.filter(landmark => {
        return bounds.contains([landmark.longitude, landmark.latitude]);
      });

      setVisibleLandmarks(visible);
    };

    // 초기 로드
    updateVisibleLandmarks();

    // 지도 이동/줌 시 업데이트
    map.on('moveend', updateVisibleLandmarks);
    map.on('zoomend', updateVisibleLandmarks);

    return () => {
      map.off('moveend', updateVisibleLandmarks);
      map.off('zoomend', updateVisibleLandmarks);
    };
  }, [map, landmarks]);

  return visibleLandmarks;
};
```

### 3. 메모이제이션

```typescript
// components/map/JourneyMap/JourneyMap.tsx
import React, { useMemo } from 'react';

export const JourneyMap: React.FC<JourneyMapProps> = ({
  journeyId,
  showLandmarks,
  userId
}) => {
  const {
    map,
    routes,
    landmarks,
    progress
  } = useJourneyMap(journeyId, userId);

  // 가시 랜드마크만 메모이제이션
  const visibleLandmarks = useVirtualMarkers(map, landmarks);

  // 랜드마크 마커들 메모이제이션
  const landmarkMarkers = useMemo(() => {
    if (!showLandmarks || !map) return null;

    return visibleLandmarks.map(landmark => (
      <LandmarkMarker
        key={landmark.id}
        landmark={landmark}
        map={map}
        isReached={
          progress ?
          progress.currentDistanceKm >= landmark.distanceFromStart :
          false
        }
      />
    ));
  }, [showLandmarks, map, visibleLandmarks, progress]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <MapContainer onMapLoad={handleMapLoad}>
        {landmarkMarkers}
      </MapContainer>
    </div>
  );
};
```

---

## 상태 관리 전략

### Zustand를 활용한 상태 관리

#### 설치
```bash
npm install zustand
```

#### 러닝 상태 관리

```typescript
// store/runningStore.ts
import create from 'zustand';
import { RunningSession, RunningRoutePoint } from '../types/running';

interface RunningState {
  session: RunningSession | null;
  isRunning: boolean;
  isPaused: boolean;

  // Actions
  startRunning: (journeyId?: number) => void;
  pauseRunning: () => void;
  resumeRunning: () => void;
  completeRunning: () => Promise<void>;
  addRoutePoint: (point: RunningRoutePoint) => void;
  updateStats: (distance: number, pace: number, speed: number) => void;
}

export const useRunningStore = create<RunningState>((set, get) => ({
  session: null,
  isRunning: false,
  isPaused: false,

  startRunning: (journeyId) => {
    const sessionId = `session-${Date.now()}`;

    set({
      session: {
        sessionId,
        journeyId,
        startTime: new Date(),
        routes: [],
        currentDistance: 0,
        currentPace: 0,
        currentSpeed: 0,
        status: 'RUNNING'
      },
      isRunning: true,
      isPaused: false
    });
  },

  pauseRunning: () => {
    set(state => ({
      isPaused: true,
      session: state.session ? {
        ...state.session,
        status: 'PAUSED'
      } : null
    }));
  },

  resumeRunning: () => {
    set(state => ({
      isPaused: false,
      session: state.session ? {
        ...state.session,
        status: 'RUNNING'
      } : null
    }));
  },

  completeRunning: async () => {
    const { session } = get();
    if (!session) return;

    // 백엔드에 완료 요청
    await runningApi.complete(session);

    set({
      session: null,
      isRunning: false,
      isPaused: false
    });
  },

  addRoutePoint: (point) => {
    set(state => {
      if (!state.session) return state;

      return {
        session: {
          ...state.session,
          routes: [...state.session.routes, point]
        }
      };
    });
  },

  updateStats: (distance, pace, speed) => {
    set(state => {
      if (!state.session) return state;

      return {
        session: {
          ...state.session,
          currentDistance: distance,
          currentPace: pace,
          currentSpeed: speed
        }
      };
    });
  }
}));
```

#### 지도 상태 관리

```typescript
// store/mapStore.ts
import create from 'zustand';
import mapboxgl from 'mapbox-gl';

interface MapState {
  map: mapboxgl.Map | null;
  center: [number, number];
  zoom: number;

  // Actions
  setMap: (map: mapboxgl.Map) => void;
  updateView: (center: [number, number], zoom: number) => void;
  flyTo: (center: [number, number], zoom?: number) => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  map: null,
  center: [126.9780, 37.5665],
  zoom: 12,

  setMap: (map) => {
    set({ map });
  },

  updateView: (center, zoom) => {
    set({ center, zoom });
  },

  flyTo: (center, zoom) => {
    const { map } = get();
    if (!map) return;

    map.flyTo({
      center,
      zoom: zoom ?? get().zoom,
      duration: 1500
    });

    set({ center, zoom: zoom ?? get().zoom });
  }
}));
```

---

## 실시간 러닝 추적 구현

### 완전한 러닝 추적 플로우

```typescript
// pages/RunningPage.tsx
import React, { useEffect, useState } from 'react';
import { RunningMap } from '../components/map/RunningMap/RunningMap';
import { useRunningStore } from '../store/runningStore';
import { runningApi } from '../services/api/runningApi';

export const RunningPage: React.FC = () => {
  const {
    session,
    isRunning,
    isPaused,
    startRunning,
    pauseRunning,
    resumeRunning,
    completeRunning,
    addRoutePoint,
    updateStats
  } = useRunningStore();

  const [stats, setStats] = useState({
    distance: 0,
    duration: 0,
    pace: 0,
    speed: 0
  });

  // 러닝 시작 핸들러
  const handleStart = async () => {
    const journeyId = 1;  // 예시
    startRunning(journeyId);

    // 백엔드에 시작 알림
    await runningApi.start({
      journeyId,
      startTime: new Date().toISOString()
    });
  };

  // 위치 업데이트 핸들러
  const handleLocationUpdate = async (location: GeolocationPosition) => {
    if (!session || isPaused) return;

    const point: RunningRoutePoint = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      sequence: session.routes.length + 1,
      timestamp: new Date().toISOString()
    };

    addRoutePoint(point);

    // 거리 계산 (이전 포인트와의 거리)
    if (session.routes.length > 0) {
      const prevPoint = session.routes[session.routes.length - 1];
      const distance = calculateDistance(
        prevPoint.latitude,
        prevPoint.longitude,
        point.latitude,
        point.longitude
      );

      const newTotalDistance = session.currentDistance + distance;
      updateStats(newTotalDistance, 0, 0);  // pace, speed는 별도 계산

      // 주기적으로 백엔드에 업데이트 (10초마다)
      if (session.routes.length % 10 === 0) {
        await runningApi.update({
          sessionId: session.sessionId,
          routes: session.routes,
          currentDistance: newTotalDistance,
          currentPace: 0,
          currentSpeed: 0
        });
      }
    }
  };

  // 러닝 완료 핸들러
  const handleComplete = async () => {
    if (!session) return;

    try {
      const result = await completeRunning();
      // 결과 페이지로 이동
      // navigate(`/running/result/${result.recordId}`);
    } catch (error) {
      console.error('러닝 완료 실패:', error);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 상단 통계 */}
      <div style={{ padding: '16px', backgroundColor: '#f8f9fa' }}>
        <div>거리: {(stats.distance / 1000).toFixed(2)} km</div>
        <div>시간: {formatDuration(stats.duration)}</div>
        <div>페이스: {stats.pace.toFixed(2)} min/km</div>
      </div>

      {/* 지도 */}
      <div style={{ flex: 1 }}>
        {session && (
          <RunningMap
            sessionId={session.sessionId}
            journeyId={session.journeyId}
            onLocationUpdate={handleLocationUpdate}
          />
        )}
      </div>

      {/* 하단 컨트롤 */}
      <div style={{ padding: '16px', backgroundColor: '#ffffff' }}>
        {!isRunning && (
          <button onClick={handleStart}>시작</button>
        )}
        {isRunning && !isPaused && (
          <>
            <button onClick={pauseRunning}>일시정지</button>
            <button onClick={handleComplete}>완료</button>
          </>
        )}
        {isRunning && isPaused && (
          <button onClick={resumeRunning}>재개</button>
        )}
      </div>
    </div>
  );
};

// 두 좌표 간 거리 계산 (Haversine formula)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // 지구 반지름 (미터)
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // 미터 단위
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
```

---

## UI/UX 권장사항

### 1. 여정 선택 화면

- 지도에 여정 경로 미리보기 표시
- 랜드마크 개수, 총 거리, 예상 완주 기간 표시
- 썸네일 이미지로 여정의 특징 강조

### 2. 여정 진행 화면

- 전체 경로와 현재 위치를 동시에 보여주기
- 완료한 구간은 초록색, 남은 구간은 회색으로 구분
- 다음 랜드마크까지 남은 거리 표시
- 진행률 바 (0-100%)

### 3. 실시간 러닝 화면

- 사용자 위치를 항상 화면 중앙에 유지
- 현재 러닝 경로는 진한 색상으로 강조
- 거리, 시간, 페이스를 실시간으로 업데이트
- 일시정지 시 지도 조작 가능하게

### 4. 랜드마크 도달 시

- 애니메이션 효과로 랜드마크 강조
- 스탬프 획득 모달 표시
- 랜드마크 정보 (이름, 설명, 사진) 제공
- 소셜 공유 기능

### 5. 완주 후

- 전체 경로를 다시 보여주며 통계 표시
- 수집한 스탬프 목록
- 소요 시간, 평균 페이스 등
- 공유 기능

---

## 추가 권장사항

### 1. 오프라인 지원

```typescript
// 경로 데이터를 로컬 스토리지에 저장
import localforage from 'localforage';

export const saveRouteOffline = async (
  journeyId: number,
  routes: JourneyRoutePoint[]
) => {
  await localforage.setItem(`journey-route-${journeyId}`, routes);
};

export const loadRouteOffline = async (
  journeyId: number
): Promise<JourneyRoutePoint[] | null> => {
  return await localforage.getItem(`journey-route-${journeyId}`);
};
```

### 2. Progressive Web App (PWA)

- Service Worker로 오프라인 지원
- 백그라운드에서도 위치 추적 가능

### 3. 배터리 최적화

- GPS 정확도를 상황에 맞게 조절
- 위치 업데이트 빈도 최적화 (5-10초 간격)
- 화면이 꺼져도 추적 계속 (백그라운드 모드)

### 4. 에러 처리

```typescript
// GPS 신호 약할 때
if (location.coords.accuracy > 50) {
  showWarning('GPS 신호가 약합니다. 실내에서 벗어나주세요.');
}

// 네트워크 끊겼을 때
try {
  await runningApi.update(data);
} catch (error) {
  // 로컬에 저장해두었다가 나중에 동기화
  saveToLocalQueue(data);
}
```

### 5. 테스트

```typescript
// 개발 환경에서 경로 시뮬레이션
export const simulateRunning = (
  routes: JourneyRoutePoint[],
  speed: number = 10  // km/h
) => {
  let currentIndex = 0;

  const interval = setInterval(() => {
    if (currentIndex >= routes.length) {
      clearInterval(interval);
      return;
    }

    const point = routes[currentIndex];
    // 위치 업데이트 시뮬레이션
    onLocationUpdate({
      coords: {
        latitude: point.latitude,
        longitude: point.longitude,
        accuracy: 10
      },
      timestamp: Date.now()
    } as GeolocationPosition);

    currentIndex++;
  }, 1000);  // 1초마다
};
```

---

## 요약

1. **Mapbox GL JS** 사용 권장
2. **컴포넌트 분리**: JourneyMap, RunningMap, ProgressMap
3. **상태 관리**: Zustand로 러닝 세션, 지도 상태 관리
4. **성능 최적화**:
   - 경로 단순화 (Douglas-Peucker)
   - 적응형 로딩 (줌 레벨에 따라)
   - Virtual Markers (뷰포트 내만 렌더링)
   - 데이터 캐싱
5. **실시간 추적**:
   - Geolocation API의 `watchPosition` 사용
   - 주기적으로 백엔드에 업데이트
   - 로컬에 데이터 저장 후 동기화
6. **UX 고려사항**:
   - 오프라인 지원
   - 배터리 최적화
   - 에러 처리
   - 애니메이션 효과

이 가이드를 따라 구현하면 안정적이고 성능 좋은 여정러닝 지도 기능을 완성할 수 있습니다.
