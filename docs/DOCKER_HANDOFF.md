# Docker handoff guide

Prerequisite: Docker Desktop with Docker Compose v2 must be installed and
running on the destination machine.

This package runs three containers:

- `web`: the compiled React application served by Nginx.
- `backend`: the Node.js API, reachable only from the Docker network.
- `database`: PostgreSQL with a persistent named volume.

Only the Web port is published. Nginx forwards `/api` to the backend, so the
frontend does not contain a machine-specific backend URL.

## Required folder layout

Keep these items next to each other before creating the handoff archive:

```text
handoff/
├── TRUNG-TAM-GIAO-DUC-/
├── TRUNG-TAM-GIAO-DUC-backend/
└── new_database_psychological.sql
```

Do not include `fake_data.sql` in a customer or production handoff.

## Configure

From `TRUNG-TAM-GIAO-DUC-`, copy `.env.docker.example` to `.env.docker` and
replace every placeholder. The database password in `DATABASE_URL` must be URL
encoded when it contains characters such as `@`, `:`, `/`, `?`, or `#`.
Keep `DATABASE_URL` and the bcrypt `ADMIN_PASSWORD_HASH` inside single quotes;
otherwise Compose may interpret `$` characters in the hash as variables.

Keep these values outside Git:

- `POSTGRES_PASSWORD`
- `DATABASE_URL`
- `JWT_SECRET`
- `ADMIN_PASSWORD_HASH`
- `GOOGLE_SHEETS_SYNC_SECRET`

The customer Web has one Admin login. Keep `WEB_CRUD_ENABLED=false`.

## Build and run

```powershell
docker compose --env-file .env.docker config
docker compose --env-file .env.docker build
docker compose --env-file .env.docker up -d
docker compose --env-file .env.docker ps
```

Open `http://localhost:8080` unless `WEB_PORT` or `PUBLIC_APP_ORIGIN` was
changed.

The schema and two additive migrations run only when PostgreSQL creates an
empty volume for the first time. Restarting the stack does not re-import them.
PostgreSQL 18 stores its versioned data directory below `/var/lib/postgresql`,
so the Compose volume intentionally targets that parent directory.

## Verify

```powershell
docker compose --env-file .env.docker exec backend wget -qO- http://127.0.0.1:4000/api/health
docker compose --env-file .env.docker logs --tail=100 backend
```

Then verify Admin login, the THCS and THPT student lists, the counselor list,
and an Apps Script synchronization event.

## Google Sheet synchronization

Apps Script cannot call a private Docker or `localhost` address. For the final
deployment, expose the Web container through a stable HTTPS domain and set the
Apps Script property:

```text
BACKEND_BASE_URL=https://your-domain.example/api
```

Set `GOOGLE_SHEETS_SYNC_SECRET` in Apps Script to the same value stored in
`.env.docker`. A temporary tunnel is suitable only for testing because its URL
expires when the tunnel stops.

## Existing production database

If the database owner supplies an existing PostgreSQL database, do not import
the schema again. Point `DATABASE_URL` at that database and remove the
`database` service, its `depends_on` entry, and its three init-file mounts from
the Compose file. Apply only migrations approved by the database owner.

## Operations

```powershell
docker compose --env-file .env.docker stop
docker compose --env-file .env.docker start
docker compose --env-file .env.docker logs -f
```

Do not run `docker compose down -v` on a real installation: `-v` removes the
PostgreSQL data volume.
