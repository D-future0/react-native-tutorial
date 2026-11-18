import { useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRemoteStudentDetail } from "../../src/features/directory/queries";

export default function RemoteStudentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const idParam = Array.isArray(id) ? id[0] : id;
  const studentId = Number(idParam);
  const validStudentId = Number.isInteger(studentId) && studentId > 0;

  const {
    data: student,
    isPending,
    isError,
    error,
    refetch,
  } = useRemoteStudentDetail(validStudentId ? studentId : 0);

  if (!validStudentId) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Invalid student ID.</Text>
      </View>
    );
  }

  if (isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading student details...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>
          {error instanceof Error
            ? error.message
            : "Could not load student details."}
        </Text>
        <Pressable style={styles.button} onPress={() => void refetch()}>
          <Text style={styles.buttonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  if (!student) {
    return (
      <View style={styles.center}>
        <Text>Student not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {student.firstName} {student.lastName}
      </Text>
      <View style={styles.card}>
        <Text style={styles.label}>Student ID</Text>
        <Text style={styles.value}>{student.id}</Text>

        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{student.email}</Text>

        <Text style={styles.label}>University</Text>
        <Text style={styles.value}>
          {student.university ?? "Institution unavailable"}
        </Text>
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    padding: 24,
  },
  title: {
    color: "#1E293B",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    padding: 20,
  },
  label: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 8,
  },
  value: {
    color: "#1E293B",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#2563EB",
    borderRadius: 10,
    padding: 14,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  error: {
    color: "#DC2626",
    textAlign: "center",
  },
});
