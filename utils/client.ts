// utils/api/client.ts
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const client = axios.create({
  baseURL: "http://waytoearth.duckdns.org:8080",
  timeout: 15000,
});

const NO_AUTH_PATHS = ["/v1/auth/kakao", "/v1/auth/onboarding"];

client.interceptors.request.use(async (config) => {
  const url = config.url ?? "";
  const skipAuth = NO_AUTH_PATHS.some((p) => url.startsWith(p));
  if (!skipAuth) {
    const t = await AsyncStorage.getItem("jwtToken");
    if (t) {
      (config.headers ??= {})["Authorization"] = `Bearer ${t}`;
    }
  }
  return config;
});
