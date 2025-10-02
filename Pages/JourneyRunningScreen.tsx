// Pages/JourneyRunningScreen.tsx
// 여정 러닝 메인 화면 (실시간 추적 + 진행률)

import React, { useState, useCallback, useMemo } from "react";
import SafeLayout from "../components/Layout/SafeLayout";
import { View, Text, Alert, Pressable, StyleSheet } from "react-native";
import JourneyMapRoute from "../components/Journey/JourneyMapRoute";
import JourneyProgressCard from "../components/Journey/JourneyProgressCard";
import RunStatsCard from "../components/Running/RunStatsCard";
import RunPlayControls from "../components/Running/RunPlayControls";
import CountdownOverlay from "../components/Running/CountdownOverlay";
import { useJourneyRunning } from "../hooks/journey/useJourneyRunning";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { LatLng } from "../types/types";
import type { JourneyId } from "../types/journey";
import { apiComplete } from "../utils/api/running";

type RouteParams = {
  route: {
    params?: {
      journeyId?: JourneyId;
      journeyTitle?: string;
      totalDistanceKm?: number;
      landmarks?: Array<{
        id: string;
        name: string;
        position: LatLng;
        distance: string;
        distanceM: number;
      }>;
      journeyRoute?: LatLng[];
    };
  };
  navigation?: any;
};

export default function JourneyRunningScreen({ route, navigation }: RouteParams) {
  const params = route?.params || {};
  const journeyId = params.journeyId || "1";
  const journeyTitle = params.journeyTitle || "여정 러닝";
  const totalDistanceKm = params.totalDistanceKm || 42.5;
  const landmarks = params.landmarks || [];
  const journeyRoute = params.journeyRoute || [];

  // 임시 userId (실제로는 전역 상태나 auth에서 가져오기)
  const userId = "user123";

  const t = useJourneyRunning({
    journeyId,
    userId,
    totalDistanceM: totalDistanceKm * 1000,
    landmarks,
    journeyRoute,
  });

  const insets = useSafeAreaInsets();
  const [countdownVisible, setCountdownVisible] = useState(false);

  const handleStartPress = useCallback(() => {
    setCountdownVisible(true);
  }, []);

  const handleCountdownDone = useCallback(() => {
    setCountdownVisible(false);
    requestAnimationFrame(() => {
      t.startJourneyRun();
    });
  }, [t]);

  const handleComplete = useCallback(async () => {
    try {
      const avgPaceSec =
        t.distance > 0 && Number.isFinite(t.elapsedSec / t.distance)
          ? Math.floor(t.elapsedSec / Math.max(t.distance, 0.000001))
          : null;

      const routePoints = t.route.map((p, i) => ({
        latitude: p.latitude,
        longitude: p.longitude,
        sequence: i + 1,
      }));

      // 러닝 완료 API 호출
      const { runId } = await apiComplete({
        sessionId: t.sessionId as string,
        distanceMeters: Math.round(t.distance * 1000),
        durationSeconds: t.elapsedSec,
        averagePaceSeconds: avgPaceSec,
        calories: Math.round(t.kcal),
        routePoints,
        endedAt: Date.now(),
        title: journeyTitle,
      });

      // 여정 진행률 업데이트
      await t.completeJourneyRun();

      navigation.navigate("RunSummary", {
        runId,
        defaultTitle: journeyTitle,
        distanceKm: t.distance,
        paceLabel: t.paceLabel,
        kcal: Math.round(t.kcal),
        elapsedSec: t.elapsedSec,
        elapsedLabel: `${Math.floor(t.elapsedSec / 60)}:${String(
          t.elapsedSec % 60
        ).padStart(2, "0")}`,
        routePath: t.route,
        sessionId: (t.sessionId as string) ?? "",
      });
    } catch (e) {
      console.error("여정 러닝 완료 실패:", e);
      Alert.alert("저장 실패", "네트워크 또는 서버 오류가 발생했어요.");
    }
  }, [navigation, t, journeyTitle]);

  const elapsedLabel = useMemo(() => {
    const m = Math.floor(t.elapsedSec / 60);
    const s = String(t.elapsedSec % 60).padStart(2, "0");
    return `${m}:${s}`;
  }, [t.elapsedSec]);

  return (
    <SafeLayout withBottomInset>
      <JourneyMapRoute
        journeyRoute={journeyRoute}
        landmarks={t.landmarksWithReached}
        userRoute={t.route}
        currentLocation={t.last}
        progressPercent={t.progressPercent}
      />

      {/* 여정 진행률 카드 (러닝 중이 아닐 때만 표시) */}
      {!t.isRunning && !t.isPaused && (
        <JourneyProgressCard
          progressPercent={t.progressPercent}
          currentDistanceKm={t.progressM / 1000}
          totalDistanceKm={totalDistanceKm}
          nextLandmark={
            t.nextLandmark
              ? {
                  name: t.nextLandmark.name,
                  distanceKm: t.nextLandmark.distanceM / 1000,
                }
              : null
          }
        />
      )}

      {/* 러닝 통계 카드 (러닝 중일 때) */}
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
        <View pointerEvents="none" style={styles.pauseOverlay}>
          <Text style={styles.pauseTitle}>일시정지</Text>
          <Text style={styles.pauseDesc}>재생 ▶ 을 누르면 다시 시작됩니다.</Text>
          <Text style={styles.pauseDesc}>
            종료하려면 ■ 버튼을 2초간 길게 누르세요.
          </Text>
        </View>
      )}

      {/* 시작 버튼 (러닝 전) */}
      {!t.isRunning && !t.isPaused && (
        <View
          style={[
            styles.startButtonContainer,
            { bottom: Math.max(insets.bottom, 12) + 100 },
          ]}
        >
          <Pressable
            onPress={handleStartPress}
            disabled={!t.isReady || t.isInitializing}
            style={[
              styles.startButton,
              (!t.isReady || t.isInitializing) && styles.startButtonDisabled,
            ]}
          >
            <Text style={styles.startButtonText}>
              {!t.isReady
                ? "준비중..."
                : t.isInitializing
                ? "시작중..."
                : "여정 러닝 시작"}
            </Text>
          </Pressable>
        </View>
      )}

      {/* 러닝 제어 버튼 (러닝 중) */}
      {t.isRunning && (
        <RunPlayControls
          isRunning={t.isRunning}
          isPaused={t.isPaused}
          onPlay={() => t.start()}
          onPause={() => t.pause()}
          onResume={() => t.resume()}
          onStopTap={() => Alert.alert("종료하려면 길게 누르세요")}
          onStopLong={handleComplete}
        />
      )}

      {/* 카운트다운 오버레이 */}
      <CountdownOverlay
        visible={countdownVisible}
        seconds={3}
        onDone={handleCountdownDone}
      />
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
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
  pauseTitle: {
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 8,
  },
  pauseDesc: {
    color: "#4b5563",
    marginTop: 2,
  },
  startButtonContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  startButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  startButtonDisabled: {
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
  },
});
