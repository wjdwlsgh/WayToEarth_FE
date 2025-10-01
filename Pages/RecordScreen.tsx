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
import BottomNavigation from "../components/Layout/BottomNav";
import { useBottomNav } from "../hooks/useBottomNav";

export default function RecordScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [weekly, setWeekly] = useState<any | null>(null);
  const [weeklyGoal, setWeeklyGoal] = useState<string>("");
  const [savingGoal, setSavingGoal] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const width = Dimensions.get("window").width;
  const [previews, setPreviews] = useState<
    Record<number, { coords: { latitude: number; longitude: number }[] }>
  >({});
  const { activeTab, onTabPress } = useBottomNav("record");

  useEffect(() => {
    (async () => {
      try {
        const [w, r] = await Promise.all([
          getWeeklyStats(),
          listRunningRecords(5),
        ]);
        setWeekly(w ?? null);
        setRecords(Array.isArray(r) ? r : []);
        // Load current weekly goal from profile
        try {
          const me = await getMyProfile();
          const v = (me as any)?.weekly_goal_distance;
          setWeeklyGoal(v != null && !Number.isNaN(Number(v)) ? String(v) : "");
        } catch {}
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

  const saveWeeklyGoal = async () => {
    if (savingGoal) return;
    try {
      setSavingGoal(true);
      const n = weeklyGoal?.trim() === "" ? undefined : Number(weeklyGoal);
      await client.put("/v1/users/me", {
        weekly_goal_distance:
          typeof n === "number" && !Number.isNaN(n) ? n : undefined,
      });
    } catch (e) {
      console.warn(e);
    } finally {
      setSavingGoal(false);
    }
  };

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
        {/* 주간 목표 설정 */}
        <View style={s.card}>
          <Text style={s.h1}>주간 목표</Text>
          <Text style={[s.dim, { marginTop: 4 }]}>주간 목표 거리 (km)</Text>
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
          </View>
          <View style={{ alignItems: "flex-end", marginTop: 10 }}>
            <TouchableOpacity
              onPress={saveWeeklyGoal}
              disabled={savingGoal}
              style={{
                backgroundColor: "#111827",
                paddingHorizontal: 14,
                height: 42,
                borderRadius: 10,
                justifyContent: "center",
                alignItems: "center",
                opacity: savingGoal ? 0.6 : 1,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>
                {savingGoal ? "저장 중…" : "목표 저장"}
              </Text>
            </TouchableOpacity>
          </View>
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
          <View style={[s.card, { alignItems: "center" }]}>
            <Text style={s.dim}>최근 운동 기록이 없습니다</Text>
          </View>
        ) : (
          records.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={s.item}
              onPress={() =>
                navigation.navigate("RecordDetailScreen", { recordId: r.id })
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
                  {formatDuration(r.durationSeconds)} · {r.calories ?? 0}kcal
                </Text>
              </View>
              <Text style={{ color: "#9CA3AF" }}>〉</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      <BottomNavigation activeTab={activeTab} onTabPress={onTabPress} />
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
    flexDirection: "row",
    alignItems: "center",
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
});
