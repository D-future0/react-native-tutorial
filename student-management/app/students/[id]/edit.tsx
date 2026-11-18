import { StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import ScreenHeader from "../../../src/component/ScreenHeader";
import StudentForm from "../../../src/component/StudentForm";
import StudentPersistenceNotice from "../../../src/component/StudentPersistenceNotice";
import StudentStoreStatus from "../../../src/component/StudentStoreStatus";
import {
  useStudentHydrationStore,
  useStudentStore,
} from "../../../src/store/studentStore";

export default function UpdateStudentScreen() {
  const { id } = useLocalSearchParams<"/students/[id]/edit">();
  const students = useStudentStore((state) => state.students);
  const updateStudent = useStudentStore((state) => state.updateStudent);
  const hasHydrated = useStudentHydrationStore((state) => state.hasHydrated);
  const hydrationError = useStudentHydrationStore(
    (state) => state.hydrationError,
  );
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

  if (!student) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Update Student" />
        <Text style={styles.notFound}>Student not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Update Student" />
      <StudentPersistenceNotice />
      <StudentForm
        key={student.id}
        initialStudent={student}
        submitLabel="Save Changes"
        onSubmit={async (values) => {
          await updateStudent(student.id, values);
          router.replace({
            pathname: "/students/[id]",
            params: { id: student.id },
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    gap: 16,
    padding: 24,
  },
  notFound: {
    color: "#64748B",
    fontSize: 16,
  },
});
