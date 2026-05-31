# VoiceNote

Voice recorder app — hold to record, release to stop. Audio is transcribed (Deepgram Nova-3), structured by Claude Sonnet into typed notes, saved to PostgreSQL, and emailed via Resend.

## Stack
- Next.js 16 (App Router, no src/ dir), TypeScript, Tailwind CSS v4
- Auth.js v5 (next-auth beta), JWT sessions, credentials provider (single user)
- Prisma 7 + PrismaPg adapter, PostgreSQL 16
- Deepgram Nova-3, Anthropic Claude Sonnet 4.6, Resend, Cloudflare R2

## Project Structure
- `lib/` — server-side modules (auth, prisma, deepgram, r2, structure, email)
- `components/` — React components (RecordButton, NoteCard, NoteRenderer)
- `app/` — Next.js App Router pages and API routes
- `prisma/` — schema and migrations
- `generated/prisma/` — Prisma client (gitignored, run `npx prisma generate`)
- `docs/superpowers/` — design spec and implementation plan

## Infrastructure
- Port: 3016
- PM2 name: `voicenote`
- Nginx: `/etc/nginx/sites-available/voicenote.zone.net.au`
- URL: `https://voicenote.zone.net.au`
- DB: PostgreSQL `voicenote` database

## Deploy
```bash
cd /var/www/voicenote
git pull
npm run build
pm2 delete voicenote && pm2 start ecosystem.config.cjs
pm2 save
```

## Key Commands
```bash
npx prisma migrate dev --name <name>   # new migration
npx prisma generate                     # regenerate client
npm run build                           # production build
pm2 logs voicenote                      # view logs
```

## Current Status
See RESUME.md for handoff state and blockers.
