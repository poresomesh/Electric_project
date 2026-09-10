import crypto from 'crypto';
import dotenv from 'dotenv';
import type { User, UserRole } from '../src/types.ts';

dotenv.config({ path: `${process.cwd()}/.env.local` });

const SESSION_COOKIE = 'voltwise_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const sessions = new Map<string, { user: AuthUser; expiresAt: number }>();

export type AuthUser = Pick<User, 'id' | 'username' | 'name' | 'role' | 'assignedBlockId' | 'email' | 'phone' | 'department' | 'designation'>;

type CredentialUser = AuthUser & { passwordHash: string };

export const DEFAULT_USER_PASSWORD = process.env.DEFAULT_USER_PASSWORD || 'SOL@13';

function configuredUsers(): CredentialUser[] {
  const raw = process.env.AUTH_USERS_JSON;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as CredentialUser[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((user) =>
      typeof user.id === 'string' &&
      typeof user.username === 'string' &&
      typeof user.passwordHash === 'string' &&
      ['admin', 'block_incharge', 'viewer'].includes(user.role)
    );
  } catch (error) {
    console.error('AUTH_USERS_JSON is invalid', error);
    return [];
  }
}

function cookieValue(cookieHeader: string | undefined): string | null {
  const value = cookieHeader?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  return value ? decodeURIComponent(value.slice(SESSION_COOKIE.length + 1)) : null;
}

function safeUser(user: CredentialUser): AuthUser {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

export function authenticate(username: string, password: string): AuthUser | null {
  const login = username.trim().toLowerCase();
  const user = configuredUsers().find((candidate) =>
    candidate.username.toLowerCase() === login || candidate.id.toLowerCase() === login
  );
  if (!user) return null;
  if (!verifyPassword(user.passwordHash, password)) return null;
  return safeUser(user);
}

export function verifyPassword(passwordHash: string, password: string): boolean {
  const [scheme, salt, digest] = passwordHash.split('$');
  if (scheme !== 'scrypt' || !salt || !digest || !/^[0-9a-f]+$/i.test(salt) || !/^[0-9a-f]+$/i.test(digest)) return false;
  const supplied = crypto.scryptSync(password, salt, digest.length / 2);
  const expected = Buffer.from(digest, 'hex');
  return expected.length === supplied.length && crypto.timingSafeEqual(expected, supplied);
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  return `scrypt$${salt}$${crypto.scryptSync(password, salt, 64).toString('hex')}`;
}

export function userFromPasswordRecord(record: CredentialUser, password: string): AuthUser | null {
  return verifyPassword(record.passwordHash, password) ? safeUser(record) : null;
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
  return configuredUsers().find((user) => user.role === 'admin')?.id || null;
}

export function publicUser(user: AuthUser): AuthUser {
  return { ...user };
}

export function roleAllowsBlock(user: AuthUser, blockId: string): boolean {
  return user.role === 'admin' || user.assignedBlockId === 'ALL' || user.assignedBlockId === blockId;
}

export function roleOf(value: unknown): UserRole | null {
  return value === 'admin' || value === 'block_incharge' || value === 'viewer' ? value : null;
}
