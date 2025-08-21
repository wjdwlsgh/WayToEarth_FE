import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiComplete } from "../utils/api";
import SummaryMap from "../components/Running/SummaryMap";

export default function RunSummaryScreen({ route, navigation }: any) {
  const {
    distanceKm,
    paceLabel,
    kcal,
    elapsedLabel,
    elapsedSec,
    routePath = [],
    startedAt,
    endedAt,
    sessionId,
  } = route.params || {};

  const [title, setTitle] = useState("금요일 오전 러닝");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [saving, setSaving] = useState(false);
  const runIdRef = useRef<string | null>(null);

  const paceSecPerKm = useMemo(() => {
    if (!paceLabel || paceLabel.includes("-")) return null;
    const [m, s] = String(paceLabel)
      .split(":")
      .map((v) => parseInt(v, 10));
    if (Number.isNaN(m) || Number.isNaN(s)) return null;
    return m * 60 + s;
  }, [paceLabel]);

  // 현재 날짜와 시간 포맷
  const currentDateTime = useMemo(() => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    const timeStr = `${hours}:${minutes.toString().padStart(2, "0")}`;
    return `${month.toString().padStart(2, "0")}월 ${day
      .toString()
      .padStart(2, "0")}일 오전 ${timeStr}`;
  }, []);

  useEffect(() => {
    (async () => {
      if (runIdRef.current || saving) return;
      try {
        setSaving(true);

        // 경로 데이터 정규화
        const normalized =
          routePath?.length && routePath[0]?.lat != null
            ? routePath.map((p: any, i: number) => ({
                latitude: p.latitude ?? p.lat,
                longitude: p.longitude ?? p.lng,
                sequence: i,
                t: p.t ? Math.floor(p.t) : undefined,
              }))
            : routePath.map((p: any, i: number) => ({
                latitude: p.latitude,
                longitude: p.longitude,
                sequence: i,
              }));

        const res = await apiComplete({
          sessionId: sessionId ?? `local_${Date.now()}`,
          endedAt: endedAt ? Date.parse(endedAt) : Date.now(),
          distanceMeters: Math.round((distanceKm ?? 0) * 1000),
          durationSeconds:
            elapsedSec ??
            (() => {
              const [mm, ss] = String(elapsedLabel ?? "0:00")
                .split(":")
                .map((x) => parseInt(x, 10));
              return (mm || 0) * 60 + (ss || 0);
            })(),
          averagePaceSeconds: paceSecPerKm,
          calories: kcal ?? 0,
          routePoints: normalized,
          title,
        });

        runIdRef.current = res.runId;
      } catch (e) {
        console.error(e);
        Alert.alert("저장 실패", "네트워크 상태를 확인하고 다시 시도해주세요.");
      } finally {
        setSaving(false);
      }
    })();
  }, [
    distanceKm,
    elapsedLabel,
    elapsedSec,
    kcal,
    paceSecPerKm,
    routePath,
    endedAt,
    sessionId,
    saving,
    title,
  ]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </Pressable>
        </View>

        {/* 날짜 및 시간 */}
        <Text style={styles.dateTime}>{currentDateTime}</Text>

        {/* 제목 */}
        <View style={styles.titleSection}>
          {isEditingTitle ? (
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              onBlur={() => setIsEditingTitle(false)}
              onSubmitEditing={() => setIsEditingTitle(false)}
              autoFocus
              selectTextOnFocus
            />
          ) : (
            <Pressable
              style={styles.titleContainer}
              onPress={() => setIsEditingTitle(true)}
            >
              <Text style={styles.title}>{title}</Text>
              <Ionicons name="pencil" size={20} color="#666" />
            </Pressable>
          )}
        </View>

        {/* 거리 표시 */}
        <Text style={styles.distance}>
          {distanceKm?.toFixed(2) || "0.00"}Km
        </Text>

        {/* 지도 */}
        <View style={styles.mapContainer}>
          <SummaryMap
            route={
              routePath?.length && routePath[0]?.lat != null
                ? routePath.map((p: any) => ({
                    latitude: p.latitude ?? p.lat,
                    longitude: p.longitude ?? p.lng,
                  }))
                : routePath
            }
            height={280}
            borderRadius={16}
            showKmMarkers
          />
        </View>

        {/* 통계 */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{elapsedLabel || "0:00"}</Text>
            <Text style={styles.statLabel}>시간</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{paceLabel || "0'00\""}</Text>
            <Text style={styles.statLabel}>평균 페이스</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{kcal || 0}</Text>
            <Text style={styles.statLabel}>칼로리</Text>
          </View>
        </View>

        {/* 공유하기 버튼 */}
        <Pressable
          style={[
            styles.shareButton,
            (!runIdRef.current || saving) && styles.shareButtonDisabled,
          ]}
          disabled={!runIdRef.current || saving}
          onPress={() => {
            if (!runIdRef.current) {
              Alert.alert("잠시만요", "기록 저장 후 다시 시도해주세요.");
              return;
            }
            navigation.navigate("FeedCompose", {
              runId: runIdRef.current,
              defaultTitle: title,
              distanceKm,
              paceLabel,
              elapsedLabel,
              kcal,
            });
          }}
        >
          <Text style={styles.shareButtonText}>
            {saving ? "저장 중..." : "공유하기"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  dateTime: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 20,
  },
  titleSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    flex: 1,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    borderBottomWidth: 1,
    borderBottomColor: "#3B82F6",
    paddingBottom: 4,
  },
  distance: {
    fontSize: 48,
    fontWeight: "900",
    color: "#000",
    textAlign: "center",
    marginBottom: 24,
  },
  mapContainer: {
    marginHorizontal: 20,
    marginBottom: 32,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#000",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  shareButton: {
    backgroundColor: "#000",
    marginHorizontal: 20,
    marginBottom: 40,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  shareButtonDisabled: {
    backgroundColor: "#ccc",
  },
  shareButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
