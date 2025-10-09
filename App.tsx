// App.tsx
import * as WebBrowser from "expo-web-browser";
WebBrowser.maybeCompleteAuthSession();
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import Constants from "expo-constants";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { RootStackParamList } from "./types/types";
import "./global.css";

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
import Feed from "./Pages/SendFeed";
import Feed2 from "./Pages/FeedScreen2";
import FeedDetail from "./Pages/FeedDetail";
import Profile from "./Pages/ProfileScreen";
import ProfileEdit from "./Pages/ProfileEditScreen";

import Emblem from "./Pages/EmblemCollectionScreen";
import Record from "./Pages/RecordScreen";
import RecordDetailScreen from "./Pages/RecordDetailScreen";
import UserInfoInputScreen from "./Pages/UserInfoInputScreen";
import LoginSuccessScreen from "./Pages/LoginSuccessScreen";
import CrewScreen from "./Pages/CrewScreen";
import CrewDetailScreen from "./Pages/CrewDetailScreen";
import CrewChatScreen from "./Pages/CrewChatScreen";
import TabBarAdapter from "./components/Layout/TabBarAdapter";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const extra: any = (Constants?.expoConfig as any)?.extra ?? {};
const CREW_MOCK = Boolean(extra?.crewMockEnabled) ||
  (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_CREW_MOCK === "1");

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBarAdapter {...props} />}
      screenOptions={{ headerShown: false }}
      initialRouteName={CREW_MOCK ? "Crew" : "LiveRunningScreen"}
    >
      <Tab.Screen name="Profile" component={Profile} />
      <Tab.Screen name="Crew" component={CrewScreen} />
      <Tab.Screen name="LiveRunningScreen" component={LiveRunningScreen} />
      <Tab.Screen name="Feed" component={Feed2} />
      <Tab.Screen name="Record" component={Record} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={CREW_MOCK ? "MainTabs" : "Onboading"}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Onboading" component={Onboading} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="LoginSuccess" component={LoginSuccessScreen} />
        <Stack.Screen name="Main" component={Main} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        {/* 여정 러닝: 로딩/가이드/리스트/디테일 */}
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
        <Stack.Screen name="CrewDetail" component={CrewDetailScreen} />
        <Stack.Screen name="CrewChat" component={CrewChatScreen} />

        {/* 하단 탭 대상 라우트들은 MainTabs 내부 */}
        <Stack.Screen
          name="RecordDetailScreen"
          component={RecordDetailScreen}
        />
        <Stack.Screen name="UserInfoInput" component={UserInfoInputScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
