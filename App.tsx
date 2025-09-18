// App.tsx
import * as WebBrowser from "expo-web-browser";
WebBrowser.maybeCompleteAuthSession();
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import type { RootStackParamList } from "./types/types";
import "./global.css";

import Onboading from "./Pages/Onboading";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import Main from "./Pages/Main";
import RunSummaryScreen from "./Pages/RunSummaryscreen";
import LiveRunningScreen from "./Pages/LiveRunningScreen";
import Feed from "./Pages/FeedScreen";
import Feed2 from "./Pages/FeedScreen2";
import Profile from "./Pages/ProfileScreen";
import ProfileEdit from "./Pages/ProfileEditScreen";

import Emblem from "./Pages/EmblemCollectionScreen";

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Onboading"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Onboading" component={Onboading} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="LiveRunningScreen" component={LiveRunningScreen} />
        <Stack.Screen
          name="RunSummary"
          component={RunSummaryScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Feed"
          component={Feed}
          options={{ title: "공유하기" }}
        />
        <Stack.Screen name="Emblem" component={Emblem} />
        <Stack.Screen name="Feed2" component={Feed2} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="ProfileEdit" component={ProfileEdit} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
