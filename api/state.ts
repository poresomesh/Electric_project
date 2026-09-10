import { handleCampusStateRequest } from '../server/campusStore.ts';
import { getSessionUser } from '../server/auth.ts';

type VercelRequest = {
  method?: string;
  body?: unknown;
  headers?: { cookie?: string };
  query?: { id?: string | string[] };
};

type VercelResponse = {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  const method = (req.method || 'GET').toUpperCase();
  const incoming =
    method === 'PUT' || method === 'POST'
      ? ((typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as Record<string, unknown>)
      : undefined;
  const result = await handleCampusStateRequest(method, getSessionUser(req.headers?.cookie), incoming);
  res.status(result.status).json(result.body);
}
