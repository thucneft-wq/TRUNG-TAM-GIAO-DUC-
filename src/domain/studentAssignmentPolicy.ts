import type { Student } from '../types.ts';

export type StudentWorkflowState =
  | 'IN_COUNSELING'
  | 'WAITING_ASSIGNMENT'
  | 'COMPLETED'
  | 'INACTIVE';

export const hasActiveStudentAssignment = (
  student: Pick<Student, 'assignmentStatus' | 'assignmentEndedAt' | 'assignedCounselorId'>,
): boolean =>
  student.assignmentStatus?.trim().toUpperCase() === 'ACTIVE'
  && !student.assignmentEndedAt
  && Boolean(student.assignedCounselorId);

export const getStudentWorkflowState = (
  student: Pick<Student, 'status' | 'assignmentStatus' | 'assignmentEndedAt' | 'assignedCounselorId'>,
): StudentWorkflowState => {
  if (student.status === 'COMPLETED') return 'COMPLETED';
  if (student.status === 'INACTIVE') return 'INACTIVE';
  return hasActiveStudentAssignment(student) ? 'IN_COUNSELING' : 'WAITING_ASSIGNMENT';
};

export const hasEndedStudentAssignment = (
  student: Pick<Student, 'assignmentStatus' | 'assignmentEndedAt'>,
): boolean =>
  student.assignmentStatus?.trim().toUpperCase() === 'INACTIVE'
  || Boolean(student.assignmentEndedAt);
