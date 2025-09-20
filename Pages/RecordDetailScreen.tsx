import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Image,
  PanResponder,
  Animated,
} from "react-native";
import MapView, { Polyline } from "react-native-maps";
import { getRunningRecordDetail } from "../utils/api/running";
import { useFocusEffect } from "@react-navigation/native";

const { width } = Dimensions.get("window");
// API는 utils/api/running을 통해 호출

type Props = { route: any; navigation: any };

const RecordDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { recordId } = route.params || {};
  const [recordDetail, setRecordDetail] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const SCREEN_H = Dimensions.get("window").height;
  const SHEET_EXPANDED_Y = 120; // 가장 위로 올렸을 때 위치
  const SHEET_COLLAPSED_Y = Math.min(SCREEN_H - 320, SCREEN_H * 0.55);
  const translateY = React.useRef(
    new Animated.Value(SHEET_COLLAPSED_Y)
  ).current;
  const startYRef = React.useRef(0);

  const pan = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        translateY.stopAnimation((v: number) => (startYRef.current = v));
      },
      onPanResponderMove: (_evt, { dy }) => {
        let ny = startYRef.current + dy;
        ny = Math.max(SHEET_EXPANDED_Y, Math.min(ny, SHEET_COLLAPSED_Y));
        translateY.setValue(ny);
      },
      onPanResponderRelease: (_evt, { dy, vy }) => {
        const current = startYRef.current + dy;
        const mid = (SHEET_EXPANDED_Y + SHEET_COLLAPSED_Y) / 2;
        const dest =
          vy < -0.35 || current < mid ? SHEET_EXPANDED_Y : SHEET_COLLAPSED_Y;
        Animated.spring(translateY, {
          toValue: dest,
          useNativeDriver: true,
          tension: 120,
          friction: 18,
        }).start();
      },
    })
  ).current;

  const rawId =
    route?.params?.recordId ?? route?.params?.id ?? route?.params?.runId;
  const recordIdNum =
    typeof rawId === "number"
      ? rawId
      : Number.isFinite(Number(rawId))
      ? Number(rawId)
      : NaN;

  useFocusEffect(
    useCallback(() => {
      if (!Number.isFinite(recordIdNum)) {
        setLoading(false);
        return;
      }
      fetchRecordDetail(recordIdNum);
    }, [recordIdNum])
  );

  const fetchRecordDetail = async (id: number) => {
    try {
      const detail = await getRunningRecordDetail(id);
      setRecordDetail(detail);
    } catch (error) {
      console.error("Record Detail fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds || isNaN(seconds)) return "00:00:00";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const y = d.getFullYear().toString();
    const m = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    const hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "오후" : "오전";
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    const hh = displayHours.toString().padStart(2, "0");
    return `${m}월 ${day}일 ${ampm} ${hh}:${minutes}`;
  };

  const formatTitleFromDate = (dateStr?: string) => {
    if (!dateStr) return "러닝";
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${y}/${m}/${day} 러닝`;
  };

  const getRunningTypeName = (runningType?: string) => {
    switch (runningType) {
      case "SINGLE":
        return "싱글런";
      case "VIRTUAL":
        return "가상런";
      case "GROUP":
        return "그룹런";
      default:
        return "싱글런";
    }
  };

  const getRunningTypeBadgeStyle = (runningType?: string) => {
    switch (runningType) {
      case "SINGLE":
        return { backgroundColor: "#10b981" };
      case "VIRTUAL":
        return { backgroundColor: "#3b82f6" };
      case "GROUP":
        return { backgroundColor: "#f59e0b" };
      default:
        return { backgroundColor: "#10b981" };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>운동 기록을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!recordDetail) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>운동 기록을 찾을 수 없습니다.</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const headerImage =
    recordDetail?.photoUrl ||
    recordDetail?.imageUrl ||
    recordDetail?.snapshotUrl;
  const routeCoords = (recordDetail?.routePoints || []).map((p: any) => ({
    latitude: p.latitude,
    longitude: p.longitude,
  }));

  // 안전한 표시용 값 계산
  const distanceKm: number =
    typeof recordDetail.totalDistanceKm === "number"
      ? recordDetail.totalDistanceKm
      : typeof (recordDetail as any).distanceKm === "number"
      ? (recordDetail as any).distanceKm
      : 0;
  const durationSec: number =
    typeof recordDetail.totalDurationSec === "number"
      ? recordDetail.totalDurationSec
      : typeof (recordDetail as any).durationSeconds === "number"
      ? (recordDetail as any).durationSeconds
      : 0;
  const formatPace = (sec: number, km: number) => {
    if (!km || !sec) return "-";
    const spk = sec / km; // sec per km
    const m = Math.floor(spk / 60);
    const s = Math.round(spk % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };
  const paceLabel: string =
    recordDetail.averagePace || formatPace(durationSec, distanceKm);

  return (
    <SafeAreaView style={styles.container}>
      {/* 배경: 큰 이미지 또는 지도 */}
      <View style={styles.heroWrap}>
        {headerImage ? (
          <Image source={{ uri: headerImage }} style={styles.heroImage} />
        ) : routeCoords.length ? (
          <MapView
            style={styles.heroImage}
            pointerEvents="none"
            initialRegion={{
              latitude: routeCoords[0].latitude,
              longitude: routeCoords[0].longitude,
              latitudeDelta: 0.008,
              longitudeDelta: 0.008,
            }}
          >
            <Polyline
              coordinates={routeCoords}
              strokeColor="#2563eb"
              strokeWidth={4}
            />
          </MapView>
        ) : (
          <View style={[styles.heroImage, { backgroundColor: "#F3F4F6" }]} />
        )}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      </View>

      {/* 드로어: 내용을 위에서 당겨 펼치는 시트 */}
      <Animated.View
        style={[
          styles.sheet,
          {
            transform: [{ translateY }],
          },
        ]}
        {...pan.panHandlers}
      >
        <View style={styles.sheetInner}>
          <View style={styles.sheetHandle} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.titleSection}>
              <Text style={styles.title}>
                {recordDetail.title ||
                  formatTitleFromDate(recordDetail.startedAt)}
              </Text>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <View
                  style={[
                    styles.typeBadge,
                    getRunningTypeBadgeStyle(recordDetail.runningType),
                  ]}
                >
                  <Text style={styles.typeBadgeText}>
                    {getRunningTypeName(recordDetail.runningType)}
                  </Text>
                </View>
                <Text style={styles.date}>
                  총 시간 {formatDuration(durationSec)} ·{" "}
                  {distanceKm.toFixed(2)} km
                </Text>
              </View>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.mainStat}>
                <Text style={styles.mainStatValue}>
                  {distanceKm.toFixed(2)}
                </Text>
                <Text style={styles.mainStatUnit}>km</Text>
                <Text style={styles.mainStatLabel}>거리</Text>
              </View>
              <View style={styles.mainStat}>
                <Text style={styles.mainStatValue}>
                  {formatDuration(durationSec)}
                </Text>
                <Text style={styles.mainStatUnit}>시간</Text>
                <Text style={styles.mainStatLabel}>운동 시간</Text>
              </View>
              <View style={styles.mainStat}>
                <Text style={styles.mainStatValue}>{paceLabel || "-"}</Text>
                <Text style={styles.mainStatUnit}>/km</Text>
                <Text style={styles.mainStatLabel}>평균 페이스</Text>
              </View>
            </View>

            {/* 확장 섹션 자리 */}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  heroWrap: {
    width: "100%",
    height: 280,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
  },
  heroImage: {
    width: "100%",
    height: 280,
  },
  backBtn: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  backIcon: { fontSize: 18, fontWeight: "700", color: "#111" },
  content: { flex: 1 },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: "transparent",
    paddingTop: 0,
  },
  sheetInner: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },
  sheetHandle: {
    alignSelf: "center",
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D1D5DB",
    marginTop: 8,
    marginBottom: 6,
  },
  titleSection: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  title: { fontSize: 24, fontWeight: "800", color: "#111827", marginBottom: 6 },
  date: { fontSize: 14, color: "#6b7280" },
  typeBadge: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: { color: "#fff", fontWeight: "600" },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  mainStat: { alignItems: "center", flex: 1 },
  mainStatValue: { fontSize: 28, fontWeight: "800", color: "#111827" },
  mainStatUnit: { fontSize: 12, color: "#6b7280" },
  mainStatLabel: { marginTop: 4, fontSize: 12, color: "#6b7280" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 8, color: "#6b7280" },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: { color: "#ef4444", marginBottom: 8 },
});

export default RecordDetailScreen;
