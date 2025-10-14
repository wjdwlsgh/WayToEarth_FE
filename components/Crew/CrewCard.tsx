import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ImageSourcePropType } from "react-native";

type Props = {
  name: string;
  description: string;
  progress: string;
  image?: ImageSourcePropType;
  onPress?: () => void;
};

export default function CrewCard({ name, description, progress, image, onPress }: Props) {
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.8}>
      <Image source={image || require("../../assets/people0.png")} style={s.img} />
      <View style={s.info}>
        <Text style={s.name}>{name}</Text>
        <Text numberOfLines={1} style={s.desc}>{description}</Text>
      </View>
      <Text style={s.progress}>{progress}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  img: { width: 50, height: 50, borderRadius: 8 },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: "600", color: "#000", marginBottom: 4 },
  desc: { fontSize: 13, color: "#666" },
  progress: { fontSize: 14, color: "#999" },
});

