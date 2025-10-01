import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function Main() {
  const nav = useNavigation<any>();
  const [menuOpen, setMenuOpen] = useState(false);

  // 애니메이션 값
  const fade = useRef(new Animated.Value(0)).current;
  const scaleMain = useRef(new Animated.Value(1)).current;
  const scaleRun = useRef(new Animated.Value(0.8)).current;
  const scaleVirtual = useRef(new Animated.Value(0.8)).current;
  const transRunY = useRef(new Animated.Value(0)).current;
  const transVirtualY = useRef(new Animated.Value(0)).current;

  const openMenu = () => {
    setMenuOpen(true);
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.spring(scaleMain, { toValue: 1.05, useNativeDriver: true }),
      Animated.stagger(60, [
        Animated.parallel([
          Animated.spring(scaleRun, { toValue: 1, useNativeDriver: true }),
          Animated.timing(transRunY, {
            toValue: -90,
            duration: 220,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.spring(scaleVirtual, { toValue: 1, useNativeDriver: true }),
          Animated.timing(transVirtualY, {
            toValue: -90,
            duration: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  };

  const closeMenu = () => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.spring(scaleMain, { toValue: 1, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(scaleRun, { toValue: 0.8, useNativeDriver: true }),
        Animated.timing(transRunY, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(scaleVirtual, { toValue: 0.8, useNativeDriver: true }),
        Animated.timing(transVirtualY, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => setMenuOpen(false));
  };

  const handleStartPress = () => {
    if (menuOpen) closeMenu();
    else openMenu();
  };

  const goLiveRun = () => {
    closeMenu();
    nav.navigate("LiveRunning"); // 스택에 등록한 이름으로 이동
  };

  const goVirtualRun = () => {
    closeMenu();
    nav.navigate("JourneyLoading");
  };

  return (
    <View style={s.container}>
      {/* 지도는 이 화면에선 배경만 깔려있다고 가정 (필요시 MapRoute 넣어도 됨) */}

      {/* 반투명 오버레이 (메뉴 열렸을 때만) */}
      {menuOpen && (
        <Animated.View
          pointerEvents="none"
          style={[s.overlay, { opacity: fade }]}
        />
      )}

      {/* 하단 중앙 시작 버튼 + 메뉴 */}
      <View style={s.bottomWrap}>
        {/* 왼쪽: 러닝 */}
        <Animated.View
          style={[
            s.smallFab,
            {
              transform: [
                { translateX: -90 },
                { translateY: transRunY },
                { scale: scaleRun },
              ],
            },
            !menuOpen && { opacity: 0, pointerEvents: "none" },
          ]}
        >
          <Pressable style={s.smallFabBtn} onPress={goLiveRun}>
            <Text style={s.smallFabText}>러닝</Text>
          </Pressable>
        </Animated.View>

        {/* 오른쪽: 여정 러닝 */}
        <Animated.View
          style={[
            s.smallFab,
            {
              transform: [
                { translateX: 90 },
                { translateY: transVirtualY },
                { scale: scaleVirtual },
              ],
            },
            !menuOpen && { opacity: 0, pointerEvents: "none" },
          ]}
        >
          <Pressable style={s.smallFabBtn} onPress={goVirtualRun}>
            <Text style={s.smallFabText}>여정 러닝</Text>
          </Pressable>
        </Animated.View>

        {/* 중앙: 시작 */}
        <Animated.View style={{ transform: [{ scale: scaleMain }] }}>
          <Pressable style={s.mainFab} onPress={handleStartPress}>
            <Text style={s.mainFabText}>시작</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  bottomWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  mainFab: {
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: "#93C5FD",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  mainFabText: { fontSize: 24, fontWeight: "900", color: "#0F172A" },
  smallFab: {
    position: "absolute",
    bottom: 70,
  },
  smallFabBtn: {
    width: 96,
    height: 48,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  smallFabText: { fontSize: 16, fontWeight: "800", color: "#111" },
});
