import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

export default function UserInfoInputScreen({ navigation }) {
  const [nickname, setNickname] = useState("");
  const [location, setLocation] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [goal, setGoal] = useState("");
  const [gender, setGender] = useState(null);
  const [isNicknameChecked, setIsNicknameChecked] = useState(false);

  // ✅ 닉네임 중복 확인
  const handleNicknameCheck = async () => {
    if (!nickname.trim()) {
      Alert.alert("입력 오류", "닉네임을 입력해주세요.");
      return;
    }

    try {
      const res = await axios.get(
        `http://10.50.205.250:8080/v1/users/check-nickname`,
        {
          params: { nickname },
        }
      );

      console.log("닉네임 체크 응답:", res.data);

      // 서버 응답 구조에 맞게 조건 수정
      if (
        res.data.isDuplicate === true || // duplicated 필드가 true이면 중복
        res.data.success === false // success가 false이면 중복
      ) {
        Alert.alert(
          "중복 닉네임",
          res.data.message || "이미 사용 중인 닉네임입니다."
        );
        setIsNicknameChecked(false);
      } else {
        Alert.alert("사용 가능", "사용 가능한 닉네임입니다.");
        setIsNicknameChecked(true);
      }
    } catch (error) {
      console.error(
        "❌ 닉네임 중복 확인 실패:",
        error.response?.data || error.message
      );
      Alert.alert("오류", "중복 확인 중 문제가 발생했습니다.");
      setIsNicknameChecked(false);
    }
  };

  // ✅ 온보딩 정보 저장
  const handleStart = async () => {
    if (!nickname || !location || !ageRange || !goal || !gender) {
      Alert.alert("입력 오류", "모든 항목을 입력해주세요.");
      return;
    }

    if (!isNicknameChecked) {
      Alert.alert("중복 확인 필요", "닉네임 중복 확인을 해주세요.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) {
        Alert.alert("인증 오류", "로그인 토큰을 찾을 수 없습니다.");
        return;
      }

      const payload = {
        nickname,
        residence: location,
        age_group: ageRange,
        weekly_goal_distance: goal,
        gender,
      };

      await axios.post(
        "http://10.50.205.250:8080/v1/auth/onboarding",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert("입력 완료", "러닝을 시작해봅시다!");
      navigation.navigate("main");
    } catch (error) {
      console.error(
        "❌ 정보 저장 실패:",
        error.response?.data || error.message
      );
      Alert.alert("오류", "정보 저장에 실패했습니다.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.mainTitle}>조금 더 알고 싶어요!</Text>
        <Text style={styles.subTitle}>
          러닝을 시작하기 위한{"\n"}기본 정보를 입력해주세요
        </Text>

        {/* 닉네임 */}
        <View style={styles.inputWrapper}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>닉네임</Text>
            <TextInput
              placeholder="ex) 런닝맨"
              value={nickname}
              onChangeText={(text) => {
                setNickname(text);
                setIsNicknameChecked(false); // 닉네임 변경 시 확인 상태 초기화
              }}
              style={styles.inputText}
            />
          </View>
          <TouchableOpacity
            style={styles.dupCheckButton}
            onPress={handleNicknameCheck}
          >
            <Text style={styles.dupCheckText}>중복확인</Text>
          </TouchableOpacity>
        </View>

        {/* 거주지 */}
        <View style={styles.inputBox}>
          <Text style={styles.label}>거주지</Text>
          <TextInput
            placeholder="ex) 춘천시"
            value={location}
            onChangeText={setLocation}
            style={styles.inputText}
          />
        </View>

        {/* 연령대 */}
        <View style={styles.inputBox}>
          <Text style={styles.label}>연령대</Text>
          <TextInput
            placeholder="ex) 20대"
            value={ageRange}
            onChangeText={setAgeRange}
            style={styles.inputText}
          />
        </View>

        {/* 주간 목표 */}
        <View style={styles.inputBox}>
          <Text style={styles.label}>주간 목표</Text>
          <TextInput
            placeholder="ex) 10km 러닝"
            value={goal}
            onChangeText={setGoal}
            style={styles.inputText}
          />
        </View>

        {/* 성별 */}
        <View style={styles.genderContainer}>
          <TouchableOpacity
            style={[
              styles.genderBox,
              gender === "남성" && styles.genderBoxActive,
            ]}
            onPress={() => setGender("남성")}
          >
            <Text style={styles.genderText}>남성</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.genderBox,
              gender === "여성" && styles.genderBoxActive,
            ]}
            onPress={() => setGender("여성")}
          >
            <Text style={styles.genderText}>여성</Text>
          </TouchableOpacity>
        </View>

        {/* 시작하기 */}
        <TouchableOpacity style={styles.startButton} onPress={handleStart}>
          <Text style={styles.startButtonText}>시작하기</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  content: {
    padding: 24,
    paddingTop: 40,
    paddingBottom: 100,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 16,
    color: "rgba(0,0,0,0.54)",
    marginBottom: 30,
  },
  inputWrapper: {
    backgroundColor: "rgba(204,222,235,0.5)",
    borderWidth: 1,
    borderColor: "#d9d9d9",
    borderRadius: 15,
    padding: 16,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  inputBox: {
    backgroundColor: "rgba(204,222,235,0.5)",
    borderWidth: 1,
    borderColor: "#d9d9d9",
    borderRadius: 15,
    padding: 16,
    marginBottom: 20,
  },
  label: {
    fontSize: 10,
    color: "#b6adad",
    fontWeight: "300",
  },
  inputText: {
    fontSize: 12,
    color: "#000",
    marginTop: 4,
    padding: 0,
  },
  dupCheckButton: {
    backgroundColor: "#667eea",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    opacity: 0.71,
    marginLeft: 10,
  },
  dupCheckText: {
    fontSize: 10,
    color: "#fff",
  },
  genderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  genderBox: {
    flex: 1,
    backgroundColor: "rgba(204,222,235,0.5)",
    borderColor: "#d9d9d9",
    borderWidth: 1,
    borderRadius: 15,
    paddingVertical: 14,
    marginHorizontal: 5,
    alignItems: "center",
  },
  genderBoxActive: {
    backgroundColor: "#4A90E2",
  },
  genderText: {
    fontSize: 14,
    color: "#000",
  },
  startButton: {
    backgroundColor: "#000",
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 10,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
