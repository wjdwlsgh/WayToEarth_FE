import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getCrewById, type CrewPublicDetail } from "../../utils/api/crews";

type Props = {
  visible: boolean;
  crewId: string;
  onClose: () => void;
  onApply?: (intro?: string) => Promise<void> | void;
  initialName?: string;
  initialProgress?: string; // e.g., "12/50"
};

export default function CrewDetailModal({
  visible,
  crewId,
  onClose,
  onApply,
  initialName,
  initialProgress,
}: Props) {
  const [detail, setDetail] = useState<CrewPublicDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intro, setIntro] = useState("");
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (!crewId) return;
    let alive = true;
    setLoading(true);
    setError(null);
    getCrewById(crewId)
      .then((d) => {
        if (!alive) return;
        setDetail(d);
      })
      .catch((e) => {
        if (!alive) return;
        const msg = e?.response?.data?.message || e?.message || "크루 정보를 불러오지 못했습니다.";
        setError(msg);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [visible, crewId]);

  const name = detail?.name || initialName || "";
  const progress = useMemo(() => {
    if (detail) return `${detail.currentMembers}/${detail.maxMembers}`;
    return initialProgress;
  }, [detail, initialProgress]);

  const submit = async () => {
    if (!onApply || applying) return;
    try {
      setApplying(true);
      await onApply(intro.trim());
      setIntro("");
      onClose();
    } finally {
      setApplying(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.handle} />

          <View style={s.headerRow}>
            <Text style={s.headerTitle}>크루 정보</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="close" size={22} color="#111" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
            <View style={s.card}>
              <View style={s.rowBetween}>
                <View style={s.avatarWrap}>
                  {detail?.profileImageUrl ? (
                    <Image source={{ uri: detail.profileImageUrl }} style={s.avatarImg} />
                  ) : (
                    <View style={s.avatarFallback}>
                      <Ionicons name="people" size={24} color="#6B7280" />
                    </View>
                  )}
                </View>
                {progress ? <Text style={s.progress}>{progress}</Text> : null}
              </View>
              <Text style={s.name}>{name}</Text>
              {detail?.ownerNickname ? (
                <Text style={s.subInfo}>리더 {detail.ownerNickname}</Text>
              ) : null}
              {detail?.isActive === false ? (
                <Text style={s.inactive}>비활성 크루</Text>
              ) : null}
              {detail?.description ? (
                <Text style={s.desc} numberOfLines={5}>
                  {detail.description}
                </Text>
              ) : null}
            </View>

            {loading && (
              <View style={s.loadingBox}>
                <ActivityIndicator color="#4A90E2" />
                <Text style={s.loadingText}>불러오는 중…</Text>
              </View>
            )}
            {error && !loading && (
              <View style={s.errorBox}>
                <Ionicons name="alert-circle" color="#ef4444" size={18} />
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}

            <View style={s.inputWrap}>
              <Text style={s.inputLabel}>가입 인사 (선택)</Text>
              <TextInput
                style={s.input}
                placeholder="간단한 소개를 남겨보세요"
                value={intro}
                onChangeText={setIntro}
                multiline
              />
            </View>
          </ScrollView>

          <TouchableOpacity style={[s.applyBtn, applying && { opacity: 0.6 }]} onPress={submit} disabled={applying}>
            <Text style={s.applyText}>{applying ? "신청 중…" : "신청"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
  card: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  avatarWrap: { width: 56, height: 56, borderRadius: 12, overflow: "hidden", backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center" },
  avatarImg: { width: 56, height: 56, resizeMode: "cover" },
  avatarFallback: { width: 56, height: 56, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 16, fontWeight: "800", color: "#111827", marginTop: 8 },
  subInfo: { marginTop: 4, fontSize: 12, color: "#6B7280" },
  progress: { fontSize: 12, color: "#6B7280", fontWeight: "700" },
  inactive: { marginTop: 4, fontSize: 12, color: "#ef4444", fontWeight: "700" },
  desc: { marginTop: 10, fontSize: 13, color: "#374151", lineHeight: 18 },
  loadingBox: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  loadingText: { marginLeft: 8, color: "#6B7280", fontSize: 12 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  errorText: { marginLeft: 6, color: "#ef4444", fontSize: 12 },
  inputWrap: { marginTop: 4 },
  inputLabel: { fontSize: 12, color: "#6B7280", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    minHeight: 84,
    textAlignVertical: "top",
  },
  applyBtn: {
    marginTop: 12,
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  applyText: { color: "#fff", fontWeight: "800" },
});

