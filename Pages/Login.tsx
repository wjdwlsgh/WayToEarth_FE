import React from "react";
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import KakaoLoginButton from "../components/KakaoLoginButton";
import RunningManIcon from "../components/Running/RunningManIcon";
import useKakaoLogin from "../hooks/useKakaoLogin";

const { height } = Dimensions.get("window");

export default function WayToEarthOnboarding() {
  const { handleKakaoLogin, logText, loading } = useKakaoLogin();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.mainTitle}>Way to Earth로</Text>
          <Text style={styles.subTitle}>
            <Text style={styles.highlight}>러닝</Text>을 재미있게
          </Text>
        </View>

        <View style={styles.illustrationContainer}>
          <RunningManIcon />
        </View>

        <View style={styles.buttonContainer}>
          <KakaoLoginButton
            onPress={() => {
              if (__DEV__) console.log("🔥 [TEST] 카카오 로그인 버튼 클릭됨");
              handleKakaoLogin();
            }}
          />

          {/* 상태 메시지 */}
          <View style={{ alignItems: "center", marginTop: 20 }}>
            {loading ? (
              <ActivityIndicator size="small" color="#4A90E2" />
            ) : (
              <Text style={{ color: "#666", fontSize: 12 }}>{logText}</Text>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "space-between",
    paddingTop: height * 0.15,
    paddingBottom: 50,
  },
  textContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 8,
    textAlign: "center",
  },
  subTitle: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
  },
  highlight: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#4A90E2",
    textAlign: "center",
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 60,
  },
  buttonContainer: {
    paddingHorizontal: 4,
  },
});
