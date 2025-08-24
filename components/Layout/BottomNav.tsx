// BottomNavigation.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";

// 네비게이션 아이템 타입
interface NavItem {
  key: string;
  icon: string;
  label: string;
}

// Props 타입
interface BottomNavigationProps {
  activeTab: string;
  onTabPress: (tabKey: string) => void;
}

// 네비게이션 아이템 데이터
const navItems: NavItem[] = [
  { key: "battle", icon: "👥", label: "대결" },
  { key: "crew", icon: "👨‍👩‍👧‍👦", label: "크루" },
  { key: "running", icon: "🏃", label: "러닝" },
  { key: "feed", icon: "📋", label: "피드" },
  { key: "record", icon: "📊", label: "기록" },
];

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabPress,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navContainer}>
        {navItems.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={styles.navItem}
            onPress={() => onTabPress(item.key)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconContainer,
                activeTab === item.key && styles.activeIconContainer,
              ]}
            >
              <Text
                style={[
                  styles.icon,
                  activeTab === item.key && styles.activeIcon,
                ]}
              >
                {item.icon}
              </Text>
            </View>
            <Text
              style={[
                styles.label,
                activeTab === item.key && styles.activeLabel,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    elevation: 8,
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
    minHeight: 70,
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
    backgroundColor: "#2c5530",
  },
  icon: {
    fontSize: 20,
  },
  activeIcon: {
    fontSize: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: "500",
    color: "#666666",
    textAlign: "center",
  },
  activeLabel: {
    color: "#2c5530",
    fontWeight: "600",
  },
});

export default BottomNavigation;
