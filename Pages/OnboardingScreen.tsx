import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from "react-native";

const { height } = Dimensions.get("window");

type OnboardingScreenProps = {
  onStart?: () => void;
  onSkip?: () => void;
  navigation?: any;
};

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onStart,
  onSkip,
  navigation,
}) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.content}>
        <Text style={styles.title}>
          [ 주제목 ] 에{"\n"}오신 것을 환영합니다!
        </Text>

        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>함영 부 목구</Text>
          <Text style={styles.description}>
            역사적 명소의 지인 경로를 달리며 탐험
          </Text>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🏆</Text>
              <Text style={styles.featureText}>
                랜드마크 도달 시 기념 스탬프 수집
              </Text>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>👥</Text>
              <Text style={styles.featureText}>
                다른 러너들과 방명록으로 소통
              </Text>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🏛️</Text>
              <Text style={styles.featureText}>
                각 장소의 흥미로운 스토리 가이드
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={
              onStart ??
              (() =>
                navigation?.reset?.({
                  index: 0,
                  routes: [{ name: "JourneyLoading" }],
                }))
            }
          >
            <Text style={styles.startButtonText}>시작하기</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={
              onSkip ??
              (() =>
                navigation?.reset?.({ index: 0, routes: [{ name: "Main" }] }))
            }
          >
            <Text style={styles.skipButtonText}>다시보지 않기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: height * 0.1,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 60,
    lineHeight: 32,
  },
  featuresContainer: { flex: 1, alignItems: "center" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 20,
  },
  featuresList: { width: "100%" },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  featureIcon: { fontSize: 24, marginRight: 16, width: 32 },
  featureText: { fontSize: 16, color: "#374151", flex: 1, lineHeight: 22 },
  buttonContainer: { width: "100%" },
  startButton: {
    backgroundColor: "#6366F1",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  startButtonText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  skipButton: {
    backgroundColor: "transparent",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  skipButtonText: { fontSize: 16, fontWeight: "500", color: "#6B7280" },
});

export default OnboardingScreen;
