import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { create } from "zustand";
import initialStudents from "../data/students";
import {
  persistedStudentsSchema,
  type Student,
  type StudentFormValues,
} from "../schemas/student";

const STORAGE_KEY = "student-management-storage";

interface StudentState {
  students: Student[];
  addStudent: (student: StudentFormValues) => Promise<void>;
  updateStudent: (
    id: string,
    updates: Partial<StudentFormValues>,
  ) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
}

type StudentHydrationState = {
  hasHydrated: boolean;
  hydrationError: string | null;
};

type StudentPersistenceState = {
  isSaving: boolean;
  persistenceError: string | null;
};

export const useStudentHydrationStore = create<StudentHydrationState>()(() => ({
  hasHydrated: false,
  hydrationError: null,
}));

export const useStudentPersistenceStore =
  create<StudentPersistenceState>()(() => ({
    isSaving: false,
    persistenceError: null,
  }));

export const useStudentStore = create<StudentState>()(() => ({
  students: [...initialStudents],

  addStudent: (student) =>
    commitStudents((currentStudents) => [
      ...currentStudents,
      { ...student, id: Crypto.randomUUID() },
    ]),

  updateStudent: (id, updates) =>
    commitStudents((currentStudents) =>
      currentStudents.map((student) =>
        student.id === id ? { ...student, ...updates } : student,
      ),
    ),

  deleteStudent: (id) =>
    commitStudents((currentStudents) =>
      currentStudents.filter((student) => student.id !== id),
    ),
}));

let writeQueue: Promise<void> = Promise.resolve();
let hydrationPromise: Promise<void> | null = null;

function commitStudents(
  update: (students: Student[]) => Student[],
): Promise<void> {
  const operation = writeQueue.then(async () => {
    const nextStudents = update(useStudentStore.getState().students);
    const persistenceStore = useStudentPersistenceStore;
    persistenceStore.setState({
      isSaving: true,
      persistenceError: null,
    });

    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ state: { students: nextStudents }, version: 0 }),
      );
    } catch (error) {
      console.error("Failed to save student records:", error);
      persistenceStore.setState({
        isSaving: false,
        persistenceError: "Student changes could not be saved.",
      });
      throw error;
    }

    useStudentStore.setState({ students: nextStudents });
    persistenceStore.setState({
      isSaving: false,
      persistenceError: null,
    });
  });

  writeQueue = operation.then(
    () => undefined,
    () => undefined,
  );
  return operation;
}

export function hydrateStudentStore(): Promise<void> {
  if (hydrationPromise) {
    return hydrationPromise;
  }

  useStudentHydrationStore.setState({
    hasHydrated: false,
    hydrationError: null,
  });

  hydrationPromise = (async () => {
    try {
      const savedValue = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedValue !== null) {
        const parsedValue: unknown = JSON.parse(savedValue);
        const validatedValue = persistedStudentsSchema.parse(parsedValue);
        const students = Array.isArray(validatedValue)
          ? validatedValue
          : validatedValue.state.students;
        useStudentStore.setState({ students });
      }

      useStudentHydrationStore.setState({
        hasHydrated: true,
        hydrationError: null,
      });
    } catch (error) {
      console.error("Failed to load saved student records:", error);
      useStudentHydrationStore.setState({
        hasHydrated: true,
        hydrationError: "Saved student data could not be loaded.",
      });
    } finally {
      hydrationPromise = null;
    }
  })();

  return hydrationPromise;
}
