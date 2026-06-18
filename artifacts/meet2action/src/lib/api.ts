import type { ParsedMeeting } from "@/lib/generation";

export interface MeetingListItem {
  id: string;
  title: string;
  meeting_type: string;
  created_at: string;
  summary: string;
  favorite?: boolean;
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
  favorite: boolean;
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
  } catch {}
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
    favorite: false,
  };

  const history = loadHistory();
  saveHistory([entry, ...history]);

  try {
    await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, id }),
    });
  } catch {}

  return id;
}

export async function listMeetings(
  deviceId: string
): Promise<MeetingListItem[] | null> {
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
  } catch {}

  const history = loadHistory();
  return history.map(({ id, title, meeting_type, created_at, summary, favorite }) => ({
    id,
    title,
    meeting_type,
    created_at,
    summary,
    favorite,
  }));
}

export async function getMeetingAnalysis(
  id: string,
  deviceId: string
): Promise<ParsedMeeting | null> {
  try {
    const res = await fetch(
      `/api/meetings/${id}?device_id=${encodeURIComponent(deviceId)}`
    );
    if (res.ok) {
      const body = (await res.json()) as { analysis: ParsedMeeting };
      if (body.analysis) return body.analysis;
    }
  } catch {}

  const history = loadHistory();
  const entry = history.find((e) => e.id === id);
  return entry?.analysis ?? null;
}

export function toggleFavorite(id: string): boolean {
  const history = loadHistory();
  const updated = history.map((e) =>
    e.id === id ? { ...e, favorite: !e.favorite } : e
  );
  saveHistory(updated);
  const entry = updated.find((e) => e.id === id);
  return entry?.favorite ?? false;
}

export function deleteMeeting(id: string): void {
  const history = loadHistory();
  saveHistory(history.filter((e) => e.id !== id));
}
