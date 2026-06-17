---
name: Meet2Action architecture
description: Key design decisions for the Meet2Action meeting transcript analyzer
---

## Generation flow
- Frontend `lib/generation.ts`: calls `/api/generate`, catches ANY error and falls back to `parseTranscript()` (deterministic NLP parser). Parser output is always the safety net.
- API server `routes/generate.ts`: calls GPT-4o mini; returns 500 on failure. Frontend handles the 500 gracefully.
- OpenAI key `sk-or-v1...` is an OpenRouter key — incompatible with the OpenAI SDK. Parser fallback is what's actually running.

**Why:** App must always produce output regardless of API key status.

## Database / Supabase
- All DB operations go through `/api/*` (Express). Frontend `supabase.ts` is intentionally empty.
- `supabaseAdmin.ts` uses SUPABASE_SERVICE_ROLE_KEY (bypasses RLS) or falls back to SUPABASE_ANON_KEY.
- RLS policies on DB use `current_setting('request.device_id', true)` — but with service role key this is bypassed; device_id filtering applied at query level instead.
- All Supabase operations are fire-and-forget on failure (silent fallback to empty history).

**Why:** Supabase not guaranteed to be configured; app must work without it.

## History / device identity
- Device ID: `localStorage key m2a_device_id`, UUID via `crypto.randomUUID()`.
- Auto-save triggers in App.tsx `useEffect` watching `generatedData`; skips re-saves via `savedDataRef`.
- RecentAnalyses is self-contained; accepts `refreshKey` (increments on save) and `pendingItem` (optimistic prepend).
- Override data pattern: `overrideData ?? generatedData` — clicking history sets overrideData; new generate clears it.

## Key files
- `artifacts/meet2action/src/hooks/useDeviceId.ts` — localStorage UUID
- `artifacts/meet2action/src/lib/api.ts` — saveMeeting, listMeetings, getMeetingAnalysis
- `artifacts/meet2action/src/components/ActionBar.tsx` — Copy/Slack/Email export with sonner toast
- `artifacts/meet2action/src/components/RecentAnalyses.tsx` — history sidebar with optimistic updates
- `artifacts/api-server/src/routes/meetings.ts` — POST/GET /api/meetings, GET /api/meetings/:id
- `artifacts/api-server/src/lib/supabaseAdmin.ts` — service role client
