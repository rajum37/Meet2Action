import { Router, type IRouter } from "express";
import { GoogleGenAI } from "@google/genai";

const router: IRouter = Router();

const SYSTEM_PROMPT = `You are a meeting intelligence engine. Given a raw meeting transcript and meeting type, extract structured information and return ONLY valid JSON matching this exact shape:
{
  "summary": "string — 2-3 sentences summarizing the meeting",
  "decisions": ["string — each key decision made"],
  "action_items": [{ "description": "string", "owner_name": "string or Unassigned" }],
  "risks": ["string — blockers, risks, concerns mentioned"],
  "open_questions": ["string — unresolved questions"],
  "next_steps": ["string — suggested follow-up actions"]
}
Rules:
- owner_name must be a real name from the transcript or "Unassigned"
- Keep descriptions concise but complete (one sentence each)
- Return ONLY the JSON object, no markdown, no explanation`;

router.post("/generate", async (req, res) => {
  const { transcript, meetingType, customMeetingTypeDescription } = req.body as {
    transcript?: string;
    meetingType?: string;
    customMeetingTypeDescription?: string;
  };

  if (!transcript || typeof transcript !== "string") {
    res.status(400).json({ error: "transcript is required" });
    return;
  }

  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    res.status(503).json({ error: "Gemini not configured" });
    return;
  }

  const ai = new GoogleGenAI({ apiKey });

  const meetingTypeLabel =
    meetingType === "other" && customMeetingTypeDescription?.trim()
      ? `other (${customMeetingTypeDescription.trim()})`
      : meetingType || "general";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `${SYSTEM_PROMPT}\n\nMeeting type: ${meetingTypeLabel}\n\nTranscript:\n${transcript}`,
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
        temperature: 0.2,
      },
    });

    const raw = response.text ?? "{}";
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "Gemini generation failed");
    res.status(500).json({
      error: err instanceof Error ? err.message : "Generation failed",
    });
  }
});

export default router;
