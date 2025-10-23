// contexts/WeatherContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import * as Location from "expo-location";
import { getCurrentWeather } from "../utils/api/weather";
import { ensureAccessToken, onAuthTokenChange } from "../utils/auth/tokenManager";

export interface WeatherData {
  condition: string;
  iconCode: string;
  emoji: string;
  fetchedAt: string;
  recommendation: string;
  temperature?: number;
}

interface WeatherContextType {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

const REFRESH_INTERVAL = 15 * 60 * 1000; // 15분

export function WeatherProvider({ children }: { children: ReactNode }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRef = useRef(false);

  const fetchWeather = async (isBackground = false) => {
    // 중복 호출 방지
    if (isFetchingRef.current) {
      console.log("[WeatherContext] 이미 호출 중, 스킵");
      return;
    }

    try {
      isFetchingRef.current = true;

      if (!isBackground) {
        setLoading(true);
      }
      setError(null);

      // 인증 토큰 확인: 없으면 조용히 스킵 (로그인 전 403 방지)
      const token = await ensureAccessToken();
      if (!token) {
        console.log("[WeatherContext] 토큰 없음 → 호출 스킵");
        isFetchingRef.current = false;
        if (!isBackground) setLoading(false);
        return;
      }

      console.log("[WeatherContext] 위치 권한 확인 중...");
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.error("[WeatherContext] 위치 권한 거부됨");
        setError("위치 권한이 필요합니다");
        setLoading(false);
        isFetchingRef.current = false;
        return;
      }

      console.log("[WeatherContext] 현재 위치 가져오는 중...");
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      console.log("[WeatherContext] 위치:", location.coords.latitude, location.coords.longitude);

      console.log("[WeatherContext] 날씨 API 호출 중...");
      const weatherData = await getCurrentWeather(
        location.coords.latitude,
        location.coords.longitude
      );

      console.log("[WeatherContext] 날씨 데이터:", weatherData);
      setWeather(weatherData);
    } catch (err: any) {
      console.error("[WeatherContext] 에러 발생:", err);
      console.error("[WeatherContext] 에러 메시지:", err?.message);
      console.error("[WeatherContext] 에러 스택:", err?.stack);
      if (!isBackground) {
        setError(err?.message || "날씨 정보를 가져올 수 없습니다");
      }
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    // 초기 로딩
    fetchWeather();

    // 15분마다 백그라운드 갱신
    intervalRef.current = setInterval(() => {
      fetchWeather(true);
    }, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // 로그인 등 토큰 상태 변경 시 즉시 갱신
  useEffect(() => {
    const off = onAuthTokenChange(() => {
      // 토큰이 생겼을 때만 호출하도록 가드
      ensureAccessToken().then((t) => { if (t) fetchWeather(false); });
    });
    return off;
  }, []);

  return (
    <WeatherContext.Provider value={{ weather, loading, error, refetch: fetchWeather }}>
      {children}
    </WeatherContext.Provider>
  );
}

export function useWeather() {
  const context = useContext(WeatherContext);
  if (context === undefined) {
    throw new Error("useWeather must be used within a WeatherProvider");
  }
  return context;
}
