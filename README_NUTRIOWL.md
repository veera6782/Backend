# NutriOwl Backend

This repository contains the Node.js and Express API for NutriOwl user data.

## Run locally

```bash
npm install
npm start
```

Before starting the server, copy `.env.example` to `.env` and set a valid
`MONGODB_URI`. The API listens on `http://127.0.0.1:5000` by default.

## Endpoints

- `GET /api/health` checks that the API is available.
- `GET /api/users/:id` retrieves a user.
- `POST /api/users` creates a user.
- `PATCH /api/users/:id` updates a user.

Example health check:

```bash
curl http://127.0.0.1:5000/api/health
```
