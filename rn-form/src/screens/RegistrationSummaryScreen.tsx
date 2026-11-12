import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import SubmitButton from "../components/SubmitButton";
import classes from "../data/classes";
import type { ContactFormData } from "../types/contact";

type RegistrationSummaryScreenProps = {
  registration: ContactFormData;
  onEdit: () => void;
  onReset: () => void;
};

const SUMMARY_FIELDS: Array<{
  label: string;
  key: keyof ContactFormData;
}> = [
  { label: "Student's full name", key: "fullName" },
  { label: "Email address", key: "email" },
  { label: "Phone number", key: "phone" },
  { label: "Date of birth", key: "dateOfBirth" },
  { label: "Parent's name", key: "parentName" },
  { label: "Parent's phone number", key: "parentPhone" },
  { label: "Address", key: "address" },
];

export default function RegistrationSummaryScreen({
  registration,
  onEdit,
  onReset,
}: RegistrationSummaryScreenProps) {
  const handleStartOver = () => {
    Alert.alert(
      "Start a new registration?",
      "This will clear the current registration details.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Start over", style: "destructive", onPress: onReset },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Registration summary</Text>
        <Text style={styles.subtitle}>
          Review the details you submitted.
        </Text>

        <View style={styles.card}>
          {SUMMARY_FIELDS.map(({ label, key }) => (
            <View key={key} style={styles.row}>
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.value}>{registration[key] || "—"}</Text>
            </View>
          ))}
          <View style={styles.row}>
            <Text style={styles.label}>Class</Text>
            <Text style={styles.value}>
              {classes.find((item) => item.value === registration.class)
                ?.label ||
                registration.class ||
                "—"}
            </Text>
          </View>
        </View>

        <SubmitButton
          label="Start new registration"
          onPress={handleStartOver}
          isSubmitting={false}
        />
        <Pressable
          accessibilityRole="button"
          onPress={onEdit}
          style={styles.editButton}
        >
          <Text style={styles.editButtonText}>Edit registration</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#F8FAFC",
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    color: "#0F172A",
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 8,
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  row: {
    borderBottomColor: "#E2E8F0",
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
  },
  label: {
    color: "#64748B",
    fontSize: 12,
    marginBottom: 4,
  },
  value: {
    color: "#0F172A",
    fontSize: 15,
  },
  editButton: {
    alignItems: "center",
    padding: 16,
  },
  editButtonText: {
    color: "#2563EB",
    fontSize: 15,
    fontWeight: "600",
  },
});
