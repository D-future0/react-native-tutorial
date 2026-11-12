import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { FormFieldProps } from "../types/contact";

export default function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  multiline = false,
  keyboardType = "default",
  autoCapitalize = "sentences",
  autoCorrect = true,
  inputRef,
  onSubmitEditing,
  returnKeyType,
  showCharacterCount = false,
}: FormFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        ref={inputRef}
        style={[
          styles.input,
          multiline && styles.multiline,
          error && styles.inputError,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        multiline={multiline}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
        textAlignVertical={multiline ? "top" : "center"}
        accessibilityLabel={label}
        accessibilityHint={error ? `Error: ${error}` : undefined}
      />

      {showCharacterCount ? (
        <Text style={styles.characterCount} accessibilityLiveRegion="polite">
          {value.length} characters
        </Text>
      ) : null}

      {error ? (
        <Text
          style={styles.error}
          accessibilityLiveRegion="polite"
        >
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
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    backgroundColor: "#FFFFFF",
    color: "#0F172A",
  },
  multiline: {
    minHeight: 110,
    paddingTop: 14,
  },
  characterCount: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 6,
    textAlign: "right",
  },
  inputError: {
    borderColor: "#DC2626",
  },
  error: {
    color: "#DC2626",
    fontSize: 12,
    marginTop: 6,
  },
});