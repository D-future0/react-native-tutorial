import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import {
  useStudentHydrationStore,
  useStudentStore,
} from "../store/studentStore";

type StudentStoreStatusProps = {
  hasHydrated: boolean;
  hydrationError: string | null;
};

export default function StudentStoreStatus({
  hasHydrated,
  hydrationError,
}: StudentStoreStatusProps) {
  if (hasHydrated && !hydrationError) {
    return null;
  }

  const retryHydration = () => {
    useStudentHydrationStore.setState({
      hasHydrated: false,
      hydrationError: null,
    });
    void useStudentStore.persist.rehydrate();
  };

  return (
    <View style={styles.container}>
      {hydrationError ? (
        <>
          <Text style={styles.message}>{hydrationError}</Text>
          <Pressable onPress={retryHydration} style={styles.button}>
            <Text style={styles.buttonText}>Retry</Text>
          </Pressable>
        </>
      ) : (
        <>
          <ActivityIndicator color="#2563EB" />
          <Text style={styles.message}>Loading students...</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
    backgroundColor: "#F8FAFC",
  },
  message: {
    color: "#475569",
    fontSize: 15,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#2563EB",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
