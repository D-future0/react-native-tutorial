import { useLocalSearchParams } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import students from "../../src/data/students";
import ScreenHeader from "../../src/component/ScreenHeader";

export default function StudentDetailsScreen() {
  const { id } = useLocalSearchParams<"/students/[id]">();
  const studentId = Array.isArray(id) ? id[0] : id;
  const student = students.find((item) => item.id === studentId) ?? null;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Student Details" />
      {student ? (
        <View style={styles.studentCard}>
          <Text>Full Name: {student.fullName}</Text>
          <Text>Class: {student.className}</Text>
          <Text>Email: {student.email}</Text>
        </View>
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
  },
});