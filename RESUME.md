# VoiceNote — Resume Point

## Last Session: 2026-05-28 (VSCode Claude) + 2026-05-31 (Claude Code)

### Status: MVP Complete, Blocked on R2 Bucket

All 11 implementation tasks from the plan are committed and deployed. The app is running on PM2 at port 3016, Nginx is configured, and `voicenote.zone.net.au` resolves.

### What Was Completed
- Prisma 7 schema with Note model + NoteType enum, migration applied
- Auth.js v5 single-user credentials (JWT sessions, middleware protection)
- Login page (dark theme, `/login`)
- Deepgram Nova-3 transcription (`lib/deepgram.ts`) — SDK v5 API
- Claude Sonnet structuring with type detection (`lib/structure.ts`)
- R2 temporary audio upload/delete (`lib/r2.ts`)
- Resend email with per-type HTML rendering (`lib/email.ts`)
- Processing pipeline API (`POST /api/notes/process`)
- Search API (`GET /api/notes/search?q=&type=&page=`)
- UI: RecordButton (hold-to-record), NoteCard, NoteRenderer components
- Pages: recorder (`/`), notes list (`/notes`), note detail (`/notes/[id]`)
- PM2 ecosystem config, Nginx reverse proxy, port 3016

### Fixed This Session (2026-05-31)
- Fixed `R2_ACCOUNT_ID` in `.env` — was set to a Cloudflare API token instead of the account ID
- Added `logs/*.log` to `.gitignore`

### Blockers
1. **R2 bucket `voicenote-audio` does not exist** — must be created in Cloudflare dashboard (R2 > Create Bucket > name: `voicenote-audio`). The R2 endpoint and credentials in `.env` are correct, but the bucket itself hasn't been provisioned. Without this, all recordings fail with `NoSuchBucket`.
2. **No GitHub remote** — repo needs to be created on GitHub and remote added:
   ```bash
   cd /var/www/voicenote
   git remote add origin https://github.com/<org>/voicenote.git
   git push -u origin main
   ```

### Next Steps
1. Create R2 bucket `voicenote-audio` in Cloudflare dashboard
2. Create GitHub repo and push
3. Test end-to-end: login → record → transcribe → structure → save → email
4. Ask Jeff to create DNS A record: `voicenote` → `178.16.138.108` (if not already done)
5. After verifying, rebuild and restart PM2:
   ```bash
   cd /var/www/voicenote
   npm run build
   pm2 delete voicenote && pm2 start ecosystem.config.cjs
   pm2 save
   ```

### Key Files
- Pipeline: `app/api/notes/process/route.ts`
- Auth: `lib/auth.ts`, `middleware.ts`
- Transcription: `lib/deepgram.ts`
- Structuring: `lib/structure.ts`
- Storage: `lib/r2.ts`
- Email: `lib/email.ts`
- DB: `lib/prisma.ts`, `prisma/schema.prisma`
- UI: `components/RecordButton.tsx`, `components/NoteCard.tsx`, `components/NoteRenderer.tsx`
- Pages: `app/page.tsx` (recorder), `app/notes/page.tsx` (list), `app/notes/[id]/page.tsx` (detail)
- Config: `ecosystem.config.cjs`, `.env`
- Plan: `docs/superpowers/plans/2026-05-28-voicenote-v1.md`
- Spec: `docs/superpowers/specs/2026-05-28-voicenote-design.md`
