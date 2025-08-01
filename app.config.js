import "dotenv/config";

export default {
  expo: {
    name: "WayToEarth",
    slug: "WayToEarth",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    scheme: "waytoearth",
    owner: "jeongjinho",
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
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
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
      kakaoJavascriptKey: process.env.KAKAO_JAVASCRIPT_KEY,
      kakaoRestApiKey: process.env.KAKAO_REST_API_KEY,
    },
  },
};
