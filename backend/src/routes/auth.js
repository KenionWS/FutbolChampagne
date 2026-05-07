import express from 'express';
import { verifyGoogleToken, authenticateUser } from '../services/auth.js';
import { query } from '../config/db.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    // Verify Google token
    const googlePayload = await verifyGoogleToken(token);

    // Authenticate user (create or update)
    const { user, token: jwtToken } = await authenticateUser(googlePayload);

    res.json({
      user,
      token: jwtToken,
    });
  } catch (error) {
    console.error('Auth error:', error.message, error.stack);
    res.status(401).json({
      error: 'Authentication failed',
      details: error.message
    });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, email, name, picture_url FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
