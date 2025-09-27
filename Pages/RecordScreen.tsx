import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Dimensions } from "react-native";
import { getWeeklyStats, listRunningRecords, getRunningRecordDetail } from "../utils/api/running";
import MapView, { Polyline } from "react-native-maps";

export default function RecordScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [weekly, setWeekly] = useState<any | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const width = Dimensions.get("window").width;
  const [previews, setPreviews] = useState<Record<number, { coords: { latitude: number; longitude: number }[] }>>({});

  useEffect(() => {
    (async () => {
      try {
        const [w, r] = await Promise.all([
          getWeeklyStats(),
          listRunningRecords(5),
        ]);
        setWeekly(w ?? null);
        setRecords(Array.isArray(r) ? r : []);
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
        const ids = records.slice(0, 5).map((r: any) => r.id).filter(Boolean);
        await Promise.all(
          ids.map(async (id) => {
            if (previews[id]) return;
            try {
              const d = await getRunningRecordDetail(id);
              const pts = (d.routePoints || []).map((p) => ({ latitude: p.latitude, longitude: p.longitude }));
              if (pts.length) setPreviews((prev) => ({ ...prev, [id]: { coords: pts } }));
            } catch {}
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

  const WeeklyChart = ({ weekly }: { weekly: any }) => {
    const dailyDistances: Array<{ day: string; distance: number }> =
      weekly?.dailyDistances || [];
    const chartHeight = 140;
    const barWidth = Math.floor((width - 80) / 7);

    if (!dailyDistances.length) {
      return (
        <View style={s.card}>
          <Text style={s.chartTitle}>주간 러닝 거리</Text>
          <Text style={s.emptyChartText}>주간 거리 데이터가 없습니다</Text>
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
      <View style={s.card}>
        <Text style={s.chartTitle}>
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
                <Text style={[s.dayLabel, isToday && s.todayLabel]}>
                  {dayLabel(item?.day || "")}
                </Text>
                <Text style={[s.distanceLabel, distance > 0 && s.hasDistanceLabel]}>
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
      {/* 헤더 - 프로필과 일관성 */}
      <View style={s.header}>
        <View style={{ width: 28 }} />
        <Text style={s.headerTitle}>운동 기록</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={s.scrollContainer}>
        {/* 주간 요약 카드 */}
        <View style={s.summaryCard}>
          <View style={s.summaryCardGradient} />
          <View style={s.summaryHeader}>
            <Text style={s.summaryTitle}>이번 주 러닝</Text>
            <View style={s.weeklyBadge}>
              <Text style={s.weeklyBadgeText}>🏃‍♂️</Text>
            </View>
          </View>
          {weekly ? (
            <View style={s.summaryContent}>
              <View style={s.summaryStats}>
                <View style={s.summaryStatItem}>
                  <Text style={s.summaryStatValue}>{(weekly.totalDistance ?? 0).toFixed(1)}</Text>
                  <Text style={s.summaryStatLabel}>km 완주</Text>
                </View>
                <View style={s.summaryDivider} />
                <View style={s.summaryStatItem}>
                  <Text style={s.summaryStatValue}>{records.length}</Text>
                  <Text style={s.summaryStatLabel}>회 러닝</Text>
                </View>
              </View>
              <View style={s.progressSection}>
                <View style={s.progressHeader}>
                  <Text style={s.progressLabel}>주간 목표</Text>
                  <Text style={s.progressText}>
                    {Math.min(Math.round(((weekly.totalDistance ?? 0) / 15) * 100), 100)}% 달성
                  </Text>
                </View>
                <View style={s.progressBarContainer}>
                  <View style={s.progressBarBg}>
                    <View
                      style={[
                        s.progressBarFill,
                        { width: `${Math.min(((weekly.totalDistance ?? 0) / 15) * 100, 100)}%` }
                      ]}
                    />
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <Text style={s.summarySubtitle}>이번 주 러닝 데이터가 없습니다</Text>
          )}
        </View>
        {weekly ? (
          <>
            <WeeklyChart weekly={weekly} />
            <View style={s.statsCard}>
              <View style={s.statsRow}>
                <View style={s.statItem}>
                  <Text style={s.statValue}>
                    {(weekly.totalDistance ?? 0).toFixed(1)}
                  </Text>
                  <Text style={s.statLabel}>거리(km)</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.statItem}>
                  <Text style={s.statValue}>
                    {formatDuration(weekly.totalDuration ?? 0)}
                  </Text>
                  <Text style={s.statLabel}>시간</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.statItem}>
                  <Text style={s.statValue}>{weekly.averagePace ?? "-:-"}</Text>
                  <Text style={s.statLabel}>평균 페이스</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <View style={s.emptyCard}>
            <Text style={s.emptyText}>통계 없음</Text>
          </View>
        )}

        {/* 최근 기록 섹션 */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>최근 운동 기록</Text>
        </View>

        {records.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyIcon}>🏃‍♂️</Text>
            <Text style={s.emptyText}>최근 운동 기록이 없습니다</Text>
            <Text style={s.emptySubtext}>첫 러닝을 시작해보세요!</Text>
          </View>
        ) : (
          records.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={s.recordCard}
              onPress={() =>
                navigation.navigate("RecordDetailScreen", { recordId: r.id })
              }
              activeOpacity={0.8}
            >
              <View style={s.mapPreview}>
                {previews[r.id]?.coords?.length ? (
                  <MapView
                    pointerEvents="none"
                    style={s.mapView}
                    initialRegion={{
                      latitude: previews[r.id].coords[0].latitude,
                      longitude: previews[r.id].coords[0].longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}
                  >
                    <Polyline
                      coordinates={previews[r.id].coords}
                      strokeColor="#6366f1"
                      strokeWidth={3}
                    />
                  </MapView>
                ) : (
                  <View style={s.mapFallback}>
                    <Text style={s.mapFallbackIcon}>📍</Text>
                  </View>
                )}
              </View>
              <View style={s.recordInfo}>
                <Text style={s.recordTitle}>{r.title || "러닝 기록"}</Text>
                <Text style={s.recordStats}>
                  {(r.distanceKm ?? 0).toFixed(2)}km • {formatDuration(r.durationSeconds)} • {r.calories ?? 0}kcal
                </Text>
              </View>
              <View style={s.recordArrow}>
                <Text style={s.recordArrowText}>›</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  // 헤더 - 프로필과 동일한 스타일
  header: {
    height: 90,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    letterSpacing: -0.3,
  },

  scrollContainer: { padding: 16 },

  // 요약 카드
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.1)",
  },
  summaryCardGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: "linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  summarySubtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  summaryValue: {
    fontWeight: "700",
    color: "#6366f1",
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  weeklyBadge: {
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  weeklyBadgeText: {
    fontSize: 16,
  },
  summaryContent: {
    gap: 16,
  },
  summaryStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryStatItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryStatValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1e293b",
    letterSpacing: -0.5,
  },
  summaryStatLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(0, 0, 0, 0.08)",
    marginHorizontal: 16,
  },
  progressSection: {
    gap: 8,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  progressText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6366f1",
  },
  progressBarContainer: {
    alignItems: "center",
  },
  progressBarBg: {
    width: "100%",
    height: 6,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#6366f1",
    borderRadius: 3,
  },

  // 차트 카드
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.04)",
  },

  // 통계 카드
  statsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.04)",
  },
  statsRow: { flexDirection: "row", alignItems: "center" },
  statItem: { flex: 1, alignItems: "center" },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1e293b",
    letterSpacing: -0.3,
  },
  statLabel: {
    color: "#64748b",
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(0, 0, 0, 0.08)",
    marginHorizontal: 16,
  },

  // 섹션 헤더
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    letterSpacing: -0.3,
  },

  // 기록 카드
  recordCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.04)",
  },
  mapPreview: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 16,
    backgroundColor: "#f1f5f9",
  },
  mapView: { flex: 1 },
  mapFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99, 102, 241, 0.1)",
  },
  mapFallbackIcon: { fontSize: 24, color: "#6366f1" },
  recordInfo: { flex: 1 },
  recordTitle: {
    fontWeight: "700",
    color: "#1e293b",
    fontSize: 16,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  recordStats: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "500",
  },
  recordArrow: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  recordArrowText: {
    color: "#94a3b8",
    fontSize: 18,
    fontWeight: "600"
  },

  // 빈 상태
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.04)",
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: {
    color: "#64748b",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  emptySubtext: {
    color: "#94a3b8",
    fontSize: 14,
  },

  // 차트 스타일
  chartTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  emptyChartText: {
    color: "#64748b",
    fontSize: 14,
    textAlign: "center",
  },
  dayLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
  },
  todayLabel: {
    color: "#6366f1",
  },
  distanceLabel: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "500",
  },
  hasDistanceLabel: {
    color: "#1e293b",
  },
});
