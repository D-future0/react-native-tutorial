
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  fetchStudentById,
  fetchRemoteStudents,
  createRemoteStudent,
  editRemoteStudent,
  deleteRemoteStudent,
} from "./api";

import type {
  NewRemoteStudent,
  RemoteStudent,
  RemoteStudentsResponse,
} from "./types";
import { REMOTE_STUDENTS_PAGE_SIZE } from "./types";

export const directoryKeys = {
  all: ["directory"] as const,

  studentLists: () =>
    [...directoryKeys.all, "students"] as const,

  students: (searchTerm = "", page = 1) =>
    [...directoryKeys.studentLists(), searchTerm, page] as const,

  student: (studentId: number) =>
    [...directoryKeys.all, "student", studentId] as const,
};

export function useRemoteStudents(searchTerm = "", page = 1) {
  const normalizedSearchTerm = searchTerm.trim();

  return useQuery({
    queryKey: directoryKeys.students(normalizedSearchTerm, page),

    queryFn: ({ signal }) =>
      fetchRemoteStudents(
        signal,
        normalizedSearchTerm,
        (page - 1) * REMOTE_STUDENTS_PAGE_SIZE
      ),

    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[2] === normalizedSearchTerm
        ? previousData
        : undefined,
    staleTime: 60 * 1000,
  });
}
export function useRemoteStudentDetail(studentId: number) {
  return useQuery({
    queryKey: directoryKeys.student(studentId),
    queryFn: ({ signal }) =>
      fetchStudentById(studentId, signal),
    enabled: Number.isInteger(studentId) && studentId > 0,
  });
}

export function useCreateRemoteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (student: NewRemoteStudent) =>
      createRemoteStudent(student),

    onSuccess: (createdStudent) => {
      queryClient
        .getQueryCache()
        .findAll({ queryKey: directoryKeys.studentLists() })
        .forEach(({ queryKey }) => {
          const searchTerm = getSearchTerm(queryKey);
          const page = getPage(queryKey);

          queryClient.setQueryData<RemoteStudentsResponse>(
            queryKey,
            (current) => {
              if (!current || !matchesStudentSearch(createdStudent, searchTerm)) {
                return current;
              }

              const alreadyListed = current.users.some(
                (user) => user.id === createdStudent.id
              );
              const users = current.users.filter(
                (user) => user.id !== createdStudent.id
              );
              if (page === 1) {
                users.unshift(createdStudent);
                users.splice(current.limit);
              }

              return {
                ...current,
                users,
                total: current.total + Number(!alreadyListed),
              };
            }
          );
        });
    },
  });
}

export function useEditRemoteStudent(studentId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updatedStudent: Partial<NewRemoteStudent>) =>
      editRemoteStudent(studentId, updatedStudent),
    onSuccess: (editedStudent) => {
      const previousStudent = queryClient.getQueryData<RemoteStudent>(
        directoryKeys.student(studentId)
      );
      queryClient.setQueryData(
        directoryKeys.student(studentId),
        editedStudent
      );

      queryClient
        .getQueryCache()
        .findAll({ queryKey: directoryKeys.studentLists() })
        .forEach(({ queryKey }) => {
          const searchTerm = getSearchTerm(queryKey);
          const page = getPage(queryKey);

          queryClient.setQueryData<RemoteStudentsResponse>(
            queryKey,
            (current) => {
              if (!current) return current;

              const previousIndex = current.users.findIndex(
                (user) => user.id === editedStudent.id
              );
              const cachedPreviousStudent =
                previousIndex >= 0
                  ? current.users[previousIndex]
                  : previousStudent;
              const wasInResults =
                cachedPreviousStudent !== undefined &&
                matchesStudentSearch(cachedPreviousStudent, searchTerm);
              const matchesSearch = matchesStudentSearch(
                editedStudent,
                searchTerm
              );
              const users = current.users.filter(
                (user) => user.id !== editedStudent.id
              );

              if (matchesSearch) {
                if (previousIndex >= 0) {
                  users.splice(
                    Math.min(previousIndex, users.length),
                    0,
                    editedStudent
                  );
                } else if (page === 1) {
                  users.unshift(editedStudent);
                  users.splice(current.limit);
                }
              }

              return {
                ...current,
                users,
                total:
                  current.total +
                  Number(matchesSearch) -
                  Number(wasInResults),
              };
            }
          );
        });
    },
  });
}

export function useDeleteRemoteStudent(student: RemoteStudent) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteRemoteStudent(student.id),
    onSuccess: () => {
      queryClient
        .getQueryCache()
        .findAll({ queryKey: directoryKeys.studentLists() })
        .forEach(({ queryKey }) => {
          const searchTerm = getSearchTerm(queryKey);

          queryClient.setQueryData<RemoteStudentsResponse>(
            queryKey,
            (current) => {
              if (!current) return current;
              const users = current.users.filter(
                (user) => user.id !== student.id
              );

              return {
                ...current,
                users,
                total: Math.max(
                  0,
                  current.total -
                    Number(matchesStudentSearch(student, searchTerm))
                ),
              };
            }
          );
        });
      queryClient.removeQueries({
        queryKey: directoryKeys.student(student.id),
      });
    },
  });
}

function getSearchTerm(queryKey: readonly unknown[]) {
  const searchTerm = queryKey[2];
  return typeof searchTerm === "string" ? searchTerm.toLowerCase() : "";
}

function getPage(queryKey: readonly unknown[]) {
  const page = queryKey[3];
  return typeof page === "number" ? page : 1;
}

function matchesStudentSearch(student: RemoteStudent, searchTerm: string) {
  if (!searchTerm) return true;

  return [
    student.firstName,
    student.lastName,
    student.email,
    student.university,
  ]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(searchTerm));
}
