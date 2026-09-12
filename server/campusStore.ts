import fs from 'fs/promises';
import path from 'path';
import { neon } from '@neondatabase/serverless';
import { mergeSharedState, type SharedCampusState } from '../src/sync/mergeState.ts';
import { DEFAULT_USER_PASSWORD, type AuthUser, hashPassword, isAdmin, protectedAdminId, roleAllowsBlock } from './auth.ts';

const STATE_ID = 'campus';
const LOCAL_STATE_FILE = process.env.VERCEL
  ? path.join('/tmp', 'campus-state.json')
  : path.join(process.cwd(), 'data', 'campus-state.json');

export type StorageKind = 'supabase' | 'neon' | 'file';

export function storageKind(): StorageKind {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) return 'supabase';
  return process.env.DATABASE_URL ? 'neon' : 'file';
}

function removeUserSecrets(incoming: Partial<SharedCampusState>): Partial<SharedCampusState> {
  return {
    ...incoming,
    users: incoming.users?.map(({ password, ...user }) => ({
      ...user,
      ...(password ? { passwordHash: hashPassword(password) } : {}),
    })),
  };
}

function supabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase configuration is incomplete');
  return { url: url.replace(/\/$/, ''), key };
}

function emptyState(): SharedCampusState {
  return {
    version: 0,
    users: [],
    blocks: [],
    meters: [],
    readings: [],
    tariff: undefined as unknown as SharedCampusState['tariff'],
    msebBlocks: [],
    msebReadings: [],
    msebTariffs: {},
    deletedReadingIds: [],
    deletedMsebReadingIds: [],
    deletedNotificationIds: [],
    deletedUserIds: [],
    dailyLimits: [],
    exceedances: [],
    notifications: [],
  };
}

async function ensureNeonTable() {
  let dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl && !dbUrl.includes('sslmode=')) {
    dbUrl += dbUrl.includes('?') ? '&sslmode=require' : '?sslmode=require';
  }
  const sql = neon(dbUrl);
  await sql`
    CREATE TABLE IF NOT EXISTS campus_state (
      id TEXT PRIMARY KEY,
      version INTEGER NOT NULL DEFAULT 0,
      payload TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  return sql;
}

async function loadState(): Promise<SharedCampusState | null> {
  if (storageKind() === 'supabase') {
    const { url, key } = supabaseConfig();
    const response = await fetch(`${url}/rest/v1/campus_state?id=eq.${STATE_ID}&select=version,payload&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!response.ok) throw new Error(`Supabase read failed (${response.status})`);
    const rows = (await response.json()) as Array<{ version: number; payload: string }>;
    if (!rows.length) return null;
    const parsed = JSON.parse(rows[0].payload) as SharedCampusState;
    parsed.version = Number(rows[0].version) || parsed.version || 0;
    return normalizeUserCredentials(parsed);
  }

  if (storageKind() === 'neon') {
    try {
      const sql = await ensureNeonTable();
      const rows = (await sql`
        SELECT version, payload FROM campus_state WHERE id = ${STATE_ID} LIMIT 1
      `) as Array<{ version: number; payload: string }>;
      if (!rows.length) return null;
      const parsed = JSON.parse(rows[0].payload) as SharedCampusState;
      parsed.version = Number(rows[0].version) || parsed.version || 0;
      return normalizeUserCredentials(parsed);
    } catch (err) {
      console.error('[Neon DB Read Error]', err);
    }
  }

  try {
    const raw = await fs.readFile(LOCAL_STATE_FILE, 'utf8');
    return normalizeUserCredentials(JSON.parse(raw) as SharedCampusState);
  } catch {
    return null;
  }

  function normalizeUserCredentials(state: SharedCampusState): SharedCampusState {
    const adminId = protectedAdminId();
    const needsDefaultMigration = (state.userPasswordPolicyVersion || 0) < 2;
    return {
      ...state,
      userPasswordPolicyVersion: 2,
      users: state.users.map((user) => (
        needsDefaultMigration && user.id !== adminId && user.role !== 'admin'
          ? { ...user, passwordHash: hashPassword(DEFAULT_USER_PASSWORD) }
          : user.passwordHash
            ? user
            : { ...user, passwordHash: hashPassword(DEFAULT_USER_PASSWORD) }
      )),
    };
  }
}

