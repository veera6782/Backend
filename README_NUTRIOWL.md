# NutriOwl Backend

This repository contains the Flask API used for food image detection.

## Run locally

```bash
source .venv/bin/activate
python backend/app.py
```

The API listens on `http://127.0.0.1:5001` by default. Set `PORT` to use a
different port and `YOLO_MODEL` to select another model file.

## Endpoints

- `GET /health` checks that the API and model are available.
- `POST /predict` accepts an image in a multipart form field named `image`.

Example health check:

```bash
curl http://127.0.0.1:5001/health
```
