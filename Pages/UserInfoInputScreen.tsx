import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";

type Props = { navigation?: any };

const UserInfoInputScreen: React.FC<Props> = ({ navigation }) => {
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");

  const onSubmit = () => {
    if (!nickname.trim()) {
      Alert.alert("확인", "닉네임을 입력해주세요.");
      return;
    }
    navigation?.goBack?.();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>프로필 설정</Text>
      <View style={styles.formRow}>
        <Text style={styles.label}>닉네임</Text>
        <TextInput
          value={nickname}
          onChangeText={setNickname}
          placeholder="예: 지구러너"
          style={styles.input}
        />
      </View>
      <View style={styles.formRow}>
        <Text style={styles.label}>소개</Text>
        <TextInput
          value={bio}
          onChangeText={setBio}
          placeholder="간단한 소개를 입력하세요"
          style={[styles.input, { height: 96 }]}
          multiline
        />
      </View>
      <TouchableOpacity style={styles.button} onPress={onSubmit}>
        <Text style={styles.buttonText}>저장</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 16 },
  formRow: { marginBottom: 12 },
  label: { color: "#374151", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  button: {
    marginTop: 8,
    backgroundColor: "#10b981",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700" },
});

export default UserInfoInputScreen;
