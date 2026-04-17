import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Star, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { anilistFetch, ANILIST_QUERIES, Anime } from "@/lib/anilist";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function useSearchAnime(query: string) {
  return useQuery<Anime[]>({
    queryKey: ["anime-search", query],
    queryFn: async () => {
      const data = await anilistFetch<{ Page: { media: Anime[] } }>(
        ANILIST_QUERIES.SEARCH,
        { search: query }
      );
      return data.Page.media;
    },
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
  });
}

interface SearchResultRowProps {
  anime: Anime;
  onSelect: () => void;
}

function SearchResultRow({ anime, onSelect }: SearchResultRowProps) {
  const title = anime.title.english || anime.title.romaji;
  const isAiring = anime.status === "RELEASING";

  return (
    <motion.button
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onSelect}
      className="w-full flex items-center gap-3.5 px-4 py-3 hover:bg-white/[0.06] transition-colors text-left rounded-lg"
    >
      <img
        src={anime.coverImage.large}
        alt={title}
        className="w-9 h-12 object-cover rounded-md flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate">{title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {isAiring && (
            <span className="text-primary text-[10px] font-bold">AIRING</span>
          )}
          {anime.seasonYear && (
            <span className="text-white/35 text-[11px]">{anime.seasonYear}</span>
          )}
          {anime.episodes && (
            <span className="text-white/35 text-[11px]">{anime.episodes} eps</span>
          )}
        </div>
      </div>
      {anime.averageScore && (
        <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold flex-shrink-0">
          <Star className="w-3 h-3 fill-yellow-400" />
          {(anime.averageScore / 10).toFixed(1)}
        </div>
      )}
    </motion.button>
  );
}

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 350);
  const { data, isLoading } = useSearchAnime(debounced);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSelect = useCallback((anime: Anime) => {
    navigate(`/anime/${anime.id}`);
    onClose();
  }, [navigate, onClose]);

  const showResults = debounced.trim().length >= 2;
  const noResults = showResults && !isLoading && (!data || data.length === 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed top-[10vh] left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-50"
          >
            <div className="bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.07]">
                <Search className="w-5 h-5 text-white/35 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search anime..."
                  className="flex-1 bg-transparent text-white placeholder:text-white/30 text-[15px] outline-none"
                />
                {isLoading && debounced.trim().length >= 2 && (
                  <Loader2 className="w-4 h-4 text-white/30 animate-spin flex-shrink-0" />
                )}
                {query && (
                  <button onClick={() => setQuery("")} className="text-white/30 hover:text-white/60 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto p-2">
                {!showResults && (
                  <div className="py-10 text-center">
                    <Search className="w-8 h-8 text-white/10 mx-auto mb-3" />
                    <p className="text-white/25 text-sm">Type to search anime</p>
                  </div>
                )}

                {showResults && isLoading && (
                  <div className="py-10 flex items-center justify-center gap-2 text-white/30">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Searching...</span>
                  </div>
                )}

                {noResults && (
                  <div className="py-10 text-center">
                    <p className="text-white/30 text-sm">No results for "{debounced}"</p>
                  </div>
                )}

                {showResults && !isLoading && data && data.length > 0 && (
                  <AnimatePresence>
                    {data.map(anime => (
                      <SearchResultRow
                        key={anime.id}
                        anime={anime}
                        onSelect={() => handleSelect(anime)}
                      />
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
