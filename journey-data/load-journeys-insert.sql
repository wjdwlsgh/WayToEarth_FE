-- ============================================
-- WayToEarth Journey Data INSERT 방식
-- ============================================
-- 작성일: 2025-01-07
-- 사용법: mysql -u sungmin -p waytoearth < load-journeys-insert.sql
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
);

-- ============================================
-- 2. Journey Routes 입력 (01-palace-tour)
-- ============================================

INSERT INTO journey_routes (journey_id, latitude, longitude, sequence, altitude, description, created_at, updated_at) VALUES
(1, 37.5796, 126.9770, 1, 50.0, '경복궁 정문 - 광화문', NOW(), NOW()),
(1, 37.5810, 126.9765, 2, 51.0, '경복궁 북측', NOW(), NOW()),
(1, 37.5830, 126.9760, 3, 52.0, '경복궁과 청와대 사이', NOW(), NOW()),
(1, 37.5850, 126.9755, 4, 53.0, '청와대 진입로', NOW(), NOW()),
(1, 37.5869, 126.9744, 5, 54.0, '청와대 정문', NOW(), NOW()),
(1, 37.5860, 126.9780, 6, 55.0, '청와대 동측', NOW(), NOW()),
(1, 37.5840, 126.9820, 7, 56.0, '창덕궁 방향', NOW(), NOW()),
(1, 37.5820, 126.9860, 8, 57.0, '창덕궁 서측 접근', NOW(), NOW()),
(1, 37.5805, 126.9890, 9, 58.0, '창덕궁 진입로', NOW(), NOW()),
(1, 37.5794, 126.9910, 10, 59.0, '창덕궁 정문 - 돈화문', NOW(), NOW()),
(1, 37.5792, 126.9925, 11, 60.0, '창덕궁과 창경궁 사이', NOW(), NOW()),
(1, 37.5790, 126.9940, 12, 61.0, '창경궁 진입로', NOW(), NOW()),
(1, 37.5788, 126.9950, 13, 62.0, '창경궁 정문 - 홍화문', NOW(), NOW()),
(1, 37.5780, 126.9950, 14, 63.0, '창경궁 남측', NOW(), NOW()),
(1, 37.5765, 126.9948, 15, 64.0, '종묘 방향', NOW(), NOW()),
(1, 37.5750, 126.9946, 16, 65.0, '종묘 북측', NOW(), NOW()),
(1, 37.5742, 126.9944, 17, 66.0, '종묘 정문', NOW(), NOW()),
(1, 37.5730, 126.9920, 18, 67.0, '종로 방향', NOW(), NOW()),
(1, 37.5715, 126.9880, 19, 68.0, '종로3가 일대', NOW(), NOW()),
(1, 37.5705, 126.9820, 20, 69.0, '인사동 방향', NOW(), NOW()),
(1, 37.5700, 126.9760, 21, 70.0, '경복궁역 일대', NOW(), NOW()),
(1, 37.5700, 126.9720, 22, 71.0, '서울역사박물관 방향', NOW(), NOW()),
(1, 37.5700, 126.9690, 23, 72.0, '서울역사박물관', NOW(), NOW()),
(1, 37.5690, 126.9710, 24, 73.0, '덕수궁 방향', NOW(), NOW()),
(1, 37.5675, 126.9735, 25, 74.0, '정동 일대', NOW(), NOW()),
(1, 37.5658, 126.9751, 26, 75.0, '덕수궁 정문 - 대한문', NOW(), NOW()),
(1, 37.5645, 126.9752, 27, 76.0, '덕수궁 남측', NOW(), NOW()),
(1, 37.5625, 126.9753, 28, 77.0, '숭례문 방향', NOW(), NOW()),
(1, 37.5605, 126.9753, 29, 78.0, '숭례문 (남대문) - 종료', NOW(), NOW());

-- ============================================
-- 3. Journey Routes 입력 (02-hanriver-run)
-- ============================================

