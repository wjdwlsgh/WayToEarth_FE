// screens/WayToEarthOnboarding.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Dimensions,
  Alert,
  NativeModules,
} from "react-native";
import KakaoLoginButton from "../components/KakaoLoginButton";
import RunningManIcon from "../components/Running/RunningManIcon";
import useKakaoLogin from "../hooks/useKakaoLogin";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getMyProfile } from "../utils/api/users";
import { useNavigation } from "@react-navigation/native";

const { height } = Dimensions.get("window");

export default function WayToEarthOnboarding() {
  const handleKakaoLogin = useKakaoLogin();
  const navigation = useNavigation<any>();
  const [checking, setChecking] = useState(true);

  // 🔑 Dev 환경에서 한 번만 카카오 키해시 표시 (카카오 콘솔에 등록용)
  useEffect(() => {
    // 자동 로그인: 토큰 보유 + 프로필 조회 성공 시 러닝 화면으로 즉시 이동
    (async () => {
      try {
        const token = await AsyncStorage.getItem("jwtToken");
        if (token) {
          await getMyProfile();
          navigation.reset({ index: 0, routes: [{ name: "LiveRunningScreen" }] });
          return;
        }
      } catch (e) {
        // 토큰 없음/만료 → 버튼 노출
      } finally {
        setChecking(false);
      }
    })();

    // 개발 편의: 키해시 토스트(선택)
    (async () => {
      try {
        const hash = await (NativeModules as any)?.RNKakaoLogins?.getKeyHash?.();
        if (__DEV__ && hash) console.log("Kakao KeyHash:", hash);
      } catch {}
    })();
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.content}>
        {checking ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#666", marginBottom: 12 }}>자동 로그인 확인중…</Text>
          </View>
        ) : (
          <>
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
          <KakaoLoginButton onPress={handleKakaoLogin} />
        </View>
          </>
        )}
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
