import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Loader2,
  FileText,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  HelpCircle,
  Users,
  ChevronRight,
} from "lucide-react";
import type { StepInfo } from "@/hooks/useGenerate";
import type { ParsedMeeting } from "@/lib/generation";
import ActionBar from "@/components/ActionBar";

// ── Helpers ─────────────────────────────────────────────────────────────────

const glass =
  "bg-white/[0.03] backdrop-blur-xl border border-white/[0.1] rounded-xl transition-all duration-200";

const glassHover =
  "hover:border-white/[0.25] hover:shadow-[0_0_32px_rgba(166,255,77,0.08)] hover:scale-[1.005]";

// ── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({
  steps,
  activeStep,
}: {
  steps: StepInfo[];
  activeStep: number;
}) {
  return (
    <div className="flex flex-col gap-1.5 px-5 py-4 border-b border-white/[0.06]">
      {steps.map((s) => {
        const isActive = s.step === activeStep;
        const isDone = s.complete;
        return (
          <motion.div
            key={s.step}
            className="flex items-center gap-2.5"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: s.step * 0.04 }}
          >
            {/* Icon */}
            <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
              <AnimatePresence mode="wait">
                {isDone ? (
                  <motion.span
                    key="check"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <Check className="w-3.5 h-3.5 text-[#A6FF4D]" />
                  </motion.span>
                ) : isActive ? (
                  <motion.span
                    key="spin"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <Loader2 className="w-3 h-3 text-[#A6FF4D] animate-spin" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="dot"
                    className="w-1.5 h-1.5 rounded-full bg-white/[0.12]"
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Label */}
            <span
              className="font-mono text-xs tracking-wide transition-colors duration-200"
              style={{
                color: isDone
                  ? "#A6FF4D"
                  : isActive
                  ? "#F5F5F0"
                  : "rgba(138,138,133,0.5)",
              }}
            >
              {s.label}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonLine({ w = "100%" }: { w?: string }) {
  return (
    <div
      className="h-3 rounded bg-white/[0.06] animate-pulse"
      style={{ width: w }}
    />
  );
}

function SkeletonCard({ title, lines = 3 }: { title: string; lines?: number }) {
  return (
    <div className={`${glass} overflow-hidden`}>
      <div className="px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="h-2.5 w-24 rounded bg-white/[0.08] animate-pulse" />
      </div>
      <div className="p-4 flex flex-col gap-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonLine
            key={i}
            w={i === lines - 1 ? "65%" : i % 2 === 0 ? "100%" : "85%"}
          />
        ))}
      </div>
    </div>
  );
}

// ── Card shell ────────────────────────────────────────────────────────────────

function Card({
  icon,
  title,
  accent,
  delay = 0,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  accent: string;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className={`${glass} ${glassHover} overflow-hidden`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.35, ease: "easeOut", delay }}
    >
      <div
        className="flex items-center gap-2.5 px-4 py-3 border-b border-white/[0.06]"
        style={{ backgroundColor: `${accent}09` }}
      >
        <span style={{ color: accent }}>{icon}</span>
        <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#8A8A85]">
          {title}
        </span>
      </div>
      <div className="p-4">{children}</div>
    </motion.div>
  );
}

// ── Individual cards ─────────────────────────────────────────────────────────

function SummaryCard({ data, delay }: { data: ParsedMeeting; delay: number }) {
  return (
    <Card
      icon={<FileText className="w-3.5 h-3.5" />}
      title="Summary"
      accent="#A6FF4D"
      delay={delay}
    >
      <p className="text-sm text-[#F5F5F0]/85 leading-relaxed">{data.summary}</p>
    </Card>
  );
}

function DecisionsCard({ data, delay }: { data: ParsedMeeting; delay: number }) {
  if (data.decisions.length === 0) return null;
  return (
    <Card
      icon={<CheckCircle2 className="w-3.5 h-3.5" />}
      title="Key Decisions"
      accent="#60A5FA"
      delay={delay}
    >
      <ul className="flex flex-col gap-2">
        {data.decisions.map((d, i) => (
          <motion.li
            key={i}
            className="flex items-start gap-2.5"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + i * 0.05 }}
          >
            <ChevronRight className="w-3.5 h-3.5 text-[#60A5FA] flex-shrink-0 mt-0.5" />
            <span className="text-sm text-[#F5F5F0]/85 leading-snug">{d}</span>
          </motion.li>
        ))}
      </ul>
    </Card>
  );
}

