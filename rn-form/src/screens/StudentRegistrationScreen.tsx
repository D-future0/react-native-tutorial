import { useRef, useState } from "react";

import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { TextInputInstance } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import FormField from "../components/FormField";
import DatePickerField from "../components/DatePickerField";
import SelectField from "../components/SelectField";
import SubmitButton from "../components/SubmitButton";
import RegistrationSummaryScreen from "./RegistrationSummaryScreen";
import { validateForm } from "../utils/validation";

import type {
  ContactFormData,
  ContactFormErrors,
} from "../types/contact";
import classes from "../data/classes";

const INITIAL_FORM: ContactFormData = {
  fullName: "",
  email: "",
  phone: "",
  dateOfBirth:"",
  class:"",
  parentName:"",
  parentPhone: "",
  address: "",
};

function parseDateOfBirth(value: string): Date | null {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDateOfBirth(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}



export default function StudentRegistrationScreen() {
  const [form, setForm] = useState<ContactFormData>(INITIAL_FORM);

  const [errors, setErrors] = useState<ContactFormErrors>({});

  const [submitError, setSubmitError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [registrationSummary, setRegistrationSummary] =
    useState<ContactFormData | null>(null);

  const emailRef = useRef<TextInputInstance>(null);
  const phoneRef = useRef<TextInputInstance>(null);
  const parentNameRef = useRef<TextInputInstance>(null);
  const parentPhoneRef = useRef<TextInputInstance>(null);
  const addressRef = useRef<TextInputInstance>(null);

  const updateField = (
    field: keyof ContactFormData,
    value: string
  ) => {
    setSubmitError("");

    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));

  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setSubmitError("");

    const validationErrors = validateForm(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 800);
      });

      setRegistrationSummary({ ...form });
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    setSubmitError("");
    setRegistrationSummary(null);
  };

  if (registrationSummary) {
    return (
      <RegistrationSummaryScreen
        registration={registrationSummary}
        onEdit={() => setRegistrationSummary(null)}
        onReset={handleReset}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Get in touch</Text>

            <Text style={styles.subtitle}>
              Student Registration Form.
            </Text>
          </View>

          <FormField
            label="Student's full name"
            value={form.fullName}
            onChangeText={(value) =>
              updateField("fullName", value)
            }
            placeholder="Enter your full name"
            error={errors.fullName}
            autoCapitalize="words"
            onSubmitEditing={() => emailRef.current?.focus()}
            returnKeyType="next"
          />

          <FormField
            label="Email address"
            value={form.email}
            onChangeText={(value) =>
              updateField("email", value)
            }
            placeholder="example@email.com"
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            inputRef={emailRef}
            onSubmitEditing={() => phoneRef.current?.focus()}
            returnKeyType="next"
          />

          <FormField
            label="Phone number"
            value={String(form.phone)}
            onChangeText={(value) =>
              updateField("phone", value)
            }
            placeholder="Enter your phone number"
            error={errors.phone}
            keyboardType="number-pad"
            inputRef={phoneRef}
            onSubmitEditing={() => parentNameRef.current?.focus()}
            returnKeyType="next"
          />

          <DatePickerField
            label="Date of Birth"
            value={parseDateOfBirth(form.dateOfBirth)}
            onChange={(date) =>
              updateField(
                "dateOfBirth",
                date ? formatDateOfBirth(date) : "",
              )
            }
            placeholder="Select your date of birth"
            error={errors.dateOfBirth}
          />
          <SelectField
            label="Class"
            value={form.class}
            onChange={(value) =>
              updateField("class", value)
            }
            options={classes}
            placeholder="Select your class"
            error={errors.class}
          />
          <FormField
            label="Parent's Name"
            value={form.parentName}
            onChangeText={(value) =>
              updateField("parentName", value)
            }
            placeholder="Enter your parent's name"
            error={errors.parentName}
            inputRef={parentNameRef}
            onSubmitEditing={() => parentPhoneRef.current?.focus()}
            returnKeyType="next"
          />
          <FormField
            label="Parent's Phone Number"
            value={form.parentPhone}
            onChangeText={(value) =>
              updateField("parentPhone", value)
            }
            placeholder="Enter your parent's phone number"
            error={errors.parentPhone}
            keyboardType="number-pad"
            inputRef={parentPhoneRef}
            onSubmitEditing={() => addressRef.current?.focus()}
            returnKeyType="next"
          />
          <FormField
            label="Address"
            value={form.address}
            onChangeText={(value) =>
              updateField("address", value)
            }
            placeholder="Enter your address"
            error={errors.address}
            inputRef={addressRef}
            onSubmitEditing={Keyboard.dismiss}
            returnKeyType="done"
            showCharacterCount
          />

          {submitError ? (
            <Text style={styles.submitError}>{submitError}</Text>
          ) : null}

          <SubmitButton
            onPress={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0F172A",
  },
  subtitle: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 8,
  },
  submitError: {
    color: "#DC2626",
    fontSize: 14,
    marginBottom: 12,
  },
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
    fontWeight: "700",
  },
});