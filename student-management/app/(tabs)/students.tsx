import { ScrollView, StyleSheet } from "react-native";
import students from "../../src/data/students";
import StudentCard from "../../src/component/StudentCard";
import { Student } from "../../src/types/student";
import ScreenHeader from "../../src/component/ScreenHeader";

export default function StudentsScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <ScreenHeader title="Students" />
      {students.map((student: Student) => (
        <StudentCard key={student.id} student={student} />
      ))}
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
    gap: 12,
  },
});
