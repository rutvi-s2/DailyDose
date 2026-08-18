# DailyDose

Daily briefings on the topics you care about.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — a Postgres connection string (Neon/Supabase free tier works)
   - `ANTHROPIC_API_KEY` — a Claude API key from console.anthropic.com (used for briefings + web search)
   - `AUTH_SECRET` — run `openssl rand -base64 32`
3. `npx prisma migrate dev` to create the schema
4. `npm run dev` and open http://localhost:3000

## Testing

`npm test`

## How it works

- Sign up / sign in (email + password).
- Add topics to your wall; click one for a web-grounded briefing.
- Briefings cache until they are 24h old or the calendar day changes; Refresh forces a new one.
- Limit: 10 briefing generations per user per day.
