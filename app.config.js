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
      package: "cloud.waytoearth", // ✅ Firebase와 일치하도록 수정
      googleServicesFile: "./google-services.json", // ✅ Firebase 설정
      permissions: [
        "POST_NOTIFICATIONS", // Android 13+ 알림 권한
      ],
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
      "@react-native-firebase/app",
      "@react-native-firebase/messaging",
    ],

    extra: {
      kakaoNativeAppKey: process.env.KAKAO_NATIVE_APP_KEY,
      kakaoRestApiKey: process.env.KAKAO_REST_API_KEY,
      eas: { projectId: "7a5e6a60-69ad-4ddc-8301-9aaf03e404a6" },
    },
  },
};