async function persistState(state: SharedCampusState): Promise<void> {
  const payload = JSON.stringify(state);

  if (storageKind() === 'supabase') {
    const { url, key } = supabaseConfig();
    const response = await fetch(`${url}/rest/v1/campus_state?on_conflict=id`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify([{ id: STATE_ID, version: state.version, payload, updated_at: new Date().toISOString() }]),
    });
    if (!response.ok) throw new Error(`Supabase write failed (${response.status})`);
    return;
  }

  if (storageKind() === 'neon') {
    try {
      const sql = await ensureNeonTable();
      await sql`
        INSERT INTO campus_state (id, version, payload, updated_at)
        VALUES (${STATE_ID}, ${state.version}, ${payload}, NOW())
        ON CONFLICT (id) DO UPDATE SET
          version = EXCLUDED.version,
          payload = EXCLUDED.payload,
          updated_at = NOW()
      `;
      return;
    } catch (err) {
      console.error('[Neon DB Write Error]', err);
    }
  }

  await fs.mkdir(path.dirname(LOCAL_STATE_FILE), { recursive: true });
  const tmp = `${LOCAL_STATE_FILE}.tmp`;
  await fs.writeFile(tmp, payload, 'utf8');
  await fs.rename(tmp, LOCAL_STATE_FILE);
}

export async function getCampusState(): Promise<SharedCampusState> {
  return (await loadState()) || emptyState();
}

export async function putCampusState(
  incoming: Partial<SharedCampusState>
): Promise<SharedCampusState> {
  const current = (await loadState()) || emptyState();

  // mergeSharedState वापरल्याने MongoDB Atlas प्रमाणे सर्व ऐतिहासिक readings, meters आणि users आपोआप सिंक राहतात
  const merged = mergeSharedState(current, removeUserSecrets(incoming));

  const next: SharedCampusState = {
    ...merged,
    version: (current.version || 0) + 1,
    // 1. ब्लॉक इनचार्जचे नाव आणि आयडी कायमस्वरूपी सेव्ह ठेवणे
    blocks: incoming.blocks
      ? incoming.blocks.map((incBlock) => {
          const old = current.blocks.find((b) => b.id === incBlock.id);
          return {
            ...old,
            ...incBlock,
            inchargeId: incBlock.inchargeId !== undefined ? incBlock.inchargeId : (old?.inchargeId || ''),
            inchargeName: incBlock.inchargeName !== undefined ? incBlock.inchargeName : (old?.inchargeName || 'Unassigned'),
          };
        })
      : merged.blocks,
    // 2. नवीन तयार केलेले युझर्स गायब न होऊ देणे
    users: incoming.users
      ? (() => {
          const incomingIds = new Set(incoming.users.map((u) => u.id));
          const retainedOldUsers = current.users.filter((u) => !incomingIds.has(u.id));
          return [...retainedOldUsers, ...incoming.users];
        })()
      : merged.users,
  };

  await persistState(next);
  return next;
}

export async function deleteNotification(notificationId: string, user: AuthUser | null): Promise<StateApiResult> {
  if (!user) return { status: 401, body: { error: 'Authentication required', storage: storageKind() } };
  const state = await getCampusState();
  const notification = state.notifications.find((item) => item.id === notificationId);
  if (!notification) return { status: 404, body: { error: 'Notification not found', storage: storageKind() } };
  const ownerId = notification.userId || state.blocks.find((block) => block.id === notification.blockId)?.inchargeId;
  const authorized = isAdmin(user) || ownerId === user.id;
  if (!authorized) return { status: 403, body: { error: 'Forbidden', storage: storageKind() } };
  const next = mergeSharedState(state, {
    deletedNotificationIds: [...(state.deletedNotificationIds || []), notificationId],
    notifications: [],
  });
  await persistState(next);
  return { status: 200, body: sanitizeState(next) };
}

