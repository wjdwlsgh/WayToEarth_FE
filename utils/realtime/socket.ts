// utils/realtime/socket.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

export type SocketLike = {
  on: (event: string, cb: (...args: any[]) => void) => void;
  emit: (event: string, ...args: any[]) => void;
  disconnect: () => void;
  connected?: boolean;
};

export async function createSocket(): Promise<SocketLike | null> {
  let io: any = null;
  try {
    // Lazy require to avoid hard dependency when offline or not installed
    io = require("socket.io-client");
  } catch (e) {
    return null;
  }

  const extra: any = (Constants?.expoConfig as any)?.extra ?? {};
  const baseURL: string =
    (extra?.apiBaseUrl as string) ||
    (typeof process !== "undefined" && (process.env as any)?.EXPO_PUBLIC_API_BASE_URL) ||
    "https://api.waytoearth.cloud";
  const url = baseURL.replace(/\/+$/, "");
  const token = (await AsyncStorage.getItem("jwtToken")) || "";

  const socket = io.io(url, {
    path: "/socket.io",
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
    timeout: 10000,
    auth: { token: token ? `Bearer ${token}` : undefined },
  });

  return socket as SocketLike;
}

