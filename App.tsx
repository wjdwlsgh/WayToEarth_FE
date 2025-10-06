// App.tsx
import * as WebBrowser from "expo-web-browser";
WebBrowser.maybeCompleteAuthSession();
import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { RootStackParamList } from "./types/types";
import "./global.css";
// import {
//   registerForPushNotificationsAsync,
//   sendTokenToServer,
//   setupNotificationListeners,
// } from "./utils/notifications";

import Onboading from "./Pages/Onboading";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import Main from "./Pages/Main";
import RunSummaryScreen from "./Pages/RunSummaryscreen";
import LiveRunningScreen from "./Pages/LiveRunningScreen";
import RunningComplete from "./Pages/RunningComplete";
import JourneyRouteListScreen from "./Pages/JourneyRouteListScreen";
import JourneyRouteDetailScreen from "./Pages/JourneyRouteDetailScreen";
import JourneyLoadingScreen from "./Pages/JourneyLoadingScreen";
import JourneyGuideScreen from "./Pages/JourneyGuideScreen";
import JourneyRunningScreen from "./Pages/JourneyRunningScreen";
import Feed from "./Pages/SendFeed";
import Feed2 from "./Pages/FeedScreen2";
import FeedDetail from "./Pages/FeedDetail";
import Profile from "./Pages/ProfileScreen";
import ProfileEdit from "./Pages/ProfileEditScreen";

import Emblem from "./Pages/EmblemCollectionScreen";
import Record from "./Pages/RecordScreen";
import RecordDetailScreen from "./Pages/RecordDetailScreen";
import AIFeedbackScreen from "./Pages/AIFeedbackScreen";
import UserInfoInputScreen from "./Pages/UserInfoInputScreen";
import LoginSuccessScreen from "./Pages/LoginSuccessScreen";
// import CrewScreen from "./Pages/CrewScreen";
import CrewDetailScreen from "./Pages/CrewDetailScreen";
import TabBarAdapter from "./components/Layout/TabBarAdapter";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// MainTabs: 하단 탭 네비게이터 (팀원 구조)
function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBarAdapter {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="LiveRunningScreen" component={LiveRunningScreen} />
      <Tab.Screen name="Feed" component={Feed2} />
      <Tab.Screen name="Record" component={Record} />
      {/* <Tab.Screen name="Crew" component={CrewScreen} /> */}
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    // FCM 토큰 등록 (시뮬레이터에서는 스킵)
    // (async () => {
    //   const token = await registerForPushNotificationsAsync();
    //   if (token) {
    //     // 백엔드에 토큰 전송 (로그인 후에 호출하는 것이 더 좋음)
    //     // await sendTokenToServer(token);
    //     console.log("FCM 토큰 발급 완료:", token);
    //   }
    // })();

    // // 알림 리스너 설정
    // const cleanup = setupNotificationListeners();

    // return cleanup;
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Onboading"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Onboading" component={Onboading} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="LoginSuccess" component={LoginSuccessScreen} />
        <Stack.Screen name="Main" component={Main} />
        <Stack.Screen name="MainTabs" component={MainTabs} />

        {/* 여정 러닝: 로딩/가이드/리스트/디테일/실행 */}
        <Stack.Screen name="JourneyLoading" component={JourneyLoadingScreen} />
        <Stack.Screen name="JourneyGuide" component={JourneyGuideScreen} />
        <Stack.Screen
          name="JourneyRouteList"
          component={JourneyRouteListScreen}
        />
        <Stack.Screen
          name="JourneyRouteDetail"
          component={JourneyRouteDetailScreen}
        />
        <Stack.Screen
          name="JourneyRunningScreen"
          component={JourneyRunningScreen}
        />
        <Stack.Screen name="RunningComplete" component={RunningComplete} />
        <Stack.Screen
          name="RunSummary"
          component={RunSummaryScreen}
          options={{ headerShown: false }}
        />

        {/* Feed/Profile/Record/Crew/LiveRunningScreen는 MainTabs로 이동 */}
        <Stack.Screen name="FeedDetail" component={FeedDetail} />
        {/* 공유 작성 화면(FeedCompose) 등록: RunSummary에서 사용 */}
        <Stack.Screen
          name="FeedCompose"
          component={Feed}
          options={{ title: "공유하기" }}
        />
        <Stack.Screen name="Emblem" component={Emblem} />
        <Stack.Screen name="ProfileEdit" component={ProfileEdit} />
        {/* <Stack.Screen name="CrewDetail" component={CrewDetailScreen} /> */}

        {/* 하단 탭 대상 라우트들은 MainTabs 내부 */}
        <Stack.Screen
          name="RecordDetailScreen"
          component={RecordDetailScreen}
        />
        <Stack.Screen
          name="AIFeedbackScreen"
          component={AIFeedbackScreen}
        />
        <Stack.Screen name="UserInfoInput" component={UserInfoInputScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
