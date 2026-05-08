import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { verifyGoogleToken, authenticateUser } from '../services/auth.js';
import { query } from '../config/db.js';
import authMiddleware from '../middleware/auth.js';

// === SUBIDA DE FOTOS DE PERFIL (deshabilitado para deploy gratuito) ===
// Para reactivar: descomentar imports + bloque de multer + endpoint /avatar/upload
// Recomendado para producción: migrar a Cloudinary o S3 en lugar de disco local
//
// import multer from 'multer';
// import path from 'path';
// import fs from 'fs';
// import { fileURLToPath } from 'url';
//
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'avatars');
//
// if (!fs.existsSync(uploadsDir)) {
//   fs.mkdirSync(uploadsDir, { recursive: true });
// }
//
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, uploadsDir),
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname);
//     cb(null, `avatar_${req.userId}_${Date.now()}${ext}`);
//   }
// });
//
// const upload = multer({
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 },
//   fileFilter: (req, file, cb) => {
//     if (!file.mimetype.startsWith('image/')) {
//       return cb(new Error('Solo se permiten imágenes'));
//     }
//     cb(null, true);
//   }
// });

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

// Register with email and password
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user with emoji avatar by default
    const result = await query(
      `INSERT INTO users (email, name, password_hash, avatar, registration_type, picture_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, name, avatar`,
      [email, name, passwordHash, '⚽', 'email', null]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Login with email and password
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const result = await query(
      'SELECT id, email, name, password_hash, avatar, picture_url FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        picture_url: user.picture_url
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user avatar
router.put('/avatar', authMiddleware, async (req, res) => {
  try {
    const { avatar } = req.body;

    if (!avatar) {
      return res.status(400).json({ error: 'Avatar is required' });
    }

    const result = await query(
      'UPDATE users SET avatar = $1, picture_url = NULL WHERE id = $2 RETURNING id, email, name, avatar, picture_url',
      [avatar, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, email, name, picture_url, avatar, surname, nickname FROM users WHERE id = $1',
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

// === ENDPOINT DE SUBIDA DE FOTOS DE PERFIL (deshabilitado) ===
// Para reactivar: descomentar imports/bloque de multer arriba + este endpoint
//
// router.post('/avatar/upload', authMiddleware, upload.single('photo'), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: 'No file uploaded' });
//     }
//
//     const photoUrl = `${req.protocol}://${req.get('host')}/uploads/avatars/${req.file.filename}`;
//
//     const result = await query(
//       `UPDATE users SET picture_url = $1, avatar = NULL WHERE id = $2
//        RETURNING id, email, name, surname, nickname, avatar, picture_url`,
//       [photoUrl, req.userId]
//     );
//
//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'User not found' });
//     }
//
//     res.json(result.rows[0]);
//   } catch (error) {
//     console.error('Upload avatar error:', error);
//     res.status(500).json({ error: error.message });
//   }
// });

// Update user profile (name, surname, nickname)
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, surname, nickname } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await query(
      `UPDATE users
       SET name = $1, surname = $2, nickname = $3
       WHERE id = $4
       RETURNING id, email, name, surname, nickname, avatar, picture_url`,
      [name, surname || null, nickname || null, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
