// utils/api/client.ts
import axios, { AxiosResponse } from "axios";
import { getAccessToken, refreshAccessToken } from "../auth/tokenManager";

// 목데이터 사용 중단: 항상 실서버 연동

export const client = axios.create({
  baseURL: "https://api.waytoearth.cloud",
  timeout: 10000,
});

// 요청: 액세스 토큰 자동 주입
client.interceptors.request.use((config) => {
  const t = getAccessToken();
  if (t) {
    config.headers = {
      ...(config.headers as any),
      Authorization: `Bearer ${t}`,
    } as any;
  }
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
  async (err) => {
    const status = err?.response?.status;
    const cfg = err?.config || {};

    // 401 처리: 토큰 재발급 시도 (무한루프 방지용 플래그)
    if (status === 401 && !(cfg as any)._retry) {
      (cfg as any)._retry = true;
      try {
        const baseURL = client.defaults.baseURL || "https://api.waytoearth.cloud";
        const newAccess = await refreshAccessToken(baseURL);
        if (newAccess) {
          cfg.headers = {
            ...(cfg.headers as any),
            Authorization: `Bearer ${newAccess}`,
          } as any;
          return client(cfg);
        }
      } catch (e) {
        // fallthrough to reject below after cleanup
      }
    }

    // 로깅 (디버깅용)
    try {
      const body = err?.response?.data;
      const hasAuth = cfg.headers?.Authorization;
      console.log(
        "[API ERR]",
        status,
        "method=",
        cfg.method,
        "url=",
        cfg.baseURL ? cfg.baseURL + (cfg.url || "") : cfg.url
      );
      console.log("[API ERR] Response Body:", JSON.stringify(body, null, 2));
      console.log("[API ERR] Has Auth Header:", hasAuth ? "YES" : "NO");
      if (status === 403) {
        console.log("[API ERR] 403 Forbidden - Check Admin Role or Token");
      }
    } catch {}

    return Promise.reject(err);
  }
);
// token refresh logic centralized in tokenManager
