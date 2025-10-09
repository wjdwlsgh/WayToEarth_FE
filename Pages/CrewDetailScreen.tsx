import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {
  getMyCrewDetail,
  removeMember,
  approveRequest,
  rejectRequest,
  promoteMember,
  demoteMember,
  closeCrew,
} from "../utils/api/crews";

type Member = {
  id: string;
  nickname: string;
  role: "ADMIN" | "MEMBER";
  distance?: number;
};
type Applicant = { id: string; nickname: string; level?: string };

export default function CrewDetailScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [crewName, setCrewName] = useState("서울 러닝 크루");
  const [crewInfo, setCrewInfo] = useState({
    location: "활동 중",
    members: "멤버 24명",
    manager: "관리자",
    totalDistance: "156km",
    meetCount: "3회",
    totalMembers: "2송",
  });
  const [members, setMembers] = useState<Member[]>([]);
  const [pending, setPending] = useState<Applicant[]>([
    { id: "1", nickname: "김러너", level: "함께 레이스 4'30\"" },
    { id: "2", nickname: "박조거", level: "함께 레이스 5'00\"" },
  ]);
  const [selectedTab, setSelectedTab] = useState<"통계" | "멤버" | "설정">(
    "통계"
  );
  const [mvpMember, setMvpMember] = useState({
    name: "정진호",
    distance: "28.5km",
  });

  const refresh = async () => {
    setLoading(true);
    try {
      const detail = await getMyCrewDetail();
      if (detail) {
        setCrewName(detail.crew.name);
        setRole(detail.role);
        setMembers(detail.members as Member[]);
        setPending(detail.pending as Applicant[]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const isAdmin = role === "ADMIN";

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" />

      {/* 헤더 */}
      <View style={s.blueHeader}>
        <View style={s.headerTop}>
          <Text style={s.headerTitle}>크루</Text>
          <TouchableOpacity style={s.searchIcon} onPress={() => {}}>
            <Ionicons name="search" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={s.scrollView} showsVerticalScrollIndicator={false}>
        {/* 크루 정보 카드 */}
        <View style={s.crewInfoCard}>
          <View style={s.crewHeader}>
            <View style={s.crewAvatar} />
            <View style={s.crewHeaderText}>
              <Text style={s.crewName}>{crewName}</Text>
              <Text style={s.crewSubInfo}>
                {crewInfo.location} • {crewInfo.members} • {crewInfo.manager}
              </Text>
            </View>
          </View>

          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={s.statValue}>{crewInfo.totalDistance}</Text>
              <Text style={s.statLabel}>이번 달</Text>
            </View>
            <View style={s.statItem}>
              <Text style={s.statValue}>{crewInfo.meetCount}</Text>
              <Text style={s.statLabel}>내 손위</Text>
            </View>
            <View style={s.statItem}>
              <Text style={s.statValue}>{crewInfo.totalMembers}</Text>
              <Text style={s.statLabel}>대열 순위</Text>
            </View>
          </View>
        </View>

        {/* 가입 신청은 통계 탭 내부로 이동 */}

        {/* 탭 메뉴 */}
        <View style={s.tabContainer}>
          <TouchableOpacity
            style={[s.tab, selectedTab === "통계" && s.activeTab]}
            onPress={() => setSelectedTab("통계")}
          >
            <Text
              style={[s.tabText, selectedTab === "통계" && s.activeTabText]}
            >
              통계
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.tab, selectedTab === "멤버" && s.activeTab]}
            onPress={() => setSelectedTab("멤버")}
          >
            <Text
              style={[s.tabText, selectedTab === "멤버" && s.activeTabText]}
            >
              멤버
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.tab, selectedTab === "설정" && s.activeTab]}
            onPress={() => setSelectedTab("설정")}
          >
            <Text
              style={[s.tabText, selectedTab === "설정" && s.activeTabText]}
            >
              설정
            </Text>
          </TouchableOpacity>
        </View>

        {/* 통계 탭 내용 */}
        {selectedTab === "통계" && (
          <>
            {/* 가입 신청 (관리자만) */}
            {isAdmin && pending.length > 0 && (
              <View style={s.applicationCard}>
                <Text style={s.applicationTitle}>가입 신청</Text>
                {pending.map((a) => (
                  <View key={a.id} style={s.applicationRow}>
                    <View style={s.applicantInfo}>
                      <View style={s.applicantAvatar} />
                      <View>
                        <Text style={s.applicantName}>{a.nickname}</Text>
                        <Text style={s.applicantLevel}>{a.level}</Text>
                      </View>
                    </View>
                    <View style={s.applicationBtns}>
                      <TouchableOpacity
                        style={[s.iconBtn, s.approveIconBtn]}
                        onPress={async () => {
                          await approveRequest(a.id);
                          await refresh();
                        }}
                        accessibilityLabel="승인"
                      >
                        <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[s.iconBtn, s.rejectIconBtn]}
                        onPress={async () => {
                          await rejectRequest(a.id);
                          await refresh();
                        }}
                        accessibilityLabel="거부"
                      >
                        <Ionicons name="close-circle" size={24} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
            {/* 크루 통계 */}
            <View style={s.statsSection}>
              <View style={s.statsSectionHeader}>
                <Text style={s.statsSectionTitle}>크루 통계</Text>
                <View style={s.filterButtons}>
                  <TouchableOpacity style={s.filterBtn}>
                    <Text style={s.filterBtnText}>주간</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.filterBtnInactive}>
                    <Text style={s.filterBtnInactiveText}>월간</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={s.statsCards}>
                <View style={s.statsCard}>
                  <Text style={s.statsCardValue}>486km</Text>
                  <Text style={s.statsCardLabel}>총 누적 거리</Text>
                </View>
                <View style={s.statsCard}>
                  <Text style={s.statsCardValue}>18회</Text>
                  <Text style={s.statsCardLabel}>그룹 러닝</Text>
                </View>
              </View>
            </View>

            {/* MVP 섹션 */}
            <View style={s.mvpSection}>
              <View style={s.mvpHeader}>
                <Text style={s.mvpTitle}>🏆 이번 주 MVP</Text>
                <Text style={s.mvpDate}>3월 18일 - 3월 24일</Text>
              </View>
              <View style={s.mvpCard}>
                <View style={s.mvpAvatar} />
                <View style={s.mvpInfo}>
                  <Text style={s.mvpName}>{mvpMember.name}</Text>
                  <Text style={s.mvpDistance}>
                    주간 거리: {mvpMember.distance}
                  </Text>
                </View>
                <View style={s.mvpBadge}>
                  <Text style={s.mvpBadgeText}>MVP</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* 멤버 탭 내용 */}
        {selectedTab === "멤버" && (
          <View style={s.membersSection}>
            <Text style={s.sectionTitle}>멤버 목록</Text>
            {members.map((m) => (
              <View key={m.id} style={s.memberRow}>
                <View style={s.memberInfo}>
                  <View style={s.memberAvatar} />
                  <Text style={s.memberName}>
                    {m.nickname}
                    {m.role === "ADMIN" ? " (관리자)" : ""}
                  </Text>
                </View>
                {isAdmin && (
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {m.role !== "ADMIN" ? (
                      <TouchableOpacity
                        style={s.roundIconBtn}
                        onPress={async () => {
                          await promoteMember(m.id);
                          await refresh();
                        }}
                        accessibilityLabel="관리자 지정"
                      >
                        <Ionicons name="star" size={18} color="#F59E0B" />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={s.roundIconBtn}
                        onPress={async () => {
                          await demoteMember(m.id);
                          await refresh();
                        }}
                        accessibilityLabel="권한 해제"
                      >
                        <Ionicons name="star-outline" size={18} color="#6B7280" />
                      </TouchableOpacity>
                    )}
                    {m.role !== "ADMIN" && (
                      <TouchableOpacity
                        style={s.roundIconBtn}
                        onPress={() => {
                          Alert.alert("확인", `${m.nickname} 님을 내보낼까요?`, [
                            { text: "취소", style: "cancel" },
                            {
                              text: "내보내기",
                              style: "destructive",
                              onPress: async () => {
                                await removeMember(m.id);
                                await refresh();
                              },
                            },
                          ]);
                        }}
                        accessibilityLabel="내보내기"
                      >
                        <Ionicons name="person-remove" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* 설정 탭 내용 */}
        {selectedTab === "설정" && (
          <View style={s.settingsSection}>
            <Text style={s.sectionTitle}>크루 설정</Text>
            {isAdmin ? (
              <TouchableOpacity
                style={s.closeCrewBtn}
                onPress={() => {
                  Alert.alert(
                    "크루 폐쇄",
                    "정말로 크루를 폐쇄하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
                    [
                      { text: "취소", style: "cancel" },
                      {
                        text: "폐쇄",
                        style: "destructive",
                        onPress: async () => {
                          await closeCrew();
                          Alert.alert("완료", "크루가 폐쇄되었습니다.");
                          navigation.goBack();
                        },
                      },
                    ]
                  );
                }}
              >
                <Ionicons name="trash" size={18} color="#fff" />
                <Text style={s.closeCrewBtnText}>크루 폐쇄</Text>
              </TouchableOpacity>
            ) : (
              <Text style={{ color: "#6B7280" }}>관리자만 접근 가능한 메뉴입니다.</Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  blueHeader: { backgroundColor: "#4A7FE8", paddingTop: 8 },
  headerTime: {
    color: "#fff",
    fontSize: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  searchIcon: { padding: 4 },
  searchIconText: { fontSize: 22 },
  scrollView: { flex: 1 },

  // 크루 정보 카드
  crewInfoCard: {
    backgroundColor: "#5B8FEE",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
  },
  crewHeader: { flexDirection: "row", marginBottom: 20 },
  crewAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFB4B4",
    marginRight: 12,
  },
  crewHeaderText: { flex: 1, justifyContent: "center" },
  crewName: { fontSize: 18, fontWeight: "700", color: "#fff", marginBottom: 4 },
  crewSubInfo: { fontSize: 13, color: "rgba(255,255,255,0.8)" },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: { alignItems: "center" },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  statLabel: { fontSize: 12, color: "rgba(255,255,255,0.8)" },

  // 가입 신청
  applicationCard: {
    backgroundColor: "#FFF8E1",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
  },
  applicationTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
  },
  applicationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  applicantInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  applicantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFB4B4",
    marginRight: 12,
  },
  applicantName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
  },
  applicantLevel: { fontSize: 12, color: "#666" },
  applicationBtns: { flexDirection: "row", gap: 8 },
  iconBtn: { padding: 6, borderRadius: 999, backgroundColor: "#F3F4F6" },
  approveIconBtn: { backgroundColor: "#ECFDF5" },
  rejectIconBtn: { backgroundColor: "#FEF2F2" },

  // 탭
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#4A7FE8",
  },
  tabText: { fontSize: 15, color: "#9CA3AF", fontWeight: "600" },
  activeTabText: { color: "#4A7FE8", fontWeight: "700" },

  // 통계 섹션
  statsSection: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
  },
  statsSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statsSectionTitle: { fontSize: 16, fontWeight: "700", color: "#000" },
  filterButtons: { flexDirection: "row", gap: 8 },
  filterBtn: {
    backgroundColor: "#4A7FE8",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  filterBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  filterBtnInactive: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  filterBtnInactiveText: { color: "#6B7280", fontSize: 12, fontWeight: "600" },
  statsCards: { flexDirection: "row", gap: 12 },
  statsCard: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  statsCardValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#4A7FE8",
    marginBottom: 4,
  },
  statsCardLabel: { fontSize: 12, color: "#6B7280" },

  // MVP 섹션
  mvpSection: {
    backgroundColor: "#3A3A3A",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  mvpHeader: { marginBottom: 16 },
  mvpTitle: { fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 4 },
  mvpDate: { fontSize: 12, color: "#9CA3AF" },
  mvpCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4A4A4A",
    padding: 12,
    borderRadius: 12,
  },
  mvpAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFB4B4",
    marginRight: 12,
  },
  mvpInfo: { flex: 1 },
  mvpName: { fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 4 },
  mvpDistance: { fontSize: 13, color: "#9CA3AF" },
  mvpBadge: {
    backgroundColor: "#6B7280",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  mvpBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  // 멤버 섹션
  membersSection: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
  },
  memberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  memberInfo: { flexDirection: "row", alignItems: "center" },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
    marginRight: 12,
  },
  memberName: { fontSize: 15, color: "#111827", fontWeight: "500" },
  kickBtn: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  kickBtnText: { color: "#111827", fontSize: 13, fontWeight: "600" },
  roundIconBtn: { backgroundColor: "#F3F4F6", padding: 8, borderRadius: 999 },

  // 설정 섹션
  settingsSection: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  closeCrewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#EF4444",
    paddingVertical: 12,
    borderRadius: 10,
  },
  closeCrewBtnText: { color: "#fff", fontSize: 14, fontWeight: "800" },
});
