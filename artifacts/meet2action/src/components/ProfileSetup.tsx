import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, ArrowRight, UserX } from "lucide-react";
import type { Profile } from "@/hooks/useProfile";
import { trackEvent } from "@/lib/analytics";

const AVATARS = ["🧠", "🚀", "💡", "⚡", "🎯", "🦊", "🐙", "🌟"];

interface ProfileSetupProps {
  onComplete: (profile: Profile) => void;
}

export default function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);

  const handleSave = () => {
    const profile: Profile = { name: name.trim(), email: email.trim(), avatar, isAnonymous: false };
    trackEvent("profile_saved", { has_name: !!name.trim(), has_email: !!email.trim() });
    onComplete(profile);
  };

  const handleAnonymous = () => {
    trackEvent("profile_skipped");
    onComplete({ name: "", email: "", avatar: "🤖", isAnonymous: true });
  };

  const inputClass =
    "w-full bg-white/[0.04] border border-white/[0.10] rounded-lg px-4 py-2.5 text-sm text-[#F5F5F0] placeholder:text-[#8A8A85]/50 font-mono focus:outline-none focus:border-[#A6FF4D]/40 focus:shadow-[0_0_20px_rgba(166,255,77,0.10)] transition-all";

  return (
    <div className="relative min-h-screen bg-[#050505] text-[#F5F5F0] flex items-center justify-center px-4">
      <div className="bg-mesh" aria-hidden="true" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md"
      >
        <div
          className="rounded-2xl p-8 flex flex-col gap-6"
          style={{
            background: "rgba(13,13,14,0.95)",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 0 80px rgba(0,0,0,0.6)",
          }}
        >
          {/* Header */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-lg bg-[#A6FF4D]/10 border border-[#A6FF4D]/20 flex items-center justify-center">
                <Zap className="w-3 h-3 text-[#A6FF4D]" />
              </div>
              <span className="text-xs font-mono text-[#8A8A85] tracking-widest uppercase">Meet2Action</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">Set up your profile</h2>
            <p className="text-sm text-[#8A8A85] leading-relaxed">
              Optional — helps personalise your experience. Nothing is shared.
            </p>
          </div>

          {/* Avatar picker */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono text-[#8A8A85] tracking-wide uppercase">Avatar</label>
            <div className="flex flex-wrap gap-2">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  onClick={() => setAvatar(a)}
                  className={[
                    "w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all",
                    avatar === a
                      ? "bg-[#A6FF4D]/15 border-2 border-[#A6FF4D]/60 scale-110"
                      : "bg-white/[0.04] border border-white/[0.10] hover:border-white/[0.25]",
                  ].join(" ")}
                  aria-label={`Select avatar ${a}`}
                  aria-pressed={avatar === a}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono text-[#8A8A85] tracking-wide uppercase">Name</label>
            <input
              type="text"
              placeholder="e.g. Alex Chen"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              autoFocus
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono text-[#8A8A85] tracking-wide uppercase">Email</label>
            <input
              type="email"
              placeholder="e.g. alex@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-1">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold bg-[#A6FF4D] text-[#050505] hover:bg-[#B8FF6A] hover:shadow-[0_0_40px_rgba(166,255,77,0.35)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A6FF4D]"
            >
              Save & continue
              <ArrowRight className="w-4 h-4" />
            </motion.button>

            <button
              onClick={handleAnonymous}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm text-[#8A8A85] hover:text-[#F5F5F0] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
            >
              <UserX className="w-3.5 h-3.5" />
              Continue anonymously
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
