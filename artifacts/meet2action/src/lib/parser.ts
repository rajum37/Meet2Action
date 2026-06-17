export interface ParsedMeeting {
  summary: string;
  decisions: string[];
  action_items: Array<{ description: string; owner_name: string }>;
  risks: string[];
  open_questions: string[];
  next_steps: string[];
}

const DECISION_PATTERNS = /we decided|we agreed|decided to|agreed to/i;
const RISK_PATTERNS = /\brisk:|\brisk\b|blocked|blocker|concern/i;
const OPEN_QUESTION_PATTERNS = /open question:|^do we\b|^should we\b|^would\b/i;
const NEXT_STEP_PATTERNS = /next step:|^next,/i;
const ACTION_OWNER_PATTERNS = /^([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s+(?:will|can|needs? to|should|must|is going to|has to)\b/;

function extractActionItem(sentence: string): { description: string; owner_name: string } | null {
  const trimmed = sentence.trim();
  if (trimmed.length < 10) return null;

  const ownerMatch = trimmed.match(ACTION_OWNER_PATTERNS);
  if (ownerMatch) {
    return { description: trimmed, owner_name: ownerMatch[1] };
  }

  const iWillMatch = trimmed.match(/^I(?:'ll)?\s+(?:will\s+)?(.+)/i);
  if (iWillMatch) {
    return { description: trimmed, owner_name: "Unassigned" };
  }

  return null;
}

export function parseTranscript(input: string, _meetingType: string): ParsedMeeting {
  const sentences = input
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  const decisions: string[] = [];
  const action_items: Array<{ description: string; owner_name: string }> = [];
  const risks: string[] = [];
  const open_questions: string[] = [];
  const next_steps: string[] = [];

  for (const sentence of sentences) {
    const stripped = sentence.replace(/^[A-Z][a-z]+(?:\s[A-Z][a-z]+)?:\s+/, "");

    if (DECISION_PATTERNS.test(sentence)) {
      decisions.push(stripped);
      continue;
    }

    if (NEXT_STEP_PATTERNS.test(sentence)) {
      next_steps.push(stripped);
      continue;
    }

    if (RISK_PATTERNS.test(sentence)) {
      risks.push(stripped);
    }

    if (OPEN_QUESTION_PATTERNS.test(stripped) || /\?$/.test(sentence)) {
      open_questions.push(stripped);
      continue;
    }

    const action = extractActionItem(stripped);
    if (action) {
      action_items.push(action);
    }
  }

  const firstTwo = sentences.slice(0, 2).join(". ").replace(/\s+/g, " ").trim();
  const summary = firstTwo.length > 0 ? firstTwo : "Meeting transcript processed.";

  return {
    summary,
    decisions,
    action_items,
    risks,
    open_questions,
    next_steps,
  };
}
