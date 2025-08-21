import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

interface RegisterPayload {
  nickname: string;
  location: string;
  age: string;
  goal: string;
  gender: string | null;
}

export default function useRegister() {
  const handleRegister = async (
    payload: RegisterPayload,
    onSuccess?: () => void
  ) => {
    const { nickname, location, age, goal, gender } = payload;

    // 필수 값 확인
    if (!nickname || !location || !age || !goal || !gender) {
      Alert.alert("입력 오류", "모든 항목을 입력해주세요.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) {
        Alert.alert("인증 오류", "로그인 토큰을 찾을 수 없습니다.");
        return;
      }

      const requestData = {
        nickname,
        residence: location,
        age_group: age,
        weekly_goal_distance: goal,
        gender,
      };

      console.log("📡 회원정보 전송:", requestData);

      const res = await axios.post(
        "http://10.50.204.159:8080/auth/onboarding", // ⚠️ IP or ngrok 주소로 변경
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("✅ 응답:", res.data);
      Alert.alert("입력 완료", "러닝을 시작해봅시다!");
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error(
        "❌ 정보 저장 실패:",
        error.response?.data || error.message
      );
      Alert.alert("오류", "정보 저장에 실패했습니다.");
    }
  };

  return handleRegister;
}
