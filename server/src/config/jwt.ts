import jwt, { VerifyOptions } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  roleId?: string | null;
  permissions?: string[];
  iat?: number;
  exp?: number;
}

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(
    payload,
    JWT_SECRET as string,
    { 
      expiresIn: JWT_EXPIRES_IN as any,
      algorithm: 'HS256'
    }
  );
};

export const verifyToken = (token: string): JWTPayload => {
  const verifyOptions: VerifyOptions = {
    algorithms: ['HS256']
  };
  return jwt.verify(token, JWT_SECRET as string, verifyOptions) as JWTPayload;
};

export { JWT_SECRET };
