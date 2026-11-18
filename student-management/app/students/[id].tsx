import { router, useLocalSearchParams } from "expo-router";
import { Alert, View, Text, StyleSheet, Pressable } from "react-native";
import { useRef } from "react";
import ScreenHeader from "../../src/component/ScreenHeader";
import StudentPersistenceNotice from "../../src/component/StudentPersistenceNotice";
import {
  useStudentHydrationStore,
  useStudentStore,
} from "../../src/store/studentStore";
import StudentStoreStatus from "../../src/component/StudentStoreStatus";

export default function StudentDetailsScreen() {
  const { id } = useLocalSearchParams<"/students/[id]">();
  const students = useStudentStore((state) => state.students);
  const hasHydrated = useStudentHydrationStore((state) => state.hasHydrated);
  const hydrationError = useStudentHydrationStore(
    (state) => state.hydrationError,
  );
  const deleteStudent = useStudentStore((state) => state.deleteStudent);
  const isDeleting = useRef(false);
  const studentId = Array.isArray(id) ? id[0] : id;
  const student = students.find((item) => item.id === studentId) ?? null;

  if (!hasHydrated || hydrationError) {
    return (
      <StudentStoreStatus
        hasHydrated={hasHydrated}
        hydrationError={hydrationError}
      />
    );
  }

  const deleteConfirmed = async () => {
    if (!student || isDeleting.current) {
      return;
    }

    isDeleting.current = true;
    try {
      await deleteStudent(student.id);
      router.replace("/students");
    } catch {
      Alert.alert(
        "Delete failed",
        "The student could not be deleted. Please try again.",
      );
    } finally {
      isDeleting.current = false;
    }
  };

  const confirmDelete = () => {
    if (!student) {
      return;
    }

    Alert.alert(
      "Delete student",
      `Are you sure you want to delete ${student.fullName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => void deleteConfirmed(),
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Student Details" />
      <StudentPersistenceNotice />
      {student ? (
        <>
          <View style={styles.studentCard}>
            <Text>Full Name: {student.fullName}</Text>
            <Text>Class: {student.className}</Text>
            <Text>Email: {student.email}</Text>
          </View>
          <Pressable
            style={styles.updateButton}
            onPress={() =>
              router.push({
                pathname: "/students/[id]/edit",
                params: { id: student.id },
              })
            }
          >
            <Text style={styles.updateButtonText}>Update Student</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={styles.deleteButton}
            onPress={confirmDelete}
          >
            <Text style={styles.deleteButtonText}>Delete Student</Text>
          </Pressable>
        </>
      ) : (
        <Text>Student not found</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  studentCard: {
    padding: 20,
    backgroundColor: "#f6f8fa",
    borderRadius: 10,
    gap: 8,
  },
  updateButton: {
    alignSelf: "flex-start",
    backgroundColor: "#2563EB",
    borderRadius: 8,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  updateButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  deleteButton: {
    alignSelf: "flex-start",
    backgroundColor: "#DC2626",
    borderRadius: 8,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});