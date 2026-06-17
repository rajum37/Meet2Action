import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Slack, Mail, X } from "lucide-react";
import { toast } from "sonner";
import type { ParsedMeeting } from "@/lib/generation";
import { trackEvent } from "@/lib/analytics";

// ── Formatters ────────────────────────────────────────────────────────────

function formatClipboard(data: ParsedMeeting): string {
  const lines: string[] = [];
  lines.push("MEETING SUMMARY", "═══════════════", data.summary, "");
  if (data.decisions.length) {
    lines.push("KEY DECISIONS", "─────────────");
    data.decisions.forEach((d) => lines.push(`• ${d}`));
    lines.push("");
  }
  if (data.action_items.length) {
    lines.push("ACTION ITEMS", "────────────");
    data.action_items.forEach((a) =>
      lines.push(`• ${a.description}  [${a.owner_name}]`)
    );
    lines.push("");
  }
  if (data.risks.length) {
    lines.push("RISKS & BLOCKERS", "────────────────");
    data.risks.forEach((r) => lines.push(`• ${r}`));
    lines.push("");
  }
  if (data.open_questions.length) {
    lines.push("OPEN QUESTIONS", "──────────────");
    data.open_questions.forEach((q) => lines.push(`• ${q}`));
    lines.push("");
  }
  if (data.next_steps.length) {
    lines.push("NEXT STEPS", "──────────");
    data.next_steps.forEach((n) => lines.push(`• ${n}`));
  }
  return lines.join("\n").trim();
}

function formatSlack(data: ParsedMeeting): string {
  const lines: string[] = [];
  lines.push(`*📋 Summary*\n${data.summary}`);
  if (data.decisions.length) {
    lines.push(`\n*✅ Key Decisions*`);
    data.decisions.forEach((d) => lines.push(`• ${d}`));
  }
  if (data.action_items.length) {
    lines.push(`\n*⚡ Action Items*`);
    data.action_items.forEach((a) =>
      lines.push(`• \`${a.owner_name}\` – ${a.description}`)
    );
  }
  if (data.risks.length) {
    lines.push(`\n*🚧 Risks & Blockers*`);
    data.risks.forEach((r) => lines.push(`• ${r}`));
  }
  if (data.open_questions.length) {
    lines.push(`\n*❓ Open Questions*`);
    data.open_questions.forEach((q) => lines.push(`• ${q}`));
  }
  if (data.next_steps.length) {
    lines.push(`\n*➡️ Next Steps*`);
    data.next_steps.forEach((n) => lines.push(`• ${n}`));
  }
  return lines.join("\n").trim();
}

function formatEmail(data: ParsedMeeting): string {
  const lines: string[] = [];
  lines.push("Meeting Summary", "", data.summary, "");
  if (data.decisions.length) {
    lines.push("Key Decisions", "");
    data.decisions.forEach((d) => lines.push(`- ${d}`));
    lines.push("");
  }
  if (data.action_items.length) {
    lines.push("Action Items", "");
    data.action_items.forEach((a) =>
      lines.push(`- ${a.description} (Owner: ${a.owner_name})`)
    );
    lines.push("");
  }
  if (data.risks.length) {
    lines.push("Risks & Blockers", "");
    data.risks.forEach((r) => lines.push(`- ${r}`));
    lines.push("");
  }
  if (data.open_questions.length) {
    lines.push("Open Questions", "");
    data.open_questions.forEach((q) => lines.push(`- ${q}`));
    lines.push("");
  }
  if (data.next_steps.length) {
    lines.push("Next Steps", "");
    data.next_steps.forEach((n) => lines.push(`- ${n}`));
  }
  return lines.join("\n").trim();
}

// ── Toast helper ──────────────────────────────────────────────────────────

const toastStyle = {
  background: "#0D0D0E",
  border: "1px solid rgba(166,255,77,0.25)",
  borderLeft: "3px solid #A6FF4D",
  color: "#F5F5F0",
  fontFamily: "monospace",
  fontSize: "13px",
};

// ── Fallback modal ────────────────────────────────────────────────────────

function FallbackModal({ text, onClose }: { text: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Copy text manually"
    >
      <motion.div
        className="w-full max-w-lg bg-[#0D0D0E] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden"
        initial={{ scale: 0.96, y: 8 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 8 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <span className="text-sm font-mono text-[#F5F5F0]">
            Select all and copy
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#8A8A85] hover:text-[#F5F5F0] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A6FF4D]/50"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4">
          <textarea
            readOnly
            autoFocus
            onFocus={(e) => e.target.select()}
            value={text}
            className="w-full h-64 bg-white/[0.03] border border-white/[0.08] rounded-lg p-3 text-sm font-mono text-[#F5F5F0]/80 resize-none focus:outline-none focus:border-white/[0.2] leading-relaxed"
          />
          <p className="mt-2 text-xs text-[#8A8A85] font-mono text-center">
            Ctrl+A then Ctrl+C to copy · Esc to close
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Button ────────────────────────────────────────────────────────────────

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A6FF4D]/50 focus-visible:ring-offset-1 focus-visible:ring-offset-[#050505]";

function ExportButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={[
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono tracking-wide",
        "border border-[#A6FF4D]/20 text-[#A6FF4D]/80",
        "bg-transparent transition-all duration-150",
        "hover:border-[#A6FF4D]/50 hover:text-[#A6FF4D]",
        "hover:shadow-[0_0_16px_rgba(166,255,77,0.12)] hover:bg-[#A6FF4D]/[0.04]",
        "active:scale-95",
        focusRing,
      ].join(" ")}
    >
      {icon}
      {label}
    </motion.button>
  );
}

// ── ActionBar ─────────────────────────────────────────────────────────────

export default function ActionBar({ data }: { data: ParsedMeeting }) {
  const [fallbackText, setFallbackText] = useState<string | null>(null);

  const copyText = async (text: string, msg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(msg, { duration: 2500, style: toastStyle });
    } catch {
      setFallbackText(text);
    }
  };

  const handleClipboard = () => {
    trackEvent("copy_clicked");
    copyText(formatClipboard(data), "Copied to clipboard!");
  };

  const handleSlack = () => {
    trackEvent("export_slack_clicked");
    copyText(formatSlack(data), "Copied for Slack!");
  };

  const handleEmail = () => {
    trackEvent("export_email_clicked");
    copyText(formatEmail(data), "Copied for Email!");
  };

  return (
    <>
      <div className="flex items-center gap-2 px-5 py-2.5 border-b border-white/[0.06] bg-white/[0.01] flex-wrap">
        <ExportButton icon={<Copy className="w-3 h-3" />} label="Copy" onClick={handleClipboard} />
        <ExportButton icon={<Slack className="w-3 h-3" />} label="Slack" onClick={handleSlack} />
        <ExportButton icon={<Mail className="w-3 h-3" />} label="Email" onClick={handleEmail} />
      </div>

      <AnimatePresence>
        {fallbackText && (
          <FallbackModal
            text={fallbackText}
            onClose={() => setFallbackText(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
