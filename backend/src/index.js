import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './config/db.js';
import authMiddleware from './middleware/auth.js';

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
app.post('/auth/google', async (req, res) => {
  try {
    const { token } = req.body;
    // TODO: Verify Google token, create/update user, return JWT
    res.json({ message: 'Auth endpoint - TBD' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await db.query(
      'SELECT id, email, name, picture_url FROM users WHERE id = $1',
      [req.userId]
    );
    res.json(user.rows[0] || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Group routes (TBD)
app.post('/groups', authMiddleware, async (req, res) => {
  res.json({ message: 'Create group - TBD' });
});

app.get('/groups/:id', authMiddleware, async (req, res) => {
  res.json({ message: 'Get group - TBD' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  db.query('SELECT NOW()', (err) => {
    if (err) console.error('DB connection error:', err);
    else console.log('Database connected');
  });
});
