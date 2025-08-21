import { useState, useEffect } from "react";
import { Alert, Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

export default function useKakaoLogin() {
  type Navigation = NativeStackNavigationProp<RootStackParamList>;
  const navigation = useNavigation<Navigation>();

  const kakaoRestApiKey = Constants.expoConfig?.extra?.kakaoRestApiKey ?? "";
  const redirectUri = "https://e56540bed708.ngrok-free.app/kakao/callback";

  const [logText, setLogText] = useState("🟡 로그인 대기 중...");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleUrl = async ({ url }: { url: string }) => {
      const parsedUrl = new URL(url);
      const code = parsedUrl.searchParams.get("code");

      if (code) {
        setLogText("✅ 인가 코드 수신! JWT 요청 중...");
        setLoading(true);
        try {
          const res = await axios.post(
            "http://10.50.205.250:8080/v1/auth/kakao",
            {
              code, // ✅ 이렇게 변경
              redirectUri,
              isMobile: true,
            }
          );

          const { jwtToken } = res.data;
          console.log("✅ JWT from backend:", jwtToken);

          await AsyncStorage.setItem("jwtToken", jwtToken);

          setLogText("🎉 로그인 성공! 페이지 이동 중...");
          Alert.alert("로그인 성공", "환영합니다!");
          navigation.navigate("Register");
        } catch (error) {
          console.error(
            "❌ 백엔드 오류:",
            error?.response?.data ?? error?.message ?? error
          );
          setLogText("❌ 서버 오류: JWT 요청 실패");
          Alert.alert("로그인 실패", "서버 통신 오류가 발생했습니다.");
        } finally {
          setLoading(false);
        }
      }
    };

    const subscribe = Linking.addEventListener("url", handleUrl);
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url });
    });

    return () => {
      subscribe.remove();
    };
  }, []);

  const handleKakaoLogin = () => {
    const authUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${kakaoRestApiKey}&redirect_uri=${redirectUri}&response_type=code`;
    setLogText("🟡 카카오 로그인 요청 중...");
    Linking.openURL(authUrl);
  };

  return { handleKakaoLogin, logText, loading };
}
