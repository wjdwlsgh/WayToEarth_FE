// hooks/useKakaoLogin.ts
import { useCallback } from "react";
import { Alert, Platform } from "react-native";
import {
  isKakaoTalkInstalled,
  login,
  loginWithKakaoAccount,
  logout,
} from "@react-native-seoul/kakao-login";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { kakaoLoginWithSDK } from "../utils/api/auth";

export default function useKakaoLogin() {
  return useCallback(async () => {
    try {
      // 네이티브 모듈 가드
      if (typeof isKakaoTalkInstalled !== "function") {
        throw new Error(
          Platform.select({
            android:
              "Kakao SDK 네이티브 모듈이 로드되지 않았습니다. Expo Go가 아닌 개발 빌드에서 실행 중인지, 그리고 prebuild/빌드를 다시 했는지 확인하세요.",
            ios: "Kakao SDK 네이티브 모듈이 로드되지 않았습니다. 개발 빌드에서 실행하세요.",
            default: "지원되지 않는 플랫폼입니다.",
          })
        );
      }

      const installed = await isKakaoTalkInstalled();
      const { accessToken } = installed
        ? await login()
        : await loginWithKakaoAccount();

      const serverRes = await kakaoLoginWithSDK(accessToken);
      const jwt =
        serverRes?.jwt ||
        serverRes?.accessToken ||
        serverRes?.token ||
        serverRes?.data?.accessToken;

      if (!jwt) throw new Error("서버에서 JWT 토큰을 받지 못했습니다.");
      await AsyncStorage.setItem("jwtToken", String(jwt));
      Alert.alert("로그인 성공", "이제 보호 API를 호출할 수 있어요.");
    } catch (e: any) {
      Alert.alert("카카오 로그인 실패", e?.message || String(e));
      try {
        await logout();
      } catch {}
    }
  }, []);
}
