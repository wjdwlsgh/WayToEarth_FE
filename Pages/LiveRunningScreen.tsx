import React, { useMemo, useRef, useState, useCallback } from "react";
import SafeLayout from "../components/Layout/SafeLayout";
import {
  SafeAreaView,
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
export default function LiveRunningScreen({ navigation }: { navigation: any }) {
  const t = useLiveRunTracker();
  const insets = useSafeAreaInsets();
  const bottomSafe = Math.max(insets.bottom, 12); // 제스처/3버튼 모두 대비
  const FAB_BASE = 40; // 기존 bottom: 40 대체

  // MapRoute 스냅샷 바인딩
  const snapshotFnRef = useRef<(() => Promise<string | null>) | undefined>(
    undefined
  );
  const isStoppingRef = useRef(false);

  // ── 시작 메뉴 애니메이션: 단일 progress로 동기화
  const [menuOpen, setMenuOpen] = useState(false);
  const progress = useRef(new Animated.Value(0)).current; // 0: 닫힘, 1: 열림

  // ✅ 맵 준비 상태 추가
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

  // ── 카운트다운
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

  // ✅ 러닝 시작 핸들러 개선
  const handleRunningStart = useCallback(() => {
    closeMenu();
    setCountdownVisible(true);
  }, []);

  // ✅ 카운트다운 완료 핸들러
  const handleCountdownDone = useCallback(() => {
    setCountdownVisible(false);
    // 카운트다운 완료 후 즉시 러닝 시작
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

  return (
    <SafeLayout withBottomInset>
      {/* 지도 */}
      <MapRoute
        route={t.route}
        last={t.last}
        liveMode
        onBindCenter={t.bindMapCenter}
        onBindSnapshot={(fn) => {
          snapshotFnRef.current = fn;
        }}
        useCurrentLocationOnMount
        // ✅ 맵 준비 상태 콜백 추가
        onMapReady={() => setMapReady(true)}
      />

      {/* ✅ 러닝 준비 중 오버레이 - 삭제됨 */}

      {/* 러닝 중/일시정지일 때만 통계 카드 노출 */}
      {(t.isRunning || t.isPaused) && (
        <RunStatsCard
          distanceKm={t.distance}
          paceLabel={t.paceLabel}
          kcal={t.kcal}
          speedKmh={t.speedKmh}
          elapsedSec={t.elapsedSec}
        />
      )}

      {/* 일시정지 오버레이 */}
      {t.isPaused && (
        <View style={styles.pauseOverlay} pointerEvents="none">
          <Text style={styles.pauseTitle}>일시정지</Text>
          <Text style={styles.pauseDesc}>
            재생 ▶ 을 누르면 다시 시작됩니다.
          </Text>
          <Text style={styles.pauseDesc}>
            종료하려면 ■ 버튼을 2초간 길게 누르세요.
          </Text>
        </View>
      )}

      {/* 시작 메뉴 (러닝/가상 러닝) — 러닝 중이 아닐 때만 */}
      {!t.isRunning && (
        <>
          {menuOpen && (
            <Animated.View
              pointerEvents="none"
              style={[styles.overlay, { opacity: fade }]}
            />
          )}

          {/* 중앙 하이라이트(연한 큰 원) */}
          {/* <Animated.View
            pointerEvents="none"
            style={[
              styles.halo,
              { opacity: haloOpacity, transform: [{ scale: haloScale }] },
            ]}
          /> */}

          <View style={[styles.bottomWrap, { bottom: bottomSafe + FAB_BASE }]}>
            {/* 왼쪽: 러닝 */}
            <Animated.View
              style={[
                styles.smallFabWrap,
                {
                  opacity: smallOpacity,
                  transform: [{ translateX: leftTx }, { scale: smallScale }],
                },
              ]}
              pointerEvents={menuOpen ? "auto" : "none"}
            >
              <Pressable
                style={[
                  styles.smallFab,
                  // ✅ 훅이 준비되지 않았을 때 비활성화
                  (!t.isReady || t.isInitializing) && styles.disabledFab,
                ]}
                onPress={handleRunningStart}
                disabled={!t.isReady || t.isInitializing}
              >
                <Text
                  style={[
                    styles.smallFabText,
                    (!t.isReady || t.isInitializing) && styles.disabledText,
                  ]}
                >
                  {!t.isReady
                    ? "준비중..."
                    : t.isInitializing
                    ? "시작중..."
                    : "러닝"}
                </Text>
              </Pressable>
            </Animated.View>

            {/* 오른쪽: 가상 러닝 */}
            <Animated.View
              style={[
                styles.smallFabWrap,
                {
                  opacity: smallOpacity,
                  transform: [{ translateX: rightTx }, { scale: smallScale }],
                },
              ]}
              pointerEvents={menuOpen ? "auto" : "none"}
            >
              <Pressable
                style={styles.smallFab}
                onPress={() => {
                  closeMenu();
                  Alert.alert("가상 러닝", "가상 러닝 화면 연결 예정!");
                  // navigation.navigate("VirtualRunning");
                }}
              >
                <Text style={styles.smallFabText}>가상 러닝</Text>
              </Pressable>
            </Animated.View>

            {/* 중앙: 시작(큰 파란 원) */}
            <Animated.View style={{ transform: [{ scale: scaleMain }] }}>
              <Pressable style={styles.mainFab} onPress={handleStartPress}>
                <Text style={styles.mainFabText}>시작</Text>
              </Pressable>
            </Animated.View>
          </View>
        </>
      )}

      {/* 러닝 중 컨트롤 */}
      {t.isRunning && (
        <RunPlayControls
          isRunning={t.isRunning}
          isPaused={t.isPaused}
          onPlay={() => t.start()}
          onPause={() => t.pause()}
          onResume={() => t.resume()}
          onStopTap={() => Alert.alert("종료하려면 길게 누르세요")}
          onStopLong={async () => {
            if (isStoppingRef.current) return;
            isStoppingRef.current = true;
            try {
              const snapshotUri = await takeSnapshotWithTimeout(
                snapshotFnRef.current,
                2500
              );
              const params = {
                distanceKm: t.distance,
                paceLabel: t.paceLabel,
                kcal: t.kcal,
                elapsedLabel,
                elapsedSec: t.elapsedSec,
                routePath: t.route,
                endedAt: new Date().toISOString(),
                snapshotUri,
              };
              t.stop();
              navigation?.navigate?.("RunSummary", params);
            } finally {
              setTimeout(() => (isStoppingRef.current = false), 800);
            }
          }}
        />
      )}

      {/* ✅ 카운트다운 오버레이: 3-2-1 후 러닝 시작 */}
      <CountdownOverlay
        visible={countdownVisible}
        seconds={3}
        onDone={handleCountdownDone}
      />
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  // 시작 메뉴 레이어
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
    bottom: 72, // 중앙 버튼과 같은 기준선
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

  // ✅ 비활성화 스타일 추가
  disabledFab: {
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  disabledText: {
    color: "#9CA3AF",
  },

  // 일시정지 오버레이
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
});
