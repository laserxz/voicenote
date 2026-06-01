# VoiceNote — Resume Point

## Last Session: 2026-05-28 (VSCode Claude) + 2026-06-01 (Claude Code)

### Status: MVP Working — End-to-End Pipeline Verified

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

### Fixed This Session (2026-06-01)
- Fixed R2 config: uses `memoir-storage` bucket with `voicenote/` prefix (not a separate bucket)
- Fixed R2 credentials to match memoir's working API keys
- Fixed `R2_ACCOUNT_ID` in `.env` — was set to a Cloudflare API token instead of the account ID
- Updated `lib/r2.ts` to prefix all keys with `voicenote/`
- Fixed Anthropic SDK auth: system env had empty `ANTHROPIC_API_KEY` (set by Claude Code) shadowing `.env` value. Fixed by loading `.env` via dotenv in `ecosystem.config.cjs` so PM2 injects vars explicitly
- Added `logs/*.log` to `.gitignore`
- Rebuilt and restarted PM2
- **Verified working**: record → transcribe → structure → save → email pipeline confirmed

### Remaining
1. **No GitHub remote** — repo needs to be created on GitHub and remote added:
   ```bash
   cd /var/www/voicenote
   git remote add origin https://github.com/<org>/voicenote.git
   git push -u origin main
   ```
2. Check email delivery (Resend) is working
3. Consider UX improvements (tap-to-record vs hold-to-record, loading states, etc.)

### Next Steps
1. Create GitHub repo and push
2. Confirm DNS A record for `voicenote.zone.net.au`
3. Test end-to-end: login → record → transcribe → structure → save → email
4. If issues, check `pm2 logs voicenote` for errors

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
