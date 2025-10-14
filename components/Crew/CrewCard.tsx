import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

type Props = {
  name: string;
  description?: string;
  progress?: string; // e.g., "3/30"
  onPress?: () => void;
};

export default function CrewCard({ name, description, progress, onPress }: Props) {
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      <View style={s.headerRow}>
        <Text style={s.title}>{name}</Text>
        {progress ? <Text style={s.progress}>{progress}</Text> : null}
      </View>
      {description ? <Text style={s.desc} numberOfLines={2}>{description}</Text> : null}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    marginBottom: 12,
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 16, fontWeight: "800", color: "#111827", flex: 1, marginRight: 8 },
  desc: { marginTop: 8, fontSize: 13, color: "#6B7280" },
  progress: { fontSize: 12, color: "#6B7280", fontWeight: "700" },
});

