// Pages/JourneyRunningScreen.tsx
// 여정 러닝 메인 화면 (실시간 추적 + 진행률)

import React, { useState, useCallback, useMemo, useEffect } from "react";
import * as Location from "expo-location";
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
  AppState,
} from "react-native";
import JourneyMapRoute from "../components/Journey/JourneyMapRoute";
import JourneyProgressCard from "../components/Journey/JourneyProgressCard";
import RunStatsCard from "../components/Running/RunStatsCard";
import RunPlayControls from "../components/Running/RunPlayControls";
import CountdownOverlay from "../components/Running/CountdownOverlay";
import GuestbookCreateModal from "../components/Guestbook/GuestbookCreateModal";
import LandmarkStatistics from "../components/Guestbook/LandmarkStatistics";
import { useJourneyRunning } from "../hooks/journey/useJourneyRunning";
import { useBackgroundRunning } from "../hooks/journey/useBackgroundRunning";
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

  // 백그라운드 러닝 훅
  const backgroundRunning = useBackgroundRunning();

  const insets = useSafeAreaInsets();
  const [countdownVisible, setCountdownVisible] = useState(false);
  const [guestbookModalVisible, setGuestbookModalVisible] = useState(false);
  const [selectedLandmark, setSelectedLandmark] = useState<LandmarkSummary | null>(null);
  const [landmarkMenuVisible, setLandmarkMenuVisible] = useState(false);
  const [menuLandmark, setMenuLandmark] = useState<any>(null);

  // 다음 랜드마크 계산
  // 도달한 랜드마크 ID 목록을 훅의 landmarksWithReached에서 파생
  const reachedIds = useMemo(
    () => t.landmarksWithReached.filter(lm => lm.reached).map(lm => lm.id),
    [t.landmarksWithReached]
  );

  const nextLandmark = useMemo(() => {
    const remaining = landmarks.filter(lm => !reachedIds.includes(lm.id));
    return remaining[0]?.name;
  }, [landmarks, reachedIds]);

  // 러닝 세션 상태 업데이트
  useEffect(() => {
    if (!t.isRunning) return;

    const session = {
      type: 'journey' as const,
      journeyId,
      journeyTitle,
      sessionId: t.sessionId,
      startTime: Date.now() - (t.elapsedSec * 1000),
      distanceKm: t.distance,
      durationSeconds: t.elapsedSec,
      isRunning: t.isRunning,
      isPaused: t.isPaused,
      reachedLandmarks: reachedIds,
    };

    // Foreground Service 업데이트
    backgroundRunning.updateForegroundService(session, nextLandmark);

    // 세션 상태 저장 (백그라운드 복원용)
    backgroundRunning.saveSession(session);
  }, [t.isRunning, t.distance, t.elapsedSec, t.isPaused, nextLandmark]);

  // 러닝 시작 시 Foreground Service 시작
  useEffect(() => {
    if (t.isRunning) {
      const session = {
        type: 'journey' as const,
        journeyId,
        journeyTitle,
        sessionId: t.sessionId,
        startTime: Date.now() - (t.elapsedSec * 1000),
        distanceKm: t.distance,
        durationSeconds: t.elapsedSec,
        isRunning: true,
        isPaused: t.isPaused,
        reachedLandmarks: reachedIds,
      };
      backgroundRunning.startForegroundService(session);
    }
  }, [t.isRunning]);

  // 컴포넌트 언마운트 시 세션 정리 (완료/취소 시)
  useEffect(() => {
    return () => {
      if (!t.isRunning) {
        backgroundRunning.stopForegroundService();
        backgroundRunning.clearSession();
      }
    };
  }, []);

  const handleStartPress = useCallback(() => {
    console.log("[JourneyRunning] start pressed -> show countdown");
    setCountdownVisible(true);
  }, []);

  const handleCountdownDone = useCallback(async () => {
    console.log("[JourneyRunning] countdown done");
    setCountdownVisible(false);
    // 즉시 시작 시도 (권한은 내부에서 처리)
    requestAnimationFrame(() => {
      console.log("[JourneyRunning] calling t.startJourneyRun()");
      t.startJourneyRun();
    });
    // 알림 권한 요청은 비동기로 병렬 처리
    backgroundRunning.requestNotificationPermission().catch(() => {});
  }, [t, backgroundRunning]);

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

      // 백그라운드 서비스 중지 및 세션 정리
      await backgroundRunning.stopForegroundService();
      await backgroundRunning.clearSession();

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
  console.log("[JourneyRunning] 총 여정 거리:", totalDistanceKm, "km");
  console.log("[JourneyRunning] 랜드마크 개수:", landmarks.length);
  console.log("[JourneyRunning] 랜드마크 목록:", landmarks.map(lm => ({
    name: lm.name,
    distanceM: lm.distanceM,
    distanceKm: (lm.distanceM / 1000).toFixed(2) + "km",
  })));

  // 🔍 청와대 위치 확인 (첫 번째 랜드마크)
  if (landmarks.length > 1) {
    const landmark = landmarks[1]; // 청와대
    console.log("[JourneyRunning] 🎯 청와대 위치:", {
      position: landmark.position,
      distanceM: landmark.distanceM,
    });
    // journeyRoute에서 청와대와 가장 가까운 포인트 찾기
    let closestIndex = 0;
    let minDist = 999999;
    journeyRoute.forEach((point, idx) => {
      const dist = Math.sqrt(
        Math.pow(point.latitude - landmark.position.latitude, 2) +
        Math.pow(point.longitude - landmark.position.longitude, 2)
      );
      if (dist < minDist) {
        minDist = dist;
        closestIndex = idx;
      }
    });
    console.log("[JourneyRunning] 🗺️ 청와대가 여정 경로의 몇 번째 포인트?:", {
      closestIndex,
      totalPoints: journeyRoute.length,
      percentage: ((closestIndex / (journeyRoute.length - 1)) * 100).toFixed(1) + "%",
    });
  }

  console.log("[JourneyRunning] 사용자 경로 개수:", t.route.length);
  console.log("[JourneyRunning] 진행률:", t.progressPercent.toFixed(1), "%");

  // 진행률에 따른 여정 경로 상의 가상 위치 계산 (거리 기반으로 수정)
  const virtualLocation = useMemo(() => {
    if (journeyRoute.length === 0) return null;
    if (journeyRoute.length === 1) return journeyRoute[0];

    // 🔧 수정: 각 랜드마크 사이를 거리 비율로 분할
    // 현재 진행 거리로 어느 구간에 있는지 찾기
    let currentSegmentStart = 0;
    let currentSegmentEnd = landmarks.length > 1 ? landmarks[1].distanceM : totalDistanceKm * 1000;
    let segmentStartIdx = 0;
    let segmentEndIdx = landmarks.length > 1 ?
      journeyRoute.findIndex(p =>
        Math.abs(p.latitude - landmarks[1].position.latitude) < 0.0001 &&
        Math.abs(p.longitude - landmarks[1].position.longitude) < 0.0001
      ) : journeyRoute.length - 1;

    // 현재 어느 랜드마크 구간에 있는지 찾기
    for (let i = 0; i < landmarks.length; i++) {
      // 🔧 수정: <= 대신 < 사용 (랜드마크 정확히 도달 시 다음 구간으로)
      if (t.progressM <= landmarks[i].distanceM || i === landmarks.length - 1) {
        currentSegmentEnd = landmarks[i].distanceM;
        currentSegmentStart = i > 0 ? landmarks[i - 1].distanceM : 0;

        // 해당 랜드마크와 가장 가까운 경로 포인트 찾기
        const landmark = landmarks[i];
        let minDist = 999999;
        segmentEndIdx = journeyRoute.length - 1; // 기본값: 마지막 포인트
        journeyRoute.forEach((point, idx) => {
          const dist = Math.sqrt(
            Math.pow(point.latitude - landmark.position.latitude, 2) +
            Math.pow(point.longitude - landmark.position.longitude, 2)
          );
          if (dist < minDist) {
            minDist = dist;
            segmentEndIdx = idx;
          }
        });

        if (i > 0) {
          const prevLandmark = landmarks[i - 1];
          minDist = 999999;
          segmentStartIdx = 0; // 기본값: 첫 포인트
          journeyRoute.forEach((point, idx) => {
            const dist = Math.sqrt(
              Math.pow(point.latitude - prevLandmark.position.latitude, 2) +
              Math.pow(point.longitude - prevLandmark.position.longitude, 2)
            );
            if (dist < minDist) {
              minDist = dist;
              segmentStartIdx = idx;
            }
          });
        } else {
          segmentStartIdx = 0; // 첫 번째 구간의 시작은 0
        }

        console.log("[JourneyRunning] 🔍 구간 찾기:", {
          landmarkIndex: i,
          landmarkName: landmark.name,
          segmentStartIdx,
          segmentEndIdx,
          currentSegmentStart,
          currentSegmentEnd,
        });

        break;
      }
    }

    // 구간 내에서의 진행 비율 계산
    const segmentDistance = currentSegmentEnd - currentSegmentStart;
    const progressInSegment = t.progressM - currentSegmentStart;
    const segmentRatio = segmentDistance > 0 ? progressInSegment / segmentDistance : 0;

    // 경로 포인트 인덱스 계산
    const indexRange = segmentEndIdx - segmentStartIdx;
    const exactIndex = segmentStartIdx + (indexRange * segmentRatio);
    const beforeIndex = Math.floor(exactIndex);
    const afterIndex = Math.min(beforeIndex + 1, journeyRoute.length - 1);
    const ratio = exactIndex - beforeIndex;

    const pointA = journeyRoute[beforeIndex];
    const pointB = journeyRoute[afterIndex];

    // 선형 보간
    const interpolated = {
      latitude: pointA.latitude + (pointB.latitude - pointA.latitude) * ratio,
      longitude: pointA.longitude + (pointB.longitude - pointA.longitude) * ratio,
    };

    console.log("[JourneyRunning] 가상 위치 계산 (거리 기반):", {
      progressM: t.progressM,
      segmentStart: currentSegmentStart,
      segmentEnd: currentSegmentEnd,
      segmentRatio: segmentRatio.toFixed(4),
      exactIndex: exactIndex.toFixed(4),
      beforeIndex,
      afterIndex,
    });

    return {
      location: interpolated,
      routeIndex: exactIndex, // 경로 인덱스도 함께 반환
    };
  }, [journeyRoute, t.progressM, landmarks, totalDistanceKm]);

  // 가상 위치와 인덱스 분리
  const virtualLocationPoint = virtualLocation?.location || null;
  const virtualRouteIndex = virtualLocation?.routeIndex || 0;

  return (
    <SafeLayout withBottomInset>
      <JourneyMapRoute
        journeyRoute={journeyRoute}
        landmarks={t.landmarksWithReached}
        userRoute={[]} // 여정 러닝에서는 실제 GPS 경로 표시 안 함
        currentLocation={virtualLocationPoint}
        progressPercent={t.progressPercent}
        virtualRouteIndex={virtualRouteIndex}
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
                {(() => {
                  const remaining = (t.nextLandmark.distanceM - t.progressM) / 1000;
                  console.log("[JourneyRunning] 랜드마크 거리 계산:", {
                    landmarkName: t.nextLandmark.name,
                    landmarkDistanceM: t.nextLandmark.distanceM,
                    progressM: t.progressM,
                    remainingKm: remaining.toFixed(3),
                  });
                  return remaining.toFixed(1);
                })()}{" "}
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

      {/* 🧪 테스트 버튼 (거리 증가) */}
      <View style={styles.testButtonContainer}>
        <Pressable
          onPress={() => t.addTestDistance(1)}
          style={styles.testButton}
        >
          <Text style={styles.testButtonText}>+1m</Text>
        </Pressable>
        <Pressable
          onPress={() => t.addTestDistance(5)}
          style={styles.testButton}
        >
          <Text style={styles.testButtonText}>+5m</Text>
        </Pressable>
        <Pressable
          onPress={() => t.addTestDistance(10)}
          style={styles.testButton}
        >
          <Text style={styles.testButtonText}>+10m</Text>
        </Pressable>
      </View>

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
  testButtonContainer: {
    position: "absolute",
    top: 120,
    right: 16,
    flexDirection: "column",
    gap: 8,
    zIndex: 1000,
  },
  testButton: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  testButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
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
