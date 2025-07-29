import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import MapScreen from "./Pages/MapScreen";
import Login from "./Pages/Login";

export default function App() {
  return (
    <View style={styles.container}>
      {/* <Text>시작이구만</Text> ← 일단 지워보자 */}
      <Login />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
