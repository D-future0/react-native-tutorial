import { z } from "zod";

export const studentFormSchema = z.object({
  fullName: z.string().trim().min(1, "Enter a student name."),
  email: z.string().trim().email("Enter a valid email address."),
  className: z.string().trim().min(1, "Enter a class."),
});

export const studentSchema = studentFormSchema.extend({
  id: z.string().min(1),
});

export const studentsSchema = z.array(studentSchema);

export const persistedStudentsSchema = z.union([
  studentsSchema,
  z.object({
    state: z.object({
      students: studentsSchema,
    }),
  }),
]);

export type StudentFormValues = z.infer<typeof studentFormSchema>;
export type Student = z.infer<typeof studentSchema>;
