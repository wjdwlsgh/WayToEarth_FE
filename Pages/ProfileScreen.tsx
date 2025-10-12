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
  Platform,
  SafeAreaView,
} from "react-native";
import {
  getMyProfile,
  getMySummary,
  type UserProfile,
  type UserSummary,
} from "../utils/api/users";
import { useFocusEffect } from "@react-navigation/native";
import SafeLayout from "../components/Layout/SafeLayout";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { deactivateToken } from "../utils/notifications";

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

  // 백그라운드 진동 알림 설정
  const [vibeEnabled, setVibeEnabled] = useState(true);
  const [vibeIntervalM, setVibeIntervalM] = useState(1000);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("@run_vibration_settings");
        if (raw) {
          const s = JSON.parse(raw);
          if (typeof s?.enabled === 'boolean') setVibeEnabled(s.enabled);
          if (typeof s?.intervalM === 'number' && s.intervalM > 0) setVibeIntervalM(s.intervalM);
        }
      } catch {}
    })();
  }, []);

  const saveVibeSettings = useCallback(async (next: { enabled?: boolean; intervalM?: number }) => {
    try {
      const enabled = typeof next.enabled === 'boolean' ? next.enabled : vibeEnabled;
      const intervalM = typeof next.intervalM === 'number' ? next.intervalM : vibeIntervalM;
      setVibeEnabled(enabled);
      setVibeIntervalM(intervalM);
      await AsyncStorage.setItem("@run_vibration_settings", JSON.stringify({ enabled, intervalM }));
    } catch {}
  }, [vibeEnabled, vibeIntervalM]);

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

  // 로딩 보호: 5초가 지나도 로딩이면 강제 해제하여 빈 화면 방지
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => {
      try {
        if (loading) {
          console.warn("[Profile] loading timeout → force hide spinner");
          setLoading(false);
        }
      } catch {}
    }, 5000);
    return () => clearTimeout(t);
  }, [loading]);

  // 서버 저장 직후 늦게 반영되는 경우 대비 1회 재시도
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

  // 화면 재진입 시 재조회(프로필 수정 반영)
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleLogout = useCallback(async () => {
    Alert.alert("로그아웃", "정말 로그아웃 하시겠어요?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: async () => {
          try {
            // FCM 토큰 비활성화
            await deactivateToken();
            // JWT 토큰 삭제
            await AsyncStorage.removeItem("jwtToken");
            // 로그인 화면으로 이동
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          } catch (error) {
            console.error("로그아웃 실패:", error);
            Alert.alert("오류", "로그아웃 중 문제가 발생했습니다.");
          }
        },
      },
    ]);
  }, [navigation]);

  // 필드 매핑
  const nickname = me?.nickname || (me as any)?.name || "사용자";
  const overrideFromRoute: string | undefined = route?.params?.avatarUrl;
  const rawProfileUrl =
    overrideFromRoute ||
    me?.profile_image_url ||
    (me as any)?.profileImageUrl ||
    "";
  const cacheKey =
    (me as any)?.profile_image_key ||
    (me as any)?.updated_at ||
    (me as any)?.updatedAt ||
    route?.params?.cacheBust ||
    "";
  const profileUrl = rawProfileUrl
    ? rawProfileUrl.includes("?")
      ? rawProfileUrl
      : `${rawProfileUrl}?v=${encodeURIComponent(
          String(cacheKey || Date.now())
        )}`
    : "";

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
      <SafeLayout withBottomInset={false}>
        <View style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>불러오는 중...</Text>
        </View>
      </SafeLayout>
    );
  }

  return (
    <SafeLayout withBottomInset={false}>
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>마이페이지</Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentInsetAdjustmentBehavior={
            Platform.OS === "ios" ? "automatic" : "never"
          }
        >
          {/* 프로필 섹션 */}
          <View style={styles.profileSection}>
            {/* 프로필 이미지 */}
            <View style={styles.avatarContainer}>
              <View style={styles.avatarOuterRing}>
                <View style={styles.avatarInnerRing}>
                  {profileUrl ? (
                    <Image
                      key={profileUrl}
                      source={{ uri: profileUrl }}
                      style={styles.avatar}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarEmoji}>😊</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* 닉네임 */}
            <Text style={styles.nickname}>{nickname}</Text>
          </View>

          {/* 통계 카드 */}
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalDistance}</Text>
              <Text style={styles.statLabel}>총 거리(km)</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.orangeText]}>
                {totalCount}
              </Text>
              <Text style={styles.statLabel}>러닝 횟수</Text>
            </View>
          </View>

          {/* 엠블럼 & 방명록: 카드형 메뉴 */}
          <View style={styles.menuSection}>
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.6}
              onPress={() =>
                navigation.navigate("Emblem", {
                  nickname,
                  ownedEmblems,
                  completionRate,
                })
              }
            >
              <Text style={styles.menuTitle}>엠블럼 컬렉션</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.6}
              onPress={() => navigation.navigate("MyGuestbookScreen")}
            >
              <Text style={styles.menuTitle}>내 방명록</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.menuSpacer} />

          {/* 기본 정보: 카드형 메뉴 (분리) */}
          <View style={styles.menuSection}>
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.6}
              onPress={() => navigation.navigate("ProfileEdit")}
            >
              <Text style={styles.menuTitle}>기본 정보 관리</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.menuSpacer} />

          {/* 알림 설정 */}
          <View style={styles.menuSection}>
            <View style={styles.menuItem}>
              <Text style={styles.menuTitle}>백그라운드 진동 알림</Text>
              <TouchableOpacity onPress={() => saveVibeSettings({ enabled: !vibeEnabled })} accessibilityLabel="백그라운드 진동 토글">
                <Text style={[styles.toggle, vibeEnabled ? styles.toggleOn : styles.toggleOff]}>{vibeEnabled ? '켜짐' : '꺼짐'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.menuDivider} />
            <View style={[styles.menuItem, { justifyContent: 'space-between' }]}>
              <Text style={styles.menuTitle}>진동 주기</Text>
              <View style={styles.pillGroup}>
                {[500, 1000, 2000].map((m) => (
                  <TouchableOpacity key={m} style={[styles.pill, vibeIntervalM === m && styles.pillActive]} onPress={() => saveVibeSettings({ intervalM: m })}>
                    <Text style={[styles.pillText, vibeIntervalM === m && styles.pillTextActive]}>{m >= 1000 ? `${m/1000}km` : `${m}m`}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* 로그아웃 */}
          <View style={styles.menuSection}>
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.6}
              onPress={handleLogout}
            >
              <Text style={[styles.menuTitle, styles.logoutText]}>로그아웃</Text>
            </TouchableOpacity>
          </View>

          {/* 설정 메뉴 - 위 카드로 통합 */}

          {/* 하단 여백 */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* 하단 네비게이션 */}
        {/* 탭 내비게이터 사용으로 하단 바는 전역에서 렌더링됨 */}
      </View>
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },

  // 헤더
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: "#F5F5F5",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
  },
  shareButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
  },
  shareIcon: {
    fontSize: 16,
    color: "#666666",
  },

  // 프로필 섹션
  profileSection: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 40,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatarOuterRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#E8E8E8",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInnerRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#D0D0D0",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 28,
  },
  nickname: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#888888",
    fontWeight: "400",
  },

  // 통계 카드
  statsCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 8,
  },
  orangeText: {
    color: "#FF6B35",
  },
  statLabel: {
    fontSize: 14,
    color: "#888888",
    fontWeight: "400",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#F0F0F0",
    marginHorizontal: 20,
  },

  // 뱃지 섹션
  badgeSection: {},

  // 메뉴 섹션
  menuSection: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: "hidden",
  },
  menuSpacer: { height: 12 },
  menuDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginLeft: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: "#FFFFFF",
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "400",
    color: "#000000",
  },
  logoutText: {
    color: "#FF3B30",
  },
  chevron: {
    fontSize: 18,
    color: "#C0C0C0",
    fontWeight: "300",
  },

  // 알림 설정 보조 스타일
  toggle: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, overflow: 'hidden', fontWeight: '700' },
  toggleOn: { backgroundColor: '#DCFCE7', color: '#166534' },
  toggleOff: { backgroundColor: '#F3F4F6', color: '#374151' },
  pillGroup: { flexDirection: 'row', gap: 8 },
  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: '#F3F4F6' },
  pillActive: { backgroundColor: '#EEF2FF' },
  pillText: { color: '#374151', fontWeight: '600' },
  pillTextActive: { color: '#4F46E5' },

  // 하단 여백
  bottomSpacing: { height: 120 },
});
