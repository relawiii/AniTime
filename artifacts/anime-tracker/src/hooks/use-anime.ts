import { useQuery } from "@tanstack/react-query";
import { anilistFetch, ANILIST_QUERIES, Anime } from "@/lib/anilist";

export function useTrendingAnime() {
  return useQuery({
    queryKey: ["anime", "trending"],
    queryFn: async () => {
      const data = await anilistFetch<{ Page: { media: Anime[] } }>(ANILIST_QUERIES.RELEASING);
      return Array.isArray(data.Page.media) ? data.Page.media : [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useUpcomingAnime() {
  return useQuery({
    queryKey: ["anime", "upcoming"],
    queryFn: async () => {
      const data = await anilistFetch<{ Page: { media: Anime[] } }>(ANILIST_QUERIES.UPCOMING);
      return Array.isArray(data.Page.media) ? data.Page.media : [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePopularAnime() {
  return useQuery({
    queryKey: ["anime", "popular"],
    queryFn: async () => {
      const data = await anilistFetch<{ Page: { media: Anime[] } }>(ANILIST_QUERIES.POPULAR);
      return Array.isArray(data.Page.media) ? data.Page.media : [];
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useAnimeDetail(id: number) {
  return useQuery({
    queryKey: ["anime", id],
    queryFn: async () => {
      const data = await anilistFetch<{ Media: Anime }>(ANILIST_QUERIES.DETAIL, { id });
      return data.Media;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAnimeByIds(ids: number[]) {
  return useQuery({
    queryKey: ["anime", "byIds", ids],
    queryFn: async () => {
      if (ids.length === 0) return [];
      const data = await anilistFetch<{ Page: { media: Anime[] } }>(ANILIST_QUERIES.BY_IDS, { ids });
      return Array.isArray(data.Page.media) ? data.Page.media : [];
    },
    enabled: ids.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAiringToday() {
  return useQuery({
    queryKey: ["anime", "airingToday"],
    queryFn: async () => {
      const data = await anilistFetch<{ Page: { media: Anime[] } }>(ANILIST_QUERIES.RELEASING, { perPage: 50 });
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000;
      const endOfToday = startOfToday + 86400;

      const media = Array.isArray(data.Page.media) ? data.Page.media : [];
      return media
        .filter(anime => {
          if (!anime.nextAiringEpisode) return false;
          const airingAt = anime.nextAiringEpisode.airingAt;
          return airingAt >= startOfToday && airingAt <= endOfToday;
        })
        .sort((a, b) => (a.nextAiringEpisode?.airingAt || 0) - (b.nextAiringEpisode?.airingAt || 0));
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000,
  });
}
