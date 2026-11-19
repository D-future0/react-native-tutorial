
import type { z } from "zod";
import type {
  RemoteStudent,
  RemoteStudentsResponse,
  NewRemoteStudent,
} from "./types";
import {
  REMOTE_STUDENTS_PAGE_SIZE,
  remoteStudentSchema,
  remoteStudentsResponseSchema,
} from "./types";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://dummyjson.com";

function apiRequest<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<T>;
function apiRequest(
  path: string,
  schema: null,
  init?: RequestInit,
): Promise<void>;
async function apiRequest<T>(
  path: string,
  schema: z.ZodType<T> | null,
  init: RequestInit = {}
): Promise<T | void> {
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

  if (response.status === 204) {
    if (schema) {
      throw new Error("Expected a JSON response but received HTTP 204.");
    }

    return;
  }

  if (schema === null) {
    return;
  }

  const payload: unknown = await response.json();
  return schema.parse(payload);
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
    remoteStudentsResponseSchema,
    { signal }
  );
}

export function fetchStudentById(
  studentId: number,
  signal?: AbortSignal
): Promise<RemoteStudent> {
  return apiRequest<RemoteStudent>(
    `/users/${studentId}?select=id,firstName,lastName,email,university`,
    remoteStudentSchema,
    { signal }
  );
}

export function createRemoteStudent(
  student: NewRemoteStudent
): Promise<RemoteStudent> {
  return apiRequest<RemoteStudent>(
    "/users/add",
    remoteStudentSchema,
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
    remoteStudentSchema,
    {
      method: "PATCH",
      body: JSON.stringify(student),
    }
  );
}

export function deleteRemoteStudent(
  studentId: number
): Promise<void> {
  return apiRequest(
    `/users/${studentId}`,
    null,
    { method: "DELETE" }
  );
}