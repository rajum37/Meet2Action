import { Router, type IRouter } from "express";
import { supabaseAdmin } from "../lib/supabaseAdmin";

const router: IRouter = Router();

interface ActionItem {
  description: string;
  owner_name: string;
}

interface Analysis {
  summary: string;
  decisions: string[];
  action_items: ActionItem[];
  risks: string[];
  open_questions: string[];
  next_steps: string[];
}

router.post("/meetings", async (req, res) => {
  const { device_id, meeting_type, raw_input, title, analysis } = req.body as {
    device_id?: string;
    meeting_type?: string;
    raw_input?: string;
    title?: string;
    analysis?: Analysis;
  };

  if (!supabaseAdmin) {
    res.status(503).json({ error: "Database not configured" });
    return;
  }

  if (!device_id || !meeting_type || !raw_input || !analysis) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const { data: meeting, error: meetingErr } = await supabaseAdmin
    .from("meetings")
    .insert({ device_id, meeting_type, raw_input, title: title ?? null, status: "completed" })
    .select("id")
    .single();

  if (meetingErr || !meeting) {
    req.log.error({ err: meetingErr }, "Failed to insert meeting");
    res.status(500).json({ error: meetingErr?.message ?? "Insert failed" });
    return;
  }

  const mid = meeting.id as string;

  await Promise.allSettled([
    supabaseAdmin
      .from("meeting_summaries")
      .insert({ meeting_id: mid, summary: analysis.summary }),

    ...(analysis.decisions ?? []).map((desc, i) =>
      supabaseAdmin
        .from("decisions")
        .insert({ meeting_id: mid, description: desc, sort_order: i })
    ),

    ...(analysis.action_items ?? []).map((item, i) =>
      supabaseAdmin.from("action_items").insert({
        meeting_id: mid,
        description: item.description,
        owner_name: item.owner_name,
        sort_order: i,
      })
    ),

    ...(analysis.risks ?? []).map((desc, i) =>
      supabaseAdmin.from("risks_and_questions").insert({
        meeting_id: mid,
        item_type: "risk",
        description: desc,
        sort_order: i,
      })
    ),

    ...(analysis.open_questions ?? []).map((desc, i) =>
      supabaseAdmin.from("risks_and_questions").insert({
        meeting_id: mid,
        item_type: "open_question",
        description: desc,
        sort_order: i + (analysis.risks?.length ?? 0),
      })
    ),

    ...(analysis.next_steps ?? []).map((desc, i) =>
      supabaseAdmin
        .from("next_steps")
        .insert({ meeting_id: mid, description: desc, sort_order: i })
    ),
  ]);

  res.json({ id: mid });
});

router.get("/meetings", async (req, res) => {
  const deviceId = req.query["device_id"] as string | undefined;

  if (!supabaseAdmin || !deviceId) {
    res.json({ meetings: [] });
    return;
  }

  const { data } = await supabaseAdmin
    .from("meetings")
    .select("id, title, meeting_type, created_at, meeting_summaries(summary)")
    .eq("device_id", deviceId)
    .order("created_at", { ascending: false })
    .limit(10);

  const meetings = (data ?? []).map((m) => ({
    id: m.id,
    title: m.title,
    meeting_type: m.meeting_type,
    created_at: m.created_at,
    summary: (m.meeting_summaries as { summary: string }[] | null)?.[0]?.summary ?? "",
  }));

  res.json({ meetings });
});

router.get("/meetings/:id", async (req, res) => {
  const { id } = req.params;
  const deviceId = req.query["device_id"] as string | undefined;

  if (!supabaseAdmin || !deviceId || !id) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [meetingRes, summaryRes, decisionsRes, actionsRes, risksRes, nextRes] =
    await Promise.all([
      supabaseAdmin
        .from("meetings")
        .select("id, meeting_type, title, created_at")
        .eq("id", id)
        .eq("device_id", deviceId)
        .single(),
      supabaseAdmin
        .from("meeting_summaries")
        .select("summary")
        .eq("meeting_id", id)
        .single(),
      supabaseAdmin
        .from("decisions")
        .select("description")
        .eq("meeting_id", id)
        .order("sort_order"),
      supabaseAdmin
        .from("action_items")
        .select("description, owner_name")
        .eq("meeting_id", id)
        .order("sort_order"),
      supabaseAdmin
        .from("risks_and_questions")
        .select("description, item_type")
        .eq("meeting_id", id)
        .order("sort_order"),
      supabaseAdmin
        .from("next_steps")
        .select("description")
        .eq("meeting_id", id)
        .order("sort_order"),
    ]);

  if (!meetingRes.data) {
    res.status(404).json({ error: "Meeting not found" });
    return;
  }

  const analysis: Analysis = {
    summary: summaryRes.data?.summary ?? "",
    decisions: (decisionsRes.data ?? []).map((d) => d.description as string),
    action_items: (actionsRes.data ?? []).map((a) => ({
      description: a.description as string,
      owner_name: a.owner_name as string,
    })),
    risks: (risksRes.data ?? [])
      .filter((r) => r.item_type === "risk")
      .map((r) => r.description as string),
    open_questions: (risksRes.data ?? [])
      .filter((r) => r.item_type === "open_question")
      .map((r) => r.description as string),
    next_steps: (nextRes.data ?? []).map((n) => n.description as string),
  };

  res.json({
    id: meetingRes.data.id,
    meeting_type: meetingRes.data.meeting_type,
    title: meetingRes.data.title,
    created_at: meetingRes.data.created_at,
    analysis,
  });
});

export default router;
