import { mergeSharedState, type SharedCampusState } from '../src/sync/mergeState';

interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  ENERGY_STORE: {
    idFromName: (name: string) => { toString(): string };
    get: (id: { toString(): string }) => { fetch: (request: Request) => Promise<Response> };
  };
}

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

export class EnergyStore {
  constructor(private readonly ctx: DurableObjectState, _env: Env) {}

  async fetch(request: Request): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method === 'GET') {
      const stored = (await this.ctx.storage.get<SharedCampusState>('campus')) || null;
      return json(stored);
    }

    if (request.method === 'PUT') {
      const incoming = (await request.json()) as Partial<SharedCampusState>;
      const current = (await this.ctx.storage.get<SharedCampusState>('campus')) || null;
      const merged = mergeSharedState(current, incoming);
      await this.ctx.storage.put('campus', merged);
      return json(merged);
    }

    return json({ error: 'Method not allowed' }, 405);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/state' || url.pathname.startsWith('/api/')) {
      const id = env.ENERGY_STORE.idFromName('campus-shared');
      return env.ENERGY_STORE.get(id).fetch(request);
    }
    return env.ASSETS.fetch(request);
  },
};
