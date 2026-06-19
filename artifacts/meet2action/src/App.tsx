import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, History } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import InputPanel, { type InputPanelState } from "@/components/InputPanel";
import OutputWorkspace from "@/components/OutputWorkspace";
import LandingPage from "@/components/LandingPage";
import ProfileSetup from "@/components/ProfileSetup";
import PastMeetings from "@/components/PastMeetings";
import { checkSupabaseConnection } from "@/lib/supabaseCheck";
import { useGenerate } from "@/hooks/useGenerate";
import { useDeviceId } from "@/hooks/useDeviceId";
import { useProfile } from "@/hooks/useProfile";
import { saveMeeting, type MeetingListItem } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";
import type { ParsedMeeting } from "@/lib/generation";

// ── Helpers ───────────────────────────────────────────────────────────────

const MEETING_LABELS: Record<string, string> = {
  standup: "Daily Standup",
  roadmap_review: "Roadmap Review",
  sprint_planning: "Sprint Planning",
  customer_call: "Customer Call",
  stakeholder_sync: "Stakeholder Sync",
};

function makeTitle(meetingType: string): string {
  const label = MEETING_LABELS[meetingType] ?? meetingType;
  return `${label} • ${format(new Date(), "MMM d, h:mm a")}`;
}

// ── Novus badge ───────────────────────────────────────────────────────────

function NovusBadge() {
  return (
    <span
      className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono tracking-widest uppercase"
      style={{
        border: "1px solid rgba(166,255,77,0.12)",
        color: "rgba(166,255,77,0.45)",
        background: "rgba(166,255,77,0.03)",
      }}
    >
      <span className="w-1 h-1 rounded-full bg-[#A6FF4D]/50" />
      Novus-ready
    </span>
  );
}

// ── Background ────────────────────────────────────────────────────────────

function GradientMesh() {
  return <div className="bg-mesh" aria-hidden="true" />;
}

// ── Novus footer ──────────────────────────────────────────────────────────

