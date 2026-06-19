import { useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Zap, ChevronRight, FileText, Sparkles, AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trackEvent } from "@/lib/analytics";

export type MeetingType =
  | "standup"
  | "roadmap_review"
  | "sprint_planning"
  | "customer_call"
  | "stakeholder_sync"
  | "other"
  | "";

export interface InputPanelState {
  title: string;
  text: string;
  meetingType: MeetingType;
  customMeetingType: string;
  inputSource: string;
}

interface InputPanelProps {
  value: InputPanelState;
  onChange: (next: InputPanelState) => void;
  onGenerate: () => void;
}

const SAMPLES: Record<string, { meetingType: MeetingType; transcript: string }> = {
  "Sprint Planning": {
    meetingType: "sprint_planning",
    transcript: `Sprint Planning — Team Velocity: 42 pts
Date: June 17, 2026 | Facilitator: Sarah Chen

Sarah: Alright, let's kick off sprint 24. We have 42 story points capacity this sprint.

Marcus: I'll take the authentication refactor. Estimated 8 points. I need the design mockups from Priya by Wednesday EOD so I can start the frontend changes.

Priya: Got it, I'll get you the auth flow mockups by Wednesday noon. I also want to own the onboarding redesign — that's 13 points. Need Marcus to review my Figma by Friday.

James: Database migration for user preferences is on me. 8 points. I'll need DevOps to provision the staging environment by Tuesday — that's a blocker.

Sarah: I'll chase DevOps today. James, can you document the migration rollback plan before you start? That's a hard requirement.

James: Will do, I'll have it ready Monday morning.

Marcus: One more thing — the CI/CD pipeline keeps flaking on the E2E tests. We agreed last sprint to fix that. Can someone own it?

Priya: I'll add a 5-point ticket for flaky test investigation. I can pair with Marcus on Thursday afternoon.

Sarah: Good. Let's also not forget the security audit response items from last week — 3 critical findings, 8 points total. Marcus you own #1 and #2, James owns #3.

Marcus: Confirmed. I'll have #1 done by Thursday, #2 by end of sprint.

James: I'll close #3 by Wednesday.

Sarah: Great sprint plan. We'll sync daily at 9 AM. Anyone have blockers to surface right now?

James: Just the staging environment — that's blocking everything else.

Sarah: Noted. I'll confirm DevOps by 11 AM today. Let's go.`,
  },

  "Customer Call": {
    meetingType: "customer_call",
    transcript: `Customer Call — Acme Corp Quarterly Business Review
Date: June 17, 2026 | Account: Acme Corp | AE: Lisa Park | CSM: Tom Wu

Lisa: Thanks for joining, Rachel. Let's walk through Q2 results and what we're planning for Q3.

Rachel (Acme CTO): Appreciate the time. I have two major concerns: the API rate limit we keep hitting, and the missing export-to-PDF feature my team keeps requesting.

Tom: On the rate limits — we upgraded you to the Growth tier last quarter but I see you've been hitting 90% utilization. We should move you to Enterprise. Lisa, can you get Rachel a quote this week?

Lisa: I'll send the Enterprise pricing proposal by Thursday. It includes a 3x rate limit increase and dedicated support.

Rachel: That would help a lot. The PDF export is critical for our compliance team — they export audit reports weekly. Is that on the roadmap?

Tom: Yes! It's scheduled for Q3. I'll connect you with our product team so you can influence the feature spec. I'll make that intro by end of this week.

Rachel: Perfect. We also had 3 incidents in June — each around 2 AM UTC. Our team thinks it's related to the nightly batch job timeout.

Tom: I'll file a P1 investigation ticket today and loop in engineering. We'll have a root cause analysis to you within 5 business days — by June 24.

Lisa: Rachel, would it help to schedule a technical deep-dive with our infrastructure team? I can set that up for next Tuesday if you're free.

Rachel: Yes, Tuesday works. 10 AM ET.

Lisa: Confirmed. I'll send a calendar invite today. Anything else before we wrap?

Rachel: Just one thing — we need SSO via Okta. Our IT policy requires it for all SaaS tools by end of Q3.

Tom: SSO is GA in August. I'll make sure you're in the early access program. I'll email you the signup link today.

Rachel: Fantastic. Overall I'm happy with the direction, just need these items resolved.`,
  },

  "Daily Standup": {
    meetingType: "standup",
    transcript: `Daily Standup — Platform Team
Date: June 17, 2026 | 9:02 AM | Present: Alex, Jordan, Sam, Morgan

Alex: Yesterday I finished the search indexing job — it's deployed to staging. Today I'm adding the relevance scoring layer. No blockers.

Jordan: I was blocked on the auth service config yesterday — Sam helped me get unblocked around 4 PM. Today I'm finishing the user profile API endpoints. Should be done by noon. No blockers now.

Sam: Yesterday I reviewed Jordan's PR, caught two edge cases. I also started on the notification service refactor. Today I need to finish the refactor and write unit tests. I have a blocker — I need access to the Twilio sandbox credentials. Can someone from DevOps help? I'll message the channel.

Morgan: Yesterday I finished the mobile deep-link implementation. Today I'm doing QA on the iOS build before we submit to TestFlight. My blocker: the iOS signing certificate expires on Friday — I need someone to renew it today or we miss the TestFlight window. That's urgent.

Alex: Morgan, I know the process — I can walk you through the renewal in 15 minutes after standup.

Morgan: Perfect, let's do it.

Sam: Quick callout — the prod deploy is at 3 PM today. Everyone freeze your PRs by 2 PM.

Jordan: Noted. I'll make sure my profile endpoint PR is merged by 1 PM then.

Alex: Same for me. Alright, anything else?

Morgan: Nope. Let's go.`,
  },
};

