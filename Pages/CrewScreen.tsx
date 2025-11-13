import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  PositiveAlert,
  NegativeAlert,
  MessageAlert,
} from "../components/ui/AlertDialog";
import { Ionicons } from "@expo/vector-icons";
import TopCrewItem from "../components/Crew/TopCrewItem";
import CrewGridItem from "../components/Crew/CrewGridItem";
import { useCrewData } from "../hooks/useCrewData";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import CreateCrewDrawer from "../components/Crew/CreateCrewDrawer";
import CrewPreviewDrawer from "../components/Crew/CrewPreviewDrawer";
import CrewDetailModal from "../components/Crew/CrewDetailModal";
import { LinearGradient } from "expo-linear-gradient";

export default function CrewScreen() {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<{
    id?: string;
    name: string;
    description?: string;
    progress?: string;
  } | null>(null);
  const {
    topCrews,
    crews,
    myCrew,
    loadingMore,
    hasMore,
    createMyCrew,
    joinExistingCrew,
    refresh,
    loadMore,
  } = useCrewData(search);
  const navigation = useNavigation<any>();
  const [dialog, setDialog] = useState<{
    open: boolean;
    title?: string;
    message?: string;
    kind?: "positive" | "negative" | "message";
  }>({ open: false, kind: "message" });

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh])
  );

  return (
    <SafeAreaView style={s.safeContainer}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom =
            layoutMeasurement.height + contentOffset.y >=
            contentSize.height - 200;
          if (isCloseToBottom && !loadingMore && hasMore) {
            loadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {/* 🏆 TOP 3 랭킹 섹션 - 그라데이션 배경 */}
        {topCrews && topCrews.length > 0 && (
          <LinearGradient
            colors={["#F8FAFC", "#FFFFFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.rankingSection}
          >
            {/* 헤더 */}
            <View style={s.rankingHeader}>
              <View style={s.rankingTitleWrap}>
                <Ionicons name="trophy" size={28} color="#F59E0B" />
                <Text style={s.rankingTitle}>이달의 TOP 크루</Text>
              </View>
              <TouchableOpacity
                style={s.viewAllBtn}
                onPress={() => navigation.navigate("CrewRanking")}
              >
                <Text style={s.viewAllText}>전체보기</Text>
                <Ionicons name="chevron-forward" size={16} color="#6366F1" />
              </TouchableOpacity>
            </View>

            {/* TOP 포디움: 항목 2개일 때 동일 크기/정렬 */}
            {topCrews.length === 2 ? (
              <View style={s.podiumContainer}>
                {[0, 1].map((idx) => (
                  <View key={topCrews[idx].id} style={s.podiumItem}>
                    <TopCrewItem
                      rank={String(idx + 1)}
                      name={topCrews[idx].name}
                      distance={topCrews[idx].distance}
                      image={
                        topCrews[idx].imageUrl
                          ? { uri: topCrews[idx].imageUrl as string }
                          : undefined
                      }
                      size="md"
                    />
                  </View>
                ))}
              </View>
            ) : (
              <View style={s.podiumContainer}>
                {/* 2위 */}
                {topCrews[1] && (
                  <View style={s.podiumItem}>
                    <TopCrewItem
                      rank="2"
                      name={topCrews[1].name}
                      distance={topCrews[1].distance}
                      image={
                        topCrews[1].imageUrl
                          ? { uri: topCrews[1].imageUrl }
                          : undefined
                      }
                      size="md"
                    />
                  </View>
                )}

                {/* 1위 - 중앙, 더 크게 */}
                {topCrews[0] && (
                  <View style={[s.podiumItem, s.podiumFirst]}>
                    <TopCrewItem
                      rank="1"
                      name={topCrews[0].name}
                      distance={topCrews[0].distance}
                      image={
                        topCrews[0].imageUrl
                          ? { uri: topCrews[0].imageUrl }
                          : undefined
                      }
                      size="lg"
                    />
                  </View>
                )}

                {/* 3위 */}
                {topCrews[2] && (
                  <View style={s.podiumItem}>
                    <TopCrewItem
                      rank="3"
                      name={topCrews[2].name}
                      distance={topCrews[2].distance}
                      image={
                        topCrews[2].imageUrl
                          ? { uri: topCrews[2].imageUrl }
                          : undefined
                      }
                      size="md"
                    />
                  </View>
                )}
              </View>
            )}

            {/* 4~10위 리스트 */}
            {topCrews.length > 3 && (
              <View style={s.rankingList}>
                {topCrews.slice(3, 10).map((crew, idx) => (
                  <View key={crew.id} style={s.rankingListItem}>
                    <View style={s.rankingLeft}>
                      <View style={s.rankNumberBadge}>
                        <Text style={s.rankNumberText}>{idx + 4}</Text>
                      </View>
                      <Text style={s.rankingCrewName} numberOfLines={1}>
                        {crew.name}
                      </Text>
                    </View>
                    <View style={s.rankingRight}>
                      <Text style={s.rankingDistance}>
                        {String(crew.distance || "0km").replace(/[^\d.]/g, "")}
                      </Text>
                      <Text style={s.rankingUnit}>km</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </LinearGradient>
        )}

        {/* 검색바 */}
        <View style={s.searchContainer}>
          <View style={s.searchBox}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={s.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="대회, 러닝크루 검색"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* 크루 둘러보기 섹션 */}
        <View style={s.content}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>러닝크루 둘러보기</Text>
            <TouchableOpacity onPress={() => setCreateOpen(true)}>
              <Ionicons name="add-circle" size={28} color="#6366F1" />
            </TouchableOpacity>
          </View>

          {/* 내 크루가 없으면 생성 유도 */}
          {!myCrew && (
            <TouchableOpacity
              style={s.emptyCard}
              onPress={() => setCreateOpen(true)}
            >
              <View style={s.emptyContent}>
                <Ionicons
                  name="people"
                  size={48}
                  color="#9CA3AF"
                  style={{ marginBottom: 12 }}
                />
                <Text style={s.emptyTitle}>크루가 없습니다</Text>
                <Text style={s.emptySubtitle}>새로운 크루를 만들어보세요</Text>
              </View>
              <View style={s.createBadge}>
                <Ionicons name="add" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
          )}

          {/* 크루 목록: 2열 그리드 */}
          <View style={s.gridWrap}>
            {(myCrew ? [myCrew, ...crews] : crews).map((c, idx) => {
              const isMine = Boolean(myCrew) && idx === 0;
              const displayName = isMine ? "내 크루" : c.name;
              const onPress = () => {
                if (isMine) {
                  navigation.navigate("CrewDetail");
                } else {
                  setSelected({
                    id: c.id,
                    name: c.name,
                    description: c.description,
                    progress: c.progress,
                  });
                  setPreviewOpen(false);
                  setDetailOpen(true);
                }
              };
              return (
                <CrewGridItem
                  key={`${c.id}-${isMine ? "mine" : "other"}`}
                  name={displayName}
                  progress={c.progress}
                  imageUrl={c.imageUrl}
                  onPress={onPress}
                />
              );
            })}
          </View>

          {/* 로딩 */}
          {loadingMore && (
            <View style={s.loadingMore}>
              <ActivityIndicator size="small" color="#6366F1" />
            </View>
          )}

          {!hasMore && crews.length > 0 && (
            <View style={s.endMessage}>
              <Text style={s.endText}>모든 크루를 불러왔습니다</Text>
            </View>
          )}

          <View style={s.bottomSpacer} />
        </View>
      </ScrollView>

      {/* 드로어 & 모달 */}
      <CreateCrewDrawer
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (name, description) => {
          try {
            if (!name?.trim()) return;
            if (myCrew) {
              setDialog({
                open: true,
                kind: "negative",
                title: "생성 불가",
                message:
                  "이미 가입된 크루가 있어 새 크루를 생성할 수 없습니다.",
              });
              return;
            }
            await createMyCrew(name, description);
          } catch (e: any) {
            const data = e?.response?.data || {};
            const err = (data as any)?.error || {};
            const code = (err?.code || (data as any)?.code || "").toString();
            const raw =
              err?.message ||
              (data as any)?.message ||
              e?.message ||
              "크루 생성에 실패했습니다.";
            const friendly =
              /ALREADY_IN_CREW|CREW_EXISTS|USER_ALREADY_MEMBER/i.test(code) ||
              /이미.*크루.*(참여|가입)/.test(raw)
                ? "이미 가입된 크루가 있어 새 크루를 생성할 수 없습니다."
                : raw;
            setDialog({
              open: true,
              kind: "negative",
              title: "생성 실패",
              message: friendly,
            });
          }
        }}
      />

      <CrewPreviewDrawer
        visible={previewOpen}
        onClose={() => setPreviewOpen(false)}
        name={selected?.name || ""}
        description={selected?.description}
        progress={selected?.progress}
        onJoin={
          selected
            ? async (intro) => {
                try {
                  const res = await joinExistingCrew(
                    {
                      id: selected.id || "",
                      name: selected.name,
                      description: selected.description || "",
                      progress: selected.progress || "0/0",
                    },
                    intro
                  );
                  setPreviewOpen(false);
                  if ((res as any)?.pending) {
                    setDialog({
                      open: true,
                      kind: "message",
                      title: "신청 완료",
                      message: "관리자 승인 후 크루에 참여할 수 있습니다.",
                    });
                  } else {
                    setDialog({
                      open: true,
                      kind: "positive",
                      title: "가입 완료",
                      message: "크루에 가입되었습니다.",
                    });
                  }
                } catch (e: any) {
                  const msg =
                    e?.code === "JOIN_PENDING_EXISTS"
                      ? "이미 해당 크루에 가입 신청이 접수되어 있습니다."
                      : e?.response?.data?.message ||
                        e?.message ||
                        "가입 신청에 실패했습니다.";
                  setDialog({
                    open: true,
                    kind: "negative",
                    title: "신청 불가",
                    message: msg,
                  });
                }
              }
            : undefined
        }
      />

      <CrewDetailModal
        visible={detailOpen}
        crewId={selected?.id || ""}
        initialName={selected?.name}
        initialProgress={selected?.progress}
        onClose={() => setDetailOpen(false)}
        onApply={
          selected
            ? async (intro) => {
                if (myCrew) {
                  setDialog({
                    open: true,
                    kind: "message",
                    title: "가입 불가",
                    message: "이미 가입된 크루가 있습니다.",
                  });
                  return;
                }

                try {
                  const res = await joinExistingCrew(
                    {
                      id: selected.id || "",
                      name: selected.name,
                      description: selected.description || "",
                      progress: selected.progress || "0/0",
                    },
                    intro
                  );
                  setDetailOpen(false);
                  if ((res as any)?.pending) {
                    setDialog({
                      open: true,
                      kind: "message",
                      title: "신청 완료",
                      message: "관리자 승인 후 크루에 참여할 수 있습니다.",
                    });
                  } else {
                    setDialog({
                      open: true,
                      kind: "positive",
                      title: "가입 완료",
                      message: "크루에 가입되었습니다.",
                    });
                  }
                } catch (e: any) {
                  const msg =
                    e?.code === "JOIN_PENDING_EXISTS"
                      ? "이미 해당 크루에 가입 신청이 접수되어 있습니다."
                      : e?.response?.data?.message ||
                        e?.message ||
                        "가입 신청 중 오류가 발생했습니다.";
                  setDialog({
                    open: true,
                    kind: "negative",
                    title: "신청 실패",
                    message: msg,
                  });
                }
              }
            : undefined
        }
      />

      {dialog.open && dialog.kind === "positive" && (
        <PositiveAlert
          visible
          title={dialog.title}
          message={dialog.message}
          onClose={() => setDialog({ open: false, kind: "message" })}
        />
      )}
      {dialog.open && dialog.kind === "negative" && (
        <NegativeAlert
          visible
          title={dialog.title}
          message={dialog.message}
          onClose={() => setDialog({ open: false, kind: "message" })}
        />
      )}
      {dialog.open && dialog.kind === "message" && (
        <MessageAlert
          visible
          title={dialog.title}
          message={dialog.message}
          onClose={() => setDialog({ open: false, kind: "message" })}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: "#F9FAFB" },

  // 🏆 랭킹 섹션
  rankingSection: {
    paddingTop: 60, // StatusBar 공간
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  rankingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  rankingTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rankingTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6366F1",
  },

  // 포디움
  podiumContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 12,
    marginBottom: 24,
  },
  podiumItem: {
    flex: 1,
    alignItems: "center",
  },
  podiumFirst: {
    marginBottom: 20, // 1위를 살짝 위로
  },

  // 4~10위 리스트
  rankingList: {
    gap: 8,
  },
  rankingListItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rankingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  rankNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  rankNumberText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  rankingCrewName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
    flex: 1,
  },
  rankingRight: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  rankingDistance: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  rankingUnit: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },

  // 검색바
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1F2937",
  },

  // 크루 둘러보기
  content: {
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
    letterSpacing: -0.5,
  },
  emptyCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#D1D5DB",
    padding: 32,
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
  },
  emptyContent: {
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#6B7280",
  },
  createBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
  },
  gridWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: "center",
  },
  endMessage: {
    alignItems: "center",
    paddingVertical: 20,
  },
  endText: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  bottomSpacer: {
    height: 100,
  },
});
