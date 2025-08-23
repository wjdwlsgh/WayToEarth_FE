import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

interface RegisterPayload {
  nickname: string;
  location: string;
  age: string;
  runningDistance: string;
  gender: "male" | "female" | null;
  token?: string;
}

export default function useRegister() {
  const handleRegister = async (payload: RegisterPayload) => {
    try {
      // 토큰 우선순위: props → AsyncStorage
      let token = payload.token;
      if (!token) {
        token = (await AsyncStorage.getItem("jwtToken")) || undefined;
      }

      if (!token) {
        Alert.alert("인증 오류", "로그인 토큰을 찾을 수 없습니다.");
        return;
      }

      // API 요청 데이터 매핑
      const requestData = {
        nickname: payload.nickname,
        residence: payload.location,
        age_group: payload.age,
        weekly_goal_distance: payload.runningDistance,
        gender: payload.gender,
      };

      console.log("📡 회원가입 요청 데이터:", requestData);

      const res = await axios.post(
        "http://10.50.204.159:8080/auth/onboarding", // ⚠️ 여기를 네 PC IP나 ngrok 주소로 변경
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("✅ 회원가입 응답:", res.data);
      Alert.alert("가입 완료", "러닝을 시작해봅시다!");
    } catch (error: any) {
      console.error("❌ 회원가입 실패:", error.response?.data || error.message);
      Alert.alert("오류", "회원가입에 실패했습니다.");
    }
  };

  return handleRegister;
}
