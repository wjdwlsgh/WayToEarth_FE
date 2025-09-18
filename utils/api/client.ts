// utils/api/client.ts
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const client = axios.create({
  baseURL: "http://waytoearth.duckdns.org:8080",
  timeout: 10000,
});

client.interceptors.request.use(async (config) => {
  const t = await AsyncStorage.getItem("jwtToken");
  if (t) {
    config.headers = {
      ...(config.headers || {}),
      Authorization: `Bearer ${t}`,
    } as any;
  }
  return config;
});
