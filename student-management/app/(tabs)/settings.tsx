import { View, Text, StyleSheet } from "react-native";
import ScreenHeader from "../../src/component/ScreenHeader";

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <ScreenHeader title="Settings" />
      <Text style={styles.description}>
        Manage your application settings here.
      </Text>
      <View style={styles.options}>
        <View style={styles.option}>
          <Text style={styles.optionText}>Account Management</Text>
        </View>
        <View style={styles.option}>
          <Text style={styles.optionText}>Enable Notifications</Text>
        </View>
        <View style={styles.option}>
          <Text style={styles.optionText}>Theme Switcher</Text>
        </View>
        <View style={styles.option}>
          <Text style={styles.optionText}>Language Preferences</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 24,
  },
  description: {
    color: "#64748B",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 20,
  },
  options: {
    gap: 12,
    marginTop: 24,
  },
  option: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  optionText: {
    color: "#1E293B",
    fontSize: 16,
    fontWeight: "600",
  },
});