function NovusFooter() {
  return (
    <footer className="fixed bottom-0 inset-x-0 z-20 flex items-center justify-center gap-2 px-4 py-2 bg-[#050505]/90 backdrop-blur-md border-t border-white/[0.05]">
      <span
        className="flex items-center justify-center w-4 h-4 rounded text-[10px] font-black text-[#050505] bg-[#A6FF4D] flex-shrink-0"
        aria-label="Novus"
      >
        N
      </span>
      <p className="text-[10px] font-mono text-[#8A8A85]/50 truncate">
        Instrumented with Novus – every session is tracked so we can see where PMs get stuck.
      </p>
    </footer>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────

export default function App() {
  const { profile, saveProfile } = useProfile();

  // View flow: landing → profile → main (skip to main if profile already saved)
  const [view, setView] = useState<"landing" | "profile" | "main">(() =>
    profile ? "main" : "landing"
  );

  const [inputState, setInputState] = useState<InputPanelState>({
    title: "",
    text: "",
    meetingType: "",
    customMeetingType: "",
    inputSource: "pasted",
  });
  const [overrideData, setOverrideData] = useState<ParsedMeeting | null>(null);
  const [showPastMeetings, setShowPastMeetings] = useState(false);

  const deviceId = useDeviceId();
  const [refreshKey, setRefreshKey] = useState(0);
  const [pendingItem, setPendingItem] = useState<MeetingListItem | null>(null);

  const {
    isLoading,
    data: generatedData,
    error,
    activeStep,
    completedSteps,
    progressSteps,
    generate,
  } = useGenerate();

  const displayData = overrideData ?? generatedData;

  // Auto-save when generation produces new data
  const savedDataRef = useRef<ParsedMeeting | null>(null);
  useEffect(() => {
    if (!generatedData || generatedData === savedDataRef.current) return;
    savedDataRef.current = generatedData;

    const title = inputState.title.trim() || makeTitle(inputState.meetingType);
    const pending: MeetingListItem = {
      id: `pending-${Date.now()}`,
      title,
      meeting_type: inputState.meetingType,
      created_at: new Date().toISOString(),
      summary: generatedData.summary,
    };
    setPendingItem(pending);
    trackEvent("generate_completed", { meeting_type: inputState.meetingType });

    saveMeeting({
      device_id: deviceId,
      meeting_type: inputState.meetingType,
      raw_input: inputState.text,
      title,
      analysis: generatedData,
      input_source: inputState.inputSource,
    }).then((id) => {
      setPendingItem(null);
      if (id) {
        setRefreshKey((k) => k + 1);
        trackEvent("save_completed");
      }
    });
  }, [generatedData, deviceId, inputState.meetingType, inputState.text]);

  useEffect(() => {
    checkSupabaseConnection();
  }, []);

  useEffect(() => {
    if (view === "main" && profile) {
      pendo.identify({
        visitor: {
          id: deviceId,
          email: profile.email || undefined,
          full_name: profile.name || undefined,
          is_anonymous: profile.isAnonymous,
        },
        account: { id: "meet2action-web" }
      });
    }
  }, [view, profile, deviceId]);

  const handleGenerate = useCallback(() => {
    if (!inputState.text.trim() || !inputState.meetingType) return;
    setOverrideData(null);
    trackEvent("generate_started", { meeting_type: inputState.meetingType });
    generate(inputState.text, inputState.meetingType, inputState.customMeetingType || undefined);
  }, [inputState, generate]);

  const handleSelectAnalysis = useCallback((data: ParsedMeeting) => {
    setOverrideData(data);
    setShowPastMeetings(false);
    if (!data.summary && !data.action_items.length) {
      toast.error("Output couldn't be fully structured. Showing summary.", {
        duration: 4000,
        style: {
          background: "#0D0D0E",
          border: "1px solid rgba(255,80,80,0.25)",
          borderLeft: "3px solid #FF5050",
          color: "#F5F5F0",
          fontFamily: "monospace",
          fontSize: "13px",
        },
      });
    }
  }, []);

  // ── Landing ──────────────────────────────────────────────────────────────
  if (view === "landing") {
    return <LandingPage onGetStarted={() => setView("profile")} />;
  }

  // ── Profile setup ─────────────────────────────────────────────────────────
  if (view === "profile") {
    return (
      <ProfileSetup
        onComplete={(p) => {
          saveProfile(p);
          setView("main");
          trackEvent("onboarding_complete", { anonymous: p.isAnonymous });
          pendo.identify({
            visitor: {
              id: deviceId,
              email: p.email || undefined,
              full_name: p.name || undefined,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            account: { id: "meet2action-web" }
          });
        }}
      />
    );
  }

  // ── Main app ──────────────────────────────────────────────────────────────
  const displayName =
    profile && !profile.isAnonymous && profile.name
      ? profile.name
      : "Anonymous PM";
  const displayAvatar = profile?.avatar ?? "🤖";

  return (
    <div className="relative min-h-screen md:h-screen md:overflow-hidden bg-[#050505] text-[#F5F5F0]">
      <GradientMesh />

      {/* ── Main layout ── */}
      <div className="flex flex-col md:flex-row md:h-screen">

        {/* ── Left sidebar ── */}
        <aside className="w-full md:w-72 md:flex-shrink-0 md:sticky md:top-0 md:h-screen md:overflow-y-auto bg-[#0D0D0E]/90 backdrop-blur-xl md:border-r border-b md:border-b-0 border-white/[0.08] flex flex-col">

          {/* Logo + badge row */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#A6FF4D]/10 border border-[#A6FF4D]/20 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-[#A6FF4D]" />
              </div>
              <span className="font-semibold text-[#F5F5F0] tracking-tight text-sm">
                Meet2Action
              </span>
            </div>
            <NovusBadge />
          </div>

          {/* Welcome strip */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.06] flex-shrink-0">
            <span className="text-xl leading-none select-none" aria-hidden="true">
              {displayAvatar}
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-[#F5F5F0] truncate">
                {displayName}
              </span>
              <span className="text-[10px] font-mono text-[#8A8A85]/60 tracking-wide">
                Welcome back
              </span>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 p-4 pb-12 flex flex-col gap-5 overflow-y-auto">
            <InputPanel
              value={inputState}
              onChange={setInputState}
              onGenerate={handleGenerate}
            />
            <div className="border-t border-white/[0.06]" />

            {/* Past meetings button */}
            <button
              onClick={() => {
                setShowPastMeetings(true);
                trackEvent("past_meetings_button_clicked");
              }}
              data-pendo="open-past-meetings"
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-[#8A8A85] hover:text-[#F5F5F0] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.15] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A6FF4D]/50"
            >
              <History className="w-3.5 h-3.5" />
              <span className="font-mono text-xs tracking-wide uppercase">Past meetings</span>
            </button>

          </div>
        </aside>

        {/* ── Right: output workspace ── */}
        <div className="flex-1 min-h-0 flex flex-col">
          <OutputWorkspace
            data={displayData}
            isLoading={isLoading}
            activeStep={activeStep}
            completedSteps={completedSteps}
            progressSteps={progressSteps}
            error={error}
          />
        </div>
      </div>

      {/* Novus footer */}
      <NovusFooter />

      {/* Past meetings panel */}
      <AnimatePresence>
        {showPastMeetings && (
          <PastMeetings
            deviceId={deviceId}
            onSelect={handleSelectAnalysis}
            onClose={() => setShowPastMeetings(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
