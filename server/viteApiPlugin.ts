import type { IncomingMessage, ServerResponse } from 'http';
import type { Plugin } from 'vite';
import { deleteNotification, deleteUser, getCampusState, handleCampusStateRequest, storageKind } from './campusStore.ts';
import { authenticate, createSession, destroySession, getSessionUser, sessionCookie, clearedSessionCookie, publicUser, userFromPasswordRecord } from './auth.ts';

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

export function viteCampusApiPlugin(): Plugin {
  return {
    name: 'voltwise-campus-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0] || '';
        if (url === '/api/auth/login') {
          if ((req.method || 'GET').toUpperCase() !== 'POST') {
            sendJson(res, 405, { error: 'Method not allowed' });
            return;
          }
          try {
            const body = JSON.parse(await readBody(req)) as { username?: string; password?: string };
            const username = body.username || '';
            const password = body.password || '';
            const user = authenticate(username, password) || (await (async () => {
              const record = (await getCampusState()).users.find((candidate) =>
                (candidate.username.toLowerCase() === username.trim().toLowerCase() ||
                  candidate.id.toLowerCase() === username.trim().toLowerCase()) && candidate.passwordHash
              );
              return record?.passwordHash ? userFromPasswordRecord(record as typeof record & { passwordHash: string }, password) : null;
            })());
            if (!user) {
              sendJson(res, 401, { error: 'Invalid username or password' });
              return;
            }
            res.setHeader('Set-Cookie', sessionCookie(createSession(user)));
            sendJson(res, 200, { user: publicUser(user) });
          } catch {
            sendJson(res, 400, { error: 'Invalid login request' });
          }
          return;
        }
        if (url === '/api/auth/me') {
          const user = getSessionUser(req.headers.cookie);
          sendJson(res, user ? 200 : 401, user ? { user: publicUser(user) } : { error: 'Authentication required' });
          return;
        }
        if (url === '/api/auth/logout') {
          destroySession(req.headers.cookie);
          res.setHeader('Set-Cookie', clearedSessionCookie());
          sendJson(res, 200, { ok: true });
          return;
        }
        const notificationMatch = url.match(/^\/api\/notifications\/([^/]+)$/);
        if (notificationMatch) {
          if ((req.method || 'GET').toUpperCase() !== 'DELETE') {
            sendJson(res, 405, { error: 'Method not allowed' });
            return;
          }
          const result = await deleteNotification(
            decodeURIComponent(notificationMatch[1]),
            getSessionUser(req.headers.cookie)
          );
          sendJson(res, result.status, result.body);
          return;
        }
        const userMatch = url.match(/^\/api\/users\/([^/]+)$/);
        if (userMatch) {
          if ((req.method || 'GET').toUpperCase() !== 'DELETE') {
            sendJson(res, 405, { error: 'Method not allowed' });
            return;
          }
          const result = await deleteUser(decodeURIComponent(userMatch[1]), getSessionUser(req.headers.cookie));
          sendJson(res, result.status, result.body);
          return;
        }
        if (url === '/api/health') {
          const kind = storageKind();
          sendJson(res, 200, {
            ok: true,
            storage: kind,
            isCloudSynced: kind === 'supabase' || kind === 'neon',
            isVercel: false,
            message: kind === 'supabase'
              ? 'Connected to Supabase cloud database (multi-device sync active)'
              : kind === 'neon'
                ? 'Connected to Neon cloud database (multi-device sync active)'
              : 'Using local file storage. Set DATABASE_URL for cloud sync.',
          });
          return;
        }
        if (url !== '/api/state') {
          next();
          return;
        }

        const method = (req.method || 'GET').toUpperCase();
        let incoming: Record<string, unknown> | undefined;
        if (method === 'PUT' || method === 'POST') {
          try {
            const raw = await readBody(req);
            incoming = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
          } catch {
            sendJson(res, 400, { error: 'Invalid JSON body', storage: storageKind() });
            return;
          }
        }
        const result = await handleCampusStateRequest(method, getSessionUser(req.headers.cookie), incoming);
        sendJson(res, result.status, result.body);
      });
    },
  };
}
