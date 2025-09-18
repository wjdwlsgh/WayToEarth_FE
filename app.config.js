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
      supportsTablet: true,
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    },
    android: {
      package: "com.jeongjinho.waytoearth",
      config: {
        googleMaps: { apiKey: process.env.ANDROID_MAPS_KEY },
      },
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
    },
    web: { favicon: "./assets/favicon.png" },

    // ✅ 공식 카카오 플러그인만 사용
    plugins: [
      [
        "@react-native-seoul/kakao-login",
        { kakaoAppKey: process.env.KAKAO_NATIVE_APP_KEY },
      ],
    ],

    extra: {
      kakaoNativeAppKey: process.env.KAKAO_NATIVE_APP_KEY,
      kakaoRestApiKey: process.env.KAKAO_REST_API_KEY,
      eas: { projectId: "7a5e6a60-69ad-4ddc-8301-9aaf03e404a6" },
    },
  },
};
