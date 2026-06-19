import { motion } from "framer-motion";
import { Zap, FileText, Cpu, Share2, Tag } from "lucide-react";

const STEPS = [
  {
    icon: FileText,
    title: "Paste your transcript",
    desc: "Drop in raw meeting notes, transcripts, or quick bullet points — just paste the text and we'll do the rest.",
  },
  {
    icon: Tag,
    title: "Choose meeting type",
    desc: "Tag it as a standup, sprint, customer call, or stakeholder sync for tailored extraction.",
  },
  {
    icon: Cpu,
    title: "AI extracts insights",
    desc: "Decisions, action items, owners, risks, and next steps are pulled out in seconds.",
  },
  {
    icon: Share2,
    title: "Export & act",
    desc: "Copy to Slack, email your team, or revisit any past meeting from your history panel.",
  },
];

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="relative min-h-screen bg-[#050505] text-[#F5F5F0] flex flex-col overflow-hidden">
      <div className="bg-mesh" aria-hidden="true" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#A6FF4D]/10 border border-[#A6FF4D]/20 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-[#A6FF4D]" />
          </div>
          <span className="font-semibold text-[#F5F5F0] tracking-tight text-sm">Meet2Action</span>
        </div>
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
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 py-20 text-center gap-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-6 max-w-2xl"
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-mono tracking-widest uppercase"
            style={{
              border: "1px solid rgba(166,255,77,0.20)",
              color: "#A6FF4D",
              background: "rgba(166,255,77,0.05)",
            }}
          >
            <Zap className="w-3 h-3" />
            AI-powered meeting intelligence
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            Turn messy meeting notes into{" "}
            <span className="text-[#A6FF4D]">structured action</span>
          </h1>

          <p className="text-[#8A8A85] text-lg leading-relaxed max-w-lg">
            Paste any transcript. Get decisions, action items, owners, risks, and next steps
            extracted in seconds — ready to share with your team.
          </p>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onGetStarted}
            data-pendo="get-started"
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold bg-[#A6FF4D] text-[#050505] hover:bg-[#B8FF6A] hover:shadow-[0_0_50px_rgba(166,255,77,0.4)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A6FF4D]"
          >
            <Zap className="w-4 h-4" />
            Get started
          </motion.button>
        </motion.div>

        {/* How it works */}
        <motion.section
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-3xl mt-8"
          aria-label="How it works"
        >
          <p className="text-[11px] font-mono tracking-widest uppercase text-[#8A8A85]/60 mb-6">
            How it works
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="flex gap-4 p-5 rounded-xl text-left"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div className="flex-shrink-0 flex items-start pt-0.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-mono font-bold"
                    style={{
                      background: "rgba(166,255,77,0.08)",
                      border: "1px solid rgba(166,255,77,0.15)",
                      color: "#A6FF4D",
                    }}
                  >
                    {i + 1}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <step.icon className="w-3.5 h-3.5 text-[#A6FF4D]/60" />
                    <span className="text-sm font-semibold text-[#F5F5F0]">{step.title}</span>
                  </div>
                  <p className="text-xs text-[#8A8A85] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 flex items-center justify-center gap-2 px-6 py-4 border-t border-white/[0.06]">
        <span className="text-[#A6FF4D] font-bold text-sm tracking-wide">N</span>
        <p className="text-[11px] font-mono text-[#8A8A85]/50 text-center">
          Instrumented with Novus – every session is tracked so we can see where PMs get stuck.
        </p>
      </footer>
    </div>
  );
}
