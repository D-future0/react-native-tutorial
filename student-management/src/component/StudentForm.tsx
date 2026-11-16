import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { Student } from "../types/student";

export type StudentFormValues = Omit<Student, "id">;

type StudentFormProps = {
  initialStudent?: StudentFormValues;
  submitLabel: string;
  onSubmit: (values: StudentFormValues) => void;
};

export default function StudentForm({
  initialStudent,
  submitLabel,
  onSubmit,
}: StudentFormProps) {
  const isSubmittingRef = useRef(false);
  const [fullName, setFullName] = useState(initialStudent?.fullName ?? "");
  const [email, setEmail] = useState(initialStudent?.email ?? "");
  const [className, setClassName] = useState(initialStudent?.className ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFullName(initialStudent?.fullName ?? "");
    setEmail(initialStudent?.email ?? "");
    setClassName(initialStudent?.className ?? "");
  }, [initialStudent]);

  const handleSubmit = () => {
    if (isSubmittingRef.current) {
      return;
    }

    const values = {
      fullName: fullName.trim(),
      email: email.trim(),
      className: className.trim(),
    };

    if (!values.fullName || !values.email || !values.className) {
      Alert.alert("Validation", "Please complete all fields.");
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      onSubmit(values);
    } catch (error) {
      console.error("Failed to save student:", error);
      Alert.alert("Save failed", "The student could not be saved. Please try again.");
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        accessibilityLabel="Full name"
        placeholder="Full name"
        value={fullName}
        onChangeText={setFullName}
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
        accessibilityLabel="Class"
        placeholder="Class"
        value={className}
        onChangeText={setClassName}
        style={styles.input}
      />
      <Pressable
        accessibilityState={{ disabled: isSubmitting }}
        disabled={isSubmitting}
        onPress={handleSubmit}
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
      >
        <Text style={styles.buttonText}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
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
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    textAlign: "center",
  },
});
