
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import initialStudents from "../data/students";
import type { Student } from "../types/student";

type NewStudent = Omit<Student, "id">;

interface StudentState {
  students: Student[];

  addStudent: (student: NewStudent) => void;
  updateStudent: (
    id: string,
    updates: Partial<NewStudent>
  ) => void;
  deleteStudent: (id: string) => void;
}

type StudentHydrationState = {
  hasHydrated: boolean;
  hydrationError: string | null;
};

export const useStudentHydrationStore = create<StudentHydrationState>()(() => ({
  hasHydrated: false,
  hydrationError: null,
}));

export const useStudentStore = create<StudentState>()(
  persist<StudentState, [], [], Pick<StudentState, "students">>(
    (set) => ({
      students: initialStudents,

      addStudent: (student) =>
        set((state) => ({
          students: [
            ...state.students,
            {
              ...student,
              id: `STU-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 7)}`,
            },
          ],
        })),

      updateStudent: (id, updates) =>
        set((state) => ({
          students: state.students.map((student) =>
            student.id === id
              ? { ...student, ...updates }
              : student
          ),
        })),

      deleteStudent: (id) =>
        set((state) => ({
          students: state.students.filter(
            (student) => student.id !== id
          ),
        })),
    }),
    {
      name: "student-management-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ students: state.students }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error("Failed to load saved students:", error);
          useStudentHydrationStore.setState({
            hasHydrated: true,
            hydrationError: "Saved student data could not be loaded.",
          });
          return;
        }

        useStudentHydrationStore.setState({
          hasHydrated: true,
          hydrationError: null,
        });
      },
    }
  )
);