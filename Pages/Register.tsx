import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
} from "react-native";
import useNicknameCheck from "../hooks/useNicknameCheck";
import useRegister from "../hooks/useRegister";

interface UserInfo {
  nickname: string;
  location: string;
  age: string;
  runningDistance: string;
  gender: "male" | "female" | null;
}

export default function Register() {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    nickname: "",
    location: "",
    age: "",
    runningDistance: "",
    gender: null,
  });

  const { handleCheck, checked } = useNicknameCheck();
  const handleRegister = useRegister();

  const handleInputChange = (field: keyof UserInfo, value: string) => {
    setUserInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGenderSelect = (gender: "male" | "female") => {
    setUserInfo((prev) => ({
      ...prev,
      gender,
    }));
  };

  const validateForm = () => {
    if (!userInfo.nickname.trim()) {
      Alert.alert("알림", "닉네임을 입력해주세요.");
      return false;
    }
    if (!userInfo.location.trim()) {
      Alert.alert("알림", "거주지를 입력해주세요.");
      return false;
    }
    if (!userInfo.age.trim()) {
      Alert.alert("알림", "연령대를 입력해주세요.");
      return false;
    }
    if (!userInfo.runningDistance.trim()) {
      Alert.alert("알림", "주간 목표를 입력해주세요.");
      return false;
    }
    if (!userInfo.gender) {
      Alert.alert("알림", "성별을 선택해주세요.");
      return false;
    }
    return true;
  };

  const isFormValid =
    userInfo.nickname &&
    userInfo.location &&
    userInfo.age &&
    userInfo.runningDistance &&
    userInfo.gender;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.mainTitle}>조금 더 알고 싶어요!</Text>
          <Text style={styles.subTitle}>러닝을 시작하기 위한</Text>
          <Text style={styles.subTitle}>기본 정보를 입력해주세요</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Text style={styles.placeholder}>닉네임</Text>
              <TextInput
                style={styles.textInput}
                value={userInfo.nickname}
                onChangeText={(text) => handleInputChange("nickname", text)}
                placeholder="ex) 런닝맨"
                placeholderTextColor="#999999"
                maxLength={20}
              />
              {userInfo.nickname && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => handleCheck(userInfo.nickname)}
                >
                  <Text style={styles.clearButtonText}>중복확인</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Text style={styles.placeholder}>거주지</Text>
              <TextInput
                style={styles.textInput}
                value={userInfo.location}
                onChangeText={(text) => handleInputChange("location", text)}
                placeholder="ex) 춘천시"
                placeholderTextColor="#999999"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Text style={styles.placeholder}>연령대</Text>
              <TextInput
                style={styles.textInput}
                value={userInfo.age}
                onChangeText={(text) => handleInputChange("age", text)}
                placeholder="ex) 20대 후반"
                placeholderTextColor="#999999"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Text style={styles.placeholder}>주간 목표</Text>
              <TextInput
                style={styles.textInput}
                value={userInfo.runningDistance}
                onChangeText={(text) =>
                  handleInputChange("runningDistance", text)
                }
                placeholder="ex) 10km 러닝"
                placeholderTextColor="#999999"
              />
            </View>
          </View>

          <View style={styles.genderContainer}>
            <TouchableOpacity
              style={[
                styles.genderButton,
                userInfo.gender === "male" && styles.selectedGenderButton,
              ]}
              onPress={() => handleGenderSelect("male")}
            >
              <Text
                style={[
                  styles.genderButtonText,
                  userInfo.gender === "male" && styles.selectedGenderButtonText,
                ]}
              >
                남성
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.genderButton,
                userInfo.gender === "female" && styles.selectedGenderButton,
              ]}
              onPress={() => handleGenderSelect("female")}
            >
              <Text
                style={[
                  styles.genderButtonText,
                  userInfo.gender === "female" &&
                    styles.selectedGenderButtonText,
                ]}
              >
                여성
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            isFormValid && styles.submitButtonActive,
          ]}
          onPress={() => {
            if (validateForm() && checked) {
              handleRegister(userInfo);
            } else {
              Alert.alert(
                "알림",
                "모든 입력값을 완료하고 닉네임 중복확인을 해주세요."
              );
            }
          }}
          disabled={!isFormValid}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.submitButtonText,
              isFormValid && styles.submitButtonTextActive,
            ]}
          >
            시작하기
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  headerContainer: { marginBottom: 40 },
  mainTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 16,
    color: "#666666",
    lineHeight: 24,
  },
  formContainer: { gap: 20 },
  inputContainer: { marginBottom: 4 },
  inputWrapper: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    minHeight: 56,
    justifyContent: "center",
    position: "relative",
  },
  placeholder: {
    fontSize: 12,
    color: "#999999",
    marginBottom: 2,
  },
  textInput: {
    fontSize: 16,
    color: "#333333",
    padding: 0,
    minHeight: 24,
  },
  clearButton: {
    position: "absolute",
    right: 16,
    top: "50%",
    transform: [{ translateY: -12 }],
    backgroundColor: "#8B7CF6",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 5,
  },
  clearButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
  },
  genderContainer: { flexDirection: "row", gap: 12, marginTop: 4 },
  genderButton: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedGenderButton: { backgroundColor: "#8B7CF6" },
  genderButtonText: {
    fontSize: 16,
    color: "#666666",
    fontWeight: "500",
  },
  selectedGenderButtonText: { color: "#ffffff" },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
  },
  submitButton: {
    backgroundColor: "#CCCCCC",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonActive: { backgroundColor: "#000000" },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#999999",
  },
  submitButtonTextActive: { color: "#ffffff" },
});
