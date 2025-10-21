// components/Running/WeatherIcon.tsx
import React from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";

interface WeatherIconProps {
  emoji?: string;
  loading?: boolean;
  onPress?: () => void;
}

export default function WeatherIcon({ emoji, loading, onPress }: WeatherIconProps) {
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#fff" />
      </View>
    );
  }

  if (!emoji) {
    return null;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.emoji}>{emoji}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  pressed: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    transform: [{ scale: 0.95 }],
  },
  emoji: {
    fontSize: 28,
  },
});
