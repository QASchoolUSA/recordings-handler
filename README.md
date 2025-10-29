# Recordings Upload Server

Simple Node.js service to accept `multipart/form-data` uploads of audio recordings (`audio/webm;codecs=opus`) from your Flutter/WebRTC app and save them to disk.

## Features

- `POST /upload` saves the uploaded file (field `file`) to `uploads/`.
- Uses `room` and `timestamp` form fields to name the file `recording_<room>_<timestamp>.webm`.
- CORS with configurable allowed origins.
- Optional bearer token auth via `Authorization: Bearer <token>`.
- Size limits via `MAX_UPLOAD_MB`.
- `GET /health` for quick readiness checks.

## Quick Start

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment:

   ```bash
   cp .env.example .env
   # edit .env as needed
   ```

3. Run the server:

   ```bash
   npm start
   # or during development
   npm run dev
   ```

Server listens on `http://localhost:${PORT}` (default `3000`).

## Environment Variables

- `PORT`: Port to listen on. Default `3000`.
- `UPLOAD_DIR`: Directory to save files. Default `uploads`.
- `CORS_ORIGINS`: Comma-separated allowed origins (e.g., `http://127.0.0.1:65246,http://localhost:65246`).
- `MAX_UPLOAD_MB`: Max upload size in MB. Default `50`.
- `UPLOAD_TOKEN`: If set, enables bearer auth. Requests must include `Authorization: Bearer <token>`.

## API

### `POST /upload`

Content-Type: `multipart/form-data`

Fields:

- `file`: Blob (`audio/webm;codecs=opus`)
- `room`: Room name (string)
- `timestamp`: ISO timestamp (string)

Response:

```json
{
  "ok": true,
  "file": {
    "filename": "recording_room_2024-10-28T12-34-56.789Z.webm",
    "path": "uploads/recording_room_2024-10-28T12-34-56.789Z.webm",
    "size": 12345,
    "mimetype": "audio/webm;codecs=opus"
  },
  "room": "room",
  "timestamp": "2024-10-28T12:34:56.789Z"
}
```

### `GET /health`

Returns `{ ok: true }`.

## cURL Example

```bash
curl -i -X POST http://localhost:3000/upload \
  -H "Authorization: Bearer ${UPLOAD_TOKEN}" \
  -F file=@sample.webm -F room=demo -F timestamp=$(date -Iseconds)
```

## Flutter Client Notes

- Set `recordUploadUrl` before recording starts. Example:

  ```dart
  _session.recordUploadUrl = Uri.parse('https://your-server.example/upload');
  ```

- Use a single-blob approach: call `MediaRecorder.start()` without a timeslice so the browser buffers the entire recording and fires one `dataavailable` on `stop`.

- When uploading, send `multipart/form-data` with fields `file`, `room`, and `timestamp`. Include `Authorization: Bearer <token>` if `UPLOAD_TOKEN` is set.

## Deployment

- Enable HTTPS (via reverse proxy like Nginx or a managed platform).
- Configure CORS for production origin(s).
- Set quotas/retention for the `uploads/` directory.

## Deploy on Coolify

1. Create an Application in Coolify and connect your Git repo.
2. Choose Dockerfile build type. Coolify will build from `Dockerfile`.
3. Configure Environment Variables:
   - `PORT=3000`
   - `UPLOAD_DIR=/app/uploads` (or leave as `uploads`)
   - `CORS_ORIGINS=https://your-app.example` (add dev origins if needed)
   - `MAX_UPLOAD_MB=50` (optional)
   - `UPLOAD_TOKEN=<optional bearer token>`
4. Add Persistent Storage:
   - Mount a volume to `/app/uploads` to retain recordings across deploys.
5. Health Check:
   - Set path to `/health` and expect HTTP `200`.
6. Deploy and test:
   - `curl -X POST http://<your-host>:<port>/upload -F file=@sample.webm -F room=demo -F timestamp=$(date -Iseconds)`