// BottomNavigation.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

// 네비게이션 아이템 타입
interface NavItem {
  key: string;
  label: string;
}

// Props 타입
interface BottomNavigationProps {
  activeTab: string;
  onTabPress: (tabKey: string) => void;
}

// 네비게이션 아이템 데이터
const navItems: NavItem[] = [
  { key: "profile", label: "내정보" },
  { key: "crew", label: "크루" },
  { key: "running", label: "러닝" },
  { key: "feed", label: "피드" },
  { key: "record", label: "기록" },
];

const ACTIVE = "#2c5530";
export const BOTTOM_NAV_MIN_HEIGHT = 70; // 스크롤 하단 패딩 계산용(선택)

// ✅ 핵심: 절대 하단 고정 + SafeAreaView로 하단 노치 공간 확보
const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabPress,
}) => {
  return (
    <View pointerEvents="box-none" style={styles.absoluteBottom}>
      <SafeAreaView style={styles.container}>
        <View style={styles.navContainer}>
          {navItems.map((item) => {
            const active = activeTab === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={styles.navItem}
                onPress={() => onTabPress(item.key)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconContainer,
                    active && styles.activeIconContainer,
                  ]}
                >
                  {item.key === "crew" ? (
                    <Feather
                      name="users"
                      size={20}
                      color={active ? "#ffffff" : "#2a2a2a"}
                    />
                  ) : item.key === "profile" ? (
                    <Feather
                      name="user"
                      size={20}
                      color={active ? "#ffffff" : "#2a2a2a"}
                    />
                  ) : item.key === "running" ? (
                    <MaterialCommunityIcons
                      name="run"
                      size={20}
                      color={active ? "#ffffff" : "#2a2a2a"}
                    />
                  ) : item.key === "feed" ? (
                    <Feather
                      name="list"
                      size={20}
                      color={active ? "#ffffff" : "#2a2a2a"}
                    />
                  ) : item.key === "record" ? (
                    <Feather
                      name="bar-chart-2"
                      size={20}
                      color={active ? "#ffffff" : "#2a2a2a"}
                    />
                  ) : null}
                </View>
                <Text style={[styles.label, active && styles.activeLabel]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  // ⚠️ 전체 화면을 덮는 absoluteFillObject / top:0 쓰지 말고,
  // 하단에만 고정시킵니다.
  absoluteBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100, // 콘텐츠 위에 보이도록
  },
  container: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  navContainer: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: "space-around",
    alignItems: "center",
    minHeight: BOTTOM_NAV_MIN_HEIGHT,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    backgroundColor: "transparent",
  },
  activeIconContainer: {
    backgroundColor: ACTIVE,
  },
  
  label: {
    fontSize: 11,
    fontWeight: "500",
    color: "#666666",
    textAlign: "center",
  },
  activeLabel: {
    color: ACTIVE,
    fontWeight: "600",
  },
});

export default BottomNavigation;
