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
      {/* 공통 헤더(크기/타이포 ProfileEdit와 맞춤) */}
      <View style={styles.header}>
        <View style={{ width: 24 }} />
        <Text style={styles.headerTitle}>내 정보</Text>
        <View style={{ width: 24 }}>
          <View style={styles.bellDot} />
        </View>
      </View>

      {/* 상단 프로필 카드 (크기/폰트 조정) */}
      <View style={styles.profileCard}>
        <View style={styles.avatarWrap}>
          {profileUrl ? (
            <Image
              key={profileUrl}
              source={{ uri: profileUrl }}
              style={styles.avatarImg}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarEmoji}>👤</Text>
            </View>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.nicknameText}>{nickname}</Text>

          {/* level 제거, 핵심 수치만 */}
          <Text style={styles.metricsText}>
            {`${totalDistance}km   ${totalCount}회   ${ownedEmblems}개`}
          </Text>

          <Text style={styles.metricsHint}>
            총 거리 러닝 횟수 엠블럼
            {typeof completionRate === "number"
              ? `   ·   컬렉션 ${completionRate}%`
              : ""}
          </Text>
        </View>
      </View>

      {/* 리스트 섹션(크기/폰트 ProfileEditScreen과 정렬) */}
      <View style={styles.card}>
        <TouchableOpacity
          style={{ flex: 1, justifyContent: "center" }}
          onPress={() => navigation.navigate("ProfileEdit")}
          activeOpacity={0.8}
        >
          <Text style={styles.cardTitle}>기본 정보 관리</Text>
          <Text style={styles.cardSub}>프로필, 닉네임, 개인정보 설정</Text>
        </TouchableOpacity>
      </View>

      {/* ✅ 엠블럼 컬렉션: 탭 시 EmblemCollection 화면으로 이동 */}
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate("Emblem", {
            nickname,
            ownedEmblems,
            completionRate, // 정수(%)이거나 undefined — 화면에서 보완 처리
          })
        }
      >
        <Text style={styles.cardTitle}>엠블럼 컬렉션</Text>
        <Text style={styles.cardSub}>
          {typeof completionRate === "number"
            ? `${ownedEmblems}개 보유 · 완성도 ${completionRate}%`
            : `${ownedEmblems}개 보유`}
        </Text>
      </TouchableOpacity>

      {/* 하단 네비 아이콘(간격/크기 조정) */}
      <View style={styles.navRow}>
        <View style={styles.navItem}>
          <Text style={styles.navIcon}>📰</Text>
          <Text style={styles.navLabel}>피드</Text>
        </View>
        <View style={styles.navItem}>
          <Text style={styles.navIcon}>⚔️</Text>
          <Text style={styles.navLabel}>대결</Text>
        </View>
        <View style={styles.navItem}>
          <Text style={styles.navIcon}>📊</Text>
          <Text style={styles.navLabel}>기록</Text>
        </View>
        <View style={styles.navItem}>
          <Text style={styles.navIcon}>👥</Text>
          <Text style={styles.navLabel}>크루</Text>
        </View>
        <View style={styles.navItem}>
          <Text style={styles.navIcon}>🏃</Text>
          <Text style={styles.navLabel}>러닝</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const CARD_RADIUS = 16;

const styles = StyleSheet.create({
  // ProfileEditScreen 과 스케일 맞춘 베이스
  container: {
    backgroundColor: "#fff",
    paddingBottom: 30,
    paddingHorizontal: 16,
  },

  // 헤더 (높이/타이포 동일)
  header: {
    height: 70,
    borderBottomWidth: 1,
    borderBottomColor: "#e2dddd",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#333" },
  bellDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#000",
    alignSelf: "flex-end",
  },

  // 프로필 카드
  profileCard: {
    backgroundColor: "#475569",
    borderRadius: CARD_RADIUS,
    padding: 16,
    marginTop: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrap: {
    marginRight: 16,
  },
  avatarImg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e8ecf0",
  },
  avatarFallback: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e8ecf0",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: { fontSize: 32, color: "#666" },

  nicknameText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  metricsText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  metricsHint: {
    marginTop: 6,
    color: "#dedede",
    fontSize: 12,
    fontWeight: "600",
  },

  // 공통 카드(리스트)
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: CARD_RADIUS,
    height: 98,
    paddingHorizontal: 20,
    marginTop: 12,
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  cardSub: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#808080",
  },

  // 하단 네비 (간격/크기 ProfileEditScreen 스케일 기준)
  navRow: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  navItem: { alignItems: "center", width: 56 },
  navIcon: { fontSize: 24 },
  navLabel: { marginTop: 4, fontSize: 11, fontWeight: "600", color: "#000" },
});