const MEETING_TYPE_OPTIONS: { value: MeetingType; label: string }[] = [
  { value: "standup", label: "Daily Standup" },
  { value: "roadmap_review", label: "Roadmap Review" },
  { value: "sprint_planning", label: "Sprint Planning" },
  { value: "customer_call", label: "Customer Call" },
  { value: "stakeholder_sync", label: "Stakeholder Sync" },
  { value: "other", label: "Other" },
];

const glassBase =
  "bg-white/[0.03] backdrop-blur-xl border border-white/[0.1] transition-all duration-200 ease-out";

const glassHover =
  "hover:border-white/[0.30] hover:shadow-[0_0_40px_rgba(166,255,77,0.15)]";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A6FF4D]/50 focus-visible:ring-offset-1 focus-visible:ring-offset-[#050505]";

const ALLOWED_EXTENSIONS = [".txt", ".md"];

export default function InputPanel({ value, onChange, onGenerate }: InputPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const isReady = value.text.trim().length >= 20 && value.meetingType !== "";

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange({ ...value, title: e.target.value }),
    [value, onChange]
  );

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) =>
      onChange({ ...value, text: e.target.value }),
    [value, onChange]
  );

  const handleMeetingTypeChange = useCallback(
    (v: string) => onChange({ ...value, meetingType: v as MeetingType, customMeetingType: v !== "other" ? "" : value.customMeetingType }),
    [value, onChange]
  );

  const handleCustomMeetingTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange({ ...value, customMeetingType: e.target.value }),
    [value, onChange]
  );

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;

      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setUploadError("Right now we support .txt and .md files. For other formats, paste the text into the box.");
        return;
      }

      setUploadError(null);
      const source = ext === ".txt" ? "uploaded_txt" : "uploaded_md";
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = (ev.target?.result as string) ?? "";
        onChange({ ...value, text: value.text ? value.text + "\n\n" + content : content, inputSource: source });
      };
      reader.readAsText(file);
    },
    [value, onChange]
  );

  const handleSampleChip = useCallback(
    (label: string) => {
      const sample = SAMPLES[label];
      if (!sample) return;
      trackEvent("demo_chip_clicked", { sample: label, meeting_type: sample.meetingType });
      onChange({ ...value, text: sample.transcript, meetingType: sample.meetingType, customMeetingType: "", inputSource: "pasted" });
    },
    [value, onChange]
  );

  const handleUseSample = useCallback(() => {
    const keys = Object.keys(SAMPLES);
    const random = keys[Math.floor(Math.random() * keys.length)];
    handleSampleChip(random);
    trackEvent("use_sample_clicked");
  }, [handleSampleChip]);

  const handleGenerate = useCallback(() => {
    if (!isReady) return;
    onGenerate();
  }, [isReady, onGenerate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleGenerate();
      }
    },
    [handleGenerate]
  );

  const charCount = value.text.length;

  return (
    <div className="flex flex-col gap-3">

      {/* Meeting title */}
      <div className="flex flex-col gap-1.5">
        <p className="tracking-mono text-[#8A8A85] text-xs uppercase font-mono">Meeting title</p>
        <input
          type="text"
          aria-label="Meeting title"
          placeholder="e.g. Sprint 24 Planning"
          value={value.title}
          onChange={handleTitleChange}
          className={[
            "w-full h-9 px-3 rounded-lg text-sm font-mono text-[#F5F5F0]",
            "bg-white/[0.03] backdrop-blur-xl border border-white/[0.1]",
            "placeholder:text-[#8A8A85]/50",
            "focus:outline-none focus:border-white/[0.30] focus:shadow-[0_0_24px_rgba(166,255,77,0.1)]",
            "transition-all duration-200",
          ].join(" ")}
        />
      </div>

      {/* Transcript textarea */}
      <div className="flex flex-col gap-1.5">
        <p className="tracking-mono text-[#8A8A85] text-xs uppercase font-mono">Transcript</p>
        <div
          className={[
            "relative rounded-xl overflow-hidden",
            glassBase,
            "focus-within:border-white/[0.30] focus-within:shadow-[0_0_40px_rgba(166,255,77,0.12)]",
          ].join(" ")}
        >
          <textarea
            aria-label="Meeting transcript"
            className="w-full h-40 md:h-48 bg-transparent text-sm text-[#F5F5F0] placeholder:text-[#8A8A85]/50 px-4 py-3 resize-none focus:outline-none font-mono leading-relaxed"
            placeholder="Paste your meeting notes or transcript here..."
            value={value.text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
          />
          <AnimatePresence>
            {charCount > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-2 right-3 tracking-mono text-[#8A8A85]/50 pointer-events-none"
                style={{ fontSize: "10px" }}
              >
                {charCount.toLocaleString()} chars
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Use sample meeting */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleUseSample}
        data-pendo="use-sample"
        className={[
          "flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm text-[#8A8A85]",
          glassBase,
          "hover:border-[#A6FF4D]/20 hover:text-[#A6FF4D] hover:bg-[#A6FF4D]/[0.03]",
          "active:scale-[0.97]",
          focusRing,
        ].join(" ")}
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span className="font-mono text-xs tracking-wide uppercase">Use sample meeting</span>
      </motion.button>

      {/* Upload .txt */}
      <input
        ref={fileInputRef}
        type="file"
        accept="*"
        className="hidden"
        onChange={handleFileUpload}
      />
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => { setUploadError(null); fileInputRef.current?.click(); }}
        data-pendo="upload-file"
        className={[
          "flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm text-[#8A8A85]",
          glassBase,
          glassHover,
          "active:scale-[0.97]",
          focusRing,
        ].join(" ")}
      >
        <Upload className="w-3.5 h-3.5" />
        <span className="font-mono text-xs tracking-wide uppercase">Upload .txt / .md</span>
        <FileText className="w-3 h-3 opacity-40" />
      </motion.button>

      <AnimatePresence initial={false}>
        {uploadError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="flex items-start gap-2 px-3 py-2.5 rounded-lg"
            style={{ background: "rgba(255,80,80,0.06)", border: "1px solid rgba(255,80,80,0.18)" }}
          >
            <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-400/90 leading-relaxed">{uploadError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Meeting type */}
      <div className="flex flex-col gap-1.5">
        <p className="tracking-mono text-[#8A8A85] text-xs uppercase font-mono">Meeting type</p>
        <Select
          key={value.meetingType || "__empty__"}
          defaultValue={value.meetingType || undefined}
          onValueChange={handleMeetingTypeChange}
        >
          <SelectTrigger
            className={[
              "w-full h-9 rounded-lg text-sm font-mono",
              "bg-white/[0.03] backdrop-blur-xl",
              "border border-white/[0.1]",
              "text-[#F5F5F0]",
              "hover:border-white/[0.30] hover:shadow-[0_0_40px_rgba(166,255,77,0.12)]",
              "focus:border-[#A6FF4D]/40 focus:ring-0 focus:shadow-[0_0_40px_rgba(166,255,77,0.18)]",
              "transition-all duration-200",
              "data-[placeholder]:text-[#8A8A85]/60",
              focusRing,
            ].join(" ")}
          >
            <SelectValue placeholder="Select meeting type…" />
          </SelectTrigger>
          <SelectContent className="bg-[#0D0D0E] border border-white/[0.12] rounded-xl shadow-2xl backdrop-blur-xl">
            {MEETING_TYPE_OPTIONS.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                className="text-sm text-[#F5F5F0]/80 focus:bg-white/[0.06] focus:text-[#F5F5F0] rounded-lg cursor-pointer font-mono tracking-wide"
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <AnimatePresence initial={false}>
          {value.meetingType === "other" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              style={{ overflow: "hidden" }}
            >
              <input
                type="text"
                aria-label="Describe this meeting type"
                placeholder="Describe this meeting type (optional)"
                value={value.customMeetingType}
                onChange={handleCustomMeetingTypeChange}
                className={[
                  "w-full h-9 px-3 rounded-lg text-sm font-mono text-[#F5F5F0]",
                  "bg-white/[0.03] backdrop-blur-xl border border-white/[0.1]",
                  "placeholder:text-[#8A8A85]/40",
                  "focus:outline-none focus:border-[#A6FF4D]/30 focus:shadow-[0_0_24px_rgba(166,255,77,0.08)]",
                  "transition-all duration-200 mt-1.5",
                ].join(" ")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Generate button */}
      <div className="flex flex-col gap-2 pt-1">
        <motion.button
          whileTap={isReady ? { scale: 0.97 } : {}}
          onClick={handleGenerate}
          disabled={!isReady}
          aria-disabled={!isReady}
          aria-label="Extract actions from transcript"
          data-pendo="extract-actions"
          className={[
            "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold",
            "transition-all duration-200",
            isReady
              ? [
                  "bg-[#A6FF4D] text-[#050505]",
                  "hover:bg-[#B8FF6A] hover:shadow-[0_0_40px_rgba(166,255,77,0.35)]",
                  "active:bg-[#96EF3D] cursor-pointer",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A6FF4D] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]",
                ].join(" ")
              : "bg-[#A6FF4D]/10 text-[#A6FF4D]/30 border border-[#A6FF4D]/10 cursor-not-allowed",
          ].join(" ")}
        >
          <Zap className="w-4 h-4" />
          Extract actions
          <ChevronRight className="w-3.5 h-3.5" />
        </motion.button>

        <AnimatePresence>
          {!isReady && (
            <motion.p
              key="hint"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="text-center tracking-mono text-[#8A8A85]/60"
              style={{ fontSize: "10px" }}
            >
              {value.text.trim().length === 0
                ? "Paste notes and select a meeting type to begin"
                : value.text.trim().length < 20
                  ? "Notes too short — add more context"
                  : "Select a meeting type to begin"}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
