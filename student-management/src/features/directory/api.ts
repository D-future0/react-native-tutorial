
import type {
  RemoteStudent,
  RemoteStudentsResponse,
  NewRemoteStudent,
} from "./types";
import { REMOTE_STUDENTS_PAGE_SIZE } from "./types";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://dummyjson.com";

async function apiRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.body
          ? { "Content-Type": "application/json" }
          : {}),
        ...init.headers as Record<string, string>,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Request failed: ${response.status} ${response.statusText}`
    );
  }

  return (await response.json()) as T;
}

export function fetchRemoteStudents(
  signal?: AbortSignal,
  searchTerm = "",
  skip = 0,
): Promise<RemoteStudentsResponse> {
  const parameters =
    `limit=${REMOTE_STUDENTS_PAGE_SIZE}&skip=${skip}` +
    "&select=id,firstName,lastName,email,university";
  const query = searchTerm
    ? `/users/search?q=${encodeURIComponent(searchTerm)}&${parameters}`
    : `/users?${parameters}`;

  return apiRequest<RemoteStudentsResponse>(
    query,
    { signal }
  );
}

export function fetchStudentById(
  studentId: number,
  signal?: AbortSignal
): Promise<RemoteStudent> {
  return apiRequest<RemoteStudent>(
    `/users/${studentId}?select=id,firstName,lastName,email,university`,
    { signal }
  );
}

export function createRemoteStudent(
  student: NewRemoteStudent
): Promise<RemoteStudent> {
  return apiRequest<RemoteStudent>(
    "/users/add",
    {
      method: "POST",
      body: JSON.stringify(student),
    }
  );
}

export function editRemoteStudent(
  studentId: number,
  student: Partial<NewRemoteStudent>
): Promise<RemoteStudent> {
  return apiRequest<RemoteStudent>(
    `/users/${studentId}`,
    {
      method: "PUT",
      body: JSON.stringify(student),
    }
  );
}

export function deleteRemoteStudent(
  studentId: number
): Promise<void> {
  return apiRequest<void>(
    `/users/${studentId}`,
    { method: "DELETE" }
  );
}