INSERT INTO journey_routes (journey_id, latitude, longitude, sequence, altitude, description, created_at, updated_at) VALUES
(2, 37.5280, 126.9240, 1, 10.0, '여의도 한강공원 시작점', NOW(), NOW()),
(2, 37.5285, 126.9250, 2, 10.5, NULL, NOW(), NOW()),
(2, 37.5290, 126.9260, 3, 11.0, NULL, NOW(), NOW()),
(2, 37.5295, 126.9270, 4, 11.5, '여의도 자전거도로', NOW(), NOW()),
(2, 37.5300, 126.9280, 5, 12.0, NULL, NOW(), NOW()),
(2, 37.5305, 126.9290, 6, 12.5, NULL, NOW(), NOW()),
(2, 37.5310, 126.9300, 7, 13.0, '여의도 샛강', NOW(), NOW()),
(2, 37.5315, 126.9310, 8, 13.5, NULL, NOW(), NOW()),
(2, 37.5320, 126.9320, 9, 14.0, NULL, NOW(), NOW()),
(2, 37.5325, 126.9330, 10, 14.5, NULL, NOW(), NOW()),
(2, 37.5330, 126.9340, 11, 15.0, '선유도공원 진입', NOW(), NOW()),
(2, 37.5335, 126.9350, 12, 15.5, '선유도공원', NOW(), NOW()),
(2, 37.5340, 126.9360, 13, 16.0, NULL, NOW(), NOW()),
(2, 37.5345, 126.9370, 14, 16.5, NULL, NOW(), NOW()),
(2, 37.5350, 126.9380, 15, 17.0, '양화대교 방향', NOW(), NOW()),
(2, 37.5355, 126.9390, 16, 17.5, NULL, NOW(), NOW()),
(2, 37.5360, 126.9400, 17, 18.0, NULL, NOW(), NOW()),
(2, 37.5365, 126.9410, 18, 18.5, NULL, NOW(), NOW()),
(2, 37.5370, 126.9420, 19, 19.0, '양화대교 아래', NOW(), NOW()),
(2, 37.5375, 126.9430, 20, 19.5, NULL, NOW(), NOW()),
(2, 37.5380, 126.9440, 21, 20.0, NULL, NOW(), NOW()),
(2, 37.5385, 126.9450, 22, 20.5, NULL, NOW(), NOW()),
(2, 37.5390, 126.9460, 23, 21.0, '합정역 방향', NOW(), NOW()),
(2, 37.5395, 126.9470, 24, 21.5, NULL, NOW(), NOW()),
(2, 37.5400, 126.9480, 25, 22.0, NULL, NOW(), NOW()),
(2, 37.5405, 126.9490, 26, 22.5, '당산철교 진입', NOW(), NOW()),
(2, 37.5410, 126.9500, 27, 23.0, '당산철교 아래', NOW(), NOW()),
(2, 37.5415, 126.9510, 28, 23.5, NULL, NOW(), NOW()),
(2, 37.5420, 126.9520, 29, 24.0, NULL, NOW(), NOW()),
(2, 37.5425, 126.9530, 30, 24.5, NULL, NOW(), NOW()),
(2, 37.5430, 126.9540, 31, 25.0, '성산대교 방향', NOW(), NOW()),
(2, 37.5435, 126.9550, 32, 25.5, NULL, NOW(), NOW()),
(2, 37.5440, 126.9560, 33, 26.0, NULL, NOW(), NOW()),
(2, 37.5445, 126.9570, 34, 26.5, NULL, NOW(), NOW()),
(2, 37.5450, 126.9580, 35, 27.0, '성산대교 아래', NOW(), NOW()),
(2, 37.5455, 126.9590, 36, 27.5, NULL, NOW(), NOW()),
(2, 37.5460, 126.9600, 37, 28.0, NULL, NOW(), NOW()),
(2, 37.5465, 126.9610, 38, 28.5, NULL, NOW(), NOW()),
(2, 37.5470, 126.9620, 39, 29.0, NULL, NOW(), NOW()),
(2, 37.5475, 126.9630, 40, 29.5, '반포대교 진입', NOW(), NOW()),
(2, 37.5480, 126.9640, 41, 30.0, NULL, NOW(), NOW()),
(2, 37.5485, 126.9650, 42, 30.5, NULL, NOW(), NOW()),
(2, 37.5490, 126.9660, 43, 31.0, NULL, NOW(), NOW()),
(2, 37.5495, 126.9670, 44, 31.5, NULL, NOW(), NOW()),
(2, 37.5500, 126.9680, 45, 32.0, '반포대교 아래', NOW(), NOW()),
(2, 37.5505, 126.9690, 46, 32.5, NULL, NOW(), NOW()),
(2, 37.5510, 126.9700, 47, 33.0, NULL, NOW(), NOW()),
(2, 37.5515, 126.9710, 48, 33.5, NULL, NOW(), NOW()),
(2, 37.5520, 126.9720, 49, 34.0, NULL, NOW(), NOW()),
(2, 37.5525, 126.9730, 50, 34.5, '반포 한강공원 도착', NOW(), NOW());

