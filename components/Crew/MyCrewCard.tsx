import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

type Props = {
  name: string;
  description?: string;
  progress?: string;
  onPress?: () => void;
};

export default function MyCrewCard({
  name,
  description,
  progress,
  onPress,
}: Props) {
  return (
    <TouchableOpacity style={s.card} onPress={onPress}>
      <Text style={s.badge}>내 크루</Text>
      <View style={s.row}>
        <Text style={s.title}>{name}</Text>
        {progress ? <Text style={s.progress}>{progress}</Text> : null}
      </View>
      {description ? (
        <Text style={s.desc} numberOfLines={2}>
          {description}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#4F46E5",
    color: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    fontSize: 10,
    fontWeight: "800",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 16, fontWeight: "800", color: "#111827" },
  progress: { fontSize: 12, color: "#374151", fontWeight: "700" },
  desc: { marginTop: 8, fontSize: 13, color: "#4B5563" },
});
