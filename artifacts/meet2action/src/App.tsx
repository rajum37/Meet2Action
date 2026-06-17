import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, X, Keyboard } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import InputPanel, { type InputPanelState } from "@/components/InputPanel";
import OutputWorkspace from "@/components/OutputWorkspace";
import RecentAnalyses from "@/components/RecentAnalyses";
import { checkSupabaseConnection } from "@/lib/supabaseCheck";
import { useGenerate } from "@/hooks/useGenerate";
import { useDeviceId } from "@/hooks/useDeviceId";
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

// ── Keyboard shortcuts modal ──────────────────────────────────────────────

const SHORTCUTS = [
  { keys: ["Ctrl", "↵"], desc: "Generate analysis" },
  { keys: ["C"], desc: "Copy result to clipboard" },
  { keys: ["?"], desc: "Show keyboard shortcuts" },
  { keys: ["Esc"], desc: "Close dialogs" },
];

function ShortcutsModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <motion.div
        className="w-full max-w-sm bg-[#0D0D0E] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden"
        initial={{ y: 20, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 20, scale: 0.97 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Keyboard className="w-3.5 h-3.5 text-[#A6FF4D]" />
            <span className="text-sm font-mono text-[#F5F5F0] tracking-wide">
              Keyboard shortcuts
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#8A8A85] hover:text-[#F5F5F0] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A6FF4D]/50"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <ul className="p-4 flex flex-col gap-3">
          {SHORTCUTS.map((s) => (
            <li key={s.desc} className="flex items-center justify-between gap-4">
              <span className="text-xs text-[#8A8A85] font-mono">{s.desc}</span>
              <div className="flex items-center gap-1 flex-shrink-0">
                {s.keys.map((k) => (
                  <kbd
                    key={k}
                    className="px-2 py-0.5 rounded bg-white/[0.06] border border-white/[0.12] text-[10px] font-mono text-[#F5F5F0]/80"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </li>
          ))}
        </ul>
        <div className="px-5 pb-4">
          <p className="text-[10px] font-mono text-[#8A8A85]/40 text-center">
            Press Esc to close
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
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

// ── Root ──────────────────────────────────────────────────────────────────

export default function App() {
  const [inputState, setInputState] = useState<InputPanelState>({
    text: "",
    meetingType: "",
  });
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [overrideData, setOverrideData] = useState<ParsedMeeting | null>(null);

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

    const title = makeTitle(inputState.meetingType);
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

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const isInput = tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT";

      if (e.key === "?" && !isInput) {
        e.preventDefault();
        trackEvent("keyboard_shortcut_used", { key: "?" });
        setShowShortcuts((v) => !v);
      }
      if (e.key === "c" && !isInput && !e.ctrlKey && !e.metaKey && displayData) {
        trackEvent("keyboard_shortcut_used", { key: "c" });
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [displayData]);

  const handleGenerate = useCallback(() => {
    if (!inputState.text.trim() || !inputState.meetingType) return;
    setOverrideData(null);
    trackEvent("generate_started", { meeting_type: inputState.meetingType });
    generate(inputState.text, inputState.meetingType);
  }, [inputState, generate]);

  const handleSelectAnalysis = useCallback((data: ParsedMeeting) => {
    setOverrideData(data);
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

  return (
    <div className="relative min-h-screen md:h-screen md:overflow-hidden bg-[#050505] text-[#F5F5F0]">
      <GradientMesh />

      {/* ── Main layout: stacked on mobile, side-by-side on desktop ── */}
      <div className="flex flex-col md:flex-row md:h-screen">

        {/* ── Left panel (sidebar on desktop, top section on mobile) ── */}
        <aside className="w-full md:w-72 md:flex-shrink-0 md:sticky md:top-0 md:h-screen md:overflow-y-auto bg-[#0D0D0E]/90 backdrop-blur-xl md:border-r border-b md:border-b-0 border-white/[0.08] flex flex-col">

          {/* Logo row */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#A6FF4D]/10 border border-[#A6FF4D]/20 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-[#A6FF4D]" />
              </div>
              <span className="font-semibold text-[#F5F5F0] tracking-tight text-sm">
                Meet2Action
              </span>
            </div>
            <div className="flex items-center gap-2">
              <NovusBadge />
              <button
                onClick={() => setShowShortcuts(true)}
                title="Keyboard shortcuts (?)"
                aria-label="Keyboard shortcuts"
                className="p-1.5 rounded-lg text-[#8A8A85] hover:text-[#F5F5F0] hover:bg-white/[0.05] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A6FF4D]/50"
              >
                <Keyboard className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 p-4 flex flex-col gap-5 overflow-y-auto">
            <InputPanel
              value={inputState}
              onChange={setInputState}
              onGenerate={handleGenerate}
            />
            <div className="border-t border-white/[0.06]" />
            <RecentAnalyses
              deviceId={deviceId}
              refreshKey={refreshKey}
              pendingItem={pendingItem}
              onSelect={handleSelectAnalysis}
            />
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

      {/* Keyboard shortcuts modal */}
      <AnimatePresence>
        {showShortcuts && (
          <ShortcutsModal onClose={() => setShowShortcuts(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
