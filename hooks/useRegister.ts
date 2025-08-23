import { Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { registerUser } from "../utils/api/users";
import type { UserInfo } from "../types/user";

export default function useRegister() {
  const navigation = useNavigation();

  const handleRegister = async (userInfo: UserInfo) => {
    try {
      await registerUser(userInfo);
      Alert.alert("성공", "회원가입이 완료되었습니다!");
      navigation.reset({
        index: 0,
        routes: [{ name: "Main" }], // Main 페이지로 이동
      });
    } catch (err) {
      Alert.alert("실패", "회원가입에 실패했습니다.");
    }
  };

  return handleRegister;
}
