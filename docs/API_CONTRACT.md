# Admin Web MVP API Contract (legacy copy)

The authoritative Frontend/Backend contract is now maintained at
[`../../docs/API_CONTRACT.md`](../../docs/API_CONTRACT.md). The notes below are retained
for historical adapter context.

This contract describes the frontend boundary only. It does not create or modify the
database, SQL schema, or backend. All examples use anonymous demo records and contain
no case notes, diagnoses, session transcripts, or other sensitive psychological data.

## Common conventions

- Base URL: `VITE_API_BASE_URL`.
- Supported periods: `this-month`, `last-month`, `all-time`.
- Query parameter name: `period`.
- Authentication supports an HTTP-only cookie and/or a bearer token returned by login.
- Responses may be direct JSON or wrapped in `{ "data": ... }`.
- Counselor collections may be direct arrays or use `counselors`, `items`, or `results`.
- The adapter accepts camelCase and snake_case fields.
- KPI IDs may use kebab-case or the equivalent snake_case alias.
- Missing numeric KPI data must be returned as `null`, not a fabricated value. It will
  be evaluated as `Not Pass`.

The frontend owns the official KPI target, comparison operator, and final status. Any
API-provided `isPassed`, `passedKpiCount`, or `overallStatus` value is ignored and
recalculated.

## POST /auth/login

Request:

```json
{
  "email": "admin@example.edu",
  "password": "example-password"
}
```

Successful response:

```json
{
  "data": {
    "accessToken": "opaque-access-token",
    "user": {
      "id": "admin-001",
      "name": "Admin User",
      "email": "admin@example.edu",
      "role": "Administrator"
    }
  }
}
```

The token may also be named `access_token` or `token`. The user object may be named
`user`, `admin`, or `account`. A cookie-only login may omit `accessToken`.

## GET /admin/dashboard?period=this-month

Response:

```json
{
  "data": {
    "period": "this-month",
    "totalStudents": 222,
    "activeCounselors": 8,
    "totalBookings": 818,
    "passedCounselors": 3,
    "notPassedCounselors": 5,
    "bookingsBreakdown": {
      "completed": 689,
      "pending": 70,
      "cancelled": 59
    },
    "monthlyTrends": [
      { "month": "Week 1", "completed": 152, "pending": 15, "cancelled": 9 }
    ],
    "lastUpdated": "2026-08-18T12:00:00Z",
    "syncNode": "team-api"
  }
}
```

The endpoint is optional. If it is unavailable, the frontend derives dashboard totals
from counselor data. Counselor pass counts and KPI-domain chart values are always
recalculated from the official five KPI records, even when supplied by this response.

## GET /admin/counselors?period=this-month

Response:

```json
{
  "data": {
    "period": "this-month",
    "counselors": [
      {
        "id": "CO-101",
        "name": "Demo Counselor A",
        "title": "Lead Counselor",
        "department": "Counseling Unit A",
        "email": "counselor.a@example.edu",
        "relationshipSummary": {
          "assignedStudents": 28,
          "completedBookings": 92,
          "pendingBookings": 8,
          "cancelledBookings": 5,
          "completedTests": 82,
          "pendingTests": 14,
          "avgResponseHours": 0,
          "satisfactionScore": 4.6
        },
        "periodMetrics": {
          "assignedStudents": 28,
          "completedBookings": 92,
          "pendingBookings": 8,
          "cancelledBookings": 5,
          "completedSessions": 88,
          "totalSessions": 100,
          "completedTests": 82,
          "pendingTests": 14,
          "assignedTests": 96,
          "satisfactionScore": 4.6,
          "feedbackCount": 48,
          "kpis": [
            {
              "id": "caseload-compliance",
              "actualNumeric": 28,
              "actualValue": "28 students",
              "evidence": { "sampleSize": 28 }
            },
            {
              "id": "session-completion-rate",
              "actualNumeric": 88,
              "actualValue": "88.0%",
              "evidence": { "numerator": 88, "denominator": 100 }
            },
            {
              "id": "booking-cancellation-rate",
              "actualNumeric": 4.8,
              "actualValue": "4.8%",
              "evidence": { "numerator": 5, "denominator": 105 }
            },
            {
              "id": "test-completion-rate",
              "actualNumeric": 85.4,
              "actualValue": "85.4%",
              "evidence": { "numerator": 82, "denominator": 96 }
            },
            {
              "id": "student-satisfaction",
              "actualNumeric": 4.6,
              "actualValue": "4.60 / 5.0",
              "evidence": { "sampleSize": 48 }
            }
          ]
        }
      }
    ]
  }
}
```

