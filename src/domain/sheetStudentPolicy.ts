export type SheetRecord = Record<string, unknown>;

const pickSheetValue = (row: SheetRecord, ...keys: string[]): unknown => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) return row[key];
  }
  return undefined;
};

const sheetText = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

export const normalizedRecordId = (value: unknown): string =>
  sheetText(value).toLocaleLowerCase('en-US');

export const isInactiveSheetValue = (value: unknown): boolean => {
  const status = sheetText(value).toLocaleLowerCase('vi-VN');
  return status === 'inactive'
    || status.includes('ngừng')
    || status.includes('ngung')
    || status.includes('không hoạt động')
    || status.includes('khong hoat dong');
};

export const isSheetTrue = (value: unknown): boolean => {
  if (value === true || value === 1) return true;
  const normalized = sheetText(value).toLocaleLowerCase('en-US');
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
};

interface ParentCandidate {
  link: SheetRecord;
  parent: SheetRecord;
  parentId: string;
  primary: boolean;
}

const parentCandidateOrder = (left: ParentCandidate, right: ParentCandidate): number => {
  if (left.primary !== right.primary) return left.primary ? -1 : 1;

  const leftCreatedAt = Date.parse(sheetText(pickSheetValue(left.link, 'created_at', 'createdAt')));
  const rightCreatedAt = Date.parse(sheetText(pickSheetValue(right.link, 'created_at', 'createdAt')));
  const leftTime = Number.isNaN(leftCreatedAt) ? Number.POSITIVE_INFINITY : leftCreatedAt;
  const rightTime = Number.isNaN(rightCreatedAt) ? Number.POSITIVE_INFINITY : rightCreatedAt;
  if (leftTime !== rightTime) return leftTime - rightTime;

  const leftLinkId = normalizedRecordId(
    pickSheetValue(left.link, 'student_parent_id', 'studentParentId', 'id'),
  );
  const rightLinkId = normalizedRecordId(
    pickSheetValue(right.link, 'student_parent_id', 'studentParentId', 'id'),
  );
  const linkOrder = leftLinkId.localeCompare(rightLinkId, 'en');
  return linkOrder !== 0 ? linkOrder : left.parentId.localeCompare(right.parentId, 'en');
};

export const enrichSheetStudentRows = (
  studentRows: SheetRecord[],
  counselorRows: SheetRecord[],
  assignmentRows: SheetRecord[],
  parentRows: SheetRecord[],
  studentParentRows: SheetRecord[],
): SheetRecord[] => {
  const rowsWithCounselors = enrichSheetStudentCounselors(
    studentRows,
    counselorRows,
    assignmentRows,
  );

  return enrichSheetStudentParents(rowsWithCounselors, parentRows, studentParentRows);
};

export const enrichSheetStudentCounselors = (
  studentRows: SheetRecord[],
  counselorRows: SheetRecord[],
  assignmentRows: SheetRecord[],
): SheetRecord[] => {
  const counselorNames = new Map<string, string>();
  counselorRows.forEach((row) => {
    const id = normalizedRecordId(
      pickSheetValue(row, 'counselor_id', 'external_counselor_id', 'id'),
    );
    if (!id || isInactiveSheetValue(pickSheetValue(row, 'status'))) return;
    const firstName = sheetText(pickSheetValue(row, 'first_name', 'firstName'));
    const lastName = sheetText(pickSheetValue(row, 'last_name', 'lastName'));
    counselorNames.set(
      id,
      sheetText(pickSheetValue(row, 'name', 'full_name')) || `${firstName} ${lastName}`.trim(),
    );
  });

  const assignments = new Map<string, SheetRecord>();
  assignmentRows.forEach((row) => {
    if (isInactiveSheetValue(pickSheetValue(row, 'status', 'assignment_status'))) return;
    if (sheetText(pickSheetValue(row, 'ended_at', 'assignment_ended_at'))) return;
    const studentId = normalizedRecordId(
      pickSheetValue(row, 'student_id', 'external_student_id'),
    );
    if (studentId) assignments.set(studentId, row);
  });

  return studentRows.map((row) => {
    const studentId = normalizedRecordId(
      pickSheetValue(row, 'student_id', 'external_student_id', 'id'),
    );
    const assignment = assignments.get(studentId);
    const counselorId = sheetText(
      pickSheetValue(assignment ?? {}, 'counselor_id', 'external_counselor_id'),
    ) || sheetText(pickSheetValue(row, 'assigned_counselor_id', 'assignedCounselorId'));

    return {
      ...row,
      assigned_counselor_id: counselorId || null,
      assigned_counselor_name: counselorNames.get(normalizedRecordId(counselorId))
        ?? sheetText(pickSheetValue(row, 'assigned_counselor_name', 'assignedCounselorName'))
        ?? null,
      assignment_status: assignment
        ? sheetText(pickSheetValue(assignment, 'status', 'assignment_status')) || 'ACTIVE'
        : pickSheetValue(row, 'assignment_status', 'assignmentStatus') ?? null,
      assignment_ended_at: assignment
        ? pickSheetValue(assignment, 'ended_at', 'assignment_ended_at') ?? null
        : pickSheetValue(row, 'assignment_ended_at', 'assignmentEndedAt') ?? null,
    };
  });
};

