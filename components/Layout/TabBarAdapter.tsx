import React from "react";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import BottomNavigation from "./BottomNav";

const ROUTE_TO_KEY: Record<string, string> = {
  Profile: "profile",
  Crew: "crew",
  LiveRunningScreen: "running",
  Feed: "feed",
  Record: "record",
};

const KEY_TO_ROUTE: Record<string, string> = {
  profile: "Profile",
  crew: "Crew",
  running: "LiveRunningScreen",
  feed: "Feed",
  record: "Record",
};

export default function TabBarAdapter({
  state,
  navigation,
}: BottomTabBarProps) {
  const route = state.routes[state.index];
  const activeTab = ROUTE_TO_KEY[route.name] || "running";

  const onTabPress = (key: string) => {
    const target = KEY_TO_ROUTE[key];
    if (!target) return;
    navigation.navigate(target as never);
  };

  return <BottomNavigation activeTab={activeTab} onTabPress={onTabPress} />;
}
