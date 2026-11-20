
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useEffect, useState } from "react";

import {
  useRemoteStudents,
  useCreateRemoteStudent,
} from "../../src/features/directory/queries";
import { Link } from "expo-router";

export default function DirectoryScreen() {
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchTerm(searchText.trim());
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchText]);

  const {
    data,
    error,
    isPending,
    isError,
    isRefetching,
    refetch,
  } = useRemoteStudents(debouncedSearchTerm);

  const createMutation = useCreateRemoteStudent();

  const handleCreateDemo = () => {
    createMutation.mutate({
      firstName: "Training",
      lastName: "Student",
      email: `training.${Date.now()}@example.com`,
      university: "Training Campus",
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Remote Student Directory</Text>

      <Text style={styles.subtitle}>
        Records retrieved from the backend API.
      </Text>

      <TextInput
        accessibilityLabel="Search students"
        placeholder="Search students..."
        value={searchText}
        onChangeText={setSearchText}
        autoCapitalize="none"
        returnKeyType="search"
        style={styles.searchInput}
      />

      <Pressable
        style={[
          styles.button,
          createMutation.isPending && styles.disabled,
        ]}
        disabled={createMutation.isPending}
        onPress={handleCreateDemo}
      >
        <Text style={styles.buttonText}>
          {createMutation.isPending
            ? "Creating..."
            : "Add Demo Student"}
        </Text>
      </Pressable>

      {createMutation.isError && (
        <Text style={styles.error}>
          {createMutation.error.message}
        </Text>
      )}

      {createMutation.isSuccess && (
        <Text style={styles.success}>
          Demo record added to the current query cache.
        </Text>
      )}

      <FlatList
        data={data?.users ?? []}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>
              {item.firstName} {item.lastName}
            </Text>

            <Text style={styles.email}>
              {item.email}
            </Text>

            <Text style={styles.university}>
              {item.university ?? "Institution unavailable"}
            </Text>

            <Link
              href={{
                pathname: "/directory/[id]",
                params: { id: String(item.id) },
              }}
              asChild
            >
              <Pressable style={styles.button}>
                <Text style={styles.buttonText}>View Details</Text>
              </Pressable>
            </Link>
          </View>
        )}
        ListEmptyComponent={
          isPending ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" />
              <Text>Loading remote students...</Text>
            </View>
          ) : isError ? (
            <View style={styles.center}>
              <Text style={styles.error}>
                {error instanceof Error
                  ? error.message
                  : "Something went wrong."}
              </Text>
              <Pressable
                style={styles.button}
                onPress={() => void refetch()}
              >
                <Text style={styles.buttonText}>Try Again</Text>
              </Pressable>
            </View>
          ) : (
            <Text>No remote students found.</Text>
          )
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 20,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E293B",
  },
  subtitle: {
    color: "#64748B",
    marginTop: 6,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CBD5E1",
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  button: {
    backgroundColor: "#2563EB",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 16,
  },
  disabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 6,
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1E293B",
  },
  email: {
    color: "#475569",
  },
  university: {
    color: "#2563EB",
    fontSize: 13,
  },
  error: {
    color: "#DC2626",
    textAlign: "center",
  },
  success: {
    color: "#15803D",
    marginBottom: 12,
  },
  list: {
    gap: 12,
    paddingBottom: 24,
  },
});