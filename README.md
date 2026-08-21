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
Admin can switch between Student and Counselor management. `VITE_GOOGLE_STUDENT_ENTRY_URL`
and `VITE_GOOGLE_COUNSELOR_ENTRY_URL` control the external Sheet buttons. Both lists
refresh at `VITE_STUDENT_SYNC_INTERVAL_MS` intervals after Apps Script pushes Sheet rows
to the Backend webhooks.

## KPI rule

The frontend recalculates every KPI from `actualNumeric` and the canonical target and
comparison in `kpiPolicy.ts`. Backend-provided `isPassed`, counts, and overall status are
not trusted. Overall status is `Pass` only for the five unique official KPI IDs with all
five passing. Failed, missing-data, duplicate, missing, unexpected, or extra KPI records
are `Not Pass`.

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

## Account
    admin@campus-counseling.edu
    Admin@123
