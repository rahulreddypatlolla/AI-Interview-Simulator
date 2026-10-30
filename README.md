# AI-Based Adaptive Interview Simulator — Frontend

A React + TypeScript + Vite starter interface with an interview-first landing page, dashboard, interview setup, a typed-answer practice room, report view, progress analytics, and mentor/admin placeholder screens.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

## Build check

```bash
npm run build
```

## Important scope notes

- The dashboard and reports currently use sample/demo data.
- The practice room's feedback is a simple local demo rubric, not an AI model evaluation.
- Supabase setup is optional at this stage. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env.local` to enable the client helper.
- Never place a Supabase service-role key, model API key, or other secret in frontend environment variables.
- Add database schema, Row Level Security policies, and a protected backend before storing real candidate information.
"# AI-Interview-Simulator" 
