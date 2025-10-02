import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, ImageSourcePropType } from "react-native";

type Props = {
  rank: string;
  distance: string;
  image?: ImageSourcePropType;
  highlight?: boolean; // 1등 강조
  onPress?: () => void;
};

export default function TopCrewItem({ rank, distance, image, highlight, onPress }: Props) {
  return (
    <TouchableOpacity style={s.wrap} onPress={onPress} activeOpacity={0.8}>
      <View style={[s.imgWrap, highlight && s.highlight]}>
        <Image source={image || require("../../assets/people0.png")} style={s.img} />
      </View>
      <Text style={s.rank}>{rank}</Text>
      <Text style={s.distance}>{distance}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: "center" },
  imgWrap: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  highlight: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: "#FFD700" },
  img: { width: 60, height: 60, borderRadius: 30 },
  rank: { color: "#fff", fontSize: 12, fontWeight: "600", marginBottom: 4 },
  distance: { color: "#fff", fontSize: 11 },
});

