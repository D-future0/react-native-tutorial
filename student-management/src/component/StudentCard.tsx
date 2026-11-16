import { View, Text,Pressable } from "react-native";
import { StudentCardProps } from "../types/student";
import { router } from "expo-router";



export default function StudentCard({ student }: StudentCardProps) {
  return (
    <View style={{ padding: 16, backgroundColor: "#f0f0f0", margin: 8 }}>
      <Text>{student.fullName}</Text>
      <Text>{student.className}</Text>
      <Pressable onPress={() => router.push(`/students/${student.id}`)}>
        <Text style={{ color: "blue" }}>View Details</Text>
      </Pressable>
    </View>
  );
}