export async function deleteUser(userId: string, user: AuthUser | null): Promise<StateApiResult> {
  if (!user) return { status: 401, body: { error: 'Authentication required', storage: storageKind() } };
  if (!isAdmin(user) || userId === protectedAdminId()) {
    return { status: 403, body: { error: 'Forbidden', storage: storageKind() } };
  }
  const state = await getCampusState();
  if (!state.users.some((candidate) => candidate.id === userId)) {
    return { status: 404, body: { error: 'User not found', storage: storageKind() } };
  }
  const next = mergeSharedState(state, {
    users: [],
    blocks: state.blocks.map((block) =>
      block.inchargeId === userId ? { ...block, inchargeId: '', inchargeName: 'Unassigned' } : block
    ),
    deletedUserIds: [...(state.deletedUserIds || []), userId],
  });
  await persistState(next);
  return { status: 200, body: sanitizeState(next) };
}

export type StateApiResult = {
  status: number;
  body: SharedCampusState | { error: string; storage: StorageKind };
};

function sanitizeState(state: SharedCampusState): SharedCampusState {
  return {
    ...state,
    users: state.users.map(({ password: _password, passwordHash, ...user }) => ({
      ...user,
      passwordConfigured: Boolean(passwordHash),
    })),
  };
}

function canWriteState(user: AuthUser, incoming: Partial<SharedCampusState>): boolean {
  if (isAdmin(user)) return true;
  if (user.role === 'viewer') return false;
  if (incoming.users || incoming.blocks || incoming.meters || incoming.tariff || incoming.msebBlocks || incoming.msebTariffs) {
    return false;
  }
  const readingsAllowed = (incoming.readings || []).every((reading) => roleAllowsBlock(user, reading.blockId));
  const exceedancesAllowed = (incoming.exceedances || []).every((item) => roleAllowsBlock(user, item.blockId));
  const notificationsAllowed = (incoming.notifications || []).every((item) => roleAllowsBlock(user, item.blockId));
  return readingsAllowed && exceedancesAllowed && notificationsAllowed;
}

function validateUserChanges(current: SharedCampusState, incoming: Partial<SharedCampusState>): string | null {
  if (!incoming.users) return null;
  const adminId = protectedAdminId();
  const currentById = new Map(current.users.map((candidate) => [candidate.id, candidate]));
  for (const candidate of incoming.users) {
    const existing = currentById.get(candidate.id);
    if (candidate.id === adminId) {
      if (candidate.username !== existing?.username || candidate.role !== 'admin') {
        return 'The protected administrator identity cannot be changed';
      }
    }
    if (candidate.role === 'admin' && candidate.id !== adminId) {
      return 'Only the protected administrator may have the admin role';
    }
  }

  // युझर्स अपडेट करताना ड्युप्लिकेट युझरनेमचा गैरसमज दूर करण्यासाठी Map वापरणे
  const userMap = new Map(current.users.map((u) => [u.id, u]));
  for (const u of incoming.users) {
    userMap.set(u.id, { ...(userMap.get(u.id) || {}), ...u });
  }

  const ids = new Set<string>();
  const usernames = new Set<string>();
  for (const candidate of userMap.values()) {
    const username = (candidate.username || '').trim().toLowerCase();
    if (ids.has(candidate.id) || (username && usernames.has(username))) {
      return 'User IDs and login IDs must be unique';
    }
    ids.add(candidate.id);
    if (username) usernames.add(username);
  }
  return null;
}

