import type { ParsedMeeting } from "@/lib/generation";

export interface MeetingListItem {
  id: string;
  title: string;
  meeting_type: string;
  created_at: string;
  summary: string;
}

export interface SaveMeetingPayload {
  device_id: string;
  meeting_type: string;
  raw_input: string;
  title: string;
  analysis: ParsedMeeting;
}

interface HistoryEntry extends MeetingListItem {
  analysis: ParsedMeeting;
}

const HISTORY_KEY = "m2a_history";
const MAX_HISTORY = 50;

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
  } catch {
    // storage quota exceeded or unavailable — silently ignore
  }
}

export async function saveMeeting(
  payload: SaveMeetingPayload
): Promise<string | null> {
  const id = crypto.randomUUID();
  const entry: HistoryEntry = {
    id,
    title: payload.title,
    meeting_type: payload.meeting_type,
    created_at: new Date().toISOString(),
    summary: payload.analysis.summary ?? "",
    analysis: payload.analysis,
  };

  const history = loadHistory();
  saveHistory([entry, ...history]);

  // Best-effort cloud sync — failure is silently ignored
  try {
    await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, id }),
    });
  } catch {
    // no-op
  }

  return id;
}

export async function listMeetings(
  deviceId: string
): Promise<MeetingListItem[] | null> {
  // Try API first (Supabase-backed)
  try {
    const res = await fetch(
      `/api/meetings?device_id=${encodeURIComponent(deviceId)}`
    );
    if (res.ok) {
      const body = (await res.json()) as { meetings: MeetingListItem[] };
      if (Array.isArray(body.meetings) && body.meetings.length > 0) {
        return body.meetings;
      }
    }
  } catch {
    // fall through to localStorage
  }

  // Fall back to localStorage
  const history = loadHistory();
  return history.map(({ id, title, meeting_type, created_at, summary }) => ({
    id,
    title,
    meeting_type,
    created_at,
    summary,
  }));
}

export async function getMeetingAnalysis(
  id: string,
  deviceId: string
): Promise<ParsedMeeting | null> {
  // Try API first
  try {
    const res = await fetch(
      `/api/meetings/${id}?device_id=${encodeURIComponent(deviceId)}`
    );
    if (res.ok) {
      const body = (await res.json()) as { analysis: ParsedMeeting };
      if (body.analysis) return body.analysis;
    }
  } catch {
    // fall through
  }

  // Fall back to localStorage
  const history = loadHistory();
  const entry = history.find((e) => e.id === id);
  return entry?.analysis ?? null;
}
