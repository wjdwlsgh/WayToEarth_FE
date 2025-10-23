import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// Secure storage (Expo SecureStore) is preferred; fallback to AsyncStorage if unavailable
let SecureStore: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  SecureStore = require("expo-secure-store");
} catch {}

const ACCESS_KEY = "accessToken"; // kept in-memory primarily
const REFRESH_KEY = "refreshToken"; // stored securely

let accessTokenMemory: string | null = null;

async function secureGetItem(key: string): Promise<string | null> {
  try {
    if (SecureStore?.getItemAsync) return await SecureStore.getItemAsync(key);
  } catch {}
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

async function secureSetItem(key: string, value: string): Promise<void> {
  try {
    if (SecureStore?.setItemAsync) {
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
      });
      return;
    }
  } catch {}
  try {
    await AsyncStorage.setItem(key, value);
  } catch {}
}

async function secureDeleteItem(key: string): Promise<void> {
  try {
    if (SecureStore?.deleteItemAsync) {
      await SecureStore.deleteItemAsync(key);
      return;
    }
  } catch {}
  try {
    await AsyncStorage.removeItem(key);
  } catch {}
}

export function getAccessToken(): string | null {
  return accessTokenMemory;
}

export async function setTokens(accessToken: string, refreshToken?: string | null) {
  accessTokenMemory = accessToken || null;
  if (refreshToken) {
    await secureSetItem(REFRESH_KEY, refreshToken);
  }
}

export async function clearTokens() {
  accessTokenMemory = null;
  await Promise.all([
    secureDeleteItem(REFRESH_KEY),
    // cleanup legacy keys if they exist
    AsyncStorage.removeItem(ACCESS_KEY).catch(() => {}),
    AsyncStorage.removeItem("jwtToken").catch(() => {}),
  ]);
}

export async function getRefreshToken(): Promise<string | null> {
  return await secureGetItem(REFRESH_KEY);
}

// Attempt to ensure we have an in-memory access token, using refresh token if possible
export async function ensureAccessToken(baseURL = "https://api.waytoearth.cloud"): Promise<string | null> {
  if (accessTokenMemory) return accessTokenMemory;
  const rt = await getRefreshToken();
  if (!rt) return null;
  const newAccess = await refreshAccessToken(baseURL);
  return newAccess;
}

let refreshing: Promise<string | null> | null = null;
export async function refreshAccessToken(baseURL = "https://api.waytoearth.cloud"): Promise<string | null> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        await clearTokens();
        return null;
      }
      const url = `${baseURL.replace(/\/+$/, "")}/v1/auth/refresh`;
      const res = await axios.post(url, { refreshToken }, { timeout: 10000 });
      const payload = res?.data && typeof res.data === "object" && "data" in res.data ? (res.data as any).data : res?.data;
      const accessToken: string | undefined = payload?.accessToken;
      const newRefresh: string | null | undefined = payload?.refreshToken ?? null;
      if (!accessToken) {
        await clearTokens();
        return null;
      }
      accessTokenMemory = accessToken;
      if (newRefresh) await secureSetItem(REFRESH_KEY, newRefresh);
      return accessToken;
    } catch (e) {
      await clearTokens();
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

// For legacy migration: pull from AsyncStorage if present
export async function migrateLegacyTokens() {
  try {
    const legacyAccess = await AsyncStorage.getItem("accessToken");
    const legacyJwt = await AsyncStorage.getItem("jwtToken");
    const legacyRefresh = await AsyncStorage.getItem("refreshToken");
    accessTokenMemory = legacyAccess || legacyJwt || accessTokenMemory;
    if (legacyRefresh) await secureSetItem(REFRESH_KEY, legacyRefresh);
  } catch {}
}

