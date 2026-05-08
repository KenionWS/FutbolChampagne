import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function verifyGoogleToken(token) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
      maxAge: '2h',
    });
    const payload = ticket.getPayload();
    console.log('Token verified:', payload.email);
    return payload;
  } catch (error) {
    console.error('Token verification error:', error.message);
    throw new Error(`Invalid Google token: ${error.message}`);
  }
}

export async function authenticateUser(googlePayload) {
  const { email, name, picture, sub: googleId } = googlePayload;

  // Check if user exists, if not create
  const result = await query(
    `INSERT INTO users (email, google_id, name, picture_url)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (google_id) DO UPDATE SET name = $3, picture_url = $4
     RETURNING id, email, name, picture_url`,
    [email, googleId, name, picture]
  );

  const user = result.rows[0];

  // Generate JWT
  const jwtToken = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );

  return {
    user,
    token: jwtToken,
  };
}
