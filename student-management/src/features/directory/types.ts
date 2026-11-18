
export const REMOTE_STUDENTS_PAGE_SIZE = 10;

export interface RemoteStudent {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  university?: string;
}

export interface RemoteStudentsResponse {
  users: RemoteStudent[];
  total: number;
  skip: number;
  limit: number;
}

export type NewRemoteStudent = Pick<
  RemoteStudent,
  "firstName" | "lastName" | "email" | "university"
>;