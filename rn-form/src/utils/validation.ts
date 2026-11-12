import type {
  ContactFormData,
  ContactFormErrors,
} from "../types/contact";

export function validateForm(
  values: ContactFormData
): ContactFormErrors {
  const errors: ContactFormErrors = {};

  if (!values.fullName.trim()) {
    errors.fullName = "Student's full name is required";
  }

  if (!values.email.trim()) {
    errors.email = "Email address is required";
  } else if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())
  ) {
    errors.email = "Enter a valid email address";
  }

  if (!values.phone.trim()) {
    errors.phone = "Phone number is required";
  } else if (!/^\d{10}$/.test(values.phone.trim())) {
    errors.phone = "Enter a valid 10-digit phone number";
  }
  if (!values.dateOfBirth.trim()) {
    errors.dateOfBirth = "Date of Birth is required";
  }
  if (!values.address.trim()) {
    errors.address = "address is required";
  } else if (values.address.trim().length < 10) {
    errors.address = "address must contain at least 10 characters";
  }

  return errors;
}