function ActionItemsCard({ data, delay }: { data: ParsedMeeting; delay: number }) {
  if (data.action_items.length === 0) return null;
  return (
    <Card
      icon={<ArrowRight className="w-3.5 h-3.5" />}
      title="Action Items"
      accent="#A6FF4D"
      delay={delay}
    >
      <ul className="flex flex-col gap-3">
        {data.action_items.map((item, i) => {
          const isUnassigned = item.owner_name === "Unassigned";
          return (
            <motion.li
              key={i}
              className="flex items-start gap-3"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + i * 0.05 }}
            >
              <span className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-[#A6FF4D]/10 border border-[#A6FF4D]/20 flex items-center justify-center">
                <Users className="w-2.5 h-2.5 text-[#A6FF4D]" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#F5F5F0]/85 leading-snug">
                  {item.description}
                </p>
                <span
                  className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wide"
                  style={
                    isUnassigned
                      ? {
                          backgroundColor: "rgba(251,191,36,0.08)",
                          color: "#FBBF24",
                          border: "1px solid rgba(251,191,36,0.2)",
                        }
                      : {
                          backgroundColor: "rgba(166,255,77,0.08)",
                          color: "#A6FF4D",
                          border: "1px solid rgba(166,255,77,0.2)",
                        }
                  }
                >
                  {item.owner_name}
                </span>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </Card>
  );
}

function RisksQuestionsCard({
  data,
  delay,
}: {
  data: ParsedMeeting;
  delay: number;
}) {
  const hasContent = data.risks.length > 0 || data.open_questions.length > 0;
  if (!hasContent) return null;
  return (
    <Card
      icon={<AlertTriangle className="w-3.5 h-3.5" />}
      title="Risks & Open Questions"
      accent="#F87171"
      delay={delay}
    >
      <div className="flex flex-col gap-4">
        {data.risks.length > 0 && (
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#F87171]/60 mb-2">
              Risks & Blockers
            </p>
            <ul className="flex flex-col gap-2">
              {data.risks.map((r, i) => (
                <motion.li
                  key={i}
                  className="flex items-start gap-2"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: delay + i * 0.05 }}
                >
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#F87171]/60 flex-shrink-0" />
                  <span className="text-sm text-[#F5F5F0]/85 leading-snug">{r}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        )}

        {data.open_questions.length > 0 && (
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#38BDF8]/60 mb-2">
              Open Questions
            </p>
            <ul className="flex flex-col gap-2">
              {data.open_questions.map((q, i) => (
                <motion.li
                  key={i}
                  className="flex items-start gap-2"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: delay + i * 0.05 }}
                >
                  <HelpCircle className="w-3 h-3 text-[#38BDF8]/60 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-[#F5F5F0]/85 leading-snug">{q}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}

function NextStepsCard({ data, delay }: { data: ParsedMeeting; delay: number }) {
  if (data.next_steps.length === 0) return null;
  return (
    <Card
      icon={<ArrowRight className="w-3.5 h-3.5" />}
      title="Suggested Next Steps"
      accent="#A78BFA"
      delay={delay}
    >
      <ul className="flex flex-col gap-2">
        {data.next_steps.map((n, i) => (
          <motion.li
            key={i}
            className="flex items-start gap-2.5"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + i * 0.05 }}
          >
            <ChevronRight className="w-3.5 h-3.5 text-[#A78BFA] flex-shrink-0 mt-0.5" />
            <span className="text-sm text-[#F5F5F0]/85 leading-snug">{n}</span>
          </motion.li>
        ))}
      </ul>
    </Card>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[400px] p-8"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="flex flex-col items-center gap-5 max-w-sm text-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-[#A6FF4D]/5 border border-[#A6FF4D]/10 flex items-center justify-center">
            <FileText className="w-7 h-7 text-[#A6FF4D]/50" />
          </div>
          <div className="absolute inset-0 rounded-2xl blur-xl bg-[#A6FF4D]/8 -z-10" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#F5F5F0] tracking-tight">
            Ready to process
          </h2>
          <p className="mt-1.5 text-sm text-[#8A8A85] leading-relaxed">
            Paste a meeting transcript or pick a sample on the left. Actions,
            owners, and decisions will appear here.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {["Action items", "Owners", "Decisions", "Risks", "Next steps"].map(
            (tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full text-xs border border-white/[0.08] text-[#8A8A85] bg-white/[0.02]"
              >
                {tag}
              </span>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface OutputWorkspaceProps {
  data: ParsedMeeting | null;
  isLoading: boolean;
  activeStep: number;
  completedSteps: number;
  progressSteps: StepInfo[];
  error: string | null;
}

export default function OutputWorkspace({
  data,
  isLoading,
  activeStep,
  completedSteps,
  progressSteps,
  error,
}: OutputWorkspaceProps) {
  const showSteps = isLoading || completedSteps > 0;
  const totalItems = data
    ? data.action_items.length +
      data.decisions.length +
      data.risks.length +
      data.open_questions.length +
      data.next_steps.length
    : 0;

  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] bg-[#050505]/80 backdrop-blur-md sticky top-0 z-10 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-[#8A8A85]" />
          <span className="tracking-mono text-[#8A8A85]">Output workspace</span>
        </div>
        <AnimatePresence mode="wait">
          {data ? (
            <motion.div
              key="count"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="px-2.5 py-1 rounded-md bg-[#A6FF4D]/10 border border-[#A6FF4D]/20"
            >
              <span className="tracking-mono text-[#A6FF4D] text-xs">
                {totalItems} items extracted
              </span>
            </motion.div>
          ) : isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08]"
            >
              <Loader2 className="w-3 h-3 text-[#A6FF4D] animate-spin" />
              <span className="tracking-mono text-[#8A8A85] text-xs">Processing…</span>
            </motion.div>
          ) : (
            <motion.div
              key="none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08]"
            >
              <span className="tracking-mono text-[#8A8A85]">No actions yet</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action bar — shown when data is ready */}
      <AnimatePresence>
        {data && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 overflow-hidden"
          >
            <ActionBar data={data} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step indicator (shown while loading or after) */}
      <AnimatePresence>
        {showSteps && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden flex-shrink-0"
          >
            <StepIndicator steps={progressSteps} activeStep={activeStep} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <AnimatePresence mode="wait">
          {error ? (
            <motion.div
              key="error"
              className="flex flex-col items-center justify-center min-h-[300px] p-8 gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AlertTriangle className="w-8 h-8 text-red-400" />
              <p className="text-sm text-red-400 font-mono text-center">{error}</p>
            </motion.div>
          ) : !isLoading && !data && completedSteps === 0 ? (
            <EmptyState key="empty" />
          ) : (
            <motion.div
              key="cards"
              className="p-5 flex flex-col gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* Summary — step 0 */}
              <AnimatePresence>
                {completedSteps >= 1 && (
                  data ? (
                    <SummaryCard key="summary-real" data={data} delay={0} />
                  ) : (
                    <motion.div
                      key="summary-skel"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <SkeletonCard title="Summary" lines={2} />
                    </motion.div>
                  )
                )}
              </AnimatePresence>

              {/* Key Decisions — step 1 */}
              <AnimatePresence>
                {completedSteps >= 2 && (
                  data ? (
                    <DecisionsCard key="decisions-real" data={data} delay={0.04} />
                  ) : (
                    <motion.div
                      key="decisions-skel"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <SkeletonCard title="Key Decisions" lines={3} />
                    </motion.div>
                  )
                )}
              </AnimatePresence>

              {/* Action Items — step 2 */}
              <AnimatePresence>
                {completedSteps >= 3 && (
                  data ? (
                    <ActionItemsCard key="actions-real" data={data} delay={0.08} />
                  ) : (
                    <motion.div
                      key="actions-skel"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <SkeletonCard title="Action Items" lines={4} />
                    </motion.div>
                  )
                )}
              </AnimatePresence>

              {/* Risks & Open Questions — step 3 */}
              <AnimatePresence>
                {completedSteps >= 4 && (
                  data ? (
                    <RisksQuestionsCard key="risks-real" data={data} delay={0.12} />
                  ) : (
                    <motion.div
                      key="risks-skel"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <SkeletonCard title="Risks & Open Questions" lines={3} />
                    </motion.div>
                  )
                )}
              </AnimatePresence>

              {/* Next Steps — step 4 */}
              <AnimatePresence>
                {completedSteps >= 5 && (
                  data ? (
                    <NextStepsCard key="next-real" data={data} delay={0.16} />
                  ) : (
                    <motion.div
                      key="next-skel"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <SkeletonCard title="Suggested Next Steps" lines={3} />
                    </motion.div>
                  )
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom bar */}
      <div className="px-5 py-3 border-t border-white/[0.08] bg-[#050505]/60 backdrop-blur-md flex-shrink-0">
        <p className="tracking-mono text-[#8A8A85]/60 text-center">
          {data ? "Powered by GPT-4o mini · Zero-touch action extraction" : "Powered by AI · Zero-touch action extraction"}
        </p>
      </div>
    </main>
  );
}
