import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { listMeetings, getMeetingAnalysis, type MeetingListItem } from "@/lib/api";
import type { ParsedMeeting } from "@/lib/generation";
import { trackEvent } from "@/lib/analytics";

const MEETING_TYPE_LABELS: Record<string, string> = {
  standup: "Standup",
  roadmap_review: "Roadmap",
  sprint_planning: "Sprint",
  customer_call: "Customer",
  stakeholder_sync: "Stakeholder",
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A6FF4D]/50 focus-visible:ring-offset-1 focus-visible:ring-offset-[#050505]";

const toastErrStyle = {
  background: "#0D0D0E",
  border: "1px solid rgba(255,80,80,0.25)",
  borderLeft: "3px solid #FF5050",
  color: "#F5F5F0",
  fontFamily: "monospace",
  fontSize: "13px",
};

interface RecentAnalysesProps {
  deviceId: string;
  refreshKey: number;
  pendingItem: MeetingListItem | null;
  onSelect: (data: ParsedMeeting) => void;
}

export default function RecentAnalyses({
  deviceId,
  refreshKey,
  pendingItem,
  onSelect,
}: RecentAnalysesProps) {
  const [items, setItems] = useState<MeetingListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    const result = await listMeetings(deviceId);
    setLoading(false);
    if (result === null) {
      toast.error("Unable to load history. Please refresh.", {
        duration: 4000,
        style: toastErrStyle,
      });
    } else {
      setItems(result);
    }
  }, [deviceId]);

  useEffect(() => {
    fetchList();
  }, [fetchList, refreshKey]);

  const handleSelect = async (item: MeetingListItem) => {
    setLoadingId(item.id);
    trackEvent("recent_analysis_opened", { meeting_id: item.id });
    const analysis = await getMeetingAnalysis(item.id, deviceId);
    setLoadingId(null);
    if (!analysis) {
      toast.error("Couldn't load this analysis. Please try again.", {
        duration: 3000,
        style: toastErrStyle,
      });
      return;
    }
    onSelect(analysis);
  };

  const allItems: MeetingListItem[] = pendingItem
    ? [pendingItem, ...items.filter((i) => i.id !== pendingItem.id)]
    : items;

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
        aria-controls="recent-analyses-list"
        className={[
          "flex items-center justify-between w-full group rounded",
          focusRing,
        ].join(" ")}
      >
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-[#8A8A85]" />
          <span className="tracking-mono text-[#8A8A85] group-hover:text-[#F5F5F0] transition-colors">
            Recent
          </span>
          {loading && (
            <Loader2 className="w-2.5 h-2.5 text-[#8A8A85] animate-spin" />
          )}
        </div>
        {collapsed ? (
          <ChevronDown className="w-3 h-3 text-[#8A8A85]" />
        ) : (
          <ChevronUp className="w-3 h-3 text-[#8A8A85]" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            id="recent-analyses-list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {allItems.length === 0 ? (
              <p className="text-xs text-[#8A8A85]/60 font-mono py-2 px-1 leading-relaxed">
                No analyses yet. Generate your first meeting analysis above.
              </p>
            ) : (
              <ul className="flex flex-col gap-1 pt-1">
                {allItems.map((item) => {
                  const isPending = pendingItem?.id === item.id;
                  const isLoadingThis = loadingId === item.id;
                  const typeLabel =
                    MEETING_TYPE_LABELS[item.meeting_type] ?? item.meeting_type;
                  const relTime =
                    item.created_at && !isPending
                      ? formatDistanceToNow(new Date(item.created_at), {
                          addSuffix: true,
                        })
                      : "";

                  return (
                    <motion.li
                      key={item.id}
                      initial={isPending ? { opacity: 0, y: -6 } : false}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <button
                        onClick={() => !isPending && handleSelect(item)}
                        disabled={isLoadingThis || isPending}
                        className={[
                          "w-full text-left px-3 py-2.5 rounded-lg",
                          "bg-white/[0.02] border border-white/[0.06]",
                          "hover:bg-white/[0.05] hover:border-white/[0.15]",
                          "transition-all duration-150 group/item",
                          isPending ? "border-[#A6FF4D]/20 bg-[#A6FF4D]/[0.03] cursor-wait" : "",
                          focusRing,
                        ].join(" ")}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span
                            className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-widest flex-shrink-0"
                            style={{
                              backgroundColor: "rgba(166,255,77,0.08)",
                              color: "#A6FF4D",
                              border: "1px solid rgba(166,255,77,0.15)",
                            }}
                          >
                            {typeLabel}
                          </span>
                          <span className="text-[10px] font-mono text-[#8A8A85]/60 flex-shrink-0">
                            {isPending ? "saving…" : relTime}
                          </span>
                        </div>
                        <p className="text-xs text-[#F5F5F0]/70 group-hover/item:text-[#F5F5F0]/90 transition-colors line-clamp-2 leading-relaxed">
                          {item.summary || item.title || "No preview"}
                        </p>
                        {isLoadingThis && (
                          <div className="flex items-center gap-1 mt-1">
                            <Loader2 className="w-2.5 h-2.5 text-[#A6FF4D] animate-spin" />
                            <span className="text-[10px] font-mono text-[#8A8A85]">
                              Loading…
                            </span>
                          </div>
                        )}
                      </button>
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
