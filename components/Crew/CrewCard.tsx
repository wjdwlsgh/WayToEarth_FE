import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
        <View style={s.titleRow}>
          <Ionicons name="people-outline" size={20} color="#4A90E2" />
          <Text style={s.title}>{name}</Text>
        </View>
        {progress ? (
          <View style={s.progressBadge}>
            <Text style={s.progress}>{progress}</Text>
          </View>
        ) : null}
      </View>
      {description ? (
        <Text style={s.desc} numberOfLines={2}>
          {description}
        </Text>
      ) : null}
      <View style={s.footer}>
        <Text style={s.joinText}>크루 보기</Text>
        <Ionicons name="arrow-forward" size={16} color="#4A90E2" />
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  progressBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  progress: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "700",
  },
  desc: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    marginBottom: 12,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  joinText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4A90E2",
  },
});

