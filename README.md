# NutriOwl API

This repository is the standalone Node.js backend for the NutriOwl frontend.

## Run

Requires Node.js 18 or newer.

Install dependencies and run or test the backend from the repository root:

```sh
npm install
npm start
npm test
```

The API listens on port `3002` by default, matching the Vite `/api` proxy.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `API_PORT` or `PORT` | `3002` | HTTP listen port |
| `MONGODB_URI` | unset | MongoDB connection string; when set, MongoDB is used instead of the local JSON store |
| `MONGODB_DATABASE` | database from URI | MongoDB database name override |
| `NUTRIOWL_DATA_FILE` | `data/nutriowl.json` | JSON store path when MongoDB is not configured |
| `CORS_ORIGIN` | `https://nutriowl.netlify.app` | Allowed browser origin |
| `AUTH_SESSION_TTL_MS` | `604800000` (7 days) | Session lifetime in milliseconds |
| `CHAT_API_KEY` (or `GEMINI_API_KEY`) | unset | Key for the chat model; without it `/api/chat` uses rule-based replies |
| `CHAT_API_URL` | Gemini OpenAI-compatible endpoint | Any OpenAI-compatible `/chat/completions` URL (Gemini, Groq, OpenRouter, Ollama) |
| `CHAT_MODEL` | `gemini-flash-latest,gemini-flash-lite-latest` | Comma-separated model names; the next is tried when one is overloaded (5xx), rate limited (429) or unavailable (404) |
| `CHAT_DAILY_LIMIT` | `50` | Chat messages per member (or per client IP when anonymous) per day |
| `CHAT_MAX_TOKENS` | `1024` | Maximum reply length in tokens |

When `MONGODB_URI` is configured, the backend stores application state, password hashes, and expiring sessions in the `nutriowl_state` collection as one document and uses revision checks to protect concurrent updates across backend instances. The MongoDB database must be created or accessible to the supplied credentials. Without `MONGODB_URI`, the local JSON store is created on the first request and written atomically; use that mode for local development only. Keep the backing database persistent across deployments, and use MongoDB for a multi-instance production service.

## Identity And Security

`POST /api/auth/signup` accepts `{ "email": "...", "password": "..." }` and returns `{ "token": "...", "profile": { ... } }`. Passwords must be 8-128 characters (up to 128 UTF-8 bytes) and are stored as salted scrypt hashes. `POST /api/auth/signin` takes the same fields and returns the same response shape; invalid credentials return `401`. `POST /api/auth/signout` accepts `Authorization: Bearer <token>` and revokes that session.

Profile, goals, and scan routes require `Authorization: Bearer <token>`. Tokens are random, expire after the configured session lifetime, and are stored server-side only as SHA-256 digests. `X-User-Email` is not used for identity. The token is a bearer credential: use HTTPS in production and do not log or expose it.

Existing email-only records do not have passwords and cannot be safely claimed based only on their stored email, since the former email header was not authentication. They are preserved, but signup with one of those email addresses returns `409` rather than silently assigning a password or exposing that record to a new registrant. Such users must register a new account; migrate a legacy profile only after independently verifying its owner and backing up the database. Do not delete legacy data as part of deployment.

## Endpoints

All responses use JSON. Profile, goals, and scan routes require a bearer token.

| Method | Path | Behavior |
| --- | --- | --- |
| `GET` | `/api/health` | Liveness check; no user header required |
| `POST` | `/api/auth/signup` | Create an account and return a bearer token and profile |
| `POST` | `/api/auth/signin` | Authenticate and return a bearer token and profile |
| `POST` | `/api/auth/signout` | Revoke the bearer session |
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
| `POST` | `/api/chat` | Nutrition assistant reply for `{ "text": "..." }` or `{ "messages": [...] }`; returns `{ "response", "source" }` |

Example:

```sh
curl http://localhost:3002/api/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"member@example.com","password":"a-long-password"}'

curl http://localhost:3002/api/goals \
  -H 'Authorization: Bearer <token>'
```

`POST /api/food/analyze` currently returns the same sample chicken-salad result as the frontend prototype. It does not inspect the submitted image. Scan records keep metadata and a short image path/URL; data URLs are replaced with the placeholder path to avoid storing large image payloads in the JSON database.

## Chat Assistant

`POST /api/chat` is a conversational nutrition and wellness assistant. Send the conversation as `{ "messages": [{ "role": "user" | "assistant", "content": "..." }, ...] }` with the newest user message last (the most recent 20 are used, each up to 2,000 characters), or a single `{ "text": "..." }`. The backend is stateless, so the client keeps the history.

The bearer token is optional. When present, replies are personalized with the member's profile, goal progress and today's scanned meals, and the daily limit is counted per member; an invalid token returns `401`. Anonymous requests are limited per client IP. Behind a proxy all anonymous traffic shares one IP, so send the token from the frontend.

The response's `source` is `ai` (model reply), `fallback` (rule-based reply because no key is configured or the provider failed or was rate limited) or `safety` (a fixed support message for self-harm or eating-disorder crisis language; the model is not called). Exceeding the daily limit returns `429`. Daily counters are kept in memory and reset when the process restarts.

Free setup: create a Gemini API key in Google AI Studio and set `CHAT_API_KEY`. To use Groq instead, set `CHAT_API_URL=https://api.groq.com/openai/v1/chat/completions` and a Groq model in `CHAT_MODEL`. Free tiers have rate limits, and providers may use free-tier prompts to improve their models.

## Moving The Backend

Deploy this repository as a Node.js service with `npm start`, and configure `MONGODB_URI` in the service's secret environment settings. The service listens on the port provided by `PORT` (or `API_PORT`, default `3002`). The deployed frontend origin is allowed by default; set `CORS_ORIGIN` if the frontend is hosted at a different origin. Configure the frontend's API base URL to point to the deployed backend URL. For local development, the frontend can proxy `/api` to `http://localhost:3002`.