-- ============================================
-- 4. Landmarks 입력 (01-palace-tour)
-- ============================================

INSERT INTO landmarks (journey_id, name, latitude, longitude, distance_from_start_m, description, image_url, created_at, updated_at) VALUES
(1, '경복궁', 37.5796, 126.9770, 0, '조선 왕조의 으뜸 궁궐. 1395년 창건된 법궁', 'https://waytoearth-assets.s3.ap-northeast-2.amazonaws.com/landmarks/gyeongbokgung.jpg', NOW(), NOW()),
(1, '청와대', 37.5869, 126.9744, 1200, '대한민국 대통령 관저였던 곳. 2022년부터 국민에게 개방', 'https://waytoearth-assets.s3.ap-northeast-2.amazonaws.com/landmarks/cheongwadae.jpg', NOW(), NOW()),
(1, '창덕궁', 37.5794, 126.9910, 3500, '유네스코 세계문화유산으로 지정된 조선 궁궐. 후원이 아름답기로 유명', 'https://waytoearth-assets.s3.ap-northeast-2.amazonaws.com/landmarks/changdeokgung.jpg', NOW(), NOW()),
(1, '창경궁', 37.5788, 126.9950, 4800, '조선시대 왕족들의 생활 공간. 대온실로 유명', 'https://waytoearth-assets.s3.ap-northeast-2.amazonaws.com/landmarks/changgyeonggung.jpg', NOW(), NOW()),
(1, '종묘', 37.5742, 126.9944, 6500, '조선 왕조 역대 왕과 왕비의 신위를 모신 유교 사당. 유네스코 세계문화유산', 'https://waytoearth-assets.s3.ap-northeast-2.amazonaws.com/landmarks/jongmyo.jpg', NOW(), NOW()),
(1, '서울역사박물관', 37.5700, 126.9690, 9200, '서울의 역사와 문화를 한눈에 볼 수 있는 박물관', 'https://waytoearth-assets.s3.ap-northeast-2.amazonaws.com/landmarks/seoul-history-museum.jpg', NOW(), NOW()),
(1, '덕수궁', 37.5658, 126.9751, 10500, '대한제국 시대의 궁궐. 서양식 건축물이 있는 것이 특징', 'https://waytoearth-assets.s3.ap-northeast-2.amazonaws.com/landmarks/deoksugung.jpg', NOW(), NOW()),
(1, '숭례문', 37.5605, 126.9753, 12500, '서울의 상징이자 국보 제1호. 남대문이라고도 불림', 'https://waytoearth-assets.s3.ap-northeast-2.amazonaws.com/landmarks/sungnyemun.jpg', NOW(), NOW());

-- ============================================
-- 5. Landmarks 입력 (02-hanriver-run)
-- ============================================

INSERT INTO landmarks (journey_id, name, latitude, longitude, distance_from_start_m, description, image_url, created_at, updated_at) VALUES
(2, '여의도 한강공원', 37.5280, 126.9240, 0, '여의도에 위치한 한강공원. 넓은 잔디밭과 자전거도로가 있음', 'https://waytoearth-assets.s3.ap-northeast-2.amazonaws.com/landmarks/yeouido-park.jpg', NOW(), NOW()),
(2, '선유도공원', 37.5335, 126.9350, 2000, '과거 정수장을 재생한 생태공원. 아름다운 수생식물원이 있음', 'https://waytoearth-assets.s3.ap-northeast-2.amazonaws.com/landmarks/seonyudo-park.jpg', NOW(), NOW()),
(2, '양화대교', 37.5370, 126.9420, 4000, '한강을 가로지르는 다리. 야경이 아름다움', 'https://waytoearth-assets.s3.ap-northeast-2.amazonaws.com/landmarks/yanghwa-bridge.jpg', NOW(), NOW()),
(2, '당산철교', 37.5410, 126.9500, 6000, '지하철 2호선이 지나가는 철교. 야간 조명이 멋짐', 'https://waytoearth-assets.s3.ap-northeast-2.amazonaws.com/landmarks/dangsan-bridge.jpg', NOW(), NOW()),
(2, '반포대교', 37.5500, 126.9680, 10000, '세계 최장의 교량 분수인 달빛무지개분수가 있는 다리', 'https://waytoearth-assets.s3.ap-northeast-2.amazonaws.com/landmarks/banpo-bridge.jpg', NOW(), NOW());

-- ============================================
-- 6. 데이터 검증
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

-- ============================================
-- 완료!
-- ============================================
