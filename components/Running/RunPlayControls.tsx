// components/Running/RunPlayControls.tsx
import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function RunPlayControls({
  isRunning,
  isPaused,
  onPlay,
  onPause,
  onResume,
  onStopTap,
  onStopLong,
}: {
  isRunning: boolean;
  isPaused: boolean;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStopTap: () => void;
  onStopLong: () => void;
}) {
  const insets = useSafeAreaInsets();
  const bottomSafe = Math.max(insets.bottom, 12);
  const BASE = 40;

  const playIcon = !isRunning || isPaused ? "play" : "pause";

  return (
    <View style={[styles.container, { bottom: bottomSafe + BASE }]}>
      <Pressable
        android_ripple={{ color: "rgba(255,255,255,0.15)" }}
        style={({ pressed }) => [styles.circle, pressed && styles.pressed]}
        onPress={() => {
          if (!isRunning) onPlay();
          else if (isPaused) onResume();
          else onPause();
        }}
        accessibilityRole="button"
        accessibilityLabel={
          !isRunning ? "재생" : isPaused ? "재개" : "일시정지"
        }
      >
        <Ionicons name={playIcon} size={28} color="#fff" />
      </Pressable>

      <Pressable
        android_ripple={{ color: "rgba(255,255,255,0.15)" }}
        style={({ pressed }) => [styles.circle, pressed && styles.pressed]}
        onPress={onStopTap}
        onLongPress={onStopLong}
        delayLongPress={2000}
        accessibilityRole="button"
        accessibilityLabel="종료"
      >
        <Ionicons name="stop" size={26} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 28,
  },
  circle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});
