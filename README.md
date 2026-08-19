# Digital Twin Psychological Counseling Centre — Admin Web MVP

React 19 + TypeScript + Vite admin dashboard covering login, responsive navigation,
dashboard charts, counselor performance, counselor detail, and strict five-KPI evaluation.

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

## KPI rule

The frontend recalculates every KPI from `actualNumeric` and the canonical target and
comparison in `kpiPolicy.ts`. Backend-provided `isPassed`, counts, and overall status are
not trusted. Overall status is `Pass` only for the five unique official KPI IDs with all
five passing. Failed, missing-data, duplicate, missing, unexpected, or extra KPI records
are `Not Pass`.

## Verification

```bash
npm.cmd run lint
npm.cmd run test:kpi
npm.cmd run build
```

Backend and database assets are intentionally outside this Frontend directory.
