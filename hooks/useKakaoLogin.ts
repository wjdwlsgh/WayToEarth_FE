// hooks/useKakaoLogin.ts
import { useCallback } from "react";
import { Alert, Platform, NativeModules } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { kakaoLoginWithSDK } from "../utils/api/auth";
import { useNavigation } from "@react-navigation/native";

type RNKakao = {
  isKakaoTalkLoginAvailable?: () => Promise<boolean>;
  isKakaoTalkInstalled?: () => Promise<boolean>;
  login: () => Promise<{ accessToken: string }>;
  loginWithKakaoAccount: () => Promise<{ accessToken: string }>;
  logout: () => Promise<void>;
  getKeyHash?: () => Promise<string>; // 👈 추가
};

export default function useKakaoLogin() {
  const navigation = useNavigation<any>();

  return useCallback(async () => {
    try {
      const Kakao = NativeModules.RNKakaoLogins as RNKakao | undefined;

      if (
        !Kakao ||
        typeof Kakao.login !== "function" ||
        typeof Kakao.loginWithKakaoAccount !== "function"
      ) {
        throw new Error(
          Platform.select({
            android:
              "Kakao SDK 네이티브 모듈을 불러오지 못했습니다. 개발 빌드(APK) 재설치 후 다시 실행하세요.",
            ios: "Kakao SDK 네이티브 모듈이 로드되지 않았습니다. 개발 빌드에서 실행하세요.",
            default: "지원되지 않는 플랫폼입니다.",
          })!
        );
      }

      // ✅ 키해시 한 번 표시 (필요 없으면 주석 처리)
      if (typeof Kakao.getKeyHash === "function") {
        const hash = await Kakao.getKeyHash();
        Alert.alert("Kakao KeyHash", hash); // 이 값을 카카오 콘솔에 등록
        console.log("Kakao KeyHash:", hash);
      }

      // 설치/가용 여부
      const talkAvailable =
        (typeof Kakao.isKakaoTalkLoginAvailable === "function"
          ? await Kakao.isKakaoTalkLoginAvailable()
          : typeof Kakao.isKakaoTalkInstalled === "function"
          ? await Kakao.isKakaoTalkInstalled()
          : false) || false;

      const { accessToken } = talkAvailable
        ? await Kakao.login()
        : await Kakao.loginWithKakaoAccount();

      const { jwtToken, isOnboardingCompleted } = await kakaoLoginWithSDK(
        accessToken
      );

      if (!jwtToken) throw new Error("서버에서 JWT 토큰을 받지 못했습니다.");

      await AsyncStorage.setItem("jwtToken", String(jwtToken));

      // ✅ 라우팅: 이미 회원가입 완료 → 러닝 화면, 미완료 → Register
      if (isOnboardingCompleted) {
        navigation.reset({ index: 0, routes: [{ name: "LiveRunningScreen" }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: "Register" }] });
      }
    } catch (e: any) {
      console.log("Kakao login error →", e, e?.code, e?.message);
      Alert.alert(
        "카카오 로그인 실패",
        [e?.code, e?.message || String(e)].filter(Boolean).join(" ")
      );
      try {
        const Kakao = NativeModules.RNKakaoLogins as RNKakao | undefined;
        await Kakao?.logout?.();
      } catch {}
    }
  }, [navigation]);
}
