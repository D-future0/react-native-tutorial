import DatePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { DatePickerFieldProps, NativeDatePickerProps } from "../types/contact";



export default function DatePickerField({
  label,
  value,
  onChange,
  placeholder = "Select a date",
  error,
  options,
}: DatePickerFieldProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleDateValueChange: NonNullable<
    NativeDatePickerProps["onValueChange"]
  > = (_event, date) => {
    if (Platform.OS !== "ios") {
      setShowPicker(false);
    }

    onChange(date);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={error ?? "Opens the date picker"}
        accessibilityState={{ expanded: showPicker }}
        onPress={() => setShowPicker((visible) => !visible)}
        style={[styles.valueButton, error && styles.valueButtonError]}
      >
        <Text style={[styles.value, !value && styles.placeholder]}>
          {value ? value.toLocaleDateString() : placeholder}
        </Text>
      </Pressable>

      {showPicker ? (
        <View>
          {Platform.OS === "ios" ? (
            <DatePicker
              {...options}
              mode="date"
              display="inline"
              value={value ?? new Date()}
              onValueChange={handleDateValueChange}
              onDismiss={() => setShowPicker(false)}
              onNeutralButtonPress={() => setShowPicker(false)}
            />
          ) : (
            <DatePicker
              {...options}
              mode="date"
              display="calendar"
              value={value ?? new Date()}
              onValueChange={handleDateValueChange}
              onDismiss={() => setShowPicker(false)}
              onNeutralButtonPress={() => setShowPicker(false)}
            />
          )}
          {Platform.OS === "ios" ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowPicker(false)}
              style={styles.doneButton}
            >
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  label: {
    color: "#1E293B",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  valueButton: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CBD5E1",
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  valueButtonError: {
    borderColor: "#DC2626",
  },
  value: {
    color: "#0F172A",
    fontSize: 15,
  },
  placeholder: {
    color: "#64748B",
  },
  doneButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  doneText: {
    color: "#2563EB",
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    color: "#DC2626",
    fontSize: 12,
    marginTop: 6,
  },
});
