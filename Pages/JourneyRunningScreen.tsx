// Pages/JourneyRunningScreen.tsx
// 여정 러닝 메인 화면 (실시간 추적 + 진행률)

import React, { useState, useCallback, useMemo } from "react";
import SafeLayout from "../components/Layout/SafeLayout";
import {
  View,
  Text,
  Alert,
  Pressable,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import JourneyMapRoute from "../components/Journey/JourneyMapRoute";
import JourneyProgressCard from "../components/Journey/JourneyProgressCard";
import RunStatsCard from "../components/Running/RunStatsCard";
import RunPlayControls from "../components/Running/RunPlayControls";
import CountdownOverlay from "../components/Running/CountdownOverlay";
import GuestbookCreateModal from "../components/Guestbook/GuestbookCreateModal";
import LandmarkStatistics from "../components/Guestbook/LandmarkStatistics";
import { useJourneyRunning } from "../hooks/journey/useJourneyRunning";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { LatLng } from "../types/types";
import type { JourneyId } from "../types/journey";
import { apiComplete } from "../utils/api/running";
import type { LandmarkSummary } from "../types/guestbook";

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

  // 랜드마크 도달 시 방명록 작성 모달 표시
  const handleLandmarkReached = useCallback((landmark: any) => {
    console.log("[JourneyRunning] 랜드마크 도달:", landmark.name);

    // 랜드마크를 LandmarkSummary 형식으로 변환
    const landmarkSummary: LandmarkSummary = {
      id: parseInt(landmark.id),
      name: landmark.name,
      cityName: "서울", // TODO: 실제 도시명으로 교체
      countryCode: "KR",
      imageUrl: "", // TODO: 실제 이미지 URL로 교체
    };

    setSelectedLandmark(landmarkSummary);
    setGuestbookModalVisible(true);

    // 축하 알림 표시
    Alert.alert(
      `🎉 ${landmark.name} 도착!`,
      "랜드마크에 방명록을 남겨보세요.",
      [
        {
          text: "나중에",
          style: "cancel",
          onPress: () => {
            setGuestbookModalVisible(false);
            setSelectedLandmark(null);
          },
        },
        { text: "방명록 작성", onPress: () => {} },
      ]
    );
  }, []);

  const t = useJourneyRunning({
    journeyId,
    userId,
    totalDistanceM: totalDistanceKm * 1000,
    landmarks,
    journeyRoute,
    onLandmarkReached: handleLandmarkReached,
  });

  const insets = useSafeAreaInsets();
  const [countdownVisible, setCountdownVisible] = useState(false);
  const [guestbookModalVisible, setGuestbookModalVisible] = useState(false);
  const [selectedLandmark, setSelectedLandmark] = useState<LandmarkSummary | null>(null);
  const [landmarkMenuVisible, setLandmarkMenuVisible] = useState(false);
  const [menuLandmark, setMenuLandmark] = useState<any>(null);

  const handleStartPress = useCallback(() => {
    setCountdownVisible(true);
  }, []);

  const handleCountdownDone = useCallback(() => {
    setCountdownVisible(false);
    requestAnimationFrame(() => {
      t.startJourneyRun();
    });
  }, [t]);

  // 랜드마크 마커 클릭 핸들러
  const handleLandmarkMarkerPress = useCallback((landmark: any) => {
    console.log("[JourneyRunning] 랜드마크 마커 클릭:", landmark.name);
    setMenuLandmark(landmark);
    setLandmarkMenuVisible(true);
  }, []);

  const handleComplete = useCallback(async () => {
    try {
      console.log("[JourneyRunning] 완료 처리 시작:", {
        sessionId: t.sessionId,
        distance: t.distance,
        elapsedSec: t.elapsedSec,
        routeLength: t.route.length,
      });

      const avgPaceSec =
        t.distance > 0 && Number.isFinite(t.elapsedSec / t.distance)
          ? Math.floor(t.elapsedSec / Math.max(t.distance, 0.000001))
          : null;

      const now = Math.floor(Date.now() / 1000);
      const routePoints = t.route.map((p, i) => ({
        latitude: p.latitude,
        longitude: p.longitude,
        sequence: i + 1,
        t: now, // 타임스탬프 추가
      }));

      console.log("[JourneyRunning] apiComplete 호출 직전:", {
        sessionId: t.sessionId,
        distanceMeters: Math.round(t.distance * 1000),
        durationSeconds: t.elapsedSec,
        averagePaceSeconds: avgPaceSec,
        calories: Math.round(t.kcal),
        routePointsCount: routePoints.length,
        title: journeyTitle,
      });

      // 러닝 완료 API 호출
      const { runId, data } = await apiComplete({
        sessionId: t.sessionId as string,
        distanceMeters: Math.round(t.distance * 1000),
        durationSeconds: t.elapsedSec,
        averagePaceSeconds: avgPaceSec,
        calories: Math.round(t.kcal),
        routePoints,
        endedAt: Date.now(),
        title: journeyTitle,
      });

      console.log("[JourneyRunning] apiComplete 응답:", { runId, data });

      // 여정 진행률 업데이트
      await t.completeJourneyRun();

      console.log("[JourneyRunning] 완료 처리 성공, 요약 화면으로 이동");

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
      console.error("[JourneyRunning] 여정 러닝 완료 실패:", e);
      console.error("[JourneyRunning] 에러 상세:", JSON.stringify(e, null, 2));
      Alert.alert("저장 실패", "네트워크 또는 서버 오류가 발생했어요.");
    }
  }, [navigation, t, journeyTitle]);

  const elapsedLabel = useMemo(() => {
    const m = Math.floor(t.elapsedSec / 60);
    const s = String(t.elapsedSec % 60).padStart(2, "0");
    return `${m}:${s}`;
  }, [t.elapsedSec]);

  // 디버깅: 여정 데이터 확인
  console.log("[JourneyRunning] 여정 경로 개수:", journeyRoute.length);
  console.log("[JourneyRunning] 랜드마크 개수:", landmarks.length);
  console.log("[JourneyRunning] 사용자 경로 개수:", t.route.length);
  console.log("[JourneyRunning] 진행률:", t.progressPercent.toFixed(1), "%");

  // 진행률에 따른 여정 경로 상의 가상 위치 계산 (선형 보간)
  const virtualLocation = useMemo(() => {
    if (journeyRoute.length === 0) return null;
    if (journeyRoute.length === 1) return journeyRoute[0];

    // 정확한 인덱스 계산 (소수점 포함)
    const exactIndex = (journeyRoute.length - 1) * t.progressPercent / 100;
    const beforeIndex = Math.floor(exactIndex);
    const afterIndex = Math.min(beforeIndex + 1, journeyRoute.length - 1);
    const ratio = exactIndex - beforeIndex;  // 0~1 사이 값

    const pointA = journeyRoute[beforeIndex];
    const pointB = journeyRoute[afterIndex];

    // 두 점 사이를 ratio 비율로 선형 보간
    return {
      latitude: pointA.latitude + (pointB.latitude - pointA.latitude) * ratio,
      longitude: pointA.longitude + (pointB.longitude - pointA.longitude) * ratio,
    };
  }, [journeyRoute, t.progressPercent]);

  return (
    <SafeLayout withBottomInset>
      <JourneyMapRoute
        journeyRoute={journeyRoute}
        landmarks={t.landmarksWithReached}
        userRoute={[]} // 여정 러닝에서는 실제 GPS 경로 표시 안 함
        currentLocation={virtualLocation}
        progressPercent={t.progressPercent}
        onLandmarkPress={handleLandmarkMarkerPress}
      />

      {/* 러닝 중이 아닐 때: 여정 진행률 카드 */}
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
                  id: parseInt(t.nextLandmark.id),
                }
              : null
          }
          onPressGuestbook={(landmarkId) => {
            const landmark = landmarks.find((lm) => parseInt(lm.id) === landmarkId);
            if (landmark) {
              navigation?.navigate("LandmarkGuestbookScreen", {
                landmarkId,
                landmarkName: landmark.name,
              });
            }
          }}
        />
      )}

      {/* 러닝 중일 때: 러닝 통계 + 간소화된 진행률 */}
      {(t.isRunning || t.isPaused) && (
        <>
          <RunStatsCard
            distanceKm={t.distance}
            paceLabel={t.paceLabel}
            kcal={t.kcal}
            speedKmh={t.speedKmh}
            elapsedSec={t.elapsedSec}
          />

          {/* 간소화된 진행률 표시 */}
          <View style={styles.compactProgressCard}>
            <View style={styles.compactHeader}>
              <Text style={styles.compactTitle}>여정 진행</Text>
              <Text style={styles.compactPercent}>
                {t.progressPercent.toFixed(1)}%
              </Text>
            </View>
            <View style={styles.compactProgressBar}>
              <View
                style={[
                  styles.compactProgressFill,
                  { width: `${Math.min(100, t.progressPercent)}%` },
                ]}
              />
            </View>
            {t.nextLandmark && (
              <Text style={styles.compactNextLandmark}>
                다음: {t.nextLandmark.name} (
                {(t.nextLandmark.distanceM / 1000 - t.progressM / 1000).toFixed(
                  1
                )}{" "}
                km)
              </Text>
            )}
          </View>
        </>
      )}

      {/* 일시정지 오버레이 */}
      {t.isPaused && (
        <>
          {/* 배경 흐림 효과 */}
          <View pointerEvents="none" style={styles.pauseBlurOverlay} />

          {/* 일시정지 텍스트 */}
          <View pointerEvents="none" style={styles.pauseTextContainer}>
            <Text style={styles.pauseTitle}>일시정지</Text>
            <Text style={styles.pauseDesc}>재생 ▶ 을 누르면 다시 시작됩니다.</Text>
            <Text style={styles.pauseDesc}>
              종료하려면 ■ 버튼을 2초간 길게 누르세요.
            </Text>
          </View>
        </>
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

      {/* 방명록 작성 모달 */}
      {selectedLandmark && (
        <GuestbookCreateModal
          visible={guestbookModalVisible}
          onClose={() => {
            setGuestbookModalVisible(false);
            setSelectedLandmark(null);
          }}
          landmark={selectedLandmark}
          userId={1} // TODO: 실제 userId로 교체
          onSuccess={() => {
            console.log("[JourneyRunning] 방명록 작성 완료");
          }}
        />
      )}

      {/* 랜드마크 메뉴 바텀시트 */}
      <Modal
        visible={landmarkMenuVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLandmarkMenuVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setLandmarkMenuVisible(false)}
        >
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHandle} />

            {menuLandmark && (
              <>
                <View style={styles.bottomSheetHeader}>
                  <Text style={styles.bottomSheetTitle}>
                    {menuLandmark.name}
                  </Text>
                  <Text style={styles.bottomSheetSubtitle}>
                    {menuLandmark.distance}
                  </Text>
                </View>

                {/* 랜드마크 통계 */}
                <View style={styles.statisticsContainer}>
                  <LandmarkStatistics
                    landmarkId={parseInt(menuLandmark.id)}
                  />
                </View>

                {/* 메뉴 옵션 */}
                <View style={styles.menuOptions}>
                  <TouchableOpacity
                    style={styles.menuOption}
                    onPress={() => {
                      setLandmarkMenuVisible(false);
                      const landmarkSummary: LandmarkSummary = {
                        id: parseInt(menuLandmark.id),
                        name: menuLandmark.name,
                        cityName: "서울",
                        countryCode: "KR",
                        imageUrl: "",
                      };
                      setSelectedLandmark(landmarkSummary);
                      setGuestbookModalVisible(true);
                    }}
                  >
                    <Text style={styles.menuOptionIcon}>✍️</Text>
                    <Text style={styles.menuOptionText}>방명록 작성</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuOption}
                    onPress={() => {
                      setLandmarkMenuVisible(false);
                      navigation?.navigate("LandmarkGuestbookScreen", {
                        landmarkId: parseInt(menuLandmark.id),
                        landmarkName: menuLandmark.name,
                      });
                    }}
                  >
                    <Text style={styles.menuOptionIcon}>📖</Text>
                    <Text style={styles.menuOptionText}>방명록 보기</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.menuOption, styles.menuOptionCancel]}
                    onPress={() => setLandmarkMenuVisible(false)}
                  >
                    <Text style={styles.menuOptionText}>닫기</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  pauseBlurOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  pauseTextContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  pauseTitle: {
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 8,
    color: "#fff",
  },
  pauseDesc: {
    color: "#fff",
    marginTop: 2,
    fontSize: 14,
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
  compactProgressCard: {
    position: "absolute",
    top: 120,
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  compactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  compactTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
  },
  compactPercent: {
    fontSize: 16,
    fontWeight: "900",
    color: "#6366F1",
  },
  compactProgressBar: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  compactProgressFill: {
    height: "100%",
    backgroundColor: "#10B981",
    borderRadius: 3,
  },
  compactNextLandmark: {
    fontSize: 12,
    color: "#4B5563",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  bottomSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 8,
    minHeight: 400,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  bottomSheetHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  bottomSheetTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  bottomSheetSubtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  statisticsContainer: {
    marginBottom: 20,
  },
  menuOptions: {
    gap: 12,
  },
  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuOptionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  menuOptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  menuOptionCancel: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: 8,
  },
});
