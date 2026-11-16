import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import ScreenHeader from "../../src/component/ScreenHeader";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <ScreenHeader title="Student Management " />

      <Pressable
        style={styles.button}
        onPress={() => router.push("/students")}
      >
        <Text style={styles.buttonText}>
          View Students
        </Text>
      </Pressable>

      <Pressable
        style={styles.button}
        onPress={() => router.push("/settings")}
      >
        <Text style={styles.buttonText}>
          Settings
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
  },
  button: {
    padding: 16,
    borderRadius: 10,
    backgroundColor: "#2563EB",
  },
  buttonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "600",
  },
});