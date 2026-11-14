import type { Ref } from "react";
import type { TextInputInstance, TextInputProps } from "react-native";
import type { ComponentProps } from "react";
import  DatePicker from "@react-native-community/datetimepicker";

export type ContactFormData = {
  fullName: string;
    email: string,
    phone: string,
    dateOfBirth:string,
    class:string,
    parentName:string,
    parentPhone:string,
    address: string,
};

export type ContactFormErrors = Partial<
  Record<keyof ContactFormData, string>
>;

export type FormFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  error?: string;
  multiline?: boolean;
  keyboardType?: TextInputProps["keyboardType"];
  maxLength?: TextInputProps["maxLength"];
  autoCapitalize?: TextInputProps["autoCapitalize"];
  autoCorrect?: boolean;
  inputRef?: Ref<TextInputInstance>;
  onSubmitEditing?: TextInputProps["onSubmitEditing"];
  returnKeyType?: TextInputProps["returnKeyType"];
  showCharacterCount?: boolean;
};

export type NativeDatePickerProps = ComponentProps<typeof DatePicker>;

type DatePickerOptions = {
  minimumDate?: Date;
  maximumDate?: Date;
};

export type DatePickerFieldProps = {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  error?: string;
  options?: DatePickerOptions;
};

type SelectFieldOption = {
  label: string;
  value: string;
};

export type SelectFieldProps = {
  label: string;
  value: string;
  options: readonly SelectFieldOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
};