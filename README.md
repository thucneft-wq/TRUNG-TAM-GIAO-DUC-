# Digital Twin Psychological Counseling Centre — Admin Web MVP

React 19 + TypeScript + Vite admin dashboard covering login, responsive navigation,
dashboard charts, counselor performance and CRUD, student/feedback trends, filters,
CSV export, audit history, role-based access, and strict five-KPI evaluation.

## Run locally

```bash
npm.cmd install
npm.cmd run dev
```

With no `VITE_API_BASE_URL`, the app runs against the bundled anonymous mock adapter.
The default local demo account is shown on the login screen.

## Team API integration

Copy `.env.example` to `.env.local`, then set `VITE_API_BASE_URL`. The frontend uses:

- `POST /auth/login`
- `GET /admin/dashboard?period=this-month`
- `GET /admin/counselors?period=this-month`
- `GET /admin/counselors/:id?period=this-month`
- `POST /admin/counselors`
- `PATCH /admin/counselors/:id`
- `DELETE /admin/counselors/:id` (soft deactivate)
- `GET /admin/analytics/filters`
- `GET /admin/analytics/student-trends?period=this_month`
- `GET /admin/analytics/feedback?period=this_month`
- `GET /admin/analytics/export?type=overview&period=this_month` (CSV)
- `GET /admin/audit-logs` (Admin only)
- `GET /students`
- `POST /students`
- `PATCH /students/:id`
- `DELETE /students/:id` (soft deactivate)

Endpoint paths can be changed independently through the `VITE_*_ENDPOINT` variables.
Cookie sessions and bearer tokens are supported. Responses may be direct or wrapped in
`data`; counselor collections may also use `counselors`, `items`, or `results`. Common
camelCase and snake_case fields are normalized.

The complete request/response contract and SQL table/column mapping are documented in
[`../docs/API_CONTRACT.md`](../docs/API_CONTRACT.md).

In mock mode, Create, Update, and Deactivate are persisted in browser `localStorage`.
When `VITE_API_BASE_URL` is configured, these actions use the separate
`Digital-Twin-Backend` application and send the bearer token returned by Login.

The customer-facing release is read-only: direct Student and Counselor CRUD is locked
in the UI. Student maintenance opens the separate THCS and THPT tabs configured by
`VITE_GOOGLE_STUDENT_THCS_SHEET_URL` and `VITE_GOOGLE_STUDENT_THPT_SHEET_URL`.
These are the normalized `students_THCS` and `students_THPT` management tabs, not the
raw Google Form response tabs. Counselor maintenance opens
`VITE_GOOGLE_COUNSELOR_ENTRY_URL`.

Student deletion is handled from the two Google Sheet tabs, not from the Web. Each tab
has a `Trạng thái` dropdown: `Đang hoạt động` keeps the Student visible, while
`Ngừng theo dõi` sends `INACTIVE` to PostgreSQL and hides the Student from the Web.
Rows must not be deleted from the Sheet because physical row deletion does not provide
enough data for the synchronization trigger to identify the Student.

Counselor status uses three values from the Sheet. `Đang hoạt động` maps to `ACTIVE`;
`Tạm nghỉ` maps to `ON_LEAVE` and remains visible on the management page with the
`UNACTIVE` badge; `Ngừng hoạt động` maps to `INACTIVE` and is hidden from the Web.

The counselor payload must resolve to the five official KPI IDs. A requested-period
response may use `periodMetrics.kpis`; an all-period response may use
`timeRangeMetrics.this-month.kpis`, `timeRangeMetrics.last-month.kpis`, and
`timeRangeMetrics.all-time.kpis`.

The dashboard endpoint is optional. If it is unavailable, totals and chart values are
derived from the counselor response and a non-blocking warning is shown.

`admin` is the highest role and can use every Admin/analytics feature plus Student CRUD.
`counselor` can only create, read, update, and soft-deactivate Students assigned to that
Counselor profile. Analytics groups smaller than `MIN_ANALYTICS_SAMPLE_SIZE` are
suppressed in both the UI and CSV output.

## Customer CRUD demo mode

Set `VITE_CRUD_DEMO_MODE="true"` to hide dashboard, KPI, analytics, export, and audit
navigation without deleting those features. Counselor accounts land on Student management;
Admin can switch between Student and Counselor management. The three level-specific
Google Sheet variables above control the external Sheet buttons.

Student, Counselor and dashboard data automatically refresh at
`VITE_STUDENT_SYNC_INTERVAL_MS` intervals after Apps Script pushes Sheet rows to the
Backend webhooks. This near-real-time refresh is active in both the full Admin portal
and Customer CRUD demo mode. It does not enable editing on the Web.

## KPI rule

The frontend recalculates every KPI from `actualNumeric`, evidence and the canonical
policy in `kpiPolicy.ts`. Backend-provided `isPassed`, counts and overall status are not
trusted. Caseload is a mandatory safety guardrail and is not counted as performance.
Overall status is `Pass` when at least three of four performance KPIs are evaluable and
pass while caseload is between 1 and 20 weighted cases per FTE. Zero caseload or fewer
than three evaluable performance KPIs produces `Insufficient Data`; caseload above 20
produces `Not Pass`.

## Knowledge Graph integration placeholder

The Admin-only `Knowledge Graph` screen is ready for the future graph module. Its stable
mount element is `#knowledge-graph-viewport`, implemented in
`src/components/KnowledgeGraphScreen.tsx`.

When the graph component is available, pass it through `graphContent` and set the status:

```tsx
<KnowledgeGraphScreen
  graphContent={<TeamKnowledgeGraph />}
  status="ready"
/>
```

Keep authorization and sensitive-data masking in the API. The placeholder intentionally
does not render fake graph data.

## Verification

```bash
npm.cmd run lint
npm.cmd run test:kpi
npm.cmd run build
```

Backend and database assets are intentionally outside this Frontend directory.

## Docker handoff

The production-style Docker package is defined in `compose.yaml`. It builds the
React app behind Nginx, proxies `/api` to the private Backend container, and
starts PostgreSQL with a persistent volume. See
[`docs/DOCKER_HANDOFF.md`](docs/DOCKER_HANDOFF.md) for the required sibling
folder layout, secret configuration, Google Sheet HTTPS requirement, startup,
verification, and customer handoff checklist.

## Account

The Web portal accepts only the Admin account configured by `ADMIN_EMAIL` and
`ADMIN_PASSWORD_HASH` in the backend environment. Do not store the plain-text
password in this repository.
