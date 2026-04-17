import { Link } from "wouter";
import { motion } from "framer-motion";
import { Bookmark, Plus } from "lucide-react";
import { useFollowsContext } from "@/hooks/use-follows";
import { useAnimeByIds } from "@/hooks/use-anime";
import { AnimeCard } from "@/components/anime/anime-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function FollowingPage() {
  const { follows, isLoading: followsLoading } = useFollowsContext();
  const safeFollows = Array.isArray(follows) ? follows : [];
  const followedIds = safeFollows.map(f => f.animeId);
  const { data: animeList, isLoading: animeLoading } = useAnimeByIds(followedIds);

  const isLoading = followsLoading || animeLoading;

  return (
    <div className="pt-20 pb-16 px-4 md:px-8 lg:px-12 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3 mb-8">
          <Bookmark className="w-6 h-6 text-primary" />
          <h1 className="text-2xl md:text-3xl font-black text-white">My List</h1>
          {safeFollows.length > 0 && (
            <span className="ml-1 bg-primary/20 text-primary text-sm font-bold px-2.5 py-0.5 rounded-full">
              {safeFollows.length}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="w-full aspect-[2/3] rounded-md bg-white/5" />
                <Skeleton className="h-3 w-3/4 mt-2 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        ) : safeFollows.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-[#141414] flex items-center justify-center mb-6">
              <Plus className="w-10 h-10 text-white/30" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Your list is empty</h2>
            <p className="text-white/50 text-sm mb-6 max-w-sm">
              Follow anime to get notified when new episodes air and track your schedule.
            </p>
            <Link href="/">
              <button className="bg-primary text-white px-6 py-2.5 rounded font-bold text-sm hover:bg-primary/90 transition-colors">
                Browse Anime
              </button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {(Array.isArray(animeList) ? animeList : []).map((anime, i) => (
              <AnimeCard key={anime.id} anime={anime} index={i} />
            ))}
            {/* Show followed entries without detailed data */}
            {safeFollows
              .filter(f => !Array.isArray(animeList) || !animeList.find(a => a.id === f.animeId))
              .map((follow, i) => (
                <Link href={`/anime/${follow.animeId}`} key={follow.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="cursor-pointer group"
                  >
                    <div className="w-full aspect-[2/3] rounded-md bg-[#1a1a1a] overflow-hidden">
                      {follow.animeCoverImage ? (
                        <img
                          src={follow.animeCoverImage}
                          alt={follow.animeTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20 text-xs p-2 text-center">
                          {follow.animeTitle}
                        </div>
                      )}
                    </div>
                    <p className="text-white text-xs font-medium mt-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {follow.animeTitle}
                    </p>
                  </motion.div>
                </Link>
              ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
