import React from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity } from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  name: string;
  description?: string;
  progress?: string;
  onJoin?: () => Promise<void> | void;
};

export default function CrewPreviewSheet({ visible, onClose, name, description, progress, onJoin }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.handle} />
          <Text style={s.title}>{name}</Text>
          {!!description && <Text style={s.desc}>{description}</Text>}
          {!!progress && <Text style={s.progress}>진행률 {progress}</Text>}
          <View style={s.row}>
            <TouchableOpacity style={[s.btn, s.cancel]} onPress={onClose}>
              <Text style={s.cancelText}>닫기</Text>
            </TouchableOpacity>
            {onJoin && (
              <TouchableOpacity style={[s.btn, s.primary]} onPress={onJoin}>
                <Text style={s.primaryText}>참여하기</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 },
  handle: { alignSelf: "center", width: 44, height: 5, borderRadius: 999, backgroundColor: "#E5E7EB", marginBottom: 12 },
  title: { fontSize: 18, fontWeight: "800", marginBottom: 8 },
  desc: { color: "#374151", marginBottom: 8 },
  progress: { color: "#111827", fontWeight: "700", marginBottom: 12 },
  row: { flexDirection: "row", gap: 10 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  cancel: { backgroundColor: "#F3F4F6" },
  cancelText: { color: "#374151", fontWeight: "700" },
  primary: { backgroundColor: "#111827" },
  primaryText: { color: "#fff", fontWeight: "800" },
});

