import type { TimeRange } from '../types';

export type SheetRecord = Record<string, unknown>;

export type BookingStatus =
  | 'completed'
  | 'pending'
  | 'confirmed'
  | 'scheduled'
  | 'cancelled';

export type BookingStatusBreakdown = Record<BookingStatus, number>;

export interface BookingTimelinePoint extends BookingStatusBreakdown {
  label: string;
}

export interface SheetOperationsSummary {
  totalBookings: number;
  bookingsBreakdown: BookingStatusBreakdown;
  bookingTimeline: BookingTimelinePoint[];
  bookingGrowthPercent: number | null;
  activeTests: number;
  totalTestAttempts: number;
  rawRowCounts: {
    bookings: number;
    tests: number;
    testAttempts: number;
  };
  countedIds: {
    bookings: string[];
    activeTests: string[];
    testAttempts: string[];
  };
}

const TIME_ZONE = 'Asia/Ho_Chi_Minh';
const BOOKING_STATUSES: BookingStatus[] = [
  'completed',
  'pending',
  'confirmed',
  'scheduled',
  'cancelled',
];

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

const normalizedId = (value: unknown): string => sheetText(value).toLocaleLowerCase('en-US');

const parseGoogleSerialDate = (value: number): Date | null => {
  if (!Number.isFinite(value) || value <= 0 || value >= 100_000) return null;
  const milliseconds = Math.round((value - 25569) * 86_400_000);
  const date = new Date(milliseconds);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseSheetDate = (value: unknown): Date | null => {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    return parseGoogleSerialDate(value) ?? new Date(value);
  }

  const text = sheetText(value);
  if (!text) return null;
  if (/^\d+(?:\.\d+)?$/.test(text)) {
    const numeric = Number(text);
    const serialDate = parseGoogleSerialDate(numeric);
    if (serialDate) return serialDate;
  }

  // Sheet values without an explicit offset represent local Vietnamese time.
  const localMatch = text.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):?(\d{2})?:?(\d{2})?)?$/,
  );
  if (localMatch) {
    const [, year, month, day, hour = '0', minute = '0', second = '0'] = localMatch;
    const date = new Date(Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour) - 7,
      Number(minute),
      Number(second),
    ));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
};

const zonedParts = (date: Date): { year: number; month: number; day: number } => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const read = (type: 'year' | 'month' | 'day') =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { year: read('year'), month: read('month'), day: read('day') };
};

const shiftMonth = (
  value: { year: number; month: number },
  offset: number,
): { year: number; month: number } => {
  const shifted = new Date(Date.UTC(value.year, value.month - 1 + offset, 1));
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1 };
};

const periodMonth = (
  range: Exclude<TimeRange, 'all-time'>,
  now: Date,
): { year: number; month: number } => {
  const current = zonedParts(now);
  return shiftMonth(current, range === 'this-month' ? 0 : -1);
};

const isInRange = (date: Date | null, range: TimeRange, now: Date): boolean => {
  if (!date) return false;
  if (range === 'all-time') return true;
  const target = periodMonth(range, now);
  const value = zonedParts(date);
  return value.year === target.year && value.month === target.month;
};

const recordFreshness = (row: SheetRecord, index: number): number => {
  const updated = parseSheetDate(pickSheetValue(row, 'updated_at', 'updatedAt'));
  const created = parseSheetDate(pickSheetValue(row, 'created_at', 'createdAt'));
  return updated?.getTime() ?? created?.getTime() ?? index;
};

const dedupeLatest = (rows: SheetRecord[], ...idKeys: string[]): SheetRecord[] => {
  const latest = new Map<string, { row: SheetRecord; freshness: number }>();
  rows.forEach((row, index) => {
    const id = normalizedId(pickSheetValue(row, ...idKeys));
    if (!id) return;
    const freshness = recordFreshness(row, index);
    const current = latest.get(id);
    if (!current || freshness >= current.freshness) latest.set(id, { row, freshness });
  });
  return [...latest.values()].map(({ row }) => row);
};

const emptyBreakdown = (): BookingStatusBreakdown => ({
  completed: 0,
  pending: 0,
  confirmed: 0,
  scheduled: 0,
  cancelled: 0,
});

const bookingStatus = (row: SheetRecord): BookingStatus | null => {
  const status = sheetText(pickSheetValue(row, 'status')).toLocaleLowerCase('en-US');
  return BOOKING_STATUSES.includes(status as BookingStatus) ? status as BookingStatus : null;
};

