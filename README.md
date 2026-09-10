<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/93e8e709-ae1d-4794-980c-11b272c5bdd2

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Supabase cloud storage

The server supports Supabase through server-only environment variables. Create
the `campus_state` table by running [database/schema.sql](database/schema.sql)
in the Supabase SQL Editor, then set:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-server-only-secret-key
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` through client-side `VITE_*` variables
or commit it to the repository. Verify the connection at `/api/health`.

## Authentication and authorization

Authentication is server-session based. Configure `AUTH_USERS_JSON` with the
server-side credentials for the administrator and block users. The server
issues an HttpOnly session cookie and derives the role from that session;
localStorage, URL parameters, and frontend role values are not authorization
sources. `/api/state` requires an authenticated session, and non-admin
sessions cannot write users, blocks, meters, tariffs, or cross-block data.
