import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

type Props = {
  name: string;
  description?: string;
  progress?: string;
  onPress?: () => void;
};

export default function MyCrewCard({ name, description, progress, onPress }: Props) {
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      <View style={s.badge}><Text style={s.badgeText}>내 크루</Text></View>
      <Text style={s.name}>{name}</Text>
      {!!description && <Text style={s.desc} numberOfLines={2}>{description}</Text>}
      {!!progress && <Text style={s.progress}>{progress}</Text>}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: "#E8F2FF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#D0E4FF",
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#2B6CB0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 8,
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  name: { fontSize: 18, fontWeight: "800", color: "#1A365D", marginBottom: 4 },
  desc: { color: "#2A4365", marginBottom: 8 },
  progress: { color: "#1A365D", fontWeight: "600" },
});

