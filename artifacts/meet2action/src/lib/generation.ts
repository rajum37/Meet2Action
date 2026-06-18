import { parseTranscript, type ParsedMeeting } from "@/lib/parser";

export type { ParsedMeeting };

export async function generateFromTranscript(
  transcript: string,
  meetingType: string,
  customMeetingTypeDescription?: string
): Promise<ParsedMeeting> {
  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript, meetingType, customMeetingTypeDescription }),
    });

    if (!res.ok) throw new Error(`API ${res.status}`);

    const data = (await res.json()) as ParsedMeeting;

    if (
      typeof data.summary === "string" &&
      Array.isArray(data.action_items)
    ) {
      return data;
    }

    throw new Error("Unexpected response shape");
  } catch {
    return parseTranscript(transcript, meetingType);
  }
}
