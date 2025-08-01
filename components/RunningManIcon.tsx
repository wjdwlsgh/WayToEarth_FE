// components/RunningManIcon.tsx
import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";

export default function RunningManIcon() {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
  }, []);

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  return (
    <View style={styles.iconContainer}>
      <Animated.View
        style={[styles.runningMan, { transform: [{ translateY }] }]}
      >
        <View style={styles.head} />
        <View style={styles.body}>
          <View style={styles.leftArm} />
          <View style={styles.rightArm} />
          <View style={styles.leftLeg} />
          <View style={styles.rightLeg} />
        </View>
      </Animated.View>
      <View style={styles.shadow} />
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  runningMan: {
    position: "relative",
    alignItems: "center",
  },
  head: {
    width: 24,
    height: 24,
    backgroundColor: "#4A90E2",
    borderRadius: 12,
    marginBottom: 4,
  },
  body: {
    width: 20,
    height: 40,
    backgroundColor: "#4A90E2",
    borderRadius: 10,
    position: "relative",
  },
  leftArm: {
    position: "absolute",
    width: 20,
    height: 6,
    backgroundColor: "#4A90E2",
    borderRadius: 3,
    top: 5,
    left: -18,
    transform: [{ rotate: "-30deg" }],
  },
  rightArm: {
    position: "absolute",
    width: 20,
    height: 6,
    backgroundColor: "#4A90E2",
    borderRadius: 3,
    top: 8,
    right: -18,
    transform: [{ rotate: "45deg" }],
  },
  leftLeg: {
    position: "absolute",
    width: 18,
    height: 6,
    backgroundColor: "#4A90E2",
    borderRadius: 3,
    bottom: -8,
    left: -12,
    transform: [{ rotate: "20deg" }],
  },
  rightLeg: {
    position: "absolute",
    width: 18,
    height: 6,
    backgroundColor: "#4A90E2",
    borderRadius: 3,
    bottom: -5,
    right: -14,
    transform: [{ rotate: "-45deg" }],
  },
  shadow: {
    width: 60,
    height: 8,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 30,
    marginTop: 15,
  },
});
