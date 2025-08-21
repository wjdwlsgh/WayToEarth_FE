// app.config.ts
import "dotenv/config";

export default {
  expo: {
    name: "WayToEarth",
    slug: "WayToEarth",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: false,
    scheme: "waytoearth",
    owner: "jeongjinho",
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
        googleMaps: {
          apiKey: process.env.ANDROID_MAPS_KEY,
        },
      },
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    extra: {
      kakaoNativeAppKey: process.env.KAKAO_NATIVE_APP_KEY,
      kakaoRestApiKey: process.env.KAKAO_REST_API_KEY,
      eas: {
        projectId: "92a31a7c-397a-417f-93bf-841ba76ac6bd", // ✅ 여기 추가
      },
    },
  },
};
