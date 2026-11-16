import { useLocalSearchParams } from "expo-router";
import { View, Text } from "react-native";
import students from "../../src/data/students";
import ScreenHeader from "../../src/component/ScreenHeader";

export default function StudentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const studentId = Array.isArray(id) ? id[0] : id;
  const student = students.find((item) => item.id === studentId) ?? null;

  return (
    <View style={{ padding: 24 }}>
      <ScreenHeader title="Student Details" />
      {student ? (
        <View style={{ padding: 20, backgroundColor: "#f6f8fa", borderRadius: 10 }}>
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