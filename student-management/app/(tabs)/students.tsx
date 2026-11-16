import { View } from "react-native";
import students from "../../src/data/students";
import StudentCard from "../../src/component/StudentCard";
import { Student } from "../../src/types/student";
import ScreenHeader from "../../src/component/ScreenHeader";

export default function StudentsScreen() {
  return (
    <View style={{ padding: 24 }}>
      <ScreenHeader title="Students" />
      {students.map((student: Student) => (
        <StudentCard key={student.id} student={student} />
      ))}
    </View>
  );
}
