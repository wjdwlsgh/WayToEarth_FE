import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ImageSourcePropType,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  rank: string;
  distance: string;
  name?: string; // 실제 크루명 표시
  image?: ImageSourcePropType;
  highlight?: boolean; // deprecated: size로 대체
  size?: "lg" | "md" | "sm";
  onPress?: () => void;
};

export default function TopCrewItem({
  rank,
  distance,
  name,
  image,
  highlight,
  size = highlight ? "lg" : "md",
  onPress,
}: Props) {
  const dim = size === "lg" ? 80 : size === "md" ? 70 : 62;
  return (
    <TouchableOpacity style={s.wrap} onPress={onPress} activeOpacity={0.8}>
      <View
        style={[
          s.imgWrap,
          { width: dim, height: dim, borderRadius: dim / 2 },
          size === "lg" && s.highlight,
        ]}
      >
        {image ? (
          <Image
            source={image}
            style={{ width: dim, height: dim, borderRadius: dim / 2 }}
            resizeMode="cover"
          />
        ) : (
          <Ionicons
            name={size === "lg" ? "people" : "people-outline"}
            size={dim * 0.5}
            color="#4A90E2"
          />
        )}
      </View>
      <Text style={s.rank}>{rank}</Text>
      {name ? (
        <Text style={s.name} numberOfLines={1}>
          {name}
        </Text>
      ) : null}
      <Text style={s.distance}>{distance}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: "center" },
  imgWrap: {
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  highlight: { borderWidth: 3, borderColor: "#FFD700" },
  rank: { color: "#fff", fontSize: 12, fontWeight: "600", marginBottom: 4 },
  name: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    maxWidth: 92,
    textAlign: "center",
  },
  distance: { color: "#fff", fontSize: 11 },
});
