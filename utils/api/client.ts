// utils/api/client.ts
import axios, { AxiosResponse } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 목데이터 사용 중단: 항상 실서버 연동

export const client = axios.create({
  baseURL: "https://api.waytoearth.cloud",
  timeout: 10000,
});

// 요청: 액세스 토큰 자동 주입
client.interceptors.request.use(async (config) => {
  try {
    const t = await AsyncStorage.getItem("accessToken");
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
  async (err) => {
    const status = err?.response?.status;
    const cfg = err?.config || {};

    // 401 처리: 토큰 재발급 시도 (무한루프 방지용 플래그)
    if (status === 401 && !cfg._retry) {
      cfg._retry = true;
      try {
        const newAccess = await refreshAccessToken();
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

// --- 토큰 재발급 유틸리티 ---
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshing) return refreshing;

  refreshing = (async () => {
    try {
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      if (!refreshToken) {
        await AsyncStorage.multiRemove(["accessToken", "refreshToken"]);
        return null;
      }

      const baseURL = client.defaults.baseURL || "https://api.waytoearth.cloud";
      const res = await axios.post(`${baseURL}/v1/auth/refresh`, { refreshToken }, { timeout: 10000 });

      const payload = (res?.data && typeof res.data === "object" && "data" in res.data)
        ? (res.data as any).data
        : res.data;

      const newAccessToken: string | undefined = payload?.accessToken;
      const newRefreshToken: string | null | undefined = payload?.refreshToken ?? null;

      if (!newAccessToken) {
        await AsyncStorage.multiRemove(["accessToken", "refreshToken"]);
        return null;
      }

      await AsyncStorage.setItem("accessToken", newAccessToken);
      if (newRefreshToken) {
        await AsyncStorage.setItem("refreshToken", newRefreshToken);
      }

      return newAccessToken;
    } catch (e) {
      // 리프레시 실패 시 토큰 정리
      try { await AsyncStorage.multiRemove(["accessToken", "refreshToken"]); } catch {}
      return null;
    } finally {
      refreshing = null;
    }
  })();

  return refreshing;
}
