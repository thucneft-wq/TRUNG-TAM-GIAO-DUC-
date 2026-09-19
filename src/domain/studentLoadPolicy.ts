import type { SheetRecord } from './sheetStudentPolicy';

export type StudentSheetTable =
  | 'students'
  | 'parents'
  | 'student_parents'
  | 'counselors'
  | 'counselor_assignments';

export const STUDENT_COUNSELOR_WARNING =
  'Thông tin phân công tư vấn viên tạm thời chưa tải được. Dữ liệu học sinh và phụ huynh vẫn được giữ nguyên.';

export interface StudentSheetSources {
  students: SheetRecord[];
  parents: SheetRecord[];
  studentParents: SheetRecord[];
  counselors: SheetRecord[];
  assignments: SheetRecord[];
  counselorDataAvailable: boolean;
  counselorWarning: string | null;
}

export const loadStudentSheetSources = async (
  loadTable: (table: StudentSheetTable) => Promise<SheetRecord[]>,
): Promise<StudentSheetSources> => {
  const [[students, parents, studentParents], counselorSources] = await Promise.all([
    Promise.all([
      loadTable('students'),
      loadTable('parents'),
      loadTable('student_parents'),
    ]),
    Promise.allSettled([
      loadTable('counselors'),
      loadTable('counselor_assignments'),
    ]),
  ]);

  const counselors = counselorSources[0].status === 'fulfilled' ? counselorSources[0].value : [];
  const assignments = counselorSources[1].status === 'fulfilled' ? counselorSources[1].value : [];
  const counselorDataAvailable = counselorSources.every((result) => result.status === 'fulfilled');

  return {
    students,
    parents,
    studentParents,
    counselors,
    assignments,
    counselorDataAvailable,
    counselorWarning: counselorDataAvailable ? null : STUDENT_COUNSELOR_WARNING,
  };
};
