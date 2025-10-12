// utils/api/client.ts
import axios, { AxiosResponse } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 목데이터 사용 중단: 항상 실서버 연동

export const client = axios.create({
  baseURL: "https://api.waytoearth.cloud",
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
    const cfg = err?.config || {};
    console.log(
      "[API ERR]",
      status,
      body,
      "method=",
      cfg.method,
      "url=",
      cfg.baseURL ? cfg.baseURL + (cfg.url || "") : cfg.url
    );
    return Promise.reject(err);
  }
);
