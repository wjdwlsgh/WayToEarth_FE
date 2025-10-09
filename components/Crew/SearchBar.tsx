import React from "react";
import { View, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  value: string;
  onChangeText: (t: string) => void;
  onSearch?: () => void;
};

export default function SearchBar({ value, onChangeText, onSearch }: Props) {
  return (
    <View style={s.container}>
      <TextInput
        style={s.input}
        placeholder="크루를 검색해 보세요"
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
        onSubmitEditing={onSearch}
      />
      <TouchableOpacity onPress={onSearch} style={s.btn}>
        <Ionicons name="search" size={20} color="#111" />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: "#000" },
  btn: { padding: 4 },
});
