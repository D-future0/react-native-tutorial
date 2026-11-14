# rn-form

A React Native and Expo student registration form. It collects student and parent contact details, validates selected fields, and displays a review screen before starting a new registration.

## Requirements

- Node.js and npm
- Expo Go on a device for a quick preview, or an Android/iOS simulator

## Setup

Open a terminal in the `rn-form` directory and install the dependencies:

```bash
npm install
```

Start the Expo development server:

```bash
npm start
```

From the Expo CLI, scan the QR code with Expo Go or select a running simulator. You can also launch a platform directly:

```bash
npm run android
npm run ios
npm run web
```

The iOS command requires macOS and Xcode. The web command starts the Expo web target.

## Features

- **Student registration fields:** student's full name, email, phone number, date of birth, class, parent/guardian name and phone number, and address.
- **Input controls:** text inputs include appropriate keyboard types; the address supports multiline entry and a live character count.
- **Date of birth picker:** uses the native date picker, with a calendar display on Android and inline picker on iOS. The selected date is stored as `YYYY-MM-DD`.
- **Class selection:** offers Class 1, Class 2, and Class 3.
- **Validation:** requires student name, email, phone number, date of birth, and address. Email is checked for a basic email format, the required student phone number must be 11 digits in Nigerian local format starting with `0`, and address must be at least 10 characters. A date of birth cannot be in the future. Errors appear beside the relevant field and clear when that field is edited. Class and parent contact fields are optional; if a parent phone number is entered, it must also use the 11-digit Nigerian local format.
- **Review and edit:** successful submission opens a summary screen. Choose **Edit registration** to return to the populated form.
- **Reset:** **Start new registration** asks for confirmation before clearing the current details.
- **Mobile usability and accessibility:** safe-area layout, scrollable content, keyboard-aware screen behavior, next-field keyboard navigation, and accessibility labels/states on interactive controls.

## Responsive layout and platform decisions

- **Orientation:** the app uses Expo's `default` orientation instead of locking to portrait, so the form can be used in portrait or landscape. iOS tablet support is enabled.
- **Form width:** the registration form fills the available width on smaller screens, keeps 20 px of horizontal padding, and is centered with a maximum width of 640 px on larger screens. This keeps fields usable on phones without letting them become uncomfortably wide on tablets or desktop-sized windows. The form remains a single column so fields stay easy to follow at narrow widths.
- **Keyboard handling:** the form scrolls when space is limited and adjusts for the keyboard using `padding` on iOS and `height` on other platforms.
- **Date picker:** iOS uses an inline calendar with a **Done** button; Android uses the calendar picker and closes it after a date is selected. This follows each platform's native interaction style.

## Submission behavior

Submission currently validates the form, shows a brief loading state, and displays the summary locally. It does not send data to a server or persist it after the app is closed.
