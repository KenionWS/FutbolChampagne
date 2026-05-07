import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './config/db.js';
import authRoutes from './routes/auth.js';
import groupRoutes from './routes/groups.js';
import matchRoutes from './routes/matches.js';

// Fix SSL certificate issue on Windows for development
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

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
