# 여정 러닝 경로 데이터 입력 가이드

## 📋 목차
1. [개요](#개요)
2. [데이터 구조 이해](#데이터-구조-이해)
3. [경로 데이터 준비 방법](#경로-데이터-준비-방법)
4. [데이터 입력 방법](#데이터-입력-방법)
5. [검증 및 테스트](#검증-및-테스트)

---

## 개요

여정 러닝 시스템에서는 각 여정(Journey)마다 **미리 정의된 경로(Route)**를 제공합니다.
사용자가 지도에서 정확한 경로를 보고 따라갈 수 있도록 위도/경도 좌표 데이터를 저장해야 합니다.

### 필요한 데이터
- **Journey**: 여정 기본 정보 (이름, 설명, 총 거리 등)
- **JourneyRoute**: 경로 좌표 데이터 (위도, 경도, 순서)
- **Landmark**: 경로 상의 주요 지점

---

## 데이터 구조 이해

### 1. JourneyEntity (여정)
```java
- id: 여정 ID
- name: "한강 러닝 코스"
- description: "한강을 따라 달리는 코스"
- totalDistanceKm: 10.5
- category: DOMESTIC
```

### 2. JourneyRouteEntity (경로 좌표)
```java
- id: 자동 생성
- journey: Journey 엔티티 (외래키)
- latitude: 37.5665 (위도)
- longitude: 126.9780 (경도)
- sequence: 1 (순서 - 중요!)
- altitude: 120.5 (고도 - 선택)
- description: "한강대교 진입" (구간 설명 - 선택)
```

### 3. 데이터 관계
```
Journey (1) ─── (N) JourneyRoute
   │
   └─── (N) Landmark
```

---

## 경로 데이터 준비 방법

### 방법 1: Google Maps에서 추출 (권장 ⭐)

#### 단계별 가이드:

1. **Google Maps에서 경로 그리기**
   - https://www.google.com/maps 접속
   - "경로" 클릭
   - 출발지/도착지 입력
   - 도보 모드 선택

2. **경로 URL 복사**
   ```
   예시: https://www.google.com/maps/dir/37.5665,126.9780/37.5512,126.9882
   ```

3. **좌표 추출 도구 사용**
   - Chrome 확장 프로그램: "GPX Extractor"
   - 또는 개발자 도구로 네트워크 탭에서 API 응답 확인

4. **좌표 데이터 정리**
   ```json
   [
     {"lat": 37.5665, "lng": 126.9780, "seq": 1},
     {"lat": 37.5670, "lng": 126.9785, "seq": 2},
     {"lat": 37.5675, "lng": 126.9790, "seq": 3},
     ...
   ]
   ```

### 방법 2: GPX 파일 활용

1. **GPX 파일 생성**
   - Strava, 나이키런클럽 등 러닝 앱에서 GPX 내보내기
   - 또는 https://gpx.studio 에서 직접 그리기

2. **GPX 파싱**
   ```xml
   <trkpt lat="37.5665" lon="126.9780">
     <ele>120.5</ele>
   </trkpt>
   ```

3. **좌표 추출 스크립트 (Python 예시)**
   ```python
   import gpxpy

   with open('route.gpx', 'r') as f:
       gpx = gpxpy.parse(f)

   coords = []
   for track in gpx.tracks:
       for segment in track.segments:
           for i, point in enumerate(segment.points):
               coords.append({
                   'latitude': point.latitude,
                   'longitude': point.longitude,
                   'sequence': i + 1,
                   'altitude': point.elevation
               })
   ```

### 방법 3: 실제 러닝 기록 활용

1. **러닝 앱에서 기록 내보내기**
   - Strava → Export GPX
   - 나이키런클럽 → Export

2. **좌표 샘플링**
   - 너무 많은 포인트는 샘플링 (예: 50m마다 1개)
   - 직선 구간은 포인트 줄이기
   - 꺾이는 부분은 포인트 유지

---

## 데이터 입력 방법

### 옵션 1: SQL 직접 입력 (소량 데이터)

```sql
-- 1. Journey 먼저 생성
INSERT INTO journeys (
    name,
    description,
    total_distance_km,
    category,
    difficulty,
    estimated_duration_hours,
    thumbnail_url,
    created_at,
    updated_at
) VALUES (
    '한강 러닝 코스',
    '한강을 따라 달리는 아름다운 코스',
    10.5,
    'DOMESTIC',
    'MEDIUM',
    2.0,
    'https://example.com/hangang.jpg',
    NOW(),
    NOW()
);

-- 2. Journey ID 확인 (예: 1)
SELECT LAST_INSERT_ID();

-- 3. JourneyRoute 데이터 입력
INSERT INTO journey_routes (journey_id, latitude, longitude, sequence, altitude, created_at, updated_at)
VALUES
    (1, 37.5665, 126.9780, 1, 120.5, NOW(), NOW()),
    (1, 37.5670, 126.9785, 2, 121.0, NOW(), NOW()),
    (1, 37.5675, 126.9790, 3, 121.5, NOW(), NOW()),
    (1, 37.5680, 126.9795, 4, 122.0, NOW(), NOW());
    -- ... 계속 추가
```

### 옵션 2: CSV 파일로 일괄 입력 (대량 데이터 권장 ⭐)

#### 1) CSV 파일 준비
**journey_routes.csv**
```csv
journey_id,latitude,longitude,sequence,altitude,description
1,37.5665,126.9780,1,120.5,한강대교 진입
1,37.5670,126.9785,2,121.0,
1,37.5675,126.9790,3,121.5,
1,37.5680,126.9795,4,122.0,여의도 공원
```

#### 2) MySQL에서 CSV 로드
```sql
LOAD DATA LOCAL INFILE '/path/to/journey_routes.csv'
INTO TABLE journey_routes
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(journey_id, latitude, longitude, sequence, altitude, description)
SET created_at = NOW(), updated_at = NOW();
```

### 옵션 3: API 엔드포인트 생성 (권장 ⭐)

관리자용 API를 만들어서 JSON으로 입력하는 방법입니다.

#### 1) Controller 추가
```java
@RestController
@RequestMapping("/v1/admin/journey-routes")
public class AdminJourneyRouteController {

    @PostMapping("/bulk-insert")
    public ApiResponse<String> bulkInsertRoutes(
        @RequestParam Long journeyId,
        @RequestBody List<RoutePointRequest> routes
    ) {
        journeyRouteService.bulkInsert(journeyId, routes);
        return ApiResponse.success("경로 데이터 입력 완료");
    }
}
```

#### 2) Request DTO
```java
public record RoutePointRequest(
    Double latitude,
    Double longitude,
    Integer sequence,
    Double altitude,
    String description
) {}
```

#### 3) Postman으로 입력
```json
POST /v1/admin/journey-routes/bulk-insert?journeyId=1

{
  "routes": [
    {
      "latitude": 37.5665,
      "longitude": 126.9780,
      "sequence": 1,
      "altitude": 120.5,
      "description": "한강대교 진입"
    },
    {
      "latitude": 37.5670,
      "longitude": 126.9785,
      "sequence": 2,
      "altitude": 121.0,
      "description": null
    }
  ]
}
```

### 옵션 4: Excel → SQL 변환

#### 1) Excel에서 데이터 정리
| journey_id | latitude | longitude | sequence | altitude | description |
|------------|----------|-----------|----------|----------|-------------|
| 1          | 37.5665  | 126.9780  | 1        | 120.5    | 한강대교 진입 |
| 1          | 37.5670  | 126.9785  | 2        | 121.0    |             |

#### 2) Excel 수식으로 SQL 생성
```excel
=CONCATENATE("(", A2, ", ", B2, ", ", C2, ", ", D2, ", ", E2, ", '", F2, "', NOW(), NOW()),")
```

결과:
```sql
INSERT INTO journey_routes (journey_id, latitude, longitude, sequence, altitude, description, created_at, updated_at)
VALUES
(1, 37.5665, 126.9780, 1, 120.5, '한강대교 진입', NOW(), NOW()),
(1, 37.5670, 126.9785, 2, 121.0, '', NOW(), NOW());
```

---

## 데이터 입력 체크리스트

### 입력 전 확인사항

- [ ] Journey가 먼저 생성되어 있는가?
- [ ] Journey ID를 정확히 알고 있는가?
- [ ] 좌표가 올바른 형식인가? (위도: -90~90, 경도: -180~180)
- [ ] sequence가 1부터 순차적으로 증가하는가?
- [ ] 중복된 sequence가 없는가?

### 데이터 품질 검증

```sql
-- 1. Journey별 경로 포인트 개수 확인
SELECT journey_id, COUNT(*) as point_count
FROM journey_routes
GROUP BY journey_id;

-- 2. sequence 순서 검증 (빠진 번호 확인)
SELECT jr1.journey_id, jr1.sequence + 1 as missing_sequence
FROM journey_routes jr1
LEFT JOIN journey_routes jr2
  ON jr1.journey_id = jr2.journey_id
  AND jr1.sequence + 1 = jr2.sequence
WHERE jr2.sequence IS NULL
  AND jr1.sequence < (SELECT MAX(sequence) FROM journey_routes WHERE journey_id = jr1.journey_id);

-- 3. 좌표 범위 검증
SELECT *
FROM journey_routes
WHERE latitude < -90 OR latitude > 90
   OR longitude < -180 OR longitude > 180;

-- 4. 중복 sequence 확인
SELECT journey_id, sequence, COUNT(*)
FROM journey_routes
GROUP BY journey_id, sequence
HAVING COUNT(*) > 1;
```

---

## 검증 및 테스트

### API로 확인

#### 1) 전체 경로 조회
```bash
GET /v1/journeys/1/routes/all
```

**기대 응답:**
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
    ...
  ]
}
```

#### 2) 경로 통계 확인
```bash
GET /v1/journeys/1/routes/statistics
```

**기대 응답:**
```json
{
  "success": true,
  "data": {
    "totalPoints": 150,
    "minSequence": 1,
    "maxSequence": 150
  }
}
```

#### 3) 구간별 조회 테스트
```bash
GET /v1/journeys/1/routes?from=1&to=10
```

### 시각적 검증

#### Google Maps에 표시해보기
```javascript
// JavaScript 콘솔에서 실행
const routes = [
  {lat: 37.5665, lng: 126.9780},
  {lat: 37.5670, lng: 126.9785},
  // ... API에서 가져온 데이터
];

const map = new google.maps.Map(document.getElementById('map'), {
  zoom: 13,
  center: routes[0]
});

const path = new google.maps.Polyline({
  path: routes,
  geodesic: true,
  strokeColor: '#FF0000',
  strokeOpacity: 1.0,
  strokeWeight: 2
});

path.setMap(map);
```

---

## 권장 입력 프로세스

### 단계별 진행 순서

1. **여정 기본 정보 입력**
   ```sql
   INSERT INTO journeys (...) VALUES (...);
   ```

2. **경로 데이터 준비**
   - Google Maps에서 경로 추출
   - GPX 파일 변환
   - CSV 파일로 정리

3. **데이터 입력**
   - 소량(< 100개): SQL 직접 입력
   - 대량(> 100개): CSV 일괄 입력 또는 API

4. **검증**
   - SQL로 데이터 품질 확인
   - API로 조회 테스트
   - 프론트엔드에서 지도 확인

5. **랜드마크 연결**
   ```sql
   INSERT INTO landmarks (journey_id, name, latitude, longitude, ...)
   VALUES (1, '여의도 공원', 37.5280, 126.9240, ...);
   ```

---

## 실전 예제: 한강 러닝 코스

### 1. Journey 생성
```sql
INSERT INTO journeys (
    name, description, total_distance_km, category,
    difficulty, estimated_duration_hours, thumbnail_url,
    created_at, updated_at
) VALUES (
    '한강 러닝 코스 (여의도 → 반포)',
    '여의도 한강공원부터 반포 한강공원까지 달리는 10km 코스',
    10.0,
    'DOMESTIC',
    'EASY',
    2.0,
    'https://waytoearth-assets.s3.ap-northeast-2.amazonaws.com/journeys/hangang.jpg',
    NOW(),
    NOW()
);
-- Journey ID = 1 (가정)
```

### 2. 경로 데이터 CSV 준비
**hangang_route.csv**
```csv
journey_id,latitude,longitude,sequence,altitude,description
1,37.5280,126.9240,1,10.0,여의도 한강공원 시작점
1,37.5285,126.9250,2,10.5,
1,37.5290,126.9260,3,11.0,
1,37.5295,126.9270,4,11.5,여의도 자전거도로
1,37.5300,126.9280,5,12.0,
...
1,37.5120,127.0050,148,15.0,
1,37.5115,127.0055,149,15.5,
1,37.5110,127.0060,150,16.0,반포 한강공원 도착
```

### 3. CSV 로드
```sql
LOAD DATA LOCAL INFILE '/path/to/hangang_route.csv'
INTO TABLE journey_routes
FIELDS TERMINATED BY ','
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(journey_id, latitude, longitude, sequence, altitude, description)
SET created_at = NOW(), updated_at = NOW();
```

### 4. 검증
```sql
-- 포인트 개수 확인
SELECT COUNT(*) FROM journey_routes WHERE journey_id = 1;
-- 기대값: 150

-- 첫/마지막 포인트 확인
SELECT * FROM journey_routes WHERE journey_id = 1 AND sequence IN (1, 150);
```

### 5. API 테스트
```bash
# 통계 조회
curl http://localhost:8080/v1/journeys/1/routes/statistics

# 첫 10개 포인트 조회
curl http://localhost:8080/v1/journeys/1/routes?page=0&size=10
```

---

## 주의사항

### ⚠️ 반드시 지켜야 할 것

1. **sequence는 1부터 시작, 연속적이어야 함**
   - ❌ 1, 2, 5, 6 (3, 4 누락)
   - ✅ 1, 2, 3, 4

2. **좌표 정확도**
   - 소수점 6자리 이상 권장 (37.566535, 126.978020)
   - 소수점 4자리: 약 11m 오차

3. **적절한 포인트 밀도**
   - 너무 많음(1m마다): DB 부담, 성능 저하
   - 너무 적음(500m마다): 경로가 부정확
   - 권장: 10~50m마다 1개 포인트

4. **고도(altitude)는 선택사항**
   - 평지 코스는 생략 가능
   - 등산/트레일은 입력 권장

---

## FAQ

### Q1: 경로 포인트가 몇 개나 필요한가요?
**A:** 코스 거리에 따라 다릅니다.
- 5km 코스: 100~250개
- 10km 코스: 200~500개
- 42km (마라톤): 1000~2000개

### Q2: Google Maps 경로와 정확히 일치해야 하나요?
**A:** 아니요. 주요 경로만 맞으면 됩니다. 프론트엔드에서 지도 API가 자동으로 경로를 부드럽게 그립니다.

### Q3: 기존 경로를 수정하려면?
**A:**
```sql
-- 전체 삭제 후 재입력
DELETE FROM journey_routes WHERE journey_id = 1;
-- 그 후 새로운 데이터 입력

-- 또는 특정 구간만 수정
UPDATE journey_routes
SET latitude = 37.5666, longitude = 126.9781
WHERE journey_id = 1 AND sequence = 10;
```

### Q4: 원형 코스(출발=도착)는 어떻게 입력하나요?
**A:** 첫 포인트와 마지막 포인트의 좌표를 같거나 가깝게 설정하면 됩니다.

---

## 다음 단계

경로 데이터 입력 후:

1. ✅ **랜드마크 추가** - 경로 상의 주요 지점
2. ✅ **스토리 카드 작성** - 랜드마크별 설명
3. ✅ **스탬프 이미지 준비** - 수집 가능한 스탬프
4. ✅ **프론트엔드 연동 테스트** - 지도에 경로 표시 확인

---

**작성일**: 2025-01-07
**마지막 수정**: 2025-01-07
**작성자**: WayToEarth Backend Team
