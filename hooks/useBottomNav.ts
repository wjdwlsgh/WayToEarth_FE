import { useCallback, useEffect, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";

export type TabKey = "battle" | "crew" | "running" | "feed" | "record";

const TAB_TO_ROUTE: Record<TabKey, string> = {
  battle: "Battle",
  crew: "Crew",
  // 러닝 탭은 실제 러닝 화면으로 이동
  running: "LiveRunningScreen",
  feed: "Feed",
  record: "Record",
};

// 라우트 → 탭 역매핑
const ROUTE_TO_TAB = Object.fromEntries(
  (Object.keys(TAB_TO_ROUTE) as TabKey[]).map((k) => [TAB_TO_ROUTE[k], k])
) as Record<string, TabKey>;

export function useBottomNav(defaultTab: TabKey = "running") {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const [activeTab, setActiveTab] = useState<TabKey>(defaultTab);

  // 현재 라우트가 바뀌면 activeTab 동기화
  useEffect(() => {
    const tab = ROUTE_TO_TAB[route.name];
    if (tab && tab !== activeTab) setActiveTab(tab);
  }, [route.name]);

  const onTabPress = useCallback(
    (tabKey: string) => {
      const key = tabKey as TabKey;
      const target = TAB_TO_ROUTE[key];
      if (!target) return;

      setActiveTab(key);
      if (route.name !== target) navigation.navigate(target);
    },
    [navigation, route.name]
  );

  return { activeTab, onTabPress };
}
