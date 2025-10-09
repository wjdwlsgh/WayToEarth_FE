// app.config.ts
import "dotenv/config";

export default {
  expo: {
    name: "WayToEarth",
    slug: "waytoearth",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: false,
    scheme: "waytoearth",
    owner: "waytoearth",
    jsEngine: "hermes",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },

    ios: {
      bundleIdentifier: "com.waytoearth", // ✅ 필수 추가
      supportsTablet: true,
      config: { googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY },
    },

    android: {
      package: "com.waytoearth", // ✅ 이미 있어서 OK
      config: { googleMaps: { apiKey: process.env.ANDROID_MAPS_KEY } },
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
    },

    web: { favicon: "./assets/favicon.png" },

    plugins: [
      [
        "expo-build-properties",
        {
          android: {
            kotlinVersion: "2.0.21",
            gradlePluginVersion: "8.6.1",
          },
        },
      ],
      [
        "@react-native-seoul/kakao-login",
        { kakaoAppKey: process.env.KAKAO_NATIVE_APP_KEY },
      ],
    ],

    extra: {
      kakaoNativeAppKey: process.env.KAKAO_NATIVE_APP_KEY,
      kakaoRestApiKey: process.env.KAKAO_REST_API_KEY,
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || "https://api.waytoearth.cloud",
      mockEnabled: process.env.EXPO_PUBLIC_API_MOCK === "1",
      crewMockEnabled: true, // 개발 편의: 크루 기능을 목 데이터로 사용
      eas: { projectId: "7a5e6a60-69ad-4ddc-8301-9aaf03e404a6" },
    },
  },
};
