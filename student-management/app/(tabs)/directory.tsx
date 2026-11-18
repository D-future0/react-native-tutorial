
import {
  Alert,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useEffect, useRef, useState } from "react";

import {
  useRemoteStudents,
  useCreateRemoteStudent,
  useDeleteRemoteStudent,
} from "../../src/features/directory/queries";
import { Link } from "expo-router";
import {
  REMOTE_STUDENTS_PAGE_SIZE,
  type RemoteStudent,
} from "../../src/features/directory/types";

export default function DirectoryScreen() {
  const listRef = useRef<FlatList<RemoteStudent>>(null);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchTerm(searchText.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchText]);

  const {
    data,
    error,
    isPending,
    isError,
    isFetching,
    isPlaceholderData,
    isRefetching,
    refetch,
  } = useRemoteStudents(debouncedSearchTerm, page);
  const pageSize = data?.limit ?? REMOTE_STUDENTS_PAGE_SIZE;
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const firstItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, total);

  useEffect(() => {
    if (data && page > pageCount) {
      setPage(pageCount);
    }
  }, [data, page, pageCount]);

  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [page, debouncedSearchTerm]);

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
        ref={listRef}
        data={data?.users ?? []}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
          />
        }
        renderItem={({ item }) => (
          <RemoteStudentCard student={item} />
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

      <View style={styles.pagination}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous page"
          accessibilityState={{ disabled: page <= 1 || isFetching }}
          disabled={page <= 1 || isFetching}
          onPress={() => setPage((currentPage) => currentPage - 1)}
          style={[
            styles.pageButton,
            (page <= 1 || isFetching) && styles.disabled,
          ]}
        >
          <Text style={styles.buttonText}>Previous</Text>
        </Pressable>

        <Text style={styles.pageText}>
          {isPlaceholderData
            ? "Loading page..."
            : total === 0
            ? "No students"
            : `${firstItem}-${lastItem} of ${total}`}
          {"\n"}Page {page} of {pageCount}
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next page"
          accessibilityState={{ disabled: page >= pageCount || isFetching }}
          disabled={page >= pageCount || isFetching}
          onPress={() => setPage((currentPage) => currentPage + 1)}
          style={[
            styles.pageButton,
            (page >= pageCount || isFetching) && styles.disabled,
          ]}
        >
          <Text style={styles.buttonText}>Next</Text>
        </Pressable>
      </View>
    </View>
  );
}

function RemoteStudentCard({ student }: { student: RemoteStudent }) {
  const deleteMutation = useDeleteRemoteStudent(student);

  const confirmDelete = () => {
    Alert.alert(
      "Delete student",
      `Are you sure you want to delete ${student.firstName} ${student.lastName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate(),
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <Text style={styles.name}>
        {student.firstName} {student.lastName}
      </Text>

      <Text style={styles.email}>{student.email}</Text>

      <Text style={styles.university}>
        {student.university ?? "Institution unavailable"}
      </Text>

      {deleteMutation.isError && (
        <Text style={styles.error}>
          {deleteMutation.error.message}
        </Text>
      )}

      <View style={styles.actions}>
        <Link
          href={{
            pathname: "/directory/[id]",
            params: { id: String(student.id) },
          }}
          asChild
        >
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>View Details</Text>
          </Pressable>
        </Link>

        <Link
          href={{
            pathname: "/directory/[id]/edit",
            params: { id: String(student.id) },
          }}
          asChild
        >
          <Pressable style={styles.editButton}>
            <Text style={styles.buttonText}>Edit</Text>
          </Pressable>
        </Link>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete ${student.firstName} ${student.lastName}`}
          accessibilityState={{ disabled: deleteMutation.isPending }}
          disabled={deleteMutation.isPending}
          onPress={confirmDelete}
          style={[
            styles.deleteButton,
            deleteMutation.isPending && styles.disabled,
          ]}
        >
          <Text style={styles.buttonText}>
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Text>
        </Pressable>
      </View>
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
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  editButton: {
    backgroundColor: "#475569",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 16,
  },
  deleteButton: {
    backgroundColor: "#DC2626",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 16,
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
  pagination: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
  },
  pageButton: {
    backgroundColor: "#2563EB",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pageText: {
    color: "#475569",
    textAlign: "center",
  },
});