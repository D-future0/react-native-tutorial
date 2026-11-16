import { useLocalSearchParams } from "expo-router";
import { View, Text } from "react-native";
import students from "../../src/data/students";

export default function StudentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const studentId = Array.isArray(id) ? id[0] : id;
  const student = students.find((item) => item.id === studentId) ?? null;

  return (
    <View style={{ padding: 24 }}>
      <Text>Student Details</Text>
      {student ? (
        <>
          <Text>Full Name: {student.fullName}</Text>
          <Text>Class: {student.className}</Text>
          <Text>Email: {student.email}</Text>
        </>
      ) : (
        <Text>Student not found</Text>
      )}
    </View>
  );
}