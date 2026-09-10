import { getSessionUser, publicUser } from '../../server/auth.ts';

export default async function handler(req: { headers?: { cookie?: string } }, res: { status: (code: number) => { json: (body: unknown) => void } }) {
  const user = getSessionUser(req.headers?.cookie);
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  return res.status(200).json({ user: publicUser(user) });
}
