import { registerRootComponent } from "expo";
import messaging from "@react-native-firebase/messaging";
import notifee from "@notifee/react-native";
import App from "./App";

// FCM 백그라운드 메시지 핸들러 (앱 시작 전 등록 필수)
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log("📬 백그라운드 메시지 수신:", remoteMessage);

  // Notifee로 백그라운드 알림 표시
  if (remoteMessage.notification) {
    await notifee.displayNotification({
      title: remoteMessage.notification.title || "Way to Earth",
      body: remoteMessage.notification.body || "",
      data: remoteMessage.data,
      android: {
        channelId: "waytoearth_running",
        smallIcon: "ic_launcher",
        color: "#10b981",
      },
    });
  }
});

registerRootComponent(App);
