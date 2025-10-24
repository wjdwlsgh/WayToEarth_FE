import React, { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { StackActions } from "@react-navigation/native";
import { navigationRef } from "../navigation/RootNavigation";
import * as Location from "expo-location";
import SafeLayout from "../components/Layout/SafeLayout";
import {
  StyleSheet,
  View,
  Text,
  Alert,
  Pressable,
  Animated,
  Easing,
  AppState,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import MapRoute from "../components/Running/MapRoute";
import RunStatsCard from "../components/Running/RunStatsCard";
import RunPlayControls from "../components/Running/RunPlayControls";
import CountdownOverlay from "../components/Running/CountdownOverlay";
import WeatherWidget from "../components/Running/WeatherWidget";
import { useLiveRunTracker } from "../hooks/useLiveRunTracker";
import { useBackgroundRunning } from "../hooks/journey/useBackgroundRunning";
import { useWeather } from "../contexts/WeatherContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiComplete } from "../utils/api/running"; // ✅ 추가

export default function LiveRunningScreen({ navigation, route }: { navigation: any; route?: any }) {
  const targetDistanceKm = (route?.params?.targetDistanceKm as number | undefined) ?? undefined;
  const t = useLiveRunTracker();

  // 백그라운드 러닝 훅
  const backgroundRunning = useBackgroundRunning();

  const insets = useSafeAreaInsets();
  const bottomSafe = Math.max(insets.bottom, 12);

  const snapshotFnRef = useRef<(() => Promise<string | null>) | undefined>(
    undefined
  );
  const isStoppingRef = useRef(false);

  // 탭 상태: 'running' | 'journey'
  const [activeTab, setActiveTab] = useState<'running' | 'journey'>('running');
  const [mapReady, setMapReady] = useState(false);
  const [countdownVisible, setCountdownVisible] = useState(false);

  // 날씨 정보
  const { weather, loading: weatherLoading } = useWeather();

  // 러닝 세션 상태 업데이트 (일반 러닝)
  useEffect(() => {
    if (!t.isRunning) return;
    if (isStoppingRef.current) return; // 종료 진행 중이면 저장/업데이트 중단

    const session = {
      type: 'general' as const,
      sessionId: t.sessionId,
      startTime: Date.now() - (t.elapsedSec * 1000),
      distanceKm: t.distance,
      durationSeconds: t.elapsedSec,
      isRunning: t.isRunning,
      isPaused: t.isPaused,
    };

    // Foreground Service 업데이트
    backgroundRunning.updateForegroundService(session);

    // 세션 상태 저장 (백그라운드 복원용)
    backgroundRunning.saveSession(session);
  }, [t.isRunning, t.distance, t.elapsedSec, t.isPaused]);

  // 러닝 시작 시 Foreground Service 시작
  useEffect(() => {
    if (t.isRunning) {
      const session = {
        type: 'general' as const,
        sessionId: t.sessionId,
        startTime: Date.now() - (t.elapsedSec * 1000),
        distanceKm: t.distance,
        durationSeconds: t.elapsedSec,
        isRunning: true,
        isPaused: t.isPaused,
      };
      backgroundRunning.startForegroundService(session);
    }
  }, [t.isRunning]);

  // 컴포넌트 언마운트 시 세션 정리
  useEffect(() => {
    return () => {
      if (!t.isRunning) {
        backgroundRunning.stopForegroundService();
        backgroundRunning.clearSession();
      }
    };
  }, []);

  const handleRunningStart = useCallback(() => {
    console.log("[LiveRunning] start pressed -> show countdown");
    // 카운트다운 동안 GPS 가열: 초기 위치 락 향상
    try { (t as any).prime?.(); } catch {}
    setCountdownVisible(true);
  }, []);

  const handleCountdownDone = useCallback(async () => {
    console.log("[LiveRunning] countdown done");
    console.log("[LiveRunning] AppState at start:", AppState.currentState);
    setCountdownVisible(false);

    // 즉시 시작 시도 (권한은 내부에서 처리)
    requestAnimationFrame(() => {
      console.log("[LiveRunning] calling t.start()");
      t.start();
    });

    // 권한 요청은 비동기로 병렬 처리 (UI 차단 방지)
    backgroundRunning.requestNotificationPermission().catch(() => {});
  }, [t, backgroundRunning]);

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

    // 먼저 일시정지 상태로 전환
    if (!t.isPaused) {
      t.pause();
    }

    // 저장 여부 확인
    Alert.alert(
      "러닝 종료",
      "러닝 기록을 저장하시겠습니까?",
      [
        {
          text: "취소",
          style: "cancel",
          onPress: () => {
            isStoppingRef.current = false;
            // 다시 재개
            if (t.isPaused) {
              t.resume();
            }
          },
        },
        {
          text: "저장 안 함",
          style: "destructive",
          onPress: async () => {
            try {
              // 탭바 보이도록 세션 키를 먼저 제거
              await backgroundRunning.clearSession();
            } catch {}

            // 먼저 네비게이션 실행 (동기) - 루트 스택에서 MainTabs로 교체 이동
            if (navigationRef.isReady()) {
              navigationRef.dispatch(StackActions.replace("MainTabs"));
            } else {
              const rootParent = navigation.getParent?.()?.getParent?.();
              if (rootParent && typeof rootParent.dispatch === 'function') {
                rootParent.dispatch(StackActions.replace("MainTabs"));
              } else {
                navigation.navigate("MainTabs", { screen: "LiveRunningScreen" });
              }
            }

            // 그 후 비동기로 정리 (화면 전환 후에 실행)
            requestAnimationFrame(async () => {
              try {
                await backgroundRunning.stopForegroundService();
                await t.stop();
              } catch (e) {
                console.error("러닝 정리 실패:", e);
              } finally {
                isStoppingRef.current = false;
              }
            });
          },
        },
        {
          text: "저장",
          onPress: async () => {
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

              // 백그라운드 서비스 중지 및 세션 정리
              await backgroundRunning.stopForegroundService();
              await backgroundRunning.clearSession();

              await t.stop();
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
              isStoppingRef.current = false;
            }
          },
        },
      ]
    );
  }, [navigation, t, backgroundRunning]);

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

      {/* 지도 비네팅 효과 */}
      <LinearGradient
        colors={['rgba(249, 250, 251, 0.7)', 'transparent', 'rgba(249, 250, 251, 0.7)']}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
        }}
      />

      {/* 상단 탭 컨트롤 */}
      <View
        style={{
          position: "absolute",
          top: Math.max(insets.top, 12) + 12,
          left: 20,
          right: 20,
          zIndex: 10,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View style={styles.segmentControl}>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              activeTab === 'running' && styles.segmentButtonActive,
            ]}
            onPress={() => setActiveTab('running')}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === 'running' && styles.segmentTextActive,
              ]}
            >
              러닝
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              activeTab === 'journey' && styles.segmentButtonActive,
            ]}
            onPress={() => setActiveTab('journey')}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === 'journey' && styles.segmentTextActive,
              ]}
            >
              여정 러닝
            </Text>
          </TouchableOpacity>
        </View>

        <WeatherWidget
          emoji={weather?.emoji}
          condition={weather?.condition}
          temperature={weather?.temperature}
          recommendation={weather?.recommendation}
          loading={weatherLoading}
        />
      </View>

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
        <View
          style={{
            position: "absolute",
            left: 20,
            right: 20,
            bottom: bottomSafe + 24,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              if (activeTab === 'running') {
                handleRunningStart();
              } else {
                navigation.navigate("JourneyRouteList");
              }
            }}
            disabled={activeTab === 'running' && (!t.isReady || t.isInitializing)}
            style={{
              height: 64,
              borderRadius: 32,
              backgroundColor:
                activeTab === 'running' && (!t.isReady || t.isInitializing)
                  ? "#9CA3AF"
                  : "#3B82F6",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOpacity: 0.2,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
              elevation: 8,
            }}
          >
            <Text
              style={{ fontSize: 18, fontWeight: "700", color: "#fff" }}
            >
              {activeTab === 'running'
                ? (!t.isReady
                  ? "준비중..."
                  : t.isInitializing
                  ? "시작중..."
                  : "러닝 시작")
                : "여정 리스트 보기"}
            </Text>
          </TouchableOpacity>
        </View>
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
  segmentControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  segmentButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  segmentButtonActive: {
    backgroundColor: '#3B82F6',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
});
