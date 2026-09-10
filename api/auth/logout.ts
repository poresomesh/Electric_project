import { clearedSessionCookie, destroySession } from '../../server/auth.ts';

export default async function handler(req: { method?: string; headers?: { cookie?: string } }, res: { setHeader: (name: string, value: string) => void; status: (code: number) => { json: (body: unknown) => void } }) {
  destroySession(req.headers?.cookie);
  res.setHeader('Set-Cookie', clearedSessionCookie());
  return res.status(200).json({ ok: true });
}
