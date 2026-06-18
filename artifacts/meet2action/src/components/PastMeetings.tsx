import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Search, Star, ChevronLeft, Loader2, AlertTriangle,
  Users, CheckSquare, AlertCircle, HelpCircle, ArrowRight, Calendar
} from "lucide-react";
import { formatDistanceToNow, isToday, isThisWeek, isThisMonth, parseISO } from "date-fns";
import { listMeetings, getMeetingAnalysis, toggleFavorite, type MeetingListItem } from "@/lib/api";
import type { ParsedMeeting } from "@/lib/generation";
import { trackEvent } from "@/lib/analytics";

const MEETING_TYPE_LABELS: Record<string, string> = {
  standup: "Standup",
  roadmap_review: "Roadmap",
  sprint_planning: "Sprint",
  customer_call: "Customer",
  stakeholder_sync: "Stakeholder",
};

const DATE_FILTERS = ["All", "Today", "This week", "This month"] as const;
type DateFilter = (typeof DATE_FILTERS)[number];

const TYPE_FILTERS = [
  { value: "", label: "All types" },
  { value: "standup", label: "Standup" },
  { value: "sprint_planning", label: "Sprint" },
  { value: "customer_call", label: "Customer" },
  { value: "roadmap_review", label: "Roadmap" },
  { value: "stakeholder_sync", label: "Stakeholder" },
];

interface PastMeetingsProps {
  deviceId: string;
  onSelect: (data: ParsedMeeting) => void;
  onClose: () => void;
}

function matchesDate(createdAt: string, filter: DateFilter): boolean {
  if (filter === "All") return true;
  try {
    const d = parseISO(createdAt);
    if (filter === "Today") return isToday(d);
    if (filter === "This week") return isThisWeek(d, { weekStartsOn: 1 });
    if (filter === "This month") return isThisMonth(d);
  } catch {}
  return true;
}

