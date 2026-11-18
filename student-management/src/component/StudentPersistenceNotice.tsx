import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useStudentPersistenceStore } from "../store/studentStore";

export default function StudentPersistenceNotice() {
  const isSaving = useStudentPersistenceStore((state) => state.isSaving);
  const persistenceError = useStudentPersistenceStore(
    (state) => state.persistenceError,
  );

  if (!isSaving && !persistenceError) {
    return null;
  }

  return (
    <View
      accessibilityRole={persistenceError ? "alert" : "none"}
      style={[styles.container, persistenceError && styles.errorContainer]}
    >
      {isSaving && <ActivityIndicator size="small" color="#2563EB" />}
      <Text style={styles.message}>
        {persistenceError ?? "Saving student records..."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingVertical: 8,
  },
  errorContainer: {
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    padding: 12,
  },
  message: {
    color: "#475569",
    flexShrink: 1,
    fontSize: 14,
  },
});
