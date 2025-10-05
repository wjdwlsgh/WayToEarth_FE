import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { Dimensions } from "react-native";
import {
  getWeeklyStats,
  listRunningRecords,
  getRunningRecordDetail,
} from "../utils/api/running";
import { getMyProfile } from "../utils/api/users";
import { client } from "../utils/api/client";
import MapView, { Polyline } from "react-native-maps";
import {
  getAIFeedback,
  createAIFeedback,
  getFriendlyErrorMessage,
  AIFeedback,
} from "../utils/api/aiFeedback";

export default function RecordScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [weekly, setWeekly] = useState<any | null>(null);
  const [weeklyGoal, setWeeklyGoal] = useState<string>("");
  const [savingGoal, setSavingGoal] = useState(false);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [totalRunningCount, setTotalRunningCount] = useState<number>(0);
  const [records, setRecords] = useState<any[]>([]);
  const width = Dimensions.get("window").width;
  const [previews, setPreviews] = useState<
    Record<number, { coords: { latitude: number; longitude: number }[] }>
  >({});
  const [aiFeedbacks, setAiFeedbacks] = useState<
    Record<number, AIFeedback | null>
  >({});
  const [aiLoading, setAiLoading] = useState<Record<number, boolean>>({});

  useEffect(() => {
    (async () => {
      try {
        const [w, r, me] = await Promise.all([
          getWeeklyStats(),
          listRunningRecords(5),
          getMyProfile(),
        ]);
        setWeekly(w ?? null);
        setRecords(Array.isArray(r) ? r : []);

        // Load weekly goal and total running count from profile
        const v = (me as any)?.weekly_goal_distance;
        setWeeklyGoal(v != null && !Number.isNaN(Number(v)) ? String(v) : "");
        setTotalRunningCount((me as any)?.total_running_count ?? 0);
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 미니맵 프리뷰 로드(상위 5개만 우선)
  useEffect(() => {
    (async () => {
      try {
        const ids = records
          .slice(0, 5)
          .map((r: any) => r.id)
          .filter(Boolean);
        await Promise.all(
          ids.map(async (id) => {
            if (previews[id]) return;
            try {
              const d = await getRunningRecordDetail(id);
              const pts = (d.routePoints || []).map((p) => ({
                latitude: p.latitude,
                longitude: p.longitude,
              }));
              if (pts.length)
                setPreviews((prev) => ({ ...prev, [id]: { coords: pts } }));
            } catch {}
          })
        );
      } catch {}
    })();
  }, [records]);

  // AI 피드백 조회 (GET으로 먼저 시도)
  useEffect(() => {
    (async () => {
      try {
        const ids = records.map((r: any) => r.id).filter(Boolean);
        await Promise.all(
          ids.map(async (id) => {
            try {
              const feedback = await getAIFeedback(id);
              setAiFeedbacks((prev) => ({ ...prev, [id]: feedback }));
            } catch (err: any) {
              // 404는 정상 (아직 분석 안 됨)
              if (err?.response?.status !== 404) {
                console.warn(`AI feedback fetch error for ${id}:`, err);
              }
              setAiFeedbacks((prev) => ({ ...prev, [id]: null }));
            }
          })
        );
      } catch {}
    })();
  }, [records]);

  const formatDuration = (seconds?: number) => {
    if (!seconds || isNaN(seconds)) return "00:00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // AI 분석 생성
  const handleCreateAIAnalysis = async (recordId: number) => {
    try {
      setAiLoading((prev) => ({ ...prev, [recordId]: true }));
      const feedback = await createAIFeedback(recordId);
      setAiFeedbacks((prev) => ({ ...prev, [recordId]: feedback }));
    } catch (err: any) {
      const friendlyMsg = getFriendlyErrorMessage(err, records.length);
      Alert.alert("AI 분석 실패", friendlyMsg);
    } finally {
      setAiLoading((prev) => ({ ...prev, [recordId]: false }));
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.center}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 8, color: "#6b7280" }}>불러오는 중…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const saveWeeklyGoal = async () => {
    if (savingGoal) return;
    try {
      setSavingGoal(true);
      const weeklyGoalNumber =
        weeklyGoal?.trim() === "" ? undefined : Number(weeklyGoal);

      const payload = {
        weekly_goal_distance:
          typeof weeklyGoalNumber === "number" &&
          !Number.isNaN(weeklyGoalNumber)
            ? weeklyGoalNumber
            : undefined,
      };

      await client.put("/v1/users/me", payload);
      Alert.alert("완료", "주간 목표가 저장되었습니다.");
      setIsEditingGoal(false);
    } catch (e: any) {
      console.warn(e);
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "주간 목표 저장에 실패했습니다.";
      Alert.alert("오류", msg);
    } finally {
      setSavingGoal(false);
    }
  };

  // 이번 주 러닝 횟수 계산
  const weeklyRunCount = weekly?.dailyDistances?.filter(
    (d: any) => (d?.distance ?? 0) > 0
  ).length ?? 0;

  const WeeklyChart = ({ weekly }: { weekly: any }) => {
    const dailyDistances: Array<{ day: string; distance: number }> =
      weekly?.dailyDistances || [];
    const chartHeight = 140;
    const barWidth = Math.floor((width - 80) / 7);

    if (!dailyDistances.length) {
      return (
        <View style={s.card}>
          <Text style={s.dim}>주간 거리 데이터가 없습니다</Text>
        </View>
      );
    }

    const distances = dailyDistances.map((d) => d?.distance ?? 0);
    const weekMax = Math.max(...distances, 0.1);
    const maxDistance = Math.max(weekMax * 1.05, 1);

    const dayLabel = (d: string) => {
      const map: any = {
        MONDAY: "월",
        TUESDAY: "화",
        WEDNESDAY: "수",
        THURSDAY: "목",
        FRIDAY: "금",
        SATURDAY: "토",
        SUNDAY: "일",
      };
      return map[d] ?? d?.slice?.(0, 1) ?? "";
    };

    const todayIndex = new Date().getDay(); // 0=Sun

    return (
      <View style={[s.card, { padding: 16 }]}>
        <Text style={{ fontWeight: "700", marginBottom: 12 }}>
          주간 러닝 거리
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            height: chartHeight,
          }}
        >
          {dailyDistances.map((item, idx) => {
            const distance =
              typeof item?.distance === "number" ? item.distance : 0;
            const h = Math.max((distance / maxDistance) * chartHeight, 2);
            const isToday = (idx + 1) % 7 === todayIndex; // 서버 순서에 따라 조정 가능
            const isFull = distance >= weekMax * 0.95 && distance > 0;
            return (
              <View key={idx} style={{ flex: 1, alignItems: "center" }}>
                <View
                  style={{
                    justifyContent: "flex-end",
                    height: chartHeight,
                    marginBottom: 8,
                  }}
                >
                  <View
                    style={{
                      height: h,
                      width: barWidth - 10,
                      borderRadius: 6,
                      backgroundColor: isFull
                        ? "#059669"
                        : isToday
                        ? "#22c55e"
                        : distance > 0
                        ? "#10b981"
                        : "#e5e7eb",
                    }}
                  />
                </View>
                <Text
                  style={{ fontSize: 12, color: isToday ? "#22c55e" : "#666" }}
                >
                  {dayLabel(item?.day || "")}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: distance > 0 ? "#333" : "#b3b3b3",
                  }}
                >
                  {distance > 0 ? distance.toFixed(1) : "0"}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* 주간 목표 박스 */}
        <View style={s.goalCard}>
          {isEditingGoal ? (
            <>
              <View style={s.goalHeader}>
                <Text style={s.goalTitle}>주간 목표 수정</Text>
                <TouchableOpacity
                  onPress={() => setIsEditingGoal(false)}
                  style={s.editGoalButton}
                >
                  <Text style={s.editGoalButtonText}>취소</Text>
                </TouchableOpacity>
              </View>
              <View style={{ marginTop: 16 }}>
                <Text style={s.goalLabel}>주간 목표 거리 (km)</Text>
                <View style={{ flexDirection: "row", marginTop: 8, gap: 8 }}>
                  <View style={[s.input, { flex: 1 }]}>
                    <TextInput
                      style={{ fontSize: 16, color: "#111", paddingVertical: 8 }}
                      placeholder="예) 25"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                      inputMode="numeric"
                      maxLength={4}
                      value={weeklyGoal}
                      onChangeText={(v) =>
                        setWeeklyGoal((v || "").replace(/[^\d]/g, ""))
                      }
                    />
                  </View>
                  <TouchableOpacity
                    onPress={saveWeeklyGoal}
                    disabled={savingGoal}
                    style={[s.saveGoalButton, savingGoal && { opacity: 0.6 }]}
                  >
                    <Text style={s.saveGoalButtonText}>
                      {savingGoal ? "저장 중" : "저장"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : (
            <>
              {/* 헤더 */}
              <View style={s.goalHeaderRow}>
                <View style={s.goalTitleSection}>
                  <Text style={s.goalSubtitle}>이번 주 목표</Text>
                  <Text style={s.goalMainTitle}>
                    {weeklyGoal ? `${weeklyGoal} km` : "목표 미설정"}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setIsEditingGoal(true)}
                  style={s.editIconButton}
                >
                  <Text style={s.editIconText}>수정</Text>
                </TouchableOpacity>
              </View>

              {/* 프로그레스 바 */}
              <View style={s.progressSection}>
                <View style={s.progressBar}>
                  <View
                    style={[
                      s.progressFill,
                      {
                        width:
                          weeklyGoal && Number(weeklyGoal) > 0
                            ? `${Math.min(
                                ((weekly?.totalDistance ?? 0) /
                                  Number(weeklyGoal)) *
                                  100,
                                100
                              )}%`
                            : "0%",
                      },
                    ]}
                  />
                </View>
                <View style={s.progressTextRow}>
                  <Text style={s.progressCurrentText}>
                    {(weekly?.totalDistance ?? 0).toFixed(1)} km
                  </Text>
                  {weeklyGoal && Number(weeklyGoal) > 0 && (
                    <Text style={s.progressPercentText}>
                      {Math.round(
                        ((weekly?.totalDistance ?? 0) / Number(weeklyGoal)) *
                          100
                      )}
                      %
                    </Text>
                  )}
                </View>
              </View>

              {/* 통계 */}
              <View style={s.goalStatsRow}>
                <View style={s.goalStatItem}>
                  <View style={s.goalStatTextContainer}>
                    <Text style={s.goalStatLabel}>총 러닝</Text>
                    <Text style={s.goalStatValue}>{totalRunningCount}</Text>
                  </View>
                </View>
                <View style={s.goalStatDivider} />
                <View style={s.goalStatItem}>
                  <View style={s.goalStatTextContainer}>
                    <Text style={s.goalStatLabel}>이번 주</Text>
                    <Text style={s.goalStatValue}>{weeklyRunCount}</Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>

        <Text style={[s.h1, { marginTop: 16 }]}>주간 러닝</Text>
        {weekly && (
          <Text style={{ color: "#111", marginTop: 4 }}>
            이번 주 총 거리{" "}
            <Text style={{ fontWeight: "800" }}>
              {(weekly.totalDistance ?? 0).toFixed(1)} km
            </Text>
          </Text>
        )}
        {weekly ? (
          <>
            <WeeklyChart weekly={weekly} />
            <View style={s.card}>
              <View style={s.row3}>
                <View style={s.col}>
                  <Text style={s.v}>
                    {(weekly.totalDistance ?? 0).toFixed(1)}
                  </Text>
                  <Text style={s.k}>거리(km)</Text>
                </View>
                <View style={s.col}>
                  <Text style={s.v}>
                    {formatDuration(weekly.totalDuration ?? 0)}
                  </Text>
                  <Text style={s.k}>시간</Text>
                </View>
                <View style={s.col}>
                  <Text style={s.v}>{weekly.averagePace ?? "-:-"}</Text>
                  <Text style={s.k}>평균 페이스</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <Text style={s.dim}>통계 없음</Text>
        )}

        <Text style={[s.h1, { marginTop: 20 }]}>운동 기록</Text>
        {records.length === 0 ? (
          <View style={s.card}>
            <Text style={[s.dim, { textAlign: "center", marginBottom: 16 }]}>
              최근 운동 기록이 없습니다
            </Text>
            <View style={[s.aiInfoBox]}>
              <Text style={s.aiInfoTitle}>🤖 AI 분석 기능</Text>
              <Text style={s.aiInfoText}>
                AI 분석은 5회 이상 러닝 완료 시 이용 가능해요.
              </Text>
              <Text style={[s.aiInfoText, { fontSize: 12, marginTop: 4 }]}>
                정확한 분석을 위해 일정 수준의 러닝 기록이 필요합니다.
              </Text>
            </View>
          </View>
        ) : (
          records.map((r) => {
            const hasFeedback = aiFeedbacks[r.id];
            const isAiLoading = aiLoading[r.id];
            const canUseAI = records.length >= 5;

            return (
              <View key={r.id} style={s.item}>
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                  onPress={() =>
                    navigation.navigate("RecordDetailScreen", {
                      recordId: r.id,
                    })
                  }
                >
                  <View
                    style={{
                      width: 72,
                      height: 72,
                      marginRight: 12,
                      borderRadius: 12,
                      overflow: "hidden",
                      backgroundColor: "#F3F4F6",
                    }}
                  >
                    {previews[r.id]?.coords?.length ? (
                      <MapView
                        pointerEvents="none"
                        style={{ flex: 1 }}
                        initialRegion={{
                          latitude: previews[r.id].coords[0].latitude,
                          longitude: previews[r.id].coords[0].longitude,
                          latitudeDelta: 0.01,
                          longitudeDelta: 0.01,
                        }}
                      >
                        <Polyline
                          coordinates={previews[r.id].coords}
                          strokeColor="#2563eb"
                          strokeWidth={3}
                        />
                      </MapView>
                    ) : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.itemTitle}>{r.title || "러닝 기록"}</Text>
                    <Text style={s.itemSub}>
                      {(r.distanceKm ?? 0).toFixed(2)}km ·{" "}
                      {formatDuration(r.durationSeconds)} · {r.calories ?? 0}
                      kcal
                    </Text>
                  </View>
                  <Text style={{ color: "#9CA3AF" }}>〉</Text>
                </TouchableOpacity>

                {/* AI 피드백 섹션 */}
                {hasFeedback ? (
                  <View style={s.aiFeedbackBox}>
                    <Text style={s.aiFeedbackLabel}>🤖 AI 코치의 피드백</Text>
                    <Text style={s.aiFeedbackText} numberOfLines={2}>
                      {hasFeedback.feedbackContent}
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate("AIFeedbackScreen", {
                          runningRecordId: r.id,
                          completedCount: records.length,
                        })
                      }
                    >
                      <Text style={s.aiFeedbackMore}>자세히 보기 →</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      s.aiAnalyzeButton,
                      !canUseAI && s.aiAnalyzeButtonDisabled,
                    ]}
                    disabled={!canUseAI || isAiLoading}
                    onPress={() => handleCreateAIAnalysis(r.id)}
                  >
                    {isAiLoading ? (
                      <>
                        <ActivityIndicator size="small" color="#fff" />
                        <Text style={s.aiAnalyzeButtonText}>
                          AI가 분석 중...
                        </Text>
                      </>
                    ) : canUseAI ? (
                      <Text style={s.aiAnalyzeButtonText}>
                        🤖 AI 분석하기
                      </Text>
                    ) : (
                      <Text style={s.aiAnalyzeButtonText}>
                        AI 분석은 {5 - records.length}회 더 러닝하면 이용
                        가능해요!
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
      {/* 탭 내비게이터 사용으로 하단 바는 전역에서 렌더링됨 */}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  h1: { fontSize: 18, fontWeight: "700" },
  dim: { color: "#6b7280" },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  row3: { flexDirection: "row" },
  col: { flex: 1, alignItems: "center" },
  v: { fontSize: 18, fontWeight: "800", color: "#111" },
  k: { color: "#6b7280", marginTop: 4, fontSize: 12 },
  item: {
    marginTop: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    gap: 12,
  },
  itemTitle: { fontWeight: "700", color: "#111" },
  itemSub: { color: "#6b7280", marginTop: 4 },
  input: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    height: 48,
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  aiFeedbackBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  aiFeedbackLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  aiFeedbackText: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
    marginBottom: 8,
  },
  aiFeedbackMore: {
    fontSize: 12,
    color: "#2563EB",
    fontWeight: "600",
  },
  aiAnalyzeButton: {
    backgroundColor: "#111827",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  aiAnalyzeButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  aiAnalyzeButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  aiInfoBox: {
    backgroundColor: "#F0F9FF",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  aiInfoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 8,
  },
  aiInfoText: {
    fontSize: 13,
    color: "#1E40AF",
    lineHeight: 18,
  },
  goalCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  goalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  goalTitleSection: {
    gap: 4,
  },
  goalSubtitle: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  goalMainTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111",
    letterSpacing: -0.3,
  },
  editIconButton: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  editIconText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
  },
  editGoalButton: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editGoalButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  goalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 4,
  },
  saveGoalButton: {
    backgroundColor: "#111827",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  saveGoalButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  goalStatsRow: {
    flexDirection: "row",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    gap: 0,
  },
  goalStatItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  goalStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#E5E7EB",
  },
  goalStatTextContainer: {
    alignItems: "center",
  },
  goalStatValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
    lineHeight: 22,
  },
  goalStatLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    fontWeight: "600",
    marginBottom: 2,
  },
  progressSection: {
    gap: 8,
  },
  progressBar: {
    height: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 5,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#10b981",
    borderRadius: 5,
  },
  progressTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressCurrentText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  progressPercentText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#10b981",
  },
});
