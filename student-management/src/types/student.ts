export type Student = {
  id: string;
  fullName: string;
  email: string;
  className: string;
};

export interface StudentCardProps {
  student: Student;
}