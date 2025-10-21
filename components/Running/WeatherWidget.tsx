// components/Running/WeatherWidget.tsx
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Platform,
} from "react-native";

interface WeatherWidgetProps {
  emoji?: string;
  condition?: string;
  temperature?: number;
  recommendation?: string;
  loading?: boolean;
}

export default function WeatherWidget({
  emoji,
  condition,
  temperature,
  recommendation,
  loading,
}: WeatherWidgetProps) {
  const [expanded, setExpanded] = useState(false);
  const animWidth = useRef(new Animated.Value(0)).current;
  const animOpacity = useRef(new Animated.Value(0)).current;

  const toggleExpand = () => {
    const toExpanded = !expanded;
    setExpanded(toExpanded);

    Animated.parallel([
      Animated.spring(animWidth, {
        toValue: toExpanded ? 1 : 0,
        useNativeDriver: false,
        friction: 8,
        tension: 40,
      }),
      Animated.timing(animOpacity, {
        toValue: toExpanded ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const containerWidth = animWidth.interpolate({
    inputRange: [0, 1],
    outputRange: [56, 220], // 축소: 56, 확장: 220 (더 넓게)
  });

  if (loading) {
    return (
      <View style={styles.iconContainer}>
        <ActivityIndicator size="small" color="#fff" />
      </View>
    );
  }

  if (!emoji) {
    return null;
  }

  return (
    <Pressable onPress={toggleExpand}>
      <Animated.View
        style={[
          styles.container,
          {
            width: containerWidth,
          },
        ]}
      >
        {/* 왼쪽: 날씨 이모지 (항상 표시) */}
        <View style={styles.iconContainer}>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>

        {/* 오른쪽: 온도 & 추천 메시지 (확장 시에만 표시) */}
        <Animated.View
          style={[
            styles.infoContainer,
            {
              opacity: animOpacity,
            },
          ]}
          pointerEvents={expanded ? "auto" : "none"}
        >
          {temperature !== undefined && temperature !== null && (
            <Text style={styles.temperature}>{Math.round(temperature)}°</Text>
          )}
          {recommendation && (
            <Text style={styles.recommendation} numberOfLines={2}>
              {recommendation}
            </Text>
          )}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(59, 130, 246, 0.85)", // 블루 반투명
    borderRadius: 28,
    paddingVertical: 8,
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        backdropFilter: "blur(10px)",
      },
    }),
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 24,
  },
  infoContainer: {
    marginLeft: 8,
    flex: 1,
    justifyContent: "center",
  },
  temperature: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 24,
    marginBottom: 2,
  },
  recommendation: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.95)",
    lineHeight: 13,
  },
});
