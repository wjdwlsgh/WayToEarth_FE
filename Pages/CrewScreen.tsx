import React, { useState } from "react";
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
import TopCrewItem from "../components/Crew/TopCrewItem";
import CrewCard from "../components/Crew/CrewCard";
import SearchBar from "../components/Crew/SearchBar";
import MyCrewCard from "../components/Crew/MyCrewCard";
import { useCrewData } from "../hooks/useCrewData";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import CreateCrewSheet from "../components/Crew/CreateCrewSheet";
import CrewPreviewSheet from "../components/Crew/CrewPreviewSheet";

export default function CrewScreen() {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selected, setSelected] = useState<{
    id?: string;
    name: string;
    description?: string;
    progress?: string;
  } | null>(null);
  const { topCrews, crews, myCrew, createMyCrew, joinExistingCrew, refresh } =
    useCrewData(search);
  // 탭 내비게이터 사용: 개별 화면에서 하단 바를 렌더하지 않음
  const navigation = useNavigation<any>();
  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh])
  );

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" />

      {/* 헤더 */}
      <View style={s.header}>
        <Text style={s.headerTime}>9:41</Text>
        {myCrew && (
          <TouchableOpacity
            accessibilityLabel="크루 채팅"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={() => {
              Alert.alert("채팅 이동", "내 크루 채팅으로 이동 시도");
              const params: any = {
                crewId: String((myCrew as any).id),
                crewName: (myCrew as any).name,
              };
              const state: any = (navigation as any)?.getState?.();
              const canHere = Array.isArray(state?.routeNames) && state.routeNames.includes("CrewChat");
              if (canHere) {
                (navigation as any).navigate("CrewChat", params);
              } else {
                const parent = (navigation as any)?.getParent?.();
                if (parent) {
                  parent.navigate("CrewChat", params);
                } else {
                  Alert.alert("채팅 이동 불가", "네비게이션 경로를 찾을 수 없습니다.");
                }
              }
            }}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={22} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* 상단 랭킹 */}
        <View style={s.topWrap}>
          {(function orderTop() {
            const a = topCrews;
            const ordered = [a[1], a[0], a[2]].filter(Boolean); // [2등, 1등, 3등]
            return ordered.map((c, idx) => {
              // 2,3등 동일 크기(md), 1등만 크게(lg)
              const size = idx === 1 ? "lg" : "md";
              // 1등을 가장 높이, 2/3등은 동일하게 조금 내려서 삼각형 배치
              const offset = idx === 1 ? 0 : 16;
              return (
                <View key={c.id} style={[s.topItemWrap, { marginTop: offset }]}>
                  <TopCrewItem
                    rank={c.rank}
                    distance={c.distance}
                    name={c.name}
                    size={size}
                    onPress={() => {}}
                  />
                </View>
              );
            });
          })()}
        </View>

        {/* 목록 섹션 */}
        <View style={s.content}>
          <Text style={s.title}>크루 목록</Text>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            onSearch={() => {}}
          />

          {/* 내 크루가 없으면 생성 유도 */}
          {!myCrew && (
            <View style={s.empty}>
              <Text style={s.emptyIcon}>👥</Text>
              <Text style={s.emptyText}>현재 크루가 없습니다</Text>
              <TouchableOpacity
                style={s.createBtn}
                onPress={() => setCreateOpen(true)}
              >
                <Text style={s.createBtnText}>크루 생성</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 내 크루 고정 노출 (1번 위치) */}
          {myCrew && (
            <MyCrewCard
              name={myCrew.name}
              description={myCrew.description}
              progress={myCrew.progress}
              onPress={() => navigation.navigate("CrewDetail")}
            />
          )}

          {/* 목록 */}
          {crews.map((c) => (
            <CrewCard
              key={c.id}
              name={c.name}
              description={c.description}
              progress={c.progress}
              onPress={() => {
                if (!myCrew) {
                  setSelected({
                    id: c.id,
                    name: c.name,
                    description: c.description,
                    progress: c.progress,
                  });
                  setPreviewOpen(true);
                } else {
                  Alert.alert("가입 불가", "현재 가입된 크루가 이미 있습니다.");
                }
              }}
            />
          ))}
        </View>
      </ScrollView>

      {/* 탭 내비게이터 사용으로 하단 바는 전역에서 렌더링됨 */}

      {/* 크루 생성 바텀 시트 */}
      <CreateCrewSheet
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (name, description) => {
          try {
            if (!name?.trim()) return;
            await createMyCrew(name, description);
          } catch (e: any) {
            const msg = e?.response?.data?.message || e?.message || "크루 생성에 실패했습니다. 잠시 후 다시 시도해주세요.";
            Alert.alert("생성 실패", msg);
          }
        }}
      />

      {/* 크루 미리보기 (내 크루 없을 때 다른 크루 클릭 시) */}
      <CrewPreviewSheet
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
                  // 승인 대기 안내
                  if ((res as any)?.pending) {
                    Alert.alert(
                      "신청 완료",
                      "관리자 승인 후 크루에 참여할 수 있습니다."
                    );
                  } else {
                    Alert.alert("가입 완료", "크루에 가입되었습니다.");
                  }
                } catch (e: any) {
                  const msg = e?.code === "JOIN_PENDING_EXISTS"
                    ? "이미 해당 크루에 가입 신청이 접수되어 있습니다. 승인/거절 결과를 기다려주세요."
                    : (e?.response?.data?.message || e?.message || "가입 신청에 실패했습니다.");
                  Alert.alert("신청 불가", msg);
                }
              }
            : undefined
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { backgroundColor: "#4A90E2", padding: 16, paddingTop: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTime: { color: "#fff", fontSize: 14, fontWeight: "600" },
  topWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end", // 하단 정렬 → 중앙 아이템을 더 높게 보이도록 marginTop으로 오프셋
    backgroundColor: "#4A90E2",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  topItemWrap: { width: "32%", alignItems: "center" },
  content: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 16, color: "#000" },
  empty: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    marginBottom: 24,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, color: "#999", marginBottom: 16 },
  createBtn: {
    backgroundColor: "#000",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  createBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
