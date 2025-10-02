import React, { useMemo, useRef, useState, useCallback } from "react";
import SafeLayout from "../components/Layout/SafeLayout";
import {
  StyleSheet,
  View,
  Text,
  Alert,
  Pressable,
  Animated,
  Easing,
} from "react-native";
import MapRoute from "../components/Running/MapRoute";
import RunStatsCard from "../components/Running/RunStatsCard";
import RunPlayControls from "../components/Running/RunPlayControls";
import CountdownOverlay from "../components/Running/CountdownOverlay";
import { useLiveRunTracker } from "../hooks/useLiveRunTracker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiComplete } from "../utils/api/running"; // ✅ 추가

export default function LiveRunningScreen({ navigation, route }: { navigation: any; route?: any }) {
  const targetDistanceKm = (route?.params?.targetDistanceKm as number | undefined) ?? undefined;
  const t = useLiveRunTracker();
  const insets = useSafeAreaInsets();
  const bottomSafe = Math.max(insets.bottom, 12);
  const FAB_BASE = 100;

  const snapshotFnRef = useRef<(() => Promise<string | null>) | undefined>(
    undefined
  );
  const isStoppingRef = useRef(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  const [mapReady, setMapReady] = useState(false);

  const fade = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const haloOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.25],
  });
  const haloScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.1],
  });
  const scaleMain = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });
  const smallScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });
  const smallOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const leftTx = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -120],
  });
  const rightTx = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 120],
  });

  const [countdownVisible, setCountdownVisible] = useState(false);

  const openMenu = () => {
    setMenuOpen(true);
    Animated.timing(progress, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(progress, {
      toValue: 0,
      duration: 120,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setMenuOpen(false);
    });
  };

  const handleStartPress = () => (menuOpen ? closeMenu() : openMenu());

  const handleRunningStart = useCallback(() => {
    closeMenu();
    setCountdownVisible(true);
  }, []);

  const handleCountdownDone = useCallback(() => {
    setCountdownVisible(false);
    requestAnimationFrame(() => {
      t.start();
    });
  }, [t]);

  const elapsedLabel = useMemo(() => {
    const m = Math.floor(t.elapsedSec / 60);
    const s = String(t.elapsedSec % 60).padStart(2, "0");
    return `${m}:${s}`;
  }, [t.elapsedSec]);

  const takeSnapshotWithTimeout = async (
    fn?: () => Promise<string | null>,
    ms = 2000
  ) => {
    if (!fn) return null;
    try {
      return await Promise.race<string | null>([
        fn(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
      ]);
    } catch {
      return null;
    }
  };

  const completeRun = useCallback(async () => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;
    try {
      const avgPaceSec =
        t.distance > 0 && Number.isFinite(t.elapsedSec / t.distance)
          ? Math.floor(t.elapsedSec / Math.max(t.distance, 0.000001))
          : null;
      const routePoints = t.route.map((p, i) => ({ latitude: p.latitude, longitude: p.longitude, sequence: i + 1 }));
      const { runId } = await apiComplete({
        sessionId: t.sessionId as string,
        distanceMeters: Math.round(t.distance * 1000),
        durationSeconds: t.elapsedSec,
        averagePaceSeconds: avgPaceSec,
        calories: Math.round(t.kcal),
        routePoints,
        endedAt: Date.now(),
        title: "오늘의 러닝",
      });
      t.stop();
      navigation.navigate("RunSummary", {
        runId,
        defaultTitle: "오늘의 러닝",
        distanceKm: t.distance,
        paceLabel: t.paceLabel,
        kcal: Math.round(t.kcal),
        elapsedSec: t.elapsedSec,
        elapsedLabel: `${Math.floor(t.elapsedSec / 60)}:${String(t.elapsedSec % 60).padStart(2, "0")}`,
        routePath: t.route,
        sessionId: (t.sessionId as string) ?? "",
      });
    } catch (e) {
      console.error("러닝 완료/저장 실패:", e);
      Alert.alert("저장 실패", "네트워크 또는 서버 오류가 발생했어요.");
    } finally {
      setTimeout(() => (isStoppingRef.current = false), 800);
    }
  }, [navigation, t]);

  React.useEffect(() => {
    if (!targetDistanceKm) return;
    if (!t.isRunning) return;
    if (t.distance >= targetDistanceKm) {
      completeRun();
    }
  }, [t.distance, t.isRunning, targetDistanceKm, completeRun]);

  return (
    <SafeLayout withBottomInset>
      <MapRoute
        route={t.route}
        last={t.last}
        liveMode
        onBindCenter={t.bindMapCenter}
        onBindSnapshot={(fn) => {
          snapshotFnRef.current = fn;
        }}
        useCurrentLocationOnMount
        onMapReady={() => setMapReady(true)}
      />

      {/* 상단 내정보 버튼 제거 (하단 공통 내비로 이동) */}

      {(t.isRunning || t.isPaused) && (
        <RunStatsCard
          distanceKm={t.distance}
          paceLabel={t.paceLabel}
          kcal={t.kcal}
          speedKmh={t.speedKmh}
          elapsedSec={t.elapsedSec}
        />
      )}

      {t.isPaused && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255,255,255,0.15)",
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: "900", marginBottom: 8 }}>
            일시정지
          </Text>
          <Text style={{ color: "#4b5563", marginTop: 2 }}>
            재생 ▶ 을 누르면 다시 시작됩니다.
          </Text>
          <Text style={{ color: "#4b5563", marginTop: 2 }}>
            종료하려면 ■ 버튼을 2초간 길게 누르세요.
          </Text>
        </View>
      )}

      {!t.isRunning && (
        <>
          {menuOpen && (
            <Animated.View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.06)",
                opacity: fade as any,
              }}
            />
          )}

          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              alignItems: "center",
              justifyContent: "center",
              bottom: bottomSafe + FAB_BASE,
            }}
          >
            <Animated.View
              style={{
                position: "absolute",
                bottom: 72,
                opacity: smallOpacity as any,
                transform: [
                  { translateX: leftTx as any },
                  { scale: smallScale as any },
                ],
              }}
              pointerEvents={menuOpen ? "auto" : "none"}
            >
              <Pressable
                onPress={handleRunningStart}
                disabled={!t.isReady || t.isInitializing}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor:
                    !t.isReady || t.isInitializing
                      ? "rgba(0,0,0,0.03)"
                      : "rgba(0,0,0,0.08)",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "800",
                    color: !t.isReady || t.isInitializing ? "#9CA3AF" : "#111",
                  }}
                >
                  {!t.isReady
                    ? "준비중..."
                    : t.isInitializing
                    ? "시작중..."
                    : "러닝"}
                </Text>
              </Pressable>
            </Animated.View>

            <Animated.View
              style={{
                position: "absolute",
                bottom: 72,
                opacity: smallOpacity as any,
                transform: [
                  { translateX: rightTx as any },
                  { scale: smallScale as any },
                ],
              }}
              pointerEvents={menuOpen ? "auto" : "none"}
            >
              <Pressable
                onPress={() => {
                  closeMenu();
                  // 여정 리스트 화면으로 이동
                  navigation.navigate("JourneyRouteList");
                }}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 999,
                  backgroundColor: "rgba(0,0,0,0.08)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "800", color: "#111" }}>
                  여정 러닝
                </Text>
              </Pressable>
            </Animated.View>

            <Animated.View style={{ transform: [{ scale: scaleMain as any }] }}>
              <Pressable
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 999,
                  backgroundColor: "#3B82F6",
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#000",
                  shadowOpacity: 0.16,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 8 },
                }}
                onPress={handleStartPress}
              >
                <Text
                  style={{ fontSize: 22, fontWeight: "900", color: "#fff" }}
                >
                  시작
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </>
      )}

      {t.isRunning && (
        <RunPlayControls
          isRunning={t.isRunning}
          isPaused={t.isPaused}
          onPlay={() => t.start()}
          onPause={() => t.pause()}
          onResume={() => t.resume()}
          onStopTap={() => Alert.alert("종료하려면 길게 누르세요")}
          onStopLong={completeRun}
        />
      )}

      {/* 탭 내비게이터 사용으로 하단 바는 전역에서 렌더링됨 */}

      <CountdownOverlay
        visible={countdownVisible}
        seconds={3}
        onDone={handleCountdownDone}
      />
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  halo: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 40 + 60,
    marginLeft: "auto",
    marginRight: "auto",
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "#93C5FD",
    opacity: 0.2,
  },
  bottomWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  mainFab: {
    width: 100,
    height: 100,
    borderRadius: 999,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  mainFabText: { fontSize: 22, fontWeight: "900", color: "#fff" },
  smallFabWrap: {
    position: "absolute",
    bottom: 72,
  },
  smallFab: {
    width: 100,
    height: 100,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  smallFabText: { fontSize: 16, fontWeight: "800", color: "#111" },
  disabledFab: {
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  disabledText: {
    color: "#9CA3AF",
  },
  pauseOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  pauseTitle: { fontSize: 22, fontWeight: "900", marginBottom: 8 },
  pauseDesc: { color: "#4b5563", marginTop: 2 },
  topRight: {
    position: "absolute",
    right: 12,
    zIndex: 30,
  },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
});
