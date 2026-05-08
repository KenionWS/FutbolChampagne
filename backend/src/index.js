import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './config/db.js';
import authRoutes from './routes/auth.js';
import groupRoutes from './routes/groups.js';
import matchRoutes from './routes/matches.js';

// Fix SSL certificate issue on Windows for development
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// CORS: acepta múltiples orígenes separados por coma en FRONTEND_URL
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(url => url.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (Postman, curl, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS bloqueado para origen: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());

// === ARCHIVOS ESTÁTICOS (deshabilitado junto con upload de fotos) ===
// Para reactivar: descomentar y reactivar el endpoint /auth/avatar/upload
// app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Auth routes
app.use('/auth', authRoutes);

// Group routes
app.use('/groups', groupRoutes);

// Match routes
app.use('/matches', matchRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  db.query('SELECT NOW()', (err) => {
    if (err) console.error('DB connection error:', err);
    else console.log('Database connected');
  });
});
