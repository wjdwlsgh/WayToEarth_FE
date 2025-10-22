import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      <View style={s.badgeRow}>
        <View style={s.badge}>
          <Ionicons name="star" size={12} color="#fff" />
          <Text style={s.badgeText}>내 크루</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#4F46E5" />
      </View>
      <View style={s.row}>
        <Text style={s.title}>{name}</Text>
        {progress ? (
          <View style={s.progressBadge}>
            <Ionicons name="people" size={14} color="#4F46E5" />
            <Text style={s.progress}>{progress}</Text>
          </View>
        ) : null}
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
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#C7D2FE",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#4F46E5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  progressBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  progress: {
    fontSize: 12,
    color: "#4F46E5",
    fontWeight: "700",
  },
  desc: {
    marginTop: 4,
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
  },
});
