import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { Link } from "expo-router";
import ScreenHeader from "../../src/component/ScreenHeader";
import StudentCard from "../../src/component/StudentCard";
import students from "../../src/data/students";

export default function HomeScreen() {
  const numberOfClasses = new Set(
    students.map((student) => student.className),
  ).size;
  const recentlyRegistered = students.slice(-1);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <ScreenHeader title="Student Management" />
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Students</Text>
          <Text style={styles.statValue}>{students.length}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Number of Classes</Text>
          <Text style={styles.statValue}>{numberOfClasses}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recently Registered</Text>
      <View style={styles.recentStudents}>
        {recentlyRegistered.length > 0 ? (
          recentlyRegistered.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))
        ) : (
          <Text style={styles.emptyState}>No students registered yet.</Text>
        )}
      </View>

      <View style={styles.navigation}>
        <Link href="/students" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>View Students</Text>
          </Pressable>
        </Link>
        <Link href="/settings" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Settings</Text>
          </Pressable>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    padding: 24,
    gap: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  statLabel: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
  },
  statValue: {
    color: "#1E293B",
    fontSize: 30,
    fontWeight: "700",
    marginTop: 8,
  },
  sectionTitle: {
    color: "#1E293B",
    fontSize: 18,
    fontWeight: "700",
  },
  recentStudents: {
    gap: 12,
  },
  emptyState: {
    color: "#64748B",
    fontSize: 15,
  },
  navigation: {
    gap: 12,
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