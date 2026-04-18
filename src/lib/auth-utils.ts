import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'fallback-access-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcryptjs.genSalt(10);
  return bcryptjs.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

export function generateAccessToken(userId: string) {
  return jwt.sign({ userId }, ACCESS_SECRET, { expiresIn: '15m' });
}

export function generateRefreshToken(userId: string) {
  // Using 7 days as requested
  return jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string) {
  try {
    return jwt.verify(token, ACCESS_SECRET) as { userId: string } | null;
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(token: string) {
  try {
    return jwt.verify(token, REFRESH_SECRET) as { userId: string } | null;
  } catch (error) {
    return null;
  }
}

export function hashToken(token: string) {
  // A simple SHA-256 equivalent using Node.js crypto
  // For edge compatibility we can just use the token string if we want, but since we are running in Node (API route):
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(token).digest('hex');
}
