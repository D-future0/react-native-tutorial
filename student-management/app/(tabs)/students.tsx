import { FlatList, StyleSheet } from "react-native";
import students from "../../src/data/students";
import StudentCard from "../../src/component/StudentCard";
import ScreenHeader from "../../src/component/ScreenHeader";

export default function StudentsScreen() {
  return (
    <FlatList
      data={students}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <StudentCard student={item} />}
      ListHeaderComponent={<ScreenHeader title="Students" />}
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
  },
});
