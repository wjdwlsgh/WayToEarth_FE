import React from "react";
import { View, Text, SafeAreaView, StyleSheet } from "react-native";

export default function GuestbookScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={{ padding: 16 }}>
        <Text style={styles.title}>방명록</Text>
        <Text style={{ color: "#6b7280", marginTop: 6 }}>목 데이터 기반 예시 화면</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "800" },
});

