
import { FlatList, StyleSheet, Text, Pressable, View } from "react-native";
import { Link } from "expo-router";
import StudentCard from "../../src/component/StudentCard";
import ScreenHeader from "../../src/component/ScreenHeader";
import StudentPersistenceNotice from "../../src/component/StudentPersistenceNotice";
import {
  useStudentHydrationStore,
  useStudentStore,
} from "../../src/store/studentStore";
import StudentStoreStatus from "../../src/component/StudentStoreStatus";

export default function StudentsScreen() {
  const students = useStudentStore((state) => state.students);
  const hasHydrated = useStudentHydrationStore((state) => state.hasHydrated);
  const hydrationError = useStudentHydrationStore(
    (state) => state.hydrationError,
  );

  if (!hasHydrated || hydrationError) {
    return (
      <StudentStoreStatus
        hasHydrated={hasHydrated}
        hydrationError={hydrationError}
      />
    );
  }

  return (
    <FlatList
      data={students}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <StudentCard student={item} />}
      ListHeaderComponent={
        <View>
          <ScreenHeader title="Students" />
          <StudentPersistenceNotice />
        </View>
      }
      ListEmptyComponent={
        <Text style={styles.empty}>
          No students registered yet.
        </Text>
      }
      ListFooterComponent={
        <Link href="/students/new" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Add New Student</Text>
          </Pressable>
        </Link>
      }
      style={styles.container}
      contentContainerStyle={styles.content}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    padding: 24,
    gap: 12,
    flexGrow: 1,
  },
  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#64748B",
  },
  button: {
    backgroundColor: "#2563EB",
    padding: 16,
    borderRadius: 10,
    margin: 24,
  },
  buttonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "600",
  },
});