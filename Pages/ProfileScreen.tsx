// screens/ProfileScreen.js
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import {
  getMyProfile,
  getMySummary,
  type UserProfile,
  type UserSummary,
} from "../utils/api/users";
import { useFocusEffect } from "@react-navigation/native";

const number = (v: number | null | undefined, digits = 1) =>
  typeof v === "number" ? Number(v.toFixed(digits)) : 0;

export default function ProfileScreen({
  navigation,
  route,
}: {
  navigation: any;
  route: any;
}) {
  const [me, setMe] = useState<UserProfile | null>(null);
  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const retriedRef = React.useRef(false);

  const fetchData = useCallback(async () => {
    try {
      const [meRes, sumRes] = await Promise.all([
        getMyProfile(),
        getMySummary(),
      ]);
      setMe(meRes);
      setSummary(sumRes);
      console.log("✅ /v1/users/me 응답:", meRes);
      console.log("✅ /v1/users/me/summary 응답:", sumRes);
    } catch (err: any) {
      console.warn(err);
      Alert.alert(
        "오류",
        err?.response?.data?.message || "정보를 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 서버 저장 직후 늦게 반영되는 경우를 대비해 1회 재시도
  useEffect(() => {
    const noAvatar = !(
      (me as any)?.profile_image_url ||
      (me as any)?.profileImageUrl ||
      route?.params?.avatarUrl
    );
    if (!loading && noAvatar && !retriedRef.current) {
      retriedRef.current = true;
      const t = setTimeout(() => fetchData(), 1200);
      return () => clearTimeout(t);
    }
  }, [loading, me, route?.params?.avatarUrl, fetchData]);

  // 화면 재진입 시 재조회(프로필 수정 등 반영)
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  // 필드 매핑(백엔드 snake/camel 혼용 대응)
  const nickname = me?.nickname || (me as any)?.name || "사용자";
  // 업로드 직후 편집 화면에서 전달한 최신 URL 우선 사용
  const overrideFromRoute: string | undefined = route?.params?.avatarUrl;
  const rawProfileUrl =
    overrideFromRoute ||
    me?.profile_image_url ||
    (me as any)?.profileImageUrl ||
    "";
  // 캐시 무효화를 위한 키(있으면 사용)
  const cacheKey =
    (me as any)?.profile_image_key ||
    (me as any)?.updated_at ||
    (me as any)?.updatedAt ||
    route?.params?.cacheBust ||
    "";
  // 서명된 URL(S3 presign 등)은 쿼리 추가 시 무효화될 수 있으므로
  // 이미 '?'가 있는 경우에는 캐시 버스팅 파라미터를 붙이지 않는다.
  const profileUrl = rawProfileUrl
    ? rawProfileUrl.includes("?")
      ? rawProfileUrl
      : `${rawProfileUrl}?v=${encodeURIComponent(String(cacheKey || Date.now()))}`
    : "";
  console.log("프로필 URL:", profileUrl);

  const totalDistance = useMemo(() => {
    const v =
      summary?.total_distance ??
      (summary as any)?.totalDistance ??
      me?.total_distance ??
      (me as any)?.totalDistance;
    return number(v, 1);
  }, [summary, me]);

  const totalCount = useMemo(() => {
    return summary?.total_running_count ?? me?.total_running_count ?? 0;
  }, [summary, me]);

  const ownedEmblems = useMemo(() => {
    return summary?.emblem_count ?? (me as any)?.owned_emblem_count ?? 0;
  }, [summary, me]);

  const completionRate = useMemo(() => {
    const c = (summary as any)?.completion ?? summary?.completion_rate;
    return typeof c === "number" ? Math.round(c * 100) : undefined;
  }, [summary]);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { flex: 1, justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>불러오는 중…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* 모던한 헤더 */}
      <View style={styles.header}>
        <View style={{ width: 28 }} />
        <Text style={styles.headerTitle}>내 정보</Text>
        <View style={styles.bellDot}>
          <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>•</Text>
        </View>
      </View>

      {/* 그라데이션 프로필 카드 */}
      <View style={styles.profileCard}>
        <View style={styles.profileCardGradient} />

        <View style={styles.avatarWrap}>
          {profileUrl ? (
            <Image
              key={profileUrl}
              source={{ uri: profileUrl }}
              style={styles.avatarImg}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarEmoji}>🏃</Text>
            </View>
          )}
          <View style={styles.avatarBadge}>
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>✓</Text>
          </View>
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.nicknameText}>{nickname}</Text>

          <View style={styles.metricsContainer}>
            <View style={styles.metricItem}>
              <Text style={styles.metricsText}>{totalDistance}</Text>
              <Text style={styles.metricsLabel}>KM</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricsText}>{totalCount}</Text>
              <Text style={styles.metricsLabel}>RUNS</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricsText}>{ownedEmblems}</Text>
              <Text style={styles.metricsLabel}>BADGES</Text>
            </View>
          </View>

          {typeof completionRate === "number" && (
            <View style={styles.completionBadge}>
              <Text style={styles.completionText}>컬렉션 {completionRate}%</Text>
            </View>
          )}
        </View>
      </View>

      {/* 모던한 카드 */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("ProfileEdit")}
        activeOpacity={0.8}
      >
        <View style={styles.cardIcon}>
          <Text style={{ fontSize: 20 }}>⚙️</Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>기본 정보 관리</Text>
          <Text style={styles.cardSub}>프로필, 닉네임, 개인정보 설정</Text>
        </View>
        <Text style={styles.cardArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate("Emblem", {
            nickname,
            ownedEmblems,
            completionRate,
          })
        }
      >
        <View style={styles.cardIcon}>
          <Text style={{ fontSize: 20 }}>🏆</Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>엠블럼 컬렉션</Text>
          <Text style={styles.cardSub}>
            {typeof completionRate === "number"
              ? `${ownedEmblems}개 보유 • 완성도 ${completionRate}%`
              : `${ownedEmblems}개 보유`}
          </Text>
        </View>
        <Text style={styles.cardArrow}>›</Text>
      </TouchableOpacity>

      {/* 모던한 네비게이션 그리드 */}
      <View style={styles.navContainer}>
        <Text style={styles.navTitle}>빠른 액세스</Text>
        <View style={styles.navGrid}>
          <View style={styles.navItem}>
            <View style={styles.navIconContainer}>
              <Text style={styles.navIcon}>📰</Text>
            </View>
            <Text style={styles.navLabel}>피드</Text>
          </View>
          <View style={styles.navItem}>
            <View style={styles.navIconContainer}>
              <Text style={styles.navIcon}>⚔️</Text>
            </View>
            <Text style={styles.navLabel}>대결</Text>
          </View>
          <View style={styles.navItem}>
            <View style={styles.navIconContainer}>
              <Text style={styles.navIcon}>📊</Text>
            </View>
            <Text style={styles.navLabel}>기록</Text>
          </View>
          <View style={styles.navItem}>
            <View style={styles.navIconContainer}>
              <Text style={styles.navIcon}>👥</Text>
            </View>
            <Text style={styles.navLabel}>크루</Text>
          </View>
          <View style={styles.navItem}>
            <View style={styles.navIconContainer}>
              <Text style={styles.navIcon}>🏃</Text>
            </View>
            <Text style={styles.navLabel}>러닝</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const CARD_RADIUS = 16;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingBottom: 30,
  },

  // 모던한 헤더
  header: {
    height: 90,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    letterSpacing: -0.3,
  },
  bellDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  // 그라데이션 프로필 카드
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    marginTop: 20,
    marginBottom: 16,
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.1)",
  },

  profileCardGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
  },

  avatarWrap: {
    marginRight: 20,
    position: "relative",
  },
  avatarImg: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#f1f5f9",
    borderWidth: 4,
    borderColor: "rgba(99, 102, 241, 0.15)",
  },
  avatarFallback: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "rgba(99, 102, 241, 0.15)",
  },
  avatarEmoji: { fontSize: 36, color: "#fff" },

  avatarBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },

  profileInfo: {
    flex: 1,
  },
  nicknameText: {
    color: "#1e293b",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 12,
    letterSpacing: -0.4,
  },
  metricsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  metricItem: {
    alignItems: "center",
    flex: 1,
  },
  metricsText: {
    color: "#6366f1",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  metricsLabel: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  completionBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  completionText: {
    color: "#6366f1",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  // 모던한 카드
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    height: 88,
    paddingHorizontal: 24,
    marginTop: 12,
    marginHorizontal: 16,
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.04)",
    flexDirection: "row",
    alignItems: "center",
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  cardSub: {
    fontSize: 13,
    fontWeight: "500",
    color: "#64748b",
    letterSpacing: 0.1,
  },
  cardArrow: {
    fontSize: 16,
    color: "#94a3b8",
    fontWeight: "600",
  },

  // 하단 네비게이션 그리드
  navContainer: {
    marginTop: 32,
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  navGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  navItem: {
    alignItems: "center",
    width: "18%",
    marginBottom: 8,
  },
  navIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(99, 102, 241, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  navIcon: { fontSize: 22 },
  navLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
    textAlign: "center",
    letterSpacing: 0.2,
  },
});
