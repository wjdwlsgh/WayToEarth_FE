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

// 5) (참고) 칼로리 근사: 체중(kg) * 거리(km)
export const caloriesKcal = (distanceKm: number, weightKg = 65) =>
  Math.round(distanceKm * weightKg);
