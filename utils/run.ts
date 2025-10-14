// pace.ts

// 1) "분/㎞" 숫자(예: 5.5 == 5분30초) → m/s
export const paceToMps = (minPerKm: number) => {
  if (!isFinite(minPerKm) || minPerKm <= 0) return 0;
  // 소수 처리 안전하게: 전체 초 = 분/㎞ * 60
  const totalSecPerKm = Math.round(minPerKm * 60); // 5.5 -> 330초(=5:30)
  return 1000 / totalSecPerKm; // m/s
};

// 2) 초 → "M:SS"
export const fmtMMSS = (seconds: number) => {
  if (!isFinite(seconds) || seconds <= 0) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  // 59.6초 같은 반올림 경계 처리
  if (s === 60) return `${m + 1}:00`;
  return `${m}:${String(s).padStart(2, "0")}`;
};

// 평균 페이스(초/㎞)
export const avgPaceSecPerKm = (distanceKm: number, elapsedSec: number) => {
  if (!isFinite(distanceKm) || distanceKm < 0.05) return Infinity;
  if (!isFinite(elapsedSec) || elapsedSec <= 0) return Infinity;
  const secPerKm = elapsedSec / distanceKm;
  // 닉런과 유사한 표기: 초 단위 반올림
  return Math.round(secPerKm);
};

// 라벨 변환
export const avgPaceLabel = (distanceKm: number, elapsedSec: number) => {
  const secPerKm = avgPaceSecPerKm(distanceKm, elapsedSec);
  return fmtMMSS(secPerKm); // 5:49 형식
};

/**
 * 칼로리 계산 (MET 기반)
 * MET (Metabolic Equivalent of Task) 공식 사용
 *
 * Running MET 값:
 * - 느린 조깅 (8 km/h, 7:30/km): MET 8.0
 * - 보통 달리기 (9.7 km/h, 6:11/km): MET 9.8
 * - 빠른 달리기 (11 km/h, 5:27/km): MET 11.0
 * - 매우 빠른 달리기 (12.9 km/h, 4:39/km): MET 12.8
 *
 * 칼로리 = MET × 체중(kg) × 시간(hour) × 1.05
 *
 * @param distanceKm 달린 거리 (km)
 * @param elapsedSec 경과 시간 (초)
 * @param weightKg 체중 (kg), 기본값 65kg
 * @returns 소모 칼로리 (kcal)
 */
export const caloriesKcal = (
  distanceKm: number,
  elapsedSec: number = 0,
  weightKg = 65
): number => {
  // 거리나 시간이 없으면 0 반환
  if (!isFinite(distanceKm) || distanceKm < 0.01) return 0;
  if (!isFinite(elapsedSec) || elapsedSec <= 0) {
    // 시간 정보가 없으면 간단한 근사치 사용 (거리 × 체중)
    return Math.round(distanceKm * weightKg);
  }

  // 속도 계산 (km/h)
  const hours = elapsedSec / 3600;
  const speedKmh = distanceKm / hours;

  // 속도에 따른 MET 값 결정
  let met: number;
  if (speedKmh < 6.4) {
    // 매우 느린 조깅 (9:23/km 이하)
    met = 6.0;
  } else if (speedKmh < 8.0) {
    // 느린 조깅 (7:30/km ~ 9:23/km)
    met = 8.0;
  } else if (speedKmh < 8.4) {
    // 보통 조깅 (7:08/km ~ 7:30/km)
    met = 8.3;
  } else if (speedKmh < 9.7) {
    // 보통 달리기 (6:11/km ~ 7:08/km)
    met = 9.0;
  } else if (speedKmh < 10.8) {
    // 빠른 달리기 (5:33/km ~ 6:11/km)
    met = 10.0;
  } else if (speedKmh < 11.3) {
    // 빠른 달리기 (5:18/km ~ 5:33/km)
    met = 11.0;
  } else if (speedKmh < 12.1) {
    // 매우 빠른 달리기 (4:58/km ~ 5:18/km)
    met = 11.5;
  } else if (speedKmh < 12.9) {
    // 매우 빠른 달리기 (4:39/km ~ 4:58/km)
    met = 12.3;
  } else if (speedKmh < 13.8) {
    // 엘리트 달리기 (4:21/km ~ 4:39/km)
    met = 12.8;
  } else if (speedKmh < 14.5) {
    // 엘리트 달리기 (4:08/km ~ 4:21/km)
    met = 13.3;
  } else {
    // 프로급 달리기 (4:08/km 이상)
    met = 14.0;
  }

  // MET 공식: 칼로리 = MET × 체중(kg) × 시간(hour) × 1.05
  const calories = met * weightKg * hours * 1.05;

  return Math.round(calories);
};
