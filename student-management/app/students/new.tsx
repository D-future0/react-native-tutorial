import { router } from "expo-router";
import { View, StyleSheet } from "react-native";
import ScreenHeader from "../../src/component/ScreenHeader";
import StudentForm from "../../src/component/StudentForm";
import StudentPersistenceNotice from "../../src/component/StudentPersistenceNotice";
import StudentStoreStatus from "../../src/component/StudentStoreStatus";
import {
  useStudentHydrationStore,
  useStudentStore,
} from "../../src/store/studentStore";

export default function NewStudentScreen() {
  const addStudent = useStudentStore((state) => state.addStudent);
  const hasHydrated = useStudentHydrationStore((state) => state.hasHydrated);
  const hydrationError = useStudentHydrationStore(
    (state) => state.hydrationError,
  );

  if (!hasHydrated || hydrationError) {
    return (
      <StudentStoreStatus
        hasHydrated={hasHydrated}
        hydrationError={hydrationError}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Register Student" />
      <StudentPersistenceNotice />
      <StudentForm
        submitLabel="Register Student"
        onSubmit={async (values) => {
          await addStudent(values);
          router.replace("/students");
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
});
