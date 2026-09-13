import { authenticate, createSession, publicUser, sessionCookie, userFromPasswordRecord } from '../../server/auth.ts';
import { getCampusState } from '../../server/campusStore.ts';

export default async function handler(
  req: { method?: string; body?: unknown },
  res: { setHeader: (name: string, value: string) => void; status: (code: number) => { json: (body: unknown) => void } }
) {
  if ((req.method || 'GET').toUpperCase() !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}) as { username?: string; password?: string };
  const rawUsername = (body.username || '').trim().toLowerCase();
  const cleanUsername = rawUsername.replace(/^@/, '');
  const password = body.password || '';

  // 1. Check configured/admin users first
  let user = authenticate(rawUsername, password) || authenticate(cleanUsername, password);

  // 2. Check dynamic database users
  if (!user) {
    const campusState = await getCampusState();
    const record = campusState.users.find((candidate) => {
      const cUser = (candidate.username || '').trim().toLowerCase().replace(/^@/, '');
      const cId = (candidate.id || '').trim().toLowerCase();
      return cUser === cleanUsername || cId === cleanUsername;
    });

    if (record) {
      user = userFromPasswordRecord(record, password);
    }
  }

  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  res.setHeader('Set-Cookie', sessionCookie(createSession(user)));
  return res.status(200).json({ user: publicUser(user) });
}