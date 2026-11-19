
import { z } from "zod";

export const REMOTE_STUDENTS_PAGE_SIZE = 10;

export const remoteStudentSchema = z.object({
  id: z.number().int().positive(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  university: z.string().optional(),
});

export const remoteStudentsResponseSchema = z.object({
  users: z.array(remoteStudentSchema),
  total: z.number().int().nonnegative(),
  skip: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
});

export type RemoteStudent = z.infer<typeof remoteStudentSchema>;
export type RemoteStudentsResponse = z.infer<
  typeof remoteStudentsResponseSchema
>;

export type NewRemoteStudent = Pick<
  RemoteStudent,
  "firstName" | "lastName" | "email" | "university"
>;