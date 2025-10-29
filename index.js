import express from 'express';
import cors from 'cors';
import multer from 'multer';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Logging
app.use(morgan('combined'));

// CORS configuration
const defaultOrigins = [
  'http://127.0.0.1:65246',
  'http://localhost:65246',
  'http://localhost:8080',
  'http://localhost:3000',
];
const originsEnv = process.env.CORS_ORIGINS || '';
const allowedOrigins = originsEnv
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
const corsOrigins = allowedOrigins.length ? allowedOrigins : defaultOrigins;

app.use(
  cors({
    origin: function (origin, cb) {
      // Allow same-origin or tools like curl (no origin)
      if (!origin) return cb(null, true);
      if (corsOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    methods: ['POST', 'OPTIONS'],
    optionsSuccessStatus: 200,
  })
);

// Optional bearer token auth
const token = process.env.UPLOAD_TOKEN;
if (token) {
  app.use((req, res, next) => {
    const auth = req.headers['authorization'] || '';
    const expected = `Bearer ${token}`;
    if (auth !== expected) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  });
}

// Multer storage and limits
const uploadDir = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const room = (req.body.room || 'call').toString().replace(/[^\w.-]/g, '_');
    const tsRaw = (req.body.timestamp || new Date().toISOString()).toString();
    const ts = tsRaw.replace(/:/g, '-');
    const ext = '.webm';
    cb(null, `recording_${room}_${ts}${ext}`);
  },
});

const maxUploadMb = Number(process.env.MAX_UPLOAD_MB || 50);
const upload = multer({
  storage,
  limits: { fileSize: maxUploadMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    // Accept audio/webm and audio/webm;codecs=opus
    if (!file.mimetype.startsWith('audio/webm')) {
      return cb(new Error('Invalid mimetype'));
    }
    cb(null, true);
  },
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file' });
    }
    const room = req.body.room || 'call';
    const timestamp = req.body.timestamp || new Date().toISOString();

    return res.json({
      ok: true,
      file: {
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
      room,
      timestamp,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    return res.status(500).json({ error: message });
  }
});

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
  console.log(`Upload server listening on http://localhost:${PORT}`);
});