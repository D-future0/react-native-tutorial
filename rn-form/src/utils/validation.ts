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
  } else if (!/^0\d{10}$/.test(values.phone.trim())) {
    errors.phone = "Enter an 11-digit Nigerian local number starting with 0";
  }

  if (
    values.parentPhone.trim() &&
    !/^0\d{10}$/.test(values.parentPhone.trim())
  ) {
    errors.parentPhone =
      "Enter an 11-digit Nigerian local number starting with 0";
  }

  if (!values.dateOfBirth.trim()) {
    errors.dateOfBirth = "Date of Birth is required";
  } else {
    const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      values.dateOfBirth.trim(),
    );

    if (!dateMatch) {
      errors.dateOfBirth = "Enter a valid date of birth";
    } else {
      const year = Number(dateMatch[1]);
      const month = Number(dateMatch[2]);
      const day = Number(dateMatch[3]);
      const birthDate = new Date(0);
      birthDate.setFullYear(year, month - 1, day);
      birthDate.setHours(0, 0, 0, 0);

      if (
        birthDate.getFullYear() !== year ||
        birthDate.getMonth() !== month - 1 ||
        birthDate.getDate() !== day
      ) {
        errors.dateOfBirth = "Enter a valid date of birth";
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (birthDate > today) {
          errors.dateOfBirth = "Date of birth cannot be in the future";
        }
      }
    }
  }

  if (!values.address.trim()) {
    errors.address = "address is required";
  } else if (values.address.trim().length < 10) {
    errors.address = "address must contain at least 10 characters";
  }

  return errors;
}