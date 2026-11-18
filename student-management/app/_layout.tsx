import { useEffect } from "react";
import { Stack } from "expo-router";
import { hydrateStudentStore } from "../src/store/studentStore";
import QueryProvider from "../src/providers/QueryProvider";

export default function RootLayout() {
  useEffect(() => {
    void hydrateStudentStore();
  }, []);

  return (
    <QueryProvider>
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="students/[id]"
        options={{ headerBackTitle: "Students" }}
      />
      {/* <Stack.Screen
        name="students/[id]/edit"
        options={{ headerBackTitle: "Student details" }}
      /> */}
      <Stack.Screen
        name="students/new"
        options={{ headerBackTitle: "Students" }}
      />
      <Stack.Screen
        name="directory/[id]"
        options={{ title: "Remote Student Details" }}
      />
      <Stack.Screen
        name="directory/[id]/edit"
        options={{ title: "Edit Remote Student" }}
      />
    </Stack>
    </QueryProvider>
  );
}
