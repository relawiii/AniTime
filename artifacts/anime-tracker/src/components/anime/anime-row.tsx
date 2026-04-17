import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Anime } from "@/lib/anilist";
import { AnimeCard } from "./anime-card";
import { Skeleton } from "@/components/ui/skeleton";

interface AnimeRowProps {
  title: string;
  anime: Anime[] | undefined;
  isLoading?: boolean;
  className?: string;
  accent?: boolean;
}

export function AnimeRow({ title, anime, isLoading, className = "", accent }: AnimeRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const safeAnime = Array.isArray(anime) ? anime : [];

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4 }}
      className={`relative ${className}`}
    >
      {/* Row header */}
      <div className="flex items-center gap-2.5 mb-4 px-5 md:px-10 lg:px-14">
        <h2 className="text-base sm:text-lg font-bold text-white">{title}</h2>
        {accent && (
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
          </span>
        )}
      </div>

      <div className="relative group">
        {/* Left fade + arrow */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 bottom-8 z-10 w-14 flex items-center justify-center bg-gradient-to-r from-[#0a0a0a]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <div className="bg-black/60 border border-white/10 rounded-full p-1 backdrop-blur-sm">
            <ChevronLeft className="w-5 h-5 text-white" />
          </div>
        </button>

        {/* Scroll container */}
        <div
          ref={scrollRef}
          className="flex gap-3.5 overflow-x-auto scrollbar-hide px-5 md:px-10 lg:px-14 pb-3"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-40 sm:w-44 md:w-48">
                  <Skeleton className="w-full aspect-[2/3] rounded-md bg-white/5" />
                  <Skeleton className="h-3 w-3/4 mt-2.5 bg-white/5 rounded" />
                  <Skeleton className="h-2.5 w-1/2 mt-1.5 bg-white/5 rounded" />
                </div>
              ))
            : safeAnime.map((a, i) => (
                <AnimeCard key={a.id} anime={a} index={i} />
              ))}
        </div>

        {/* Right fade + arrow */}
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 bottom-8 z-10 w-14 flex items-center justify-center bg-gradient-to-l from-[#0a0a0a]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <div className="bg-black/60 border border-white/10 rounded-full p-1 backdrop-blur-sm">
            <ChevronRight className="w-5 h-5 text-white" />
          </div>
        </button>
      </div>
    </motion.section>
  );
}
