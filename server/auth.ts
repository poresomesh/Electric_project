import crypto from 'crypto';
import dotenv from 'dotenv';
import type { User, UserRole } from '../src/types.ts';

dotenv.config({ path: `${process.cwd()}/.env.local` });

const SESSION_COOKIE = 'voltwise_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const sessions = new Map<string, { user: AuthUser; expiresAt: number }>();

export type AuthUser = Pick<User, 'id' | 'username' | 'name' | 'role' | 'assignedBlockId' | 'email' | 'phone' | 'department' | 'designation'>;
type CredentialUser = AuthUser & { passwordHash: string };

export const DEFAULT_USER_PASSWORD = 'SOL@13';

function cookieValue(cookieHeader: string | undefined): string | null {
  const value = cookieHeader?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  return value ? decodeURIComponent(value.slice(SESSION_COOKIE.length + 1)) : null;
}

function safeUser(user: CredentialUser | any): AuthUser {
  const { passwordHash: _ph, password: _p, ...publicUser } = user;
  return publicUser as AuthUser;
}

// थेट ऑथेंटिकेशन - ॲडमिन आणि नॉर्मल युझर्स दोघांसाठी
export function authenticate(username: string, password: string): AuthUser | null {
  const login = username.trim().toLowerCase().replace(/^@/, '');

  // 1. फक्त Tejas / Admin साठी लॉगिन
  if (login === 'tejas' || login === 'admin') {
    if (password !== 'Tejas@') { // इथे पासवर्ड 'Tejas@' सेट केला आहे
      return null;
    }
    return {
      id: 'usr-admin',
      username: 'Tejas',
      name: 'Tejas Pawar',
      role: 'admin',
      assignedBlockId: 'ALL',
      department: 'Electrical Dept',
      designation: 'Admin / Lead Engineer',
    };
  }

  return null;
}

export function verifyPassword(passwordHash: string, password: string): boolean {
  if (!passwordHash) return false;
  
  if (passwordHash.startsWith('scrypt$')) {
    const parts = passwordHash.split('$');
    if (parts.length !== 3) return false;
    const [, salt, originalHash] = parts;
    const hashBuf = crypto.scryptSync(password, salt, 64);
    const originalBuf = Buffer.from(originalHash, 'hex');
    if (hashBuf.length !== originalBuf.length) return false;
    return crypto.timingSafeEqual(originalBuf, hashBuf);
  }

  return passwordHash === password;
}

export function userFromPasswordRecord(record: any, password: string): AuthUser | null {
  if (!record || !verifyPassword(record.passwordHash, password)) {
    return null;
  }
  return safeUser(record);
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  return `scrypt$${salt}$${crypto.scryptSync(password, salt, 64).toString('hex')}`;
}

export function createSession(user: AuthUser): string {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { user, expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
}

export function getSessionUser(cookieHeader: string | undefined): AuthUser | null {
  const token = cookieValue(cookieHeader);
  if (!token) return null;
  const session = sessions.get(token);
  if (!session || session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }
  return session.user;
}

export function destroySession(cookieHeader: string | undefined): void {
  const token = cookieValue(cookieHeader);
  if (token) sessions.delete(token);
}

export function sessionCookie(token: string): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${SESSION_TTL_MS / 1000}; SameSite=Lax${secure}`;
}

export function clearedSessionCookie(): string {
  return `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`;
}

export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === 'admin';
}

export function protectedAdminId(): string | null {
  return 'usr-admin';
}

export function publicUser(user: AuthUser): AuthUser {
  return { ...user };
}

export function roleAllowsBlock(_user: AuthUser, _blockId: string): boolean {
  return true;
}

export function roleOf(value: unknown): UserRole | null {
  return value === 'admin' || value === 'block_incharge' || value === 'viewer' ? value : null;
}