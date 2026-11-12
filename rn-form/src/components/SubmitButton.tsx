import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";

type SubmitButtonProps = {
  onPress: () => void;
  isSubmitting: boolean;
  label?: string;
};

export default function SubmitButton({
  onPress,
  isSubmitting,
  label = "Submit form",
}: SubmitButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={isSubmitting}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{
        disabled: isSubmitting,
        busy: isSubmitting,
      }}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        isSubmitting && styles.buttonDisabled,
      ]}
    >
      {isSubmitting ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={styles.buttonText}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#2563EB",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    marginTop: 8,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
