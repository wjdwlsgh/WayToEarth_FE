// utils/notifications.ts
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { client } from "./api/client";

// 알림 표시 방식 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * FCM 토큰 등록
 * 앱 시작 시 또는 로그인 후 호출
 */
export async function registerForPushNotificationsAsync() {
  let token = "";

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("waytoearth_running", {
      name: "러닝 알림",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#10b981",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("알림 권한이 거부되었습니다.");
      return null;
    }

    // FCM 토큰 발급
    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })
    ).data;

    console.log("FCM Token:", token);
  } else {
    console.warn("실제 기기에서만 푸시 알림을 사용할 수 있습니다.");
  }

  return token;
}

/**
 * FCM 토큰을 백엔드에 등록
 */
export async function sendTokenToServer(fcmToken: string) {
  try {
    const deviceId = Constants.deviceId || Constants.sessionId || "unknown";
    const deviceType = Platform.OS === "ios" ? "IOS" : "ANDROID";

    await client.post("/v1/notifications/fcm-token", {
      fcmToken,
      deviceId,
      deviceType,
    });

    console.log("FCM 토큰 등록 성공");
  } catch (error) {
    console.error("FCM 토큰 등록 실패:", error);
  }
}

/**
 * FCM 토큰 비활성화 (로그아웃 시)
 */
export async function deactivateToken() {
  try {
    const deviceId = Constants.deviceId || Constants.sessionId || "unknown";

    await client.delete(`/v1/notifications/fcm-token/${deviceId}`);

    console.log("FCM 토큰 비활성화 성공");
  } catch (error) {
    console.error("FCM 토큰 비활성화 실패:", error);
  }
}

/**
 * 알림 리스너 설정
 */
export function setupNotificationListeners() {
  // 앱이 포그라운드에 있을 때 알림 수신
  const notificationListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log("알림 수신:", notification);
    }
  );

  // 사용자가 알림을 탭했을 때
  const responseListener =
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("알림 탭:", response);
      // 필요한 화면으로 네비게이션
      // navigation.navigate('...')
    });

  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}
