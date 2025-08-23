// App.tsx
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
import FeedComposeScreen from "./Pages/FeedScreen";

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="LiveRunningScreen"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Onboading" component={Onboading} />
        <Stack.Screen name="Main" component={Main} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="LiveRunningScreen" component={LiveRunningScreen} />
        <Stack.Screen
          name="RunSummary"
          component={RunSummaryScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="FeedCompose"
          component={FeedComposeScreen}
          options={{ title: "공유하기" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