function validateNotificationChanges(
  current: SharedCampusState,
  incoming: Partial<SharedCampusState>,
  user: AuthUser
): string | null {
  if (isAdmin(user) || !incoming.notifications) return null;
  const existingById = new Map(current.notifications.map((item) => [item.id, item]));
  for (const candidate of incoming.notifications) {
    const existing = existingById.get(candidate.id);
    if (!existing) {
      const relatedExceedance = (incoming.exceedances || current.exceedances)
        .find((item) => item.id === candidate.exceedanceId);
      const adminId = current.users.find((item) => item.role === 'admin')?.id;
      const canSubmitRemark =
        candidate.type === 'exceedance_remark_submitted' &&
        Boolean(relatedExceedance?.remark) &&
        relatedExceedance?.status === 'responded' &&
        relatedExceedance.respondedBy === user.id &&
        roleAllowsBlock(user, relatedExceedance.blockId) &&
        (candidate.userId === adminId || !candidate.userId) &&
        candidate.blockId === relatedExceedance.blockId &&
        candidate.readingDate === relatedExceedance.readingDate &&
        candidate.exceedanceId === relatedExceedance.id;
      if (!canSubmitRemark) return 'Users cannot create or rewrite notification records';
      continue;
    }
    const ownerId = existing.userId || current.blocks.find((block) => block.id === existing.blockId)?.inchargeId;
    if (ownerId !== user.id) {
      const unchanged =
        candidate.userId === existing.userId &&
        candidate.exceedanceId === existing.exceedanceId &&
        candidate.blockId === existing.blockId &&
        candidate.title === existing.title &&
        candidate.message === existing.message &&
        candidate.readByUserIds.length === existing.readByUserIds.length &&
        candidate.readByUserIds.every((id) => existing.readByUserIds.includes(id));
      if (!unchanged) return 'Forbidden';
      continue;
    }
    if (
      candidate.userId !== existing.userId ||
      candidate.exceedanceId !== existing.exceedanceId ||
      candidate.blockId !== existing.blockId ||
      candidate.title !== existing.title ||
      candidate.message !== existing.message ||
      candidate.readByUserIds.some((id) => id !== user.id && !existing.readByUserIds.includes(id)) ||
      existing.readByUserIds.some((id) => !candidate.readByUserIds.includes(id))
    ) {
      return 'Notification fields are server-managed';
    }
  }
  return null;
}

export async function handleCampusStateRequest(
  method: string,
  user: AuthUser | null,
  incoming?: Partial<SharedCampusState>
): Promise<StateApiResult> {
  try {
    if (!user) return { status: 401, body: { error: 'Authentication required', storage: storageKind() } };
    if (method === 'GET') {
      const state = await getCampusState();
      const visible = isAdmin(user)
        ? state
        : {
            ...state,
            users: state.users.filter((candidate) => candidate.id === user.id),
            blocks: state.blocks.filter((block) => roleAllowsBlock(user, block.id)),
            meters: state.meters.filter((meter) => roleAllowsBlock(user, meter.blockId)),
            readings: state.readings.filter((reading) => roleAllowsBlock(user, reading.blockId)),
            exceedances: state.exceedances.filter((item) => roleAllowsBlock(user, item.blockId)),
            notifications: state.notifications.filter((item) =>
              item.userId ? item.userId === user.id : roleAllowsBlock(user, item.blockId)
            ),
          };
      return { status: 200, body: sanitizeState(visible) };
    }
    if (method === 'PUT' || method === 'POST') {
      if (!canWriteState(user, incoming || {})) {
        return { status: 403, body: { error: 'Forbidden', storage: storageKind() } };
      }
      const current = await getCampusState();
      const validationError = validateUserChanges(current, incoming || {});
      if (validationError) return { status: 409, body: { error: validationError, storage: storageKind() } };
      const notificationError = validateNotificationChanges(current, incoming || {}, user);
      if (notificationError) return { status: 403, body: { error: notificationError, storage: storageKind() } };
      const saved = await putCampusState(incoming || {});
      const visible = isAdmin(user)
        ? saved
        : {
            ...saved,
            users: saved.users.filter((candidate) => candidate.id === user.id),
            blocks: saved.blocks.filter((block) => roleAllowsBlock(user, block.id)),
            meters: saved.meters.filter((meter) => roleAllowsBlock(user, meter.blockId)),
            readings: saved.readings.filter((reading) => roleAllowsBlock(user, reading.blockId)),
            exceedances: saved.exceedances.filter((item) => roleAllowsBlock(user, item.blockId)),
            notifications: saved.notifications.filter((item) =>
              item.userId ? item.userId === user.id : roleAllowsBlock(user, item.blockId)
            ),
          };
      return { status: 200, body: sanitizeState(visible) };
    }
    return {
      status: 405,
      body: { error: 'Method not allowed', storage: storageKind() },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to access campus store';
    return { status: 500, body: { error: message, storage: storageKind() } };
  }
}