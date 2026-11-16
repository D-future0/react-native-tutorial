import { View, Text, Pressable, StyleSheet } from "react-native";
import { StudentCardProps } from "../types/student";
import { router } from "expo-router";

export default function StudentCard({ student }: StudentCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{student.fullName}</Text>
      <Text style={styles.className}>{student.className}</Text>
      <Pressable
        style={styles.button}
        onPress={() => router.push(`/students/${student.id}`)}
      >
        <Text style={styles.buttonText}>View Details</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  name: {
    color: "#1E293B",
    fontSize: 18,
    fontWeight: "700",
  },
  className: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 6,
  },
  button: {
    alignSelf: "flex-start",
    backgroundColor: "#2563EB",
    borderRadius: 8,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
