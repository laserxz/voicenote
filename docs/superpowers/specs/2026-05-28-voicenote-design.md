# VoiceNote — Design Spec
Date: 2026-05-28

## Overview
Single-user voice recorder app. Hold to record, release to stop. Audio is transcribed via Deepgram Nova-3, structured by Claude Sonnet into a typed note, saved to PostgreSQL, emailed to the user, and the audio deleted from R2.

## Stack
- Next.js 15 (App Router, no src/ dir), TypeScript, Tailwind CSS v4
- Auth.js v5 (next-auth beta), JWT sessions, credentials provider
- Prisma 7 + PrismaPg adapter, PostgreSQL 16
- Deepgram Nova-3 (transcription)
- Anthropic Claude Sonnet 4.6 (structuring)
- Resend (email)
- Cloudflare R2 (temporary audio storage)

## Auth
- Single-user: credentials read from ADMIN_EMAIL + ADMIN_PASSWORD env vars
- JWT session strategy (no DB session storage)
- Middleware protects all routes except /login and /api/auth/*
- No signup, no password reset, no account management

## Database Schema (Prisma 7, prisma.config.ts pattern)
Single model:
```
Note {
  id         String   @id @default(cuid())
  title      String?
  transcript String
  structured Json
  noteType   NoteType
  duration   Int?
  emailedAt  DateTime?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

enum NoteType { LIST BRAINSTORM POSTMORTEM MEETING ACTION_ITEMS JOURNAL PROBLEM RAW }
```

No User, Session, Account, or VerificationToken models.

## Processing Pipeline
POST /api/notes/process (multipart form, `audio` field):
1. Auth check
2. Upload WebM buffer to R2 (key: `{uuid}.webm`)
3. Transcribe with Deepgram Nova-3 (en-AU, smart_format, punctuate)
4. Structure with Claude Sonnet — detect type, generate title, return typed JSON
5. Delete from R2
6. Save Note to DB
7. Email to EMAIL_TO_DEFAULT via Resend
8. Return { note, structured }
On error: delete R2 key if uploaded, re-throw

## API Routes
- `POST /api/notes/process` — pipeline above
- `GET /api/notes/search?q=&type=&page=` — paginated list, icontains search on title + transcript (no fullTextSearch preview feature needed for single-user scale)

## Lib Files
- `lib/prisma.ts` — PrismaPg singleton (memoir pattern)
- `lib/auth.ts` — Auth.js v5 credentials, ADMIN_EMAIL/ADMIN_PASSWORD, JWT
- `lib/deepgram.ts` — transcribeAudio(buffer, mimeType) → string
- `lib/structure.ts` — structureNote(transcript) → StructuredNote
- `lib/r2.ts` — uploadAudio(key, buffer, contentType), deleteAudio(key)
- `lib/email.ts` — emailNote(noteId, note) → void (always sends to EMAIL_TO_DEFAULT)

## Pages (phone-first, dark theme)
- `/login` — email + password form
- `/` (protected) — hold-to-record button, shows structured note preview after recording
- `/notes` (protected) — scrollable list, filter by NoteType chips, text search
- `/notes/[id]` (protected) — rendered structured note + raw transcript toggle

## UI Components
- `components/RecordButton.tsx` — hold (pointerdown) to record, release (pointerup) to stop, states: idle/recording/processing/done/error, 5-min auto-stop, shows elapsed time while recording
- `components/NoteCard.tsx` — compact card for list view
- `components/NoteRenderer.tsx` — renders structured JSON per note type

## Infrastructure Corrections (vs. scaffold doc)
- Port: 3016 (not 3015 — taken by ReviewsZone)
- App path: /var/www/voicenote (not /opt/lasershow/voicenote)
- Nginx: wildcard cert at /etc/letsencrypt/live/zone.net.au-0001/
- Nginx: proxy_pass http://127.0.0.1:3016 (not localhost)
- ecosystem.config.cjs (not .js), cwd: /var/www/voicenote
