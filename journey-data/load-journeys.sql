-- ============================================
-- WayToEarth Journey Data 일괄 입력 SQL
-- ============================================
-- 작성일: 2025-01-07
-- 사용법: mysql -u user -p database < load-journeys.sql
-- ============================================

-- 1. Journey 기본 정보 입력
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
) VALUES
-- 여정 1: 한국의 고궁탐방
(
    '한국의 고궁탐방',
    '서울의 5대 궁궐과 역사 유적지를 탐방하는 역사 문화 여정. 조선시대부터 현대까지의 역사를 한눈에 볼 수 있습니다.',
    12.5,
    'DOMESTIC',
    'EASY',
    2.5,
    'https://waytoearth-assets.s3.ap-northeast-2.amazonaws.com/journeys/palace-tour.jpg',
    NOW(),
    NOW()
),
-- 여정 2: 한강 러닝 코스
(
    '한강 러닝 코스',
    '여의도부터 반포까지 한강을 따라 달리는 상쾌한 러닝 코스. 강바람을 맞으며 시원한 러닝을 즐길 수 있습니다.',
    10.0,
    'DOMESTIC',
    'EASY',
    2.0,
    'https://waytoearth-assets.s3.ap-northeast-2.amazonaws.com/journeys/hanriver-run.jpg',
    NOW(),
    NOW()
),
-- 여정 3: 북한산 둘레길 1코스
(
    '북한산 둘레길 1코스',
    '북한산을 완만하게 둘러보는 둘레길 1코스. 숲속 산책과 경치 감상을 동시에 즐길 수 있습니다.',
    8.3,
    'DOMESTIC',
    'MEDIUM',
    2.5,
    'https://waytoearth-assets.s3.ap-northeast-2.amazonaws.com/journeys/bukhansan-trail.jpg',
    NOW(),
    NOW()
),
-- 여정 4: 제주 올레 1코스
(
    '제주 올레 1코스',
    '제주 올레길의 시작, 시흥초등학교부터 성산일출봉까지. 제주 바다를 끼고 걷는 힐링 코스입니다.',
    15.1,
    'DOMESTIC',
    'MEDIUM',
    4.0,
    'https://waytoearth-assets.s3.ap-northeast-2.amazonaws.com/journeys/jeju-olle-1.jpg',
    NOW(),
    NOW()
),
-- 여정 5: 경주 역사문화탐방
(
    '경주 역사문화탐방',
    '천년 고도 경주의 역사 유적지를 둘러보는 문화 탐방 코스. 신라시대 유적들을 직접 체험할 수 있습니다.',
    11.2,
    'DOMESTIC',
    'EASY',
    3.0,
    'https://waytoearth-assets.s3.ap-northeast-2.amazonaws.com/journeys/gyeongju-history.jpg',
    NOW(),
    NOW()
),
-- 여정 6: 부산 해운대 해안길
(
    '부산 해운대 해안길',
    '해운대에서 송정까지 부산의 아름다운 해안선을 따라 달리는 코스. 바다 풍경이 일품입니다.',
    9.5,
    'DOMESTIC',
    'EASY',
    2.0,
    'https://waytoearth-assets.s3.ap-northeast-2.amazonaws.com/journeys/haeundae-coastal.jpg',
    NOW(),
    NOW()
);

-- ============================================
-- 2. Journey Routes 입력 (CSV 로드)
-- ============================================

-- 방법 1: LOAD DATA INFILE 사용 (권장)
-- 주의: 파일 경로는 실제 경로로 수정 필요
-- 주의: MySQL 설정에서 local_infile=1 필요

-- 여정 1: 고궁탐방
LOAD DATA LOCAL INFILE 'journey-data/01-palace-tour.csv'
INTO TABLE journey_routes
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(journey_id, latitude, longitude, sequence, altitude, description)
SET created_at = NOW(), updated_at = NOW();

-- 여정 2: 한강 러닝
LOAD DATA LOCAL INFILE 'journey-data/02-hanriver-run.csv'
INTO TABLE journey_routes
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(journey_id, latitude, longitude, sequence, altitude, description)
SET created_at = NOW(), updated_at = NOW();

-- 나머지 여정들도 동일하게...
-- LOAD DATA LOCAL INFILE 'journey-data/03-bukhansan-trail.csv' ...
-- LOAD DATA LOCAL INFILE 'journey-data/04-jeju-olle-1.csv' ...
-- LOAD DATA LOCAL INFILE 'journey-data/05-gyeongju-history.csv' ...
-- LOAD DATA LOCAL INFILE 'journey-data/06-haeundae-coastal.csv' ...

-- ============================================
-- 3. Landmarks 입력 (CSV 로드)
-- ============================================

-- 여정 1: 고궁탐방 랜드마크
LOAD DATA LOCAL INFILE 'journey-data/01-palace-tour-landmarks.csv'
INTO TABLE landmarks
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(journey_id, name, latitude, longitude, distance_from_start_m, description, image_url)
SET created_at = NOW(), updated_at = NOW();

-- 여정 2: 한강 러닝 랜드마크
LOAD DATA LOCAL INFILE 'journey-data/02-hanriver-run-landmarks.csv'
INTO TABLE landmarks
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(journey_id, name, latitude, longitude, distance_from_start_m, description, image_url)
SET created_at = NOW(), updated_at = NOW();

-- 나머지 랜드마크들도 동일하게...

-- ============================================
-- 4. 데이터 검증
-- ============================================

-- Journey 개수 확인
SELECT COUNT(*) as journey_count FROM journeys;

-- 각 Journey별 경로 포인트 개수
SELECT
    j.id,
    j.name,
    COUNT(jr.id) as route_points,
    COUNT(l.id) as landmarks
FROM journeys j
LEFT JOIN journey_routes jr ON j.id = jr.journey_id
LEFT JOIN landmarks l ON j.id = l.journey_id
GROUP BY j.id, j.name
ORDER BY j.id;

-- sequence 검증 (빠진 번호 확인)
SELECT
    jr1.journey_id,
    jr1.sequence + 1 as missing_sequence
FROM journey_routes jr1
LEFT JOIN journey_routes jr2
  ON jr1.journey_id = jr2.journey_id
  AND jr1.sequence + 1 = jr2.sequence
WHERE jr2.sequence IS NULL
  AND jr1.sequence < (
    SELECT MAX(sequence)
    FROM journey_routes
    WHERE journey_id = jr1.journey_id
  );

-- 좌표 범위 검증
SELECT COUNT(*) as invalid_coordinates
FROM journey_routes
WHERE latitude < -90 OR latitude > 90
   OR longitude < -180 OR longitude > 180;

-- ============================================
-- 완료!
-- ============================================
