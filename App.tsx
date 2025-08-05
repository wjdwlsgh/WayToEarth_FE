// App.tsx
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import * as Linking from "expo-linking";

import type { RootStackParamList } from "./types/types";

import Onboading from "./Pages/Onboading";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import MapScreen from "./Pages/MapScreen";

const Stack = createStackNavigator<RootStackParamList>();

// ✅ Linking 설정
const linking = {
  prefixes: ["waytoearth://"], // app.config.ts에 등록한 스킴
  config: {
    screens: {
      Onboading: "onboarding",
      Login: "login",
      Register: "login-success", // 백엔드 리다이렉트 path
      MapScreen: "map",
    },
  },
};

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Onboading" component={Onboading} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="MapScreen" component={MapScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
