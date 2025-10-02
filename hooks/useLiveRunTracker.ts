import { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import type { LatLng } from "../types/types";
import { distanceKm } from "../utils/geo";
import { fmtMMSS, avgPaceSecPerKm, caloriesKcal } from "../utils/run";
import { apiStart, apiUpdate, apiPause, apiResume, apiStartSession } from "../utils/api/running";

type TimerId = ReturnType<typeof setInterval>;
type Sample = { t: number; p: LatLng; a?: number; s?: number };

const UPDATE_MIN_MS = 5000; // 5초 간격
const UPDATE_MIN_KM = 0.05; // 50m 이동

// 두 점 사이 거리(m)
const toMeters = (a: LatLng, b: LatLng) => distanceKm(a, b) * 1000;

export function useLiveRunTracker(runningType: "SINGLE" | "JOURNEY" = "SINGLE") {
  // ── 상태
  const [route, setRoute] = useState<LatLng[]>([]);
  const [distance, setDistance] = useState(0); // km
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [speedKmh, setSpeedKmh] = useState(0);
  const [weightKg] = useState(65);

  // ✅ 준비 상태
  const [isReady, setIsReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // ── refs
  const prev = useRef<LatLng | null>(null);
  const subRef = useRef<Location.LocationSubscription | null>(null);
  const elapsedTimerRef = useRef<TimerId | null>(null);
  const mapCenterRef = useRef<((p: LatLng) => void) | undefined>(undefined);
  const recentRef = useRef<Sample[]>([]);
  const pausedRef = useRef(false);
  const prevAccRef = useRef<number | null>(null); // m

  // 세션 & 업데이트 쓰로틀
  const sessionIdRef = useRef<string | null>(null);
  const lastUpdateAtRef = useRef<number>(0);
  const lastUpdateDistanceRef = useRef<number>(0);

  // 거리/시퀀스 최신값 ref (쓰로틀 계산 정확도 개선)
  const distanceRef = useRef(0); // km
  const seqRef = useRef(0); // route point sequence

  // ✅ 캐시된 위치
  const cachedLocationRef = useRef<LatLng | null>(null);

  // 노이즈 여부 판단
  const shouldIgnoreSample = (
    prevP: LatLng | null,
    cur: Location.LocationObject
  ) => {
    const acc = cur.coords.accuracy ?? 999; // m
    const spd = cur.coords.speed ?? null; // m/s
    // 정확도 너무 나쁘면 제외(강화)
    if (acc > 60) return true;

    if (!prevP) return false; // 첫 포인트 수락
    const p = {
      latitude: cur.coords.latitude,
      longitude: cur.coords.longitude,
    };
    const seg = toMeters(prevP, p);
    // 이동 최소 임계치(강화): 정확도 20m → 10m, 하한 5m
    const minMove = Math.max(acc * 0.5, 5);
    if (seg < minMove) return true;
    // 정지에 가까운 속도에서의 미세 흔들림 제거
    if (typeof spd === "number" && spd >= 0 && spd < 0.6) {
      if (seg < Math.max(acc * 0.8, 8)) return true;
    }
    return false;
  };

  // 앱 시작시 GPS 준비
  useEffect(() => {
    const prepareGPS = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === "granted") {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Low,
          });
          cachedLocationRef.current = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
        }
        setIsReady(true);
      } catch (error) {
        console.warn("GPS 준비 실패:", error);
        setIsReady(true);
      }
    };
    prepareGPS();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const centerMap = (p: LatLng) => mapCenterRef.current?.(p);

  /** 포인트 반영 + 속도/거리 갱신 + 주기 업데이트 전송 */
  const pushPoint = async (p: LatLng, acc?: number, spd?: number) => {
    const now = Date.now();

    // ── 거리 계산(스파이크 필터)
    let newDistanceKm = distanceRef.current;
    if (prev.current) {
      const segKm = distanceKm(prev.current, p);
      const dtSec =
        recentRef.current.length > 0
          ? (now - recentRef.current[recentRef.current.length - 1].t) / 1000
          : 1;
      const mps = (segKm * 1000) / Math.max(dtSec, 0.001);
      // 속도 스파이크 필터(완화 → 강화): 6.5 m/s 초과는 노이즈로 간주
      if (mps <= 6.5) {
        // 정확도 기반 거리 보정: 세그먼트에서 노이즈 허용치 차감
        const prevAcc = prevAccRef.current ?? acc ?? 0;
        const curAcc = acc ?? prevAccRef.current ?? 0;
        const noiseAllowanceM = 0.5 * (prevAcc + curAcc); // 평균 정확도의 50%
        const segM = segKm * 1000;
        const effM = Math.max(0, segM - noiseAllowanceM);
        const effKm = effM / 1000;
        newDistanceKm = distanceRef.current + effKm;
      }
    } else {
      newDistanceKm = 0;
    }

    // 상태/refs 갱신
    distanceRef.current = newDistanceKm;
    setDistance(newDistanceKm);
    prev.current = p;
    seqRef.current += 1;
    setRoute((cur) => (cur.length ? [...cur, p] : [p]));

    // 최근 5초 평균 속도
    recentRef.current.push({ t: now, p, a: acc, s: spd });
    const cutoff = now - 5000;
    while (recentRef.current.length && recentRef.current[0].t < cutoff) {
      recentRef.current.shift();
    }
    const arr = recentRef.current;
    if (arr.length >= 2) {
      const dt = (arr[arr.length - 1].t - arr[0].t) / 1000; // s
      const dk = distanceKm(arr[0].p, arr[arr.length - 1].p); // km
      setSpeedKmh(dt > 0 ? (dk / dt) * 3600 : 0);
    }

    centerMap(p);
    if (typeof acc === "number") prevAccRef.current = acc;

    // ── 주기 업데이트 (세션 있을 때만)
    const sid = sessionIdRef.current;
    if (!sid) return;

    const msEnough = now - lastUpdateAtRef.current >= UPDATE_MIN_MS;
    const kmEnough =
      distanceRef.current - lastUpdateDistanceRef.current >= UPDATE_MIN_KM;

    if (msEnough || kmEnough) {
      try {
        const paceSec = avgPaceSecPerKm(distanceRef.current, elapsedSec);
        await apiUpdate({
          sessionId: sid,
          distanceMeters: Math.round(distanceRef.current * 1000),
          durationSeconds: elapsedSec,
          averagePaceSeconds: isFinite(paceSec) ? Math.floor(paceSec) : null,
          calories: caloriesKcal(distanceRef.current, weightKg),
          currentPoint: {
            latitude: p.latitude,
            longitude: p.longitude,
            sequence: seqRef.current,
            t: Math.floor(now / 1000),
          },
        });
        lastUpdateAtRef.current = now;
        lastUpdateDistanceRef.current = distanceRef.current;
      } catch {
        // 조용히 무시(다음 주기 때 재시도)
      }
    }
  };

  /** 타이머 */
  const startElapsed = () => {
    if (elapsedTimerRef.current) return;
    elapsedTimerRef.current = setInterval(
      () => setElapsedSec((s) => s + 1),
      1000
    );
  };
  const stopElapsed = () => {
    if (!elapsedTimerRef.current) return;
    clearInterval(elapsedTimerRef.current);
    elapsedTimerRef.current = null;
  };

  /** ✅ 최적화된 시작 */
  const start = async () => {
    if (isInitializing) return; // 중복 방지
    setIsInitializing(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setIsInitializing(false);
        return;
      }

      try {
        // @ts-ignore (iOS only)
        await Location.setActivityTypeAsync?.(Location.ActivityType.Fitness);
      } catch {}

      // 초기 위치(캐시 우선)
      let initialLocation: LatLng;
      if (cachedLocationRef.current) {
        initialLocation = cachedLocationRef.current;
      } else {
        const cur = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        initialLocation = {
          latitude: cur.coords.latitude,
          longitude: cur.coords.longitude,
        };
      }

      // 상태 초기화
      setRoute([initialLocation]);
      prev.current = initialLocation;
      recentRef.current = [{ t: Date.now(), p: initialLocation }];
      distanceRef.current = 0;
      setDistance(0);
      setSpeedKmh(0);
      setElapsedSec(0);
      seqRef.current = 0;
      centerMap(initialLocation);

      pausedRef.current = false;
      setIsPaused(false);
      setIsRunning(true);
      startElapsed();

      // 세션 생성 (백엔드 API 호출)
      (async () => {
        try {
          // 1. 로컬 세션 ID 생성
          const localSessionId = `session_${Date.now()}`;

          // 2. 백엔드에 세션 시작 알림
          const sess = await apiStart({
            sessionId: localSessionId,
            runningType: runningType
          });

          sessionIdRef.current = sess.sessionId ?? localSessionId;
          lastUpdateAtRef.current = 0;
          lastUpdateDistanceRef.current = 0;
          console.log("[RunTracker] 세션 시작:", sessionIdRef.current);
        } catch (e) {
          console.error("세션 생성 실패:", e);
          // 백엔드 실패 시에도 로컬 세션으로 계속
          sessionIdRef.current = `local_${Date.now()}`;
        }
      })();

      // 위치 스트림(백그라운드)
      (async () => {
        try {
          subRef.current?.remove?.();
          subRef.current = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              timeInterval: 1000,
              distanceInterval: 5,
            },
            (loc) => {
              if (pausedRef.current) return;
              // 🔒 노이즈 필터
              if (shouldIgnoreSample(prev.current, loc)) return;

              pushPoint(
                {
                  latitude: loc.coords.latitude,
                  longitude: loc.coords.longitude,
                },
                loc.coords.accuracy,
                loc.coords.speed ?? undefined
              );
            }
          );
        } catch (e) {
          console.warn("위치 스트림 설정 실패:", e);
        }
      })();
    } catch (e) {
      console.error("러닝 시작 실패:", e);
      setIsRunning(false);
    } finally {
      setIsInitializing(false);
    }
  };

  /** 일시정지 */
  const pause = async () => {
    if (!isRunning || isPaused) return;
    pausedRef.current = true;
    setIsPaused(true);
    stopElapsed();
    const sid = sessionIdRef.current;
    if (sid) {
      try {
        await apiPause({ sessionId: sid });
      } catch {}
    }
  };

  /** 재개 */
  const resume = async () => {
    if (!isRunning || !isPaused) return;
    pausedRef.current = false;
    setIsPaused(false);
    startElapsed();
    const sid = sessionIdRef.current;
    if (sid) {
      try {
        await apiResume({ sessionId: sid });
      } catch {}
    }
  };

  /** 종료(센서 정리만) */
  const stop = () => {
    subRef.current?.remove?.();
    subRef.current = null;
    stopElapsed();
    setIsRunning(false);
    setIsPaused(false);
    setIsInitializing(false);
    pausedRef.current = false;
  };

  // 파생값
  const last = route[route.length - 1] ?? null;
  const paceSec = avgPaceSecPerKm(distance, elapsedSec);
  const paceLabel = isFinite(paceSec) ? fmtMMSS(paceSec) : "--:--";
  const kcal = caloriesKcal(distance, weightKg);

  // 맵 카메라 바인딩
  const bindMapCenter = (fn: (p: LatLng) => void) =>
    (mapCenterRef.current = fn);

  return {
    // 상태
    route,
    distance,
    last,
    isRunning,
    isPaused,
    elapsedSec,
    paceLabel,
    kcal,
    speedKmh,

    // 준비 상태
    isReady,
    isInitializing,

    // 제어
    start,
    pause,
    resume,
    stop,

    // 바인딩
    bindMapCenter,

    // 세션ID (요약 저장용)
    get sessionId() {
      return sessionIdRef.current;
    },
  };
}
