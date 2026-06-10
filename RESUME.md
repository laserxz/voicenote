# VoiceNote — Resume Point

## Last Session: 2026-06-09 (Claude Code)

### Status: MVP deployed + hardening/UX pass complete

App is live at `https://voicenote.zone.net.au` (PM2 `voicenote`, port 3016).
GitHub remote: `https://github.com/laserxz/voicenote` (main is pushed).

### Completed 2026-06-09 — review fixes
- **Never-lose-a-note pipeline**: structuring failure now falls back to saving a RAW note (transcript preserved); R2 audio deleted only *after* the note is in the DB; on processing failure the audio is kept in R2 and the key is logged for recovery
- **Structuring via tool use**: `lib/structure.ts` uses a forced `save_note` tool (guaranteed JSON), `max_tokens` 4000 with truncation detection, and `normalizeStructured()` coerces LLM output to the exact shapes renderers expect
- **Defensive rendering**: `NoteRenderer` and email renderer no longer crash on off-schema content (old notes included)
- **Email**: all transcript-derived values HTML-escaped
- **RecordButton**: failed uploads keep the audio blob — tap retries, "Discard recording" resets; tap-to-record *and* hold-to-record both work (600ms threshold); removed accidental-stop on pointer-leave; screen wake lock while recording
- **Auth**: bcrypt hash comparison (`ADMIN_PASSWORD_HASH` in `.env`, plaintext kept commented for recovery); duplicate `NEXTAUTH_SECRET` removed (`AUTH_SECRET` is canonical)
- **nginx**: rate limit on `POST /api/auth/callback/credentials` (10r/m, burst 5) via `conf.d/voicenote-ratelimit.conf`
- **Middleware**: `/api/*` excluded from redirect matcher (API returns clean 401s); manifest/icons public
- **Notes list**: "Load more" pagination (was capped at 20 with no way to page)
- **PWA**: `app/manifest.ts`, mic icons (`public/icons/`), apple-touch-icon, theme color — installable on iOS/Android

### Known gaps / ideas
- No service worker (installable, but no offline support)
- Search is Postgres `ILIKE`; switch to full-text search if the notes table grows large
- Failed-processing audio recovery is manual (key is in `pm2 logs voicenote`, object under `voicenote/` prefix in the `memoir-storage` bucket)

### Key Files
- Pipeline: `app/api/notes/process/route.ts`
- Auth: `lib/auth.ts`, `middleware.ts`
- Transcription: `lib/deepgram.ts`
- Structuring + normalization: `lib/structure.ts`
- Storage: `lib/r2.ts`
- Email: `lib/email.ts`
- UI: `components/RecordButton.tsx`, `components/NoteCard.tsx`, `components/NoteRenderer.tsx`, `components/NoteActions.tsx`
- Pages: `app/page.tsx` (recorder), `app/notes/page.tsx` (list), `app/notes/[id]/page.tsx` (detail)
- Config: `ecosystem.config.cjs`, `.env`, `app/manifest.ts`
