import { Alert, View, Text, Pressable, StyleSheet } from "react-native";
import { useRef } from "react";
import type { StudentCardProps } from "../types/student";
import { Link } from "expo-router";
import { useStudentStore } from "../store/studentStore";

export default function StudentCard({ student }: StudentCardProps) {
  const deleteStudent = useStudentStore((state) => state.deleteStudent);
  const isDeleting = useRef(false);

  const deleteConfirmed = async () => {
    if (isDeleting.current) {
      return;
    }

    isDeleting.current = true;
    try {
      await deleteStudent(student.id);
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
    <View style={styles.card}>
      <Text style={styles.name}>{student.fullName}</Text>
      <Text style={styles.className}>{student.className}</Text>
      <View style={styles.buttonContainer}>
        <Link
          href={{ pathname: "/students/[id]", params: { id: student.id } }}
          asChild
        >
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>View Details</Text>
          </Pressable>
        </Link>
        <Link
          href={{ pathname: "/students/[id]/edit", params: { id: student.id } }}
          asChild
        >
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Edit Student</Text>
          </Pressable>
        </Link>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete ${student.fullName}`}
          onPress={confirmDelete}
          style={styles.deleteButton}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </Pressable>
      </View>
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
  buttonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  button: {
    alignSelf: "flex-start",
    backgroundColor: "#2563EB",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  deleteButton: {
    alignSelf: "flex-start",
    backgroundColor: "#DC2626",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
