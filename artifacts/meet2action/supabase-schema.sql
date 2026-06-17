-- ============================================================
-- Meet2Action — Supabase schema
-- Run this entire file in the Supabase SQL editor
-- ============================================================

-- ── Enums ──────────────────────────────────────────────────
CREATE TYPE meeting_type AS ENUM (
  'standup',
  'roadmap_review',
  'sprint_planning',
  'customer_call',
  'stakeholder_sync'
);

CREATE TYPE risk_item_type AS ENUM ('risk', 'open_question');

-- ── profiles ───────────────────────────────────────────────
CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT,
  email      TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── meetings ───────────────────────────────────────────────
CREATE TABLE meetings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES profiles(id),
  device_id    TEXT,
  title        TEXT,
  meeting_type meeting_type NOT NULL,
  raw_input    TEXT NOT NULL,
  status       TEXT DEFAULT 'completed',
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_meetings_user_created   ON meetings (user_id,   created_at DESC);
CREATE INDEX idx_meetings_device_created ON meetings (device_id, created_at DESC);

-- ── meeting_summaries ──────────────────────────────────────
CREATE TABLE meeting_summaries (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  summary    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX idx_meeting_summaries_meeting ON meeting_summaries (meeting_id);

-- ── decisions ──────────────────────────────────────────────
CREATE TABLE decisions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id  UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_decisions_meeting ON decisions (meeting_id);

-- ── action_items ───────────────────────────────────────────
CREATE TABLE action_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id  UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  owner_name  TEXT DEFAULT 'Unassigned',
  due_date    DATE,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_action_items_meeting ON action_items (meeting_id);

-- ── risks_and_questions ────────────────────────────────────
CREATE TABLE risks_and_questions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id  UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  item_type   risk_item_type NOT NULL,
  description TEXT NOT NULL,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_risks_questions_meeting ON risks_and_questions (meeting_id);

-- ── next_steps ─────────────────────────────────────────────
CREATE TABLE next_steps (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id  UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_next_steps_meeting ON next_steps (meeting_id);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE meetings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_summaries   ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE risks_and_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE next_steps          ENABLE ROW LEVEL SECURITY;

-- meetings
CREATE POLICY "meetings_select" ON meetings FOR SELECT
  USING (auth.uid() = user_id OR device_id = current_setting('request.device_id', true));
CREATE POLICY "meetings_insert" ON meetings FOR INSERT
  WITH CHECK (auth.uid() = user_id OR device_id = current_setting('request.device_id', true));

-- meeting_summaries
CREATE POLICY "summaries_select" ON meeting_summaries FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM meetings
    WHERE meetings.id = meeting_summaries.meeting_id
      AND (auth.uid() = meetings.user_id OR meetings.device_id = current_setting('request.device_id', true))
  ));
CREATE POLICY "summaries_insert" ON meeting_summaries FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM meetings
    WHERE meetings.id = meeting_summaries.meeting_id
      AND (auth.uid() = meetings.user_id OR meetings.device_id = current_setting('request.device_id', true))
  ));

-- decisions
CREATE POLICY "decisions_select" ON decisions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM meetings
    WHERE meetings.id = decisions.meeting_id
      AND (auth.uid() = meetings.user_id OR meetings.device_id = current_setting('request.device_id', true))
  ));
CREATE POLICY "decisions_insert" ON decisions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM meetings
    WHERE meetings.id = decisions.meeting_id
      AND (auth.uid() = meetings.user_id OR meetings.device_id = current_setting('request.device_id', true))
  ));

-- action_items
CREATE POLICY "action_items_select" ON action_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM meetings
    WHERE meetings.id = action_items.meeting_id
      AND (auth.uid() = meetings.user_id OR meetings.device_id = current_setting('request.device_id', true))
  ));
CREATE POLICY "action_items_insert" ON action_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM meetings
    WHERE meetings.id = action_items.meeting_id
      AND (auth.uid() = meetings.user_id OR meetings.device_id = current_setting('request.device_id', true))
  ));

-- risks_and_questions
CREATE POLICY "risks_select" ON risks_and_questions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM meetings
    WHERE meetings.id = risks_and_questions.meeting_id
      AND (auth.uid() = meetings.user_id OR meetings.device_id = current_setting('request.device_id', true))
  ));
CREATE POLICY "risks_insert" ON risks_and_questions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM meetings
    WHERE meetings.id = risks_and_questions.meeting_id
      AND (auth.uid() = meetings.user_id OR meetings.device_id = current_setting('request.device_id', true))
  ));

-- next_steps
CREATE POLICY "next_steps_select" ON next_steps FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM meetings
    WHERE meetings.id = next_steps.meeting_id
      AND (auth.uid() = meetings.user_id OR meetings.device_id = current_setting('request.device_id', true))
  ));
CREATE POLICY "next_steps_insert" ON next_steps FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM meetings
    WHERE meetings.id = next_steps.meeting_id
      AND (auth.uid() = meetings.user_id OR meetings.device_id = current_setting('request.device_id', true))
  ));
