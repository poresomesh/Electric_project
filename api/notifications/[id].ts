import { deleteNotification } from '../../server/campusStore.ts';
import { getSessionUser } from '../../server/auth.ts';

export default async function handler(
  req: { method?: string; headers?: { cookie?: string }; query?: { id?: string | string[] } },
  res: { status: (code: number) => { json: (body: unknown) => void } }
) {
  if ((req.method || 'GET').toUpperCase() !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });
  const value = req.query?.id;
  const id = Array.isArray(value) ? value[0] : value;
  if (!id) return res.status(400).json({ error: 'Notification id is required' });
  const result = await deleteNotification(id, getSessionUser(req.headers?.cookie));
  return res.status(result.status).json(result.body);
}
