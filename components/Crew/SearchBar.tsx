import React from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
} from "react-native";

type Props = {
  value: string;
  onChangeText: (t: string) => void;
  onSearch?: () => void;
};

export default function SearchBar({ value, onChangeText, onSearch }: Props) {
  return (
    <View style={s.row}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="크루 이름으로 검색"
        style={s.input}
        returnKeyType="search"
        onSubmitEditing={onSearch}
      />
      <TouchableOpacity style={s.btn} onPress={onSearch}>
        <Text style={s.btnText}>검색</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, marginBottom: 16 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  btn: {
    backgroundColor: "#111827",
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { color: "#fff", fontWeight: "800" },
});
