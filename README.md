# DailyDose

**Live app: [daily-dose-xi.vercel.app](https://daily-dose-xi.vercel.app/)**

**A newspaper you edit.** Pick the topics you care about, and DailyDose uses AI with live web search to write you a fresh, sourced briefing on each, on demand.

DailyDose turns "what's new with X?" into a one-click habit. Add a topic (say, *Hollywood movies* or *the NBA*), optionally tell it what you specifically want to know, and it searches the web and summarizes the latest developments into a concise, cited briefing.

## Features

- **Topic wall:** add the things you follow as tiles in a clean, card-based grid.
- **AI briefings:** click a tile and get a short, current briefing written by Claude, grounded in live web search, with the sources it used linked at the bottom.
- **Focused briefings:** give a topic an optional description ("focus on upcoming releases and trailers") to steer what the briefing covers.
- **Smart caching:** a briefing is reused until it's 24 hours old or the calendar day changes, so you don't re-generate (and re-pay) needlessly. A **Refresh** button forces a fresh one.
- **Edit & manage:** update a topic's description (which regenerates its briefing) or delete it, with a confirmation step so nothing disappears by accident.
- **Accounts:** email + password sign-up/sign-in, with password reset.
- **Cost guardrail:** a daily cap of 25 briefing generations per user keeps API usage bounded.
- **Mobile-friendly:** responsive layout that reads well on a phone.

## Tech stack

- **Framework:** Next.js 15 (App Router) + React 19
- **Auth:** Auth.js (NextAuth v5), credentials + JWT sessions
- **Database:** PostgreSQL via Prisma (works great on [Neon](https://neon.tech))
- **AI:** Anthropic Claude (`claude-haiku-4-5`) with the `web_search` tool for grounded, sourced output
- **Email:** Resend (optional, for password-reset links)
- **Tests:** Vitest + Testing Library

## Getting started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment:** copy the example and fill it in:
   ```bash
   cp .env.example .env
   ```
   | Variable | What it is |
   |----------|------------|
   | `DATABASE_URL` | Postgres connection string (pooled). Neon's free tier works well. |
   | `DIRECT_URL` | Direct (unpooled) Postgres string for migrations. Locally, the same value as `DATABASE_URL` is fine. |
   | `ANTHROPIC_API_KEY` | Claude API key from [console.anthropic.com](https://console.anthropic.com) (used for briefings + web search). |
   | `AUTH_SECRET` | Session-signing secret. Generate with `openssl rand -base64 32`. |
   | `RESEND_API_KEY` | *(optional)* Enables real password-reset emails. Without it, reset links are logged to the server console. |
   | `APP_URL` | *(optional)* Base URL for reset links. Defaults to the deployment URL on Vercel, or `localhost` locally. |

3. **Create the database schema**
   ```bash
   npx prisma migrate dev
   ```

4. **Run the dev server**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000.

## Testing

```bash
npm test
```

## How it works

1. You add a **topic** (a title, plus an optional description of what you want to know).
2. When you open a topic, DailyDose asks Claude to write a briefing. Claude runs live **web searches**, then summarizes the most recent, relevant developments into short markdown sections and cites its sources.
3. The result is **cached** and shown until it's 24 hours old or the calendar day rolls over, then it regenerates automatically. Editing a topic's description also invalidates its cache. **Refresh** forces a new briefing any time.
4. A per-user **daily cap of 25 generations** keeps costs predictable.

## Deployment

DailyDose is deployed on **Vercel** with a **Neon** Postgres database, live at [daily-dose-xi.vercel.app](https://daily-dose-xi.vercel.app/):

- The build runs `prisma migrate deploy` automatically, so the production schema is created/updated on each deploy.
- Set the environment variables above in your Vercel project settings (use Neon's pooled string for `DATABASE_URL` and its direct string for `DIRECT_URL`).
- Both hosts have free tiers, so hosting cost is **$0**. The only usage-based cost is the Anthropic API (roughly a few cents per generated briefing, thanks to caching).
