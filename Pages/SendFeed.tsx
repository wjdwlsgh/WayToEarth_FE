import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  Pressable,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { createFeed } from "../utils/api/feeds";
import * as ImagePicker from "expo-image-picker";

export default function FeedComposeScreen({ route, navigation }: any) {
  const { runId, defaultTitle, distanceKm, paceLabel, kcal } =
    route.params || {};

  const [title, setTitle] = useState(defaultTitle || "");
  const [content, setContent] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // runId 정규화: local_... → null, "123" → 123, 그 외 NaN → null
  const normalizedRunId: number | null = useMemo(() => {
    if (typeof runId === "string") {
      if (runId.startsWith("local_")) return null; // 서버 기록 없음
      const n = Number(runId);
      return Number.isFinite(n) ? n : null;
    }
    if (typeof runId === "number" && Number.isFinite(runId)) return runId;
    return null;
  }, [runId]);

  const canShare = Boolean(normalizedRunId) && !submitting;

  const pickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
      });
      if (!result.canceled) {
        setPhotoUrl(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert("오류", "사진 선택에 실패했습니다.");
    }
  };

  const onSubmit = async () => {
    if (!normalizedRunId) {
      Alert.alert(
        "기록 저장 필요",
        "러닝 기록이 서버에 저장되지 않았어요.\n러닝 완료 저장 후 다시 시도해 주세요."
      );
      return;
    }
    try {
      setSubmitting(true);
      console.log("[FeedCompose] 피드 생성 시도 - runId:", normalizedRunId);
      console.log("[FeedCompose] content:", content);
      console.log("[FeedCompose] photoUrl:", photoUrl);
      await createFeed({ runningRecordId: normalizedRunId, content, photoUrl });
      Alert.alert("공유 완료", "피드가 업로드되었습니다.");
      navigation.navigate("Feed");
    } catch (e: any) {
      console.error("[FeedCompose] createFeed error =>", e?.message ?? e);
      console.error("[FeedCompose] error response =>", e?.response?.data);
      console.error("[FeedCompose] error status =>", e?.response?.status);
      // 401/403 별도 안내
      const msg =
        e?.response?.status === 401 || e?.response?.status === 403
          ? "로그인이 만료되었어요. 다시 로그인해 주세요."
          : `네트워크 또는 서버 오류가 발생했어요.\nrunId: ${normalizedRunId}`;
      Alert.alert("게시 실패", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={s.centerContent}
        >
          <View style={s.wrapper}>
            <Text style={s.header}>Way to Earth</Text>

            <View style={s.summaryRow}>
              <View style={s.pill}>
                <Text style={s.pillVal}>
                  {distanceKm?.toFixed?.(2) ?? "0.00"}
                </Text>
                <Text style={s.pillLbl}>거리(km)</Text>
              </View>
              <View style={s.pill}>
                <Text style={s.pillVal}>{paceLabel ?? "-:-:-"}</Text>
                <Text style={s.pillLbl}>평균 페이스</Text>
              </View>
              <View style={s.pill}>
                <Text style={s.pillVal}>{kcal ?? "0"}</Text>
                <Text style={s.pillLbl}>칼로리</Text>
              </View>
            </View>

            <TextInput
              style={s.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="오늘 러닝 어땠나요? 제목을 적어주세요"
              placeholderTextColor="#9CA3AF"
              textAlignVertical="center"
            />
            <TextInput
              style={s.contentInput}
              value={content}
              onChangeText={setContent}
              multiline
              placeholder="한 줄을 남겨보세요!"
              placeholderTextColor="#D1D5DB"
              textAlignVertical="top"
            />

            {photoUrl ? (
              <>
                <Image source={{ uri: photoUrl }} style={s.photo as any} />
                <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                  <Pressable
                    onPress={() => setPhotoUrl(null)}
                    style={[s.btn, s.ghost, { flex: 1 }]}
                  >
                    <Text style={[s.btnText, { color: "#111" }]}>
                      사진 제거
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <Pressable style={s.addBox} onPress={pickPhoto}>
                <Text style={{ color: "#6b7280" }}>＋ 사진 선택</Text>
              </Pressable>
            )}

            <View style={{ gap: 12, marginTop: 12 }}>
              <Pressable
                style={[s.btn, s.primary, !canShare && { opacity: 0.5 }]}
                onPress={onSubmit}
                disabled={!canShare}
              >
                <Text style={s.btnText}>
                  {submitting
                    ? "업로드 중..."
                    : normalizedRunId
                    ? "공유하기"
                    : "기록 저장 후 공유"}
                </Text>
              </Pressable>

              <Pressable
                style={[s.btn, s.ghost]}
                onPress={() => navigation.goBack()}
              >
                <Text style={[s.btnText, { color: "#111" }]}>취소</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// 스타일은 기존 그대로
const s = StyleSheet.create({
  /* 화면 배경 + 기본 */
  root: { flex: 1, backgroundColor: "#fff" },

  /* 세로 중앙 정렬 핵심 */
  centerContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 25,
    paddingVertical: 20,
  },

  /* 가로 중앙 + 폭 제한(큰 화면 대비) */
  wrapper: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 560,
  },

  header: {
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 16,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  pill: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  pillVal: { fontSize: 18, fontWeight: "800" },
  pillLbl: { fontSize: 12, color: "#6b7280", marginTop: 4 },

  titleInput: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    fontSize: 16,
    fontWeight: "700",
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  contentInput: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    padding: 15,
    minHeight: 150,
    backgroundColor: "#F9FAFB",
  },

  photo: {
    width: "100%",
    height: 180,
    borderRadius: 16,
    marginTop: 12,
    backgroundColor: "#F3F4F6",
  },
  addBox: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    borderRadius: 16,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },

  btn: {
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: { backgroundColor: "#111" },
  ghost: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB" },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
