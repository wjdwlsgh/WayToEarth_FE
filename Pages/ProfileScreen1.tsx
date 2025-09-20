import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";

const ProfileScreen1: React.FC = () => {
  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>프로필(대안 화면)</Text>
      </View>
      <View style={s.body}>
        <Text style={s.text}>프로필1 레이아웃을 여기에 구성하세요.</Text>
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: { fontSize: 18, fontWeight: "700" },
  body: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { color: "#6b7280" },
});

export default ProfileScreen1;