const bookingDate = (row: SheetRecord): Date | null =>
  parseSheetDate(pickSheetValue(row, 'start_time', 'startTime'));

const attemptDate = (row: SheetRecord): Date | null => {
  for (const key of ['submitted_at', 'submittedAt', 'assigned_at', 'assignedAt', 'created_at', 'createdAt']) {
    const date = parseSheetDate(row[key]);
    if (date) return date;
  }
  return null;
};

const timelineLabel = (date: Date, range: TimeRange): { key: string; label: string } => {
  const { year, month, day } = zonedParts(date);
  if (range === 'all-time') {
    return {
      key: `${year}-${String(month).padStart(2, '0')}`,
      label: `${String(month).padStart(2, '0')}/${year}`,
    };
  }
  return {
    key: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    label: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`,
  };
};

const countBookingsForMonth = (
  rows: SheetRecord[],
  target: { year: number; month: number },
): number => rows.filter((row) => {
  if (!bookingStatus(row)) return false;
  const date = bookingDate(row);
  if (!date) return false;
  const parts = zonedParts(date);
  return parts.year === target.year && parts.month === target.month;
}).length;

export const calculateSheetOperationsSummary = (
  bookingRows: SheetRecord[],
  testRows: SheetRecord[],
  testAttemptRows: SheetRecord[],
  range: TimeRange,
  now = new Date(),
): SheetOperationsSummary => {
  const uniqueBookings = dedupeLatest(bookingRows, 'booking_id', 'bookingId', 'id');
  const filteredBookings = uniqueBookings.filter((row) =>
    bookingStatus(row) !== null && isInRange(bookingDate(row), range, now));
  const bookingsBreakdown = emptyBreakdown();
  filteredBookings.forEach((row) => {
    const status = bookingStatus(row);
    if (status) bookingsBreakdown[status] += 1;
  });

  const timelineByKey = new Map<string, BookingTimelinePoint>();
  filteredBookings.forEach((row) => {
    const date = bookingDate(row);
    const status = bookingStatus(row);
    if (!date || !status) return;
    const { key, label } = timelineLabel(date, range);
    const point = timelineByKey.get(key) ?? { label, ...emptyBreakdown() };
    point[status] += 1;
    timelineByKey.set(key, point);
  });

  let bookingGrowthPercent: number | null = null;
  if (range !== 'all-time') {
    const selectedMonth = periodMonth(range, now);
    const previousMonth = shiftMonth(selectedMonth, -1);
    const previousTotal = countBookingsForMonth(uniqueBookings, previousMonth);
    if (previousTotal > 0) {
      bookingGrowthPercent = Math.round(
        ((filteredBookings.length - previousTotal) / previousTotal) * 1000,
      ) / 10;
    }
  }

  const uniqueTests = dedupeLatest(testRows, 'test_id', 'testId', 'id');
  const activeTestRows = uniqueTests.filter((row) =>
    sheetText(pickSheetValue(row, 'status')).toLocaleUpperCase('en-US') === 'ACTIVE');

  const uniqueAttempts = dedupeLatest(
    testAttemptRows,
    'test_attempt_id',
    'testAttemptId',
    'id',
  );
  const filteredAttempts = uniqueAttempts.filter((row) =>
    isInRange(attemptDate(row), range, now));

  const ids = (rows: SheetRecord[], ...keys: string[]) => rows
    .map((row) => sheetText(pickSheetValue(row, ...keys)))
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right, 'en'));

  return {
    totalBookings: filteredBookings.length,
    bookingsBreakdown,
    bookingTimeline: [...timelineByKey.entries()]
      .sort(([left], [right]) => left.localeCompare(right, 'en'))
      .map(([, point]) => point),
    bookingGrowthPercent,
    activeTests: activeTestRows.length,
    totalTestAttempts: filteredAttempts.length,
    rawRowCounts: {
      bookings: bookingRows.length,
      tests: testRows.length,
      testAttempts: testAttemptRows.length,
    },
    countedIds: {
      bookings: ids(filteredBookings, 'booking_id', 'bookingId', 'id'),
      activeTests: ids(activeTestRows, 'test_id', 'testId', 'id'),
      testAttempts: ids(filteredAttempts, 'test_attempt_id', 'testAttemptId', 'id'),
    },
  };
};
