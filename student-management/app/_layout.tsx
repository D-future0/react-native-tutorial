import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="students/[id]"
        options={{ headerBackTitle: "Students" }}
      />
      <Stack.Screen
        name="students/[id]/edit"
        options={{ headerBackTitle: "Student details" }}
      />
      <Stack.Screen
        name="students/new"
        options={{ headerBackTitle: "Students" }}
      />
    </Stack>
  );
}
