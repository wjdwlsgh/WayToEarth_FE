// utils/api/client.ts
import axios, { AxiosResponse } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

// Mock 모드 비활성화: 항상 실제 API 연동 사용
const extra: any = (Constants?.expoConfig as any)?.extra ?? {};
export const mockEnabled = false;

export const client = axios.create({
  baseURL:
    (extra?.apiBaseUrl as string) ||
    ((typeof process !== "undefined" &&
      (process.env?.EXPO_PUBLIC_API_BASE_URL as string)) ||
      "https://api.waytoearth.cloud"), // ✅ 기본값, app.config.js의 extra.apiBaseUrl 우선
  timeout: 10000,
});

// 요청: JWT 자동 주입
client.interceptors.request.use(async (config) => {
  try {
    const t = await AsyncStorage.getItem("jwtToken");
    if (t) {
      config.headers = {
        ...(config.headers as any),
        Authorization: `Bearer ${t}`,
      } as any;
    }
  } catch {}
  return config;
});

// 응답: {success,data,message} 래퍼면 data로 언래핑
client.interceptors.response.use(
  (res: AxiosResponse) => {
    const d = res.data;
    if (
      d &&
      typeof d === "object" &&
      "data" in d &&
      ("success" in d || "message" in d)
    ) {
      res.data = (d as any).data; // ← 이후 .data가 실제 페이로드
    }
    return res;
  },
  (err) => {
    const status = err?.response?.status;
    const body = err?.response?.data;
    console.log("[API ERR]", status, body);
    return Promise.reject(err);
  }
);