Instead of `periodMetrics`, the backend may provide all periods in
`timeRangeMetrics`/`time_range_metrics`, keyed by `this-month`, `last-month`, and
`all-time`. When both forms are present, `periodMetrics` is used for the requested
period.

## GET /admin/counselors/:id?period=this-month

Example request:

```text
GET /admin/counselors/CO-101?period=this-month
Authorization: Bearer opaque-access-token
```

Response:

```json
{
  "data": {
    "period": "this-month",
    "counselor": {
      "id": "CO-101",
      "name": "Demo Counselor A",
      "title": "Lead Counselor",
      "department": "Counseling Unit A",
      "email": "counselor.a@example.edu",
      "periodMetrics": {
        "assignedStudents": 28,
        "completedBookings": 92,
        "pendingBookings": 8,
        "cancelledBookings": 5,
        "completedSessions": 88,
        "totalSessions": 100,
        "completedTests": 82,
        "pendingTests": 14,
        "assignedTests": 96,
        "satisfactionScore": 4.6,
        "feedbackCount": 48,
        "kpis": [
          { "id": "caseload-compliance", "actualNumeric": 28, "actualValue": "28 students" },
          { "id": "session-completion-rate", "actualNumeric": 88, "actualValue": "88.0%" },
          { "id": "booking-cancellation-rate", "actualNumeric": 4.8, "actualValue": "4.8%" },
          { "id": "test-completion-rate", "actualNumeric": 85.4, "actualValue": "85.4%" },
          { "id": "student-satisfaction", "actualNumeric": 4.6, "actualValue": "4.60 / 5.0" }
        ]
      }
    }
  }
}
```

The frontend adapter exposes this endpoint for future detail-page loading. The current
MVP can still open detail records from the counselor collection already in memory.

## Official KPI definitions and SQL mapping

| KPI ID | Formula and target | Required SQL tables and columns |
| --- | --- | --- |
| `caseload-compliance` | Count distinct active assigned students; target `<= 30` (`lte`). | Filter `Counselor_Assignment_Records.counselor_id`, `status`, `assigned_at`, and `ended_at`; join `Counselor_Assignment_Records.assignment_id` to `Counselor_Assignments.assignment_id`; count distinct `Counselor_Assignments.student_id`. |
| `session-completion-rate` | `completed sessions / total sessions * 100`; target `>= 80%` (`gte`). | Join `Sessions.booking_id` to `Bookings.booking_id`; filter counselor through `Bookings.counselor_id`; select the period with `Sessions.started_at`, `Sessions.ended_at`, and/or `Bookings.start_time`; determine completion from `Sessions.status`. |
| `booking-cancellation-rate` | `cancelled bookings / total bookings * 100`; target `<= 10%` (`lte`). | Use `Bookings.counselor_id`, `Bookings.booking_id`, `Bookings.status`, and `Bookings.start_time`. |
| `test-completion-rate` | `completed tests / assigned tests * 100`; target `>= 80%` (`gte`). | Denominator: distinct `Test_Assignments.test_assignment_id` filtered by `Test_Assignments.counselor_id` and `assigned_at`. Completion evidence joins `Test_Attempts.test_assignment_id`, `status`, and `submitted_at`, then `Results.test_attempt_id`. A completed assignment must have a completed/submitted attempt and its result. |
| `student-satisfaction` | `AVG(Feedbacks.rating)`; target `>= 4.0/5.0` (`gte`). | Use non-null `Feedbacks.rating`, filtered by `Feedbacks.counselor_id` and `Feedbacks.created_at`. |

The SQL schema does not constrain all status values beyond defaults. The backend must
use its canonical status vocabulary consistently (for example `ACTIVE`, `COMPLETED`,
and `CANCELLED`) and document any deviation. The frontend does not infer or alter the
database schema.

## Strict overall rule

The response must resolve to exactly these five unique IDs:

1. `caseload-compliance`
2. `session-completion-rate`
3. `booking-cancellation-rate`
4. `test-completion-rate`
5. `student-satisfaction`

The frontend recalculates every item using its canonical target and comparison. Overall
status is `Pass` only when all five pass. One failure, missing numeric data, a missing
KPI, an extra KPI, a duplicate ID, or an unexpected ID produces `Not Pass`.
