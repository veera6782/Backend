# NutriOwl API

This repository is the standalone Node.js backend for the NutriOwl frontend. It has no runtime npm dependencies.

## Run

Requires Node.js 18 or newer.

Run or test the backend from the repository root:

```sh
npm start
npm test
```

The API listens on port `3002` by default, matching the Vite `/api` proxy. No `npm install` is needed for the backend.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `API_PORT` or `PORT` | `3002` | HTTP listen port |
| `MONGODB_URI` | unset | MongoDB connection string; when set, MongoDB is used instead of the local JSON store |
| `MONGODB_DATABASE` | database from URI | MongoDB database name override |
| `NUTRIOWL_DATA_FILE` | `data/nutriowl.json` | JSON store path when MongoDB is not configured |
| `CORS_ORIGIN` | `https://nutriowl.netlify.app` | Allowed browser origin |
| `DEFAULT_USER_EMAIL` | `demo@nutriowl.local` | User key when `X-User-Email` is omitted |

When `MONGODB_URI` is configured, the backend stores application state in the `nutriowl_state` collection as one document and uses revision checks to protect concurrent updates across backend instances. The MongoDB database must be created or accessible to the supplied credentials. Without `MONGODB_URI`, the local JSON store is created on the first request and written atomically; use that mode for local development only.

## Identity And Security

User-scoped routes use the `X-User-Email` header, which matches the current frontend client. If omitted, requests use the configurable demo account. This header is an identifier, **not authentication**: a caller can choose another email and access that account's data. Do not expose this backend to real users or sensitive data until the frontend is connected to an authentication provider and the backend verifies signed credentials. Configure `CORS_ORIGIN` narrowly for deployment.

## Endpoints

All responses use JSON. User-scoped routes accept `X-User-Email`.

| Method | Path | Behavior |
| --- | --- | --- |
| `GET` | `/api/health` | Liveness check; no user header required |
| `GET`, `POST`, `PUT` | `/api/profile` | Read or save profile and preferences |
| `GET` | `/api/goals` | Return goal items, fruit preference, hydration reminder, and wellness plan |
| `POST` | `/api/goals/generate` | Regenerate the wellness plan |
| `PATCH` | `/api/goals/preferences` | Update fruit servings and/or hydration reminder |
| `PATCH` | `/api/goals/:id` | Set `{ "target": 8 }` or add `{ "increment": 1 }` |
| `GET` | `/api/scans` | Return `{ "scans": [...] }` |
| `POST` | `/api/scans` | Save scan metadata; returns the created scan and list |
| `GET`, `DELETE` | `/api/scans/:id` | Read or delete one scan |
| `DELETE` | `/api/scans` | Clear scan history |
| `POST` | `/api/food/analyze` | Return a demo nutrition estimate |
| `POST` | `/api/chat` | Return a rule-based nutrition response for `{ "text": "..." }` |

Example:

```sh
curl http://localhost:3002/api/goals \
  -H 'X-User-Email: demo@nutriowl.local'
```

`POST /api/food/analyze` currently returns the same sample chicken-salad result as the frontend prototype. It does not inspect the submitted image. `/api/chat` uses a small rule-based response set, not an AI model. Scan records keep metadata and a short image path/URL; data URLs are replaced with the placeholder path to avoid storing large image payloads in the JSON database.

## Moving The Backend

Deploy this repository as a Node.js service with `npm start`, and configure `MONGODB_URI` in the service's secret environment settings. The service listens on the port provided by `PORT` (or `API_PORT`, default `3002`). The deployed frontend origin is allowed by default; set `CORS_ORIGIN` if the frontend is hosted at a different origin. Configure the frontend's API base URL to point to the deployed backend URL. For local development, the frontend can proxy `/api` to `http://localhost:3002`.