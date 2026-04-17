import { HeroSection } from "@/components/anime/hero-section";
import { AnimeRow } from "@/components/anime/anime-row";
import {
  useTrendingAnime,
  usePopularAnime,
  useUpcomingAnime,
  useAiringToday,
} from "@/hooks/use-anime";

export default function HomePage() {
  const trending = useTrendingAnime();
  const popular = usePopularAnime();
  const upcoming = useUpcomingAnime();
  const airingToday = useAiringToday();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <HeroSection anime={trending.data} isLoading={trending.isLoading} />

      <div className="relative z-10 -mt-12 pb-20 space-y-12">
        {airingToday.data && airingToday.data.length > 0 && (
          <AnimeRow
            title="Airing Today"
            anime={airingToday.data}
            isLoading={airingToday.isLoading}
            accent
          />
        )}

        <AnimeRow
          title="Trending Now"
          anime={trending.data}
          isLoading={trending.isLoading}
        />

        <AnimeRow
          title="Popular This Season"
          anime={popular.data}
          isLoading={popular.isLoading}
        />

        <AnimeRow
          title="Coming Soon"
          anime={upcoming.data}
          isLoading={upcoming.isLoading}
        />
      </div>
    </div>
  );
}