export const enrichSheetStudentParents = (
  studentRows: SheetRecord[],
  parentRows: SheetRecord[],
  studentParentRows: SheetRecord[],
): SheetRecord[] => {
  const parents = new Map<string, SheetRecord>();
  parentRows.forEach((row) => {
    const id = normalizedRecordId(pickSheetValue(row, 'parent_id', 'id'));
    if (id && !isInactiveSheetValue(pickSheetValue(row, 'status'))) parents.set(id, row);
  });

  const parentCandidatesByStudent = new Map<string, ParentCandidate[]>();
  studentParentRows.forEach((link) => {
    if (isInactiveSheetValue(pickSheetValue(link, 'status'))) return;
    const studentId = normalizedRecordId(
      pickSheetValue(link, 'student_id', 'external_student_id'),
    );
    const parentId = normalizedRecordId(pickSheetValue(link, 'parent_id'));
    const parent = parents.get(parentId);
    if (!studentId || !parentId || !parent) return;
    const candidates = parentCandidatesByStudent.get(studentId) ?? [];
    candidates.push({
      link,
      parent,
      parentId,
      primary: isSheetTrue(pickSheetValue(link, 'is_primary', 'isPrimary')),
    });
    parentCandidatesByStudent.set(studentId, candidates);
  });

  const selectedParentByStudent = new Map<string, ParentCandidate>();
  parentCandidatesByStudent.forEach((candidates, studentId) => {
    const selected = [...candidates].sort(parentCandidateOrder)[0];
    if (selected) selectedParentByStudent.set(studentId, selected);
  });

  return studentRows.map((row) => {
    const studentId = normalizedRecordId(
      pickSheetValue(row, 'student_id', 'external_student_id', 'id'),
    );
    const selectedParent = selectedParentByStudent.get(studentId);
    const parent = selectedParent?.parent;
    const parentFirstName = sheetText(pickSheetValue(parent ?? {}, 'first_name', 'firstName'));
    const parentLastName = sheetText(pickSheetValue(parent ?? {}, 'last_name', 'lastName'));

    return {
      ...row,
      parent_id: selectedParent ? sheetText(pickSheetValue(parent ?? {}, 'parent_id', 'id')) : null,
      parent_name: selectedParent ? `${parentFirstName} ${parentLastName}`.trim() || null : null,
      parent_relationship: selectedParent
        ? sheetText(pickSheetValue(selectedParent.link, 'relationship')) || null
        : null,
      parent_is_primary: selectedParent?.primary ?? false,
      parent_phone_number: selectedParent
        ? sheetText(pickSheetValue(parent ?? {}, 'phone_number', 'phoneNumber')) || null
        : null,
      parent_email: selectedParent
        ? sheetText(pickSheetValue(parent ?? {}, 'email')) || null
        : null,
    };
  });
};

export interface ActiveStudentSummary {
  total: number;
  thcs: number;
  thpt: number;
}

export const countActiveStudentsByLevel = (
  students: Array<{ status: string; schoolLevel: string | null }>,
): ActiveStudentSummary => {
  const summary: ActiveStudentSummary = { total: 0, thcs: 0, thpt: 0 };
  students.forEach((student) => {
    if (student.status !== 'ACTIVE') return;
    if (student.schoolLevel === 'THCS') summary.thcs += 1;
    if (student.schoolLevel === 'THPT') summary.thpt += 1;
  });
  summary.total = summary.thcs + summary.thpt;
  return summary;
};
