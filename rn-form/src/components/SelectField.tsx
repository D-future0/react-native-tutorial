import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { SelectFieldProps } from "../types/contact";


export default function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = "Select an option",
  error,
}: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityHint={error ?? "Opens the options list"}
          accessibilityState={{ expanded: isOpen }}
          onPress={() => setIsOpen((open) => !open)}
          style={[styles.selectButton, error && styles.selectButtonError]}
        >
          <Text style={[styles.value, !selectedOption && styles.placeholder]}>
            {selectedOption?.label ?? placeholder}
          </Text>
          <Text style={styles.chevron}>{isOpen ? "^" : "v"}</Text>
        </Pressable>

        {isOpen ? (
          <View style={styles.optionsList}>
            {options.length > 0 ? (
              options.map((option) => (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: option.value === value }}
                  onPress={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  style={[
                    styles.option,
                    option.value === value && styles.selectedOption,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      option.value === value && styles.selectedOptionText,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))
            ) : (
              <Text style={styles.emptyMessage}>No options available</Text>
            )}
          </View>
        ) : null}
      </View>

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
  selectButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#CBD5E1",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  selectButtonError: {
    borderColor: "#DC2626",
  },
  value: {
    color: "#0F172A",
    fontSize: 15,
  },
  placeholder: {
    color: "#64748B",
  },
  chevron: {
    color: "#64748B",
    fontSize: 14,
  },
  optionsList: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CBD5E1",
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
    overflow: "hidden",
  },
  option: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  selectedOption: {
    backgroundColor: "#EFF6FF",
  },
  optionText: {
    color: "#0F172A",
    fontSize: 15,
  },
  selectedOptionText: {
    color: "#2563EB",
    fontWeight: "600",
  },
  emptyMessage: {
    color: "#64748B",
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  error: {
    color: "#DC2626",
    fontSize: 12,
    marginTop: 6,
  },
});
