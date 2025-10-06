// utils/notifications.ts
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import messaging from "@react-native-firebase/messaging";
import { client } from "./api/client";

// 알림 표시 방식 설정 (Expo Notifications - 포그라운드 알림용)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Firebase FCM 토큰 등록
 * Expo Push를 거치지 않고 Firebase를 직접 사용
 */
export async function registerForPushNotificationsAsync() {
  let token = "";

  // 시뮬레이터 체크
  if (!Device.isDevice) {
    const mockToken = `FirebaseToken[SIMULATOR-${Platform.OS}-${Date.now()}]`;
    console.log("⚠️ FCM Token (시뮬레이터 Mock):", mockToken);
    console.log("💡 실제 푸시 알림은 실제 기기에서만 작동합니다.");
    return mockToken;
  }

  try {
    // 1. 알림 권한 요청
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.warn("❌ 알림 권한이 거부되었습니다.");
      return null;
    }

    // 2. Android 알림 채널 설정
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("waytoearth_running", {
        name: "러닝 알림",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#10b981",
      });
    }

    // 3. Firebase FCM 토큰 발급 (Expo 서버를 거치지 않음!)
    token = await messaging().getToken();

    console.log("✅ Firebase FCM Token (실제 기기):", token);
    return token;
  } catch (error: any) {
    console.error("❌ Firebase FCM 토큰 발급 실패:", error?.message || error);
    return null;
  }
}

/**
 * FCM 토큰을 백엔드에 등록
 */
export async function sendTokenToServer(fcmToken: string) {
  try {
    const deviceId = Device.modelId || Device.osInternalBuildId || "unknown";
    const deviceType = Platform.OS === "ios" ? "IOS" : "ANDROID";

    await client.post("/v1/notifications/fcm-token", {
      fcmToken,
      deviceId,
      deviceType,
    });

    console.log("✅ FCM 토큰 백엔드 등록 성공");
  } catch (error: any) {
    console.error(
      "❌ FCM 토큰 백엔드 등록 실패:",
      error?.response?.data || error?.message || error
    );

    // 백엔드 에러는 앱 동작을 막지 않도록 조용히 처리
  }
}

/**
 * FCM 토큰 비활성화 (로그아웃 시)
 */
export async function deactivateToken() {
  try {
    const deviceId = Device.modelId || Device.osInternalBuildId || "unknown";

    await client.delete(`/v1/notifications/fcm-token/${deviceId}`);

    // Firebase 토큰 삭제
    await messaging().deleteToken();

    console.log("✅ FCM 토큰 비활성화 성공");
  } catch (error: any) {
    console.error(
      "❌ FCM 토큰 비활성화 실패:",
      error?.response?.data || error?.message || error
    );

    // 로그아웃은 계속 진행되도록 에러를 throw 하지 않음
  }
}

/**
 * Firebase 알림 리스너 설정
 */
export function setupNotificationListeners() {
  // 1. 포그라운드 메시지 수신 (앱이 켜져 있을 때)
  const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
    console.log("📩 포그라운드 알림 수신:", remoteMessage);

    // Expo Notifications로 로컬 알림 표시
    if (remoteMessage.notification) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: remoteMessage.notification.title || "Way to Earth",
          body: remoteMessage.notification.body || "",
          data: remoteMessage.data || {},
        },
        trigger: null, // 즉시 표시
      });
    }
  });

  // 2. 백그라운드 메시지 핸들러는 index.js에서 등록 필요
  // messaging().setBackgroundMessageHandler() 참고

  // 3. 알림 탭 이벤트 (앱이 백그라운드/종료 상태에서 알림 탭)
  const unsubscribeNotificationOpened = messaging().onNotificationOpenedApp(
    (remoteMessage) => {
      console.log("📱 알림 탭으로 앱 열림:", remoteMessage);
      // 필요한 화면으로 네비게이션
    }
  );

  // 4. 앱이 종료된 상태에서 알림을 탭해서 열었는지 확인
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        console.log("🚀 종료 상태에서 알림으로 앱 시작:", remoteMessage);
        // 필요한 화면으로 네비게이션
      }
    });

  // Expo Notifications 리스너 (로컬 알림용)
  const notificationListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log("🔔 로컬 알림 수신:", notification);
    }
  );

  const responseListener =
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("👆 로컬 알림 탭:", response);
      // 필요한 화면으로 네비게이션
    });

  // Cleanup 함수
  return () => {
    unsubscribeForeground();
    unsubscribeNotificationOpened();
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}

/**
 * FCM 토큰 갱신 리스너
 */
export function setupTokenRefreshListener() {
  return messaging().onTokenRefresh(async (newToken) => {
    console.log("🔄 FCM 토큰 갱신됨:", newToken);
    await sendTokenToServer(newToken);
  });
}
