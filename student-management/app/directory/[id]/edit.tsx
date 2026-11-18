import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  useEditRemoteStudent,
  useRemoteStudentDetail,
} from "../../../src/features/directory/queries";

export default function EditRemoteStudentScreen() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const idParam = Array.isArray(id) ? id[0] : id;
  const studentId = Number(idParam);
  const validStudentId = Number.isInteger(studentId) && studentId > 0;
  const {
    data: student,
    isPending,
    isError: isLoadError,
    error: loadError,
    refetch,
  } = useRemoteStudentDetail(validStudentId ? studentId : 0);
  const editMutation = useEditRemoteStudent(studentId);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [university, setUniversity] = useState("");

  useEffect(() => {
    if (!student) return;
    setFirstName(student.firstName);
    setLastName(student.lastName);
    setEmail(student.email);
    setUniversity(student.university ?? "");
  }, [student]);

  const saveChanges = () => {
    const updatedStudent = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      university: university.trim(),
    };

    if (
      !updatedStudent.firstName ||
      !updatedStudent.lastName ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updatedStudent.email)
    ) {
      return;
    }

    editMutation.mutate(updatedStudent, {
      onSuccess: () => {
        router.replace({
          pathname: "/directory/[id]",
          params: { id: String(studentId) },
        });
      },
    });
  };

  if (!validStudentId) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Invalid student ID.</Text>
      </View>
    );
  }

  if (isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading student...</Text>
      </View>
    );
  }

  if (isLoadError || !student) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>
          {loadError instanceof Error
            ? loadError.message
            : "Student not found."}
        </Text>
        {isLoadError && (
          <Pressable style={styles.button} onPress={() => void refetch()}>
            <Text style={styles.buttonText}>Try Again</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        accessibilityLabel="First name"
        placeholder="First name"
        value={firstName}
        onChangeText={setFirstName}
        style={styles.input}
      />
      <TextInput
        accessibilityLabel="Last name"
        placeholder="Last name"
        value={lastName}
        onChangeText={setLastName}
        style={styles.input}
      />
      <TextInput
        accessibilityLabel="Email address"
        placeholder="Email address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        accessibilityLabel="University"
        placeholder="University"
        value={university}
        onChangeText={setUniversity}
        style={styles.input}
      />

      {(!firstName.trim() ||
        !lastName.trim() ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) && (
        <Text style={styles.error}>
          Enter a first name, last name, and valid email address.
        </Text>
      )}

      {editMutation.isError && (
        <Text style={styles.error}>{editMutation.error.message}</Text>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: editMutation.isPending }}
        disabled={editMutation.isPending}
        onPress={saveChanges}
        style={[styles.button, editMutation.isPending && styles.disabled]}
      >
        <Text style={styles.buttonText}>
          {editMutation.isPending ? "Saving..." : "Save Changes"}
        </Text>
      </Pressable>
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    padding: 24,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CBD5E1",
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
  },
  button: {
    backgroundColor: "#2563EB",
    borderRadius: 10,
    padding: 16,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    textAlign: "center",
  },
  disabled: {
    opacity: 0.6,
  },
  error: {
    color: "#DC2626",
  },
});