function DetailView({
  item,
  deviceId,
  onBack,
  onLoad,
}: {
  item: MeetingListItem;
  deviceId: string;
  onBack: () => void;
  onLoad: (analysis: ParsedMeeting) => void;
}) {
  const [analysis, setAnalysis] = useState<ParsedMeeting | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getMeetingAnalysis(item.id, deviceId).then((data) => {
      setAnalysis(data);
      setLoading(false);
    });
  }, [item.id, deviceId]);

  const typeLabel = MEETING_TYPE_LABELS[item.meeting_type] ?? item.meeting_type;
  const relTime = item.created_at
    ? formatDistanceToNow(parseISO(item.created_at), { addSuffix: true })
    : "";

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.08] flex-shrink-0">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg text-[#8A8A85] hover:text-[#F5F5F0] hover:bg-white/[0.05] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A6FF4D]/50"
          aria-label="Back to list"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
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
            <span className="text-[11px] font-mono text-[#8A8A85]/60">{relTime}</span>
          </div>
          <p className="text-sm font-semibold text-[#F5F5F0] truncate">{item.title}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 text-[#A6FF4D] animate-spin" />
          </div>
        ) : !analysis ? (
          <div className="flex flex-col items-center gap-2 py-16">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <p className="text-sm text-[#8A8A85]">Could not load analysis</p>
          </div>
        ) : (
          <>
            {analysis.summary && (
              <Section label="Summary" icon={null}>
                <p className="text-sm text-[#F5F5F0]/80 leading-relaxed">{analysis.summary}</p>
              </Section>
            )}
            {analysis.decisions?.length > 0 && (
              <Section label="Key Decisions" icon={<CheckSquare className="w-3.5 h-3.5" />}>
                <ul className="flex flex-col gap-2">
                  {analysis.decisions.map((d, i) => (
                    <li key={i} className="flex gap-2 text-sm text-[#F5F5F0]/80 leading-relaxed">
                      <ArrowRight className="w-3 h-3 text-[#A6FF4D]/50 flex-shrink-0 mt-0.5" />
                      {d}
                    </li>
                  ))}
                </ul>
              </Section>
            )}
            {analysis.action_items?.length > 0 && (
              <Section label="Action Items" icon={<Users className="w-3.5 h-3.5" />}>
                <ul className="flex flex-col gap-2">
                  {analysis.action_items.map((a, i) => (
                    <li key={i} className="flex flex-col gap-1">
                      <span className="text-sm text-[#F5F5F0]/80 leading-relaxed">{a.description}</span>
                      <span
                        className="self-start px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-widest"
                        style={{
                          backgroundColor: "rgba(166,255,77,0.06)",
                          color: "#A6FF4D",
                          border: "1px solid rgba(166,255,77,0.12)",
                        }}
                      >
                        {a.owner_name}
                      </span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
            {analysis.risks?.length > 0 && (
              <Section label="Risks" icon={<AlertCircle className="w-3.5 h-3.5" />}>
                <ul className="flex flex-col gap-2">
                  {analysis.risks.map((r, i) => (
                    <li key={i} className="text-sm text-[#F5F5F0]/80 leading-relaxed flex gap-2">
                      <span className="text-red-400/70 flex-shrink-0">·</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </Section>
            )}
            {analysis.open_questions?.length > 0 && (
              <Section label="Open Questions" icon={<HelpCircle className="w-3.5 h-3.5" />}>
                <ul className="flex flex-col gap-2">
                  {analysis.open_questions.map((q, i) => (
                    <li key={i} className="text-sm text-[#F5F5F0]/80 leading-relaxed flex gap-2">
                      <span className="text-yellow-400/70 flex-shrink-0">?</span>
                      {q}
                    </li>
                  ))}
                </ul>
              </Section>
            )}
            {analysis.next_steps?.length > 0 && (
              <Section label="Next Steps" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                <ul className="flex flex-col gap-2">
                  {analysis.next_steps.map((s, i) => (
                    <li key={i} className="text-sm text-[#F5F5F0]/80 leading-relaxed flex gap-2">
                      <span className="text-[#A6FF4D]/50 flex-shrink-0">→</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </>
        )}
      </div>

      {analysis && (
        <div className="px-6 py-4 border-t border-white/[0.08] flex-shrink-0">
          <button
            onClick={() => onLoad(analysis)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold bg-[#A6FF4D] text-[#050505] hover:bg-[#B8FF6A] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A6FF4D]"
          >
            Load in workspace
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function Section({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        {icon && <span className="text-[#A6FF4D]/60">{icon}</span>}
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#8A8A85]">{label}</span>
      </div>
      <div
        className="p-3 rounded-xl"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {children}
      </div>
    </div>
  );
}

export default function PastMeetings({ deviceId, onSelect, onClose }: PastMeetingsProps) {
  const [items, setItems] = useState<MeetingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("All");
  const [typeFilter, setTypeFilter] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MeetingListItem | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const result = await listMeetings(deviceId);
    setItems(result ?? []);
    setLoading(false);
  }, [deviceId]);

  useEffect(() => {
    void fetchItems();
    trackEvent("past_meetings_opened");
  }, [fetchItems]);

  const handleFavoriteToggle = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    toggleFavorite(id);
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, favorite: !item.favorite } : item))
    );
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (favoritesOnly && !item.favorite) return false;
      if (typeFilter && item.meeting_type !== typeFilter) return false;
      if (!matchesDate(item.created_at, dateFilter)) return false;
      if (query) {
        const q = query.toLowerCase();
        const inTitle = item.title?.toLowerCase().includes(q);
        const inSummary = item.summary?.toLowerCase().includes(q);
        if (!inTitle && !inSummary) return false;
      }
      return true;
    });
  }, [items, query, dateFilter, typeFilter, favoritesOnly]);

  const handleSelectItem = useCallback(
    async (item: MeetingListItem) => {
      setSelectedItem(item);
      trackEvent("past_meeting_detail_opened", { meeting_id: item.id });
    },
    []
  );

  const handleLoadInWorkspace = useCallback(
    async (item: MeetingListItem) => {
      const analysis = await getMeetingAnalysis(item.id, deviceId);
      if (analysis) {
        onSelect(analysis);
        onClose();
        trackEvent("past_meeting_loaded", { meeting_id: item.id });
      }
    },
    [deviceId, onSelect, onClose]
  );

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-stretch justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Past meetings"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <motion.div
        className="relative w-full max-w-md h-full bg-[#0D0D0E] border-l border-white/[0.08] flex flex-col shadow-2xl"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {selectedItem ? (
          <DetailView
            item={selectedItem}
            deviceId={deviceId}
            onBack={() => setSelectedItem(null)}
            onLoad={(analysis) => {
              onSelect(analysis);
              onClose();
              trackEvent("past_meeting_loaded", { meeting_id: selectedItem.id });
            }}
          />
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] flex-shrink-0">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#8A8A85]" />
                <span className="text-sm font-semibold text-[#F5F5F0]">Past meetings</span>
                {!loading && (
                  <span className="text-[10px] font-mono text-[#8A8A85]/50">
                    {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#8A8A85] hover:text-[#F5F5F0] hover:bg-white/[0.05] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A6FF4D]/50"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 pt-4 pb-2 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8A8A85]/50 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search meetings…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                  className="w-full bg-white/[0.04] border border-white/[0.10] rounded-lg pl-9 pr-4 py-2 text-sm text-[#F5F5F0] placeholder:text-[#8A8A85]/50 font-mono focus:outline-none focus:border-[#A6FF4D]/40 transition-all"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="px-5 pb-3 flex flex-col gap-2 flex-shrink-0">
              {/* Date filters */}
              <div className="flex gap-1.5 flex-wrap">
                {DATE_FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setDateFilter(f)}
                    className={[
                      "px-2.5 py-1 rounded-lg text-[10px] font-mono tracking-wide uppercase transition-all",
                      dateFilter === f
                        ? "bg-[#A6FF4D]/15 text-[#A6FF4D] border border-[#A6FF4D]/30"
                        : "bg-white/[0.03] text-[#8A8A85] border border-white/[0.08] hover:border-white/[0.20] hover:text-[#F5F5F0]",
                    ].join(" ")}
                  >
                    {f}
                  </button>
                ))}
                <button
                  onClick={() => setFavoritesOnly((v) => !v)}
                  className={[
                    "px-2.5 py-1 rounded-lg text-[10px] font-mono tracking-wide uppercase transition-all flex items-center gap-1",
                    favoritesOnly
                      ? "bg-yellow-400/15 text-yellow-400 border border-yellow-400/30"
                      : "bg-white/[0.03] text-[#8A8A85] border border-white/[0.08] hover:border-white/[0.20] hover:text-[#F5F5F0]",
                  ].join(" ")}
                  aria-pressed={favoritesOnly}
                >
                  <Star className="w-2.5 h-2.5" />
                  Favourites
                </button>
              </div>

              {/* Type filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-white/[0.04] border border-white/[0.10] rounded-lg px-3 py-1.5 text-xs font-mono text-[#F5F5F0] focus:outline-none focus:border-[#A6FF4D]/40 transition-all appearance-none"
              >
                {TYPE_FILTERS.map((t) => (
                  <option key={t.value} value={t.value} style={{ background: "#0D0D0E" }}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-5 pb-5">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-5 h-5 text-[#A6FF4D] animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-16 text-center">
                  <Calendar className="w-8 h-8 text-[#8A8A85]/30" />
                  <p className="text-sm text-[#8A8A85]">
                    {items.length === 0 ? "No meetings yet" : "No meetings match your filters"}
                  </p>
                  {items.length === 0 && (
                    <p className="text-xs text-[#8A8A85]/50">
                      Generate your first analysis to see it here
                    </p>
                  )}
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  <AnimatePresence initial={false}>
                    {filtered.map((item) => {
                      const typeLabel = MEETING_TYPE_LABELS[item.meeting_type] ?? item.meeting_type;
                      const relTime = item.created_at
                        ? formatDistanceToNow(parseISO(item.created_at), { addSuffix: true })
                        : "";
                      return (
                        <motion.li
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                        >
                          <button
                            onClick={() => handleSelectItem(item)}
                            className="w-full text-left rounded-xl p-4 group/item transition-all hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A6FF4D]/50"
                            style={{
                              background: "rgba(255,255,255,0.02)",
                              border: "1px solid rgba(255,255,255,0.06)",
                            }}
                          >
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex items-center gap-2 flex-wrap">
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
                                <span className="text-[10px] font-mono text-[#8A8A85]/50">{relTime}</span>
                              </div>
                              <button
                                onClick={(e) => handleFavoriteToggle(e, item.id)}
                                className="flex-shrink-0 p-1 rounded transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-yellow-400/50"
                                aria-label={item.favorite ? "Remove from favourites" : "Add to favourites"}
                                aria-pressed={!!item.favorite}
                              >
                                <Star
                                  className="w-3.5 h-3.5 transition-colors"
                                  style={{
                                    color: item.favorite ? "#facc15" : "rgba(138,138,133,0.4)",
                                    fill: item.favorite ? "#facc15" : "none",
                                  }}
                                />
                              </button>
                            </div>
                            <p className="text-xs font-semibold text-[#F5F5F0]/90 mb-1 line-clamp-1">
                              {item.title}
                            </p>
                            {item.summary && (
                              <p className="text-xs text-[#8A8A85]/70 line-clamp-2 leading-relaxed">
                                {item.summary}
                              </p>
                            )}
                          </button>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              )}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
