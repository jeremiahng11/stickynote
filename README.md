# Sticky Notes

A multi-board sticky-notes web app: register / login, create boards, and drag,
edit, colour and persist notes on each board. Built with Express, Sequelize
(MySQL/MariaDB) and EJS templates with a jQuery front end.

## Stack

- Node.js 20+
- Express 4
- Sequelize 6 + mysql2 (MySQL / MariaDB)
- EJS views, jQuery / jQuery UI front end
- bcryptjs (password hashing), express-session, nodemailer (password reset)

## Run locally

### Option A — Node + your own MySQL

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the env template and fill it in:
   ```bash
   cp .env.example .env
   ```
   Set the `DB_*` values to point at a running MySQL/MariaDB instance and create
   the database (`CREATE DATABASE stickynotes;`). Tables are created
   automatically on first start.
3. Start the app:
   ```bash
   npm start      # or: npm run dev  (auto-reload, Node 20+)
   ```
4. Open http://localhost:3005 and register an account.

### Option B — docker-compose (app + MariaDB)

```bash
cp .env.example .env   # optional: tweak credentials
docker compose up --build
```

This starts the app on `http://localhost:3005` and a MariaDB instance with a
persistent volume. The app waits for the database to become healthy before
starting.

## Environment variables

| Variable          | Description                                          | Default                  |
| ----------------- | ---------------------------------------------------- | ------------------------ |
| `PORT`            | Port the server listens on                           | `3005`                   |
| `HOST`            | Bind address                                         | `0.0.0.0`                |
| `SESSION_SECRET`  | Secret for signing the session cookie                | (insecure dev default)   |
| `COOKIE_SECURE`   | `true` to only send the cookie over HTTPS            | `false`                  |
| `CORS_ORIGIN`     | Allowed CORS origin                                  | `*`                      |
| `DB_HOST`         | Database host                                        | `localhost`              |
| `DB_PORT`         | Database port                                        | `3306`                   |
| `DB_USER`         | Database user                                        | `root`                   |
| `DB_PASSWORD`     | Database password                                    | (empty)                  |
| `DB_NAME`         | Database name                                        | `stickynotes`            |
| `SMTP_SERVICE`    | nodemailer service name (optional)                   | (empty)                  |
| `SMTP_HOST`       | SMTP host                                            | (empty)                  |
| `SMTP_PORT`       | SMTP port                                            | `465`                    |
| `SMTP_SECURE`     | `true` for implicit TLS                              | `true`                   |
| `EMAIL_FROM`      | From address / SMTP username                         | (empty)                  |
| `EMAIL_PASS`      | SMTP password                                        | (empty)                  |
| `EMAIL_TEXT`      | Body line in the reset email                         | `Password for Sticky...` |
| `EMAIL_SUBJECT`   | Reset email subject                                  | `Password change...`     |

SMTP is only required for the forgot-password flow.

## Deploy on Coolify

This repo ships a production `Dockerfile`, so Coolify can build and run it
directly.

1. **Create the database resource.** In your Coolify project, add a
   **MySQL** or **MariaDB** resource and note its host, port, user, password and
   database name.
2. **Create the application.** Add a new resource → **Application** → point it at
   this Git repository. Coolify will detect the `Dockerfile` (build pack:
   *Dockerfile*).
3. **Set environment variables** on the application (Coolify → your app →
   *Environment Variables*) using the table above. At minimum set `SESSION_SECRET`,
   the `DB_*` values (point `DB_HOST` at the database resource's internal host),
   and `COOKIE_SECURE=true` since Coolify serves over HTTPS.
4. **Port / health check.** The container listens on `3005` (exposed in the
   Dockerfile). Set the app's port to `3005`. A health endpoint is available at
   `/health` — use it for Coolify's health check.
5. **Deploy.** Tables are created automatically on first boot, and the app
   retries the DB connection on startup so deploy ordering is not an issue.

## Health check

`GET /health` returns `{ "status": "ok" }` with HTTP 200.

## Notes

- Passwords are hashed with `bcryptjs` (pure JS, so no native build step in the
  container image).
- The app binds to `0.0.0.0` and reads `PORT` from the environment, as required
  by container platforms.
