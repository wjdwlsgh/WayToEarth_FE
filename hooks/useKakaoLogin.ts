import { Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import Constants from "expo-constants";
import { kakaoLogin } from "../utils/api";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

export default function useKakaoLogin() {
  type Navigation = NativeStackNavigationProp<RootStackParamList>;
  const navigation = useNavigation<Navigation>();

  const kakaoRestApiKey = Constants.expoConfig?.extra?.kakaoRestApiKey ?? "";
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: "waytoearth",
  });

  console.log("✅ redirectUri:", redirectUri);

  const handleKakaoLogin = async () => {
    try {
      const authUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${kakaoRestApiKey}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=code`;

      // ✅ 최신 방식 (expo-auth-session v6 대응)
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri
      );
      console.log(result);

      if (result.type === "success" && result.url) {
        const url = new URL(result.url);
        const code = url.searchParams.get("code");

        if (code) {
          try {
            const { jwtToken } = await kakaoLogin(code, redirectUri);
            console.log("✅ JWT 토큰:", jwtToken);
            Alert.alert("로그인 성공", "환영합니다!");
            navigation.navigate("Register");
          } catch (error) {
            console.error("❌ 백엔드 요청 실패:", error);
            Alert.alert("로그인 실패", "토큰 요청 중 문제가 발생했어요");
          }
        } else {
          Alert.alert("로그인 실패", "인가 코드를 찾지 못했어요");
        }
      } else {
        Alert.alert("로그인 실패", "사용자가 로그인을 취소했어요");
      }
    } catch (err) {
      console.error("카카오 로그인 에러:", err);
      Alert.alert("로그인 실패", "예기치 못한 오류가 발생했어요");
    }
  };

  return handleKakaoLogin;
}
