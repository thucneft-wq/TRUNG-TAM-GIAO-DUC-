import type { SheetRecord } from './sheetStudentPolicy';

export type StudentSheetTable =
  | 'students'
  | 'parents'
  | 'student_parents'
  | 'counselors'
  | 'counselor_assignments'
  | 'counselor_assignment_records';

export const STUDENT_COUNSELOR_WARNING =
  'Thông tin phân công tư vấn viên tạm thời chưa tải được. Dữ liệu học sinh và phụ huynh vẫn được giữ nguyên.';

export interface StudentSheetSources {
  students: SheetRecord[];
  parents: SheetRecord[];
  studentParents: SheetRecord[];
  counselors: SheetRecord[];
  assignments: SheetRecord[];
  assignmentRecords: SheetRecord[];
  counselorDataAvailable: boolean;
  counselorWarning: string | null;
}

export interface StudentParentSheetSources {
  parents: SheetRecord[];
  studentParents: SheetRecord[];
}

export interface StudentCounselorSheetSources {
  counselors: SheetRecord[];
  assignments: SheetRecord[];
  assignmentRecords: SheetRecord[];
  counselorDataAvailable: boolean;
  counselorWarning: string | null;
}

export const loadStudentRows = (
  loadTable: (table: StudentSheetTable) => Promise<SheetRecord[]>,
): Promise<SheetRecord[]> => loadTable('students');

export const loadStudentParentSources = async (
  loadTable: (table: StudentSheetTable) => Promise<SheetRecord[]>,
): Promise<StudentParentSheetSources> => {
  const [parents, studentParents] = await Promise.all([
    loadTable('parents'),
    loadTable('student_parents'),
  ]);
  return { parents, studentParents };
};

export const loadStudentCounselorSources = async (
  loadTable: (table: StudentSheetTable) => Promise<SheetRecord[]>,
): Promise<StudentCounselorSheetSources> => {
  const counselorSources = await Promise.allSettled([
    loadTable('counselors'),
    loadTable('counselor_assignments'),
    loadTable('counselor_assignment_records'),
  ]);
  const counselors = counselorSources[0].status === 'fulfilled' ? counselorSources[0].value : [];
  const assignments = counselorSources[1].status === 'fulfilled' ? counselorSources[1].value : [];
  const assignmentRecords = counselorSources[2].status === 'fulfilled'
    ? counselorSources[2].value
    : [];
  const counselorDataAvailable = counselorSources.every((result) => result.status === 'fulfilled');
  return {
    counselors,
    assignments,
    assignmentRecords,
    counselorDataAvailable,
    counselorWarning: counselorDataAvailable ? null : STUDENT_COUNSELOR_WARNING,
  };
};

export const loadStudentSheetSources = async (
  loadTable: (table: StudentSheetTable) => Promise<SheetRecord[]>,
): Promise<StudentSheetSources> => {
  const students = await loadStudentRows(loadTable);
  const [parentSources, counselorSources] = await Promise.all([
    loadStudentParentSources(loadTable),
    loadStudentCounselorSources(loadTable),
  ]);

  return {
    students,
    parents: parentSources.parents,
    studentParents: parentSources.studentParents,
    ...counselorSources,
  };
};
