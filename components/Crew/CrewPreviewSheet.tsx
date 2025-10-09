import React, { useState } from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  visible: boolean;
  onClose: () => void;
  name: string;
  description?: string;
  progress?: string;
  onJoin?: (intro?: string) => Promise<void> | void;
};

export default function CrewPreviewSheet({ visible, onClose, name, description, progress, onJoin }: Props) {
  const [intro, setIntro] = useState("");
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.handle} />
          <TouchableOpacity style={s.closeBtn} onPress={onClose} accessibilityLabel="닫기">
            <Ionicons name="close" size={20} color="#111" />
          </TouchableOpacity>

          <Text style={s.headerTitle}>가입 신청</Text>
          <View style={{ height: 8 }} />
          <Text style={s.label}>한줄 소개</Text>
          <TextInput
            style={s.textarea}
            placeholder="안녕하세요 저는 진지한 러닝을 원합니다."
            placeholderTextColor="#A3A3A3"
            value={intro}
            onChangeText={setIntro}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={s.primaryCta}
            onPress={async () => {
              if (onJoin) await onJoin(intro.trim());
              setIntro("");
              onClose();
            }}
          >
            <Text style={s.primaryCtaText}>가입 신청하기</Text>
          </TouchableOpacity>

          {/* 참고 정보 (선택): 기존 설명/진행률 */}
          {!!description && <Text style={s.desc}>{description}</Text>}
          {!!progress && <Text style={s.progress}>진행률 {progress}</Text>}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 },
  handle: { alignSelf: "center", width: 44, height: 5, borderRadius: 999, backgroundColor: "#E5E7EB", marginBottom: 12 },
  closeBtn: { position: 'absolute', right: 14, top: 14, padding: 6, borderRadius: 999, backgroundColor: '#F5F5F5' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111' },
  label: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 8 },
  textarea: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 120,
    color: '#111',
    marginBottom: 16,
  },
  primaryCta: { backgroundColor: '#111111', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
  primaryCtaText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  desc: { color: "#374151", marginBottom: 8 },
  progress: { color: "#111827", fontWeight: "700", marginBottom: 12 },
  row: { flexDirection: "row", gap: 10 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  cancel: { backgroundColor: "#F3F4F6" },
  cancelText: { color: "#374151", fontWeight: "700" },
  primary: { backgroundColor: "#111827" },
  primaryText: { color: "#fff", fontWeight: "800" },
});
