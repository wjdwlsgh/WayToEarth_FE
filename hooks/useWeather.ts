// hooks/useWeather.ts
import { useState, useEffect } from "react";
import * as Location from "expo-location";
import { getCurrentWeather } from "../utils/api/weather";

export interface WeatherData {
  condition: string;
  iconCode: string;
  emoji: string;
  fetchedAt: string;
  recommendation: string;
  temperature?: number; // 온도 (섭씨)
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError(null);

      // 위치 권한 확인
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("위치 권한이 필요합니다");
        return;
      }

      // 현재 위치 가져오기
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // 날씨 API 호출
      const weatherData = await getCurrentWeather(
        location.coords.latitude,
        location.coords.longitude
      );

      setWeather(weatherData);
    } catch (err: any) {
      console.error("[useWeather] 날씨 조회 실패:", err);
      setError(err?.message || "날씨 정보를 가져올 수 없습니다");
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 자동으로 날씨 조회
  useEffect(() => {
    fetchWeather();
  }, []);

  return {
    weather,
    loading,
    error,
    refetch: fetchWeather,
  };
}
