import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
} from "react-native";
import KakaoLogo from "../assets/kakao-talk-communication.svg";

const { width, height } = Dimensions.get("window");

// 러닝맨 아이콘 컴포넌트
const RunningManIcon = () => {
  const animatedValue = new Animated.Value(0);

  React.useEffect(() => {
    // 러닝맨 애니메이션 (위아래로 살짝 움직임)
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
  }, []);

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  return (
    <View style={styles.iconContainer}>
      <Animated.View
        style={[styles.runningMan, { transform: [{ translateY }] }]}
      >
        {/* 러닝맨 머리 */}
        <View style={styles.head} />

        {/* 러닝맨 몸통 */}
        <View style={styles.body}>
          {/* 팔 */}
          <View style={styles.leftArm} />
          <View style={styles.rightArm} />

          {/* 다리 */}
          <View style={styles.leftLeg} />
          <View style={styles.rightLeg} />
        </View>
      </Animated.View>

      {/* 그림자 */}
      <View style={styles.shadow} />
    </View>
  );
};

// 카카오 아이콘 컴포넌트
const KakaoIcon = () => (
  <View style={styles.kakaoIcon}>
    <View style={styles.kakaoBody}>
      {/* 카카오 얼굴 */}
      <View style={styles.kakaoFace}>
        <View style={styles.kakaoEye} />
        <View style={[styles.kakaoEye, { marginLeft: 8 }]} />
        <View style={styles.kakaoMouth} />
      </View>
    </View>
  </View>
);

export default function WayToEarthOnboarding() {
  const handleKakaoLogin = () => {
    // 카카오 로그인 로직
    console.log("카카오 로그인 시작");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.content}>
        {/* 메인 텍스트 */}
        <View style={styles.textContainer}>
          <Text style={styles.mainTitle}>Way to Earth로</Text>
          <Text style={styles.subTitle}>
            <Text style={styles.highlight}>러닝</Text>을 재미있게
          </Text>
        </View>

        {/* 러닝맨 아이콘 */}
        <View style={styles.illustrationContainer}>
          <RunningManIcon />
        </View>

        {/* 카카오 로그인 버튼 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.kakaoButton}
            onPress={handleKakaoLogin}
            activeOpacity={0.8}
          >
            <KakaoLogo width={20} height={20} marginRight={5} />
            <Text style={styles.kakaoButtonText}>카카오 계정으로 계속하기</Text>
          </TouchableOpacity>
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
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  runningMan: {
    position: "relative",
    alignItems: "center",
  },
  head: {
    width: 24,
    height: 24,
    backgroundColor: "#4A90E2",
    borderRadius: 12,
    marginBottom: 4,
  },
  body: {
    width: 20,
    height: 40,
    backgroundColor: "#4A90E2",
    borderRadius: 10,
    position: "relative",
  },
  leftArm: {
    position: "absolute",
    width: 20,
    height: 6,
    backgroundColor: "#4A90E2",
    borderRadius: 3,
    top: 5,
    left: -18,
    transform: [{ rotate: "-30deg" }],
  },
  rightArm: {
    position: "absolute",
    width: 20,
    height: 6,
    backgroundColor: "#4A90E2",
    borderRadius: 3,
    top: 8,
    right: -18,
    transform: [{ rotate: "45deg" }],
  },
  leftLeg: {
    position: "absolute",
    width: 18,
    height: 6,
    backgroundColor: "#4A90E2",
    borderRadius: 3,
    bottom: -8,
    left: -12,
    transform: [{ rotate: "20deg" }],
  },
  rightLeg: {
    position: "absolute",
    width: 18,
    height: 6,
    backgroundColor: "#4A90E2",
    borderRadius: 3,
    bottom: -5,
    right: -14,
    transform: [{ rotate: "-45deg" }],
  },
  shadow: {
    width: 60,
    height: 8,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 30,
    marginTop: 15,
  },
  buttonContainer: {
    paddingHorizontal: 4,
  },
  kakaoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE500",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  kakaoIcon: {
    marginRight: 12,
  },
  kakaoBody: {
    width: 24,
    height: 24,
    backgroundColor: "#3C1E1E",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  kakaoFace: {
    alignItems: "center",
  },
  kakaoEye: {
    width: 2,
    height: 2,
    backgroundColor: "#FEE500",
    borderRadius: 1,
    position: "absolute",
    top: -2,
  },
  kakaoMouth: {
    width: 6,
    height: 3,
    backgroundColor: "#FEE500",
    borderRadius: 3,
    marginTop: 2,
  },
  kakaoButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3C1E1E",
  },
});
