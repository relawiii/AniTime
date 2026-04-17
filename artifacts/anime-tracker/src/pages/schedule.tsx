import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChevronRight, Radio } from "lucide-react";
import { useTrendingAnime, useUpcomingAnime } from "@/hooks/use-anime";
import { CountdownTimer } from "@/components/ui/countdown-timer";
import { PlatformBadges } from "@/components/ui/platform-badges";
import { Anime } from "@/lib/anilist";
import { useAppSettings } from "@/hooks/use-app-settings";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getWeekDays() {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : DAYS[d.getDay()],
      shortLabel: i === 0 ? "Today" : SHORT_DAYS[d.getDay()],
      date: d,
    };
  });
}

function formatTime(timestamp: number, showJST: boolean): string {
  const date = new Date(timestamp * 1000);
  const local = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (!showJST) return local;
  const jst = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
  return `${local} · ${jst} JST`;
}

function ScheduleRow({ anime, showJST }: { anime: Anime; showJST: boolean }) {
  const [, navigate] = useLocation();
  if (!anime.nextAiringEpisode) return null;
  const { airingAt, episode, timeUntilAiring } = anime.nextAiringEpisode;
  const isLive = timeUntilAiring <= 0;
  const isSoon = timeUntilAiring > 0 && timeUntilAiring < 3600;
  const title = anime.title.english || anime.title.romaji;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate(`/anime/${anime.id}`)}
      className={`group flex items-center gap-4 p-3.5 rounded-xl cursor-pointer transition-all border ${
        isLive
          ? "bg-primary/10 border-primary/30 hover:bg-primary/15"
          : isSoon
          ? "bg-yellow-500/5 border-yellow-500/20 hover:bg-yellow-500/10"
          : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1]"
      }`}
    >
      <img
        src={anime.coverImage.large}
        alt={title}
        className="w-10 h-14 object-cover rounded-lg flex-shrink-0"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {isLive && (
            <span className="flex items-center gap-1 text-primary text-[10px] font-bold">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
              </span>
              LIVE
            </span>
          )}
          <p className="text-white text-sm font-semibold truncate">{title}</p>
        </div>
        <p className="text-white/45 text-xs">
          Ep {episode} · {formatTime(airingAt, showJST)}
        </p>
        <div className="mt-1.5">
          <PlatformBadges links={anime.externalLinks} limit={2} />
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="text-right">
          {isLive ? (
            <span className="text-primary font-bold text-xs">Now</span>
          ) : (
            <CountdownTimer airingAt={airingAt} className="text-xs text-white/50 font-mono" />
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
      </div>
    </motion.div>
  );
}

export default function SchedulePage() {
  const trending = useTrendingAnime();
  const upcoming = useUpcomingAnime();
  const { showJST } = useAppSettings();
  const weekDays = useMemo(() => getWeekDays(), []);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);

  const allAnime = useMemo(() => {
    return [...(trending.data ?? []), ...(upcoming.data ?? [])].filter(a => a.nextAiringEpisode);
  }, [trending.data, upcoming.data]);

  const byOffset = useMemo(() => {
    const map: Record<number, Anime[]> = {};
    for (let i = 0; i < 7; i++) map[i] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000;

    allAnime.forEach(anime => {
      const at = anime.nextAiringEpisode!.airingAt;
      const offset = Math.floor((at - todayStart) / 86400);
      if (offset >= 0 && offset < 7) {
        map[offset].push(anime);
      }
    });

    Object.values(map).forEach(arr =>
      arr.sort((a, b) => (a.nextAiringEpisode?.airingAt ?? 0) - (b.nextAiringEpisode?.airingAt ?? 0))
    );

    return map;
  }, [allAnime]);

  const isLoading = trending.isLoading || upcoming.isLoading;
  const selectedAnime = byOffset[selectedDayIdx] ?? [];

  return (
    <div className="pt-20 pb-16 min-h-screen">
      <div className="max-w-3xl mx-auto px-5 md:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-7"
        >
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Weekly Schedule</h1>
            <p className="text-white/35 text-xs mt-0.5">Episode release times in your local timezone</p>
          </div>
        </motion.div>

        {/* Day tabs */}
        <div className="flex gap-1.5 mb-7 overflow-x-auto scrollbar-hide pb-1">
          {weekDays.map((day, i) => {
            const count = byOffset[i]?.length ?? 0;
            return (
              <button
                key={i}
                onClick={() => setSelectedDayIdx(i)}
                className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                  selectedDayIdx === i
                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                    : "bg-white/[0.04] text-white/50 border-white/[0.06] hover:bg-white/[0.08] hover:text-white/70"
                }`}
              >
                <span>{day.shortLabel}</span>
                {count > 0 && (
                  <span className={`text-[10px] font-bold ${selectedDayIdx === i ? "text-white/70" : "text-primary"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Date label */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white font-bold text-base">
              {weekDays[selectedDayIdx]?.label}
              {selectedDayIdx > 1 && (
                <span className="text-white/35 font-normal text-sm ml-2">
                  {weekDays[selectedDayIdx]?.date.toLocaleDateString([], { month: "short", day: "numeric" })}
                </span>
              )}
            </p>
            <p className="text-white/30 text-xs mt-0.5">
              {selectedAnime.length === 0
                ? "No episodes scheduled"
                : `${selectedAnime.length} episode${selectedAnime.length > 1 ? "s" : ""} airing`}
            </p>
          </div>
          {selectedDayIdx === 0 && selectedAnime.some(a => a.nextAiringEpisode && a.nextAiringEpisode.timeUntilAiring <= 0) && (
            <span className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full border border-primary/20">
              <Radio className="w-3.5 h-3.5" />
              Live now
            </span>
          )}
        </div>

        {/* Anime list */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDayIdx}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-2"
          >
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-20 bg-white/[0.03] border border-white/[0.06] rounded-xl animate-pulse" />
              ))
            ) : selectedAnime.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-white/20 text-4xl mb-4 font-black">—</p>
                <p className="text-white/35 text-sm">No episodes scheduled for this day</p>
              </div>
            ) : (
              selectedAnime.map(anime => (
                <ScheduleRow key={anime.id} anime={anime} showJST={showJST} />
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
