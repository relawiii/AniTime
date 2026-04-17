export type AnimeStatus = "FINISHED" | "RELEASING" | "NOT_YET_RELEASED" | "CANCELLED" | "HIATUS";

export interface AnimeExternalLink {
  site: string;
  url: string;
  icon: string | null;
  color: string | null;
}

export interface AiringEpisode {
  airingAt: number; // Unix timestamp
  timeUntilAiring: number; // Seconds
  episode: number;
}

export interface Anime {
  id: number;
  title: {
    romaji: string;
    english: string | null;
  };
  coverImage: {
    large: string;
    extraLarge: string;
  };
  bannerImage: string | null;
  episodes: number | null;
  status: AnimeStatus;
  nextAiringEpisode: AiringEpisode | null;
  externalLinks: AnimeExternalLink[];
  popularity: number;
  averageScore: number | null;
  season: string | null;
  seasonYear: number | null;
  description?: string;
  genres?: string[];
}

export interface AniListResponse<T> {
  data: T;
  errors?: any[];
}

export async function anilistFetch<T>(query: string, variables: any = {}): Promise<T> {
  const response = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const json = await response.json() as AniListResponse<T>;
  
  if (json.errors) {
    console.error("AniList API Error:", json.errors);
    throw new Error(json.errors[0].message || "Failed to fetch from AniList");
  }
  
  return json.data;
}

export const ANILIST_QUERIES = {
  RELEASING: `
    query($page: Int = 1, $perPage: Int = 20) {
      Page(page: $page, perPage: $perPage) {
        media(status: RELEASING, type: ANIME, sort: TRENDING_DESC) {
          id
          title { romaji english }
          coverImage { large extraLarge }
          bannerImage
          episodes
          status
          nextAiringEpisode { airingAt timeUntilAiring episode }
          externalLinks { site url icon color }
          popularity
          averageScore
          season
          seasonYear
        }
      }
    }
  `,
  UPCOMING: `
    query($page: Int = 1, $perPage: Int = 20) {
      Page(page: $page, perPage: $perPage) {
        media(status: NOT_YET_RELEASED, type: ANIME, sort: POPULARITY_DESC) {
          id
          title { romaji english }
          coverImage { large extraLarge }
          bannerImage
          episodes
          status
          nextAiringEpisode { airingAt timeUntilAiring episode }
          externalLinks { site url icon color }
          popularity
          averageScore
          season
          seasonYear
        }
      }
    }
  `,
  POPULAR: `
    query($page: Int = 1, $perPage: Int = 20) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: POPULARITY_DESC, status_in: [RELEASING, FINISHED]) {
          id
          title { romaji english }
          coverImage { large extraLarge }
          bannerImage
          episodes
          status
          nextAiringEpisode { airingAt timeUntilAiring episode }
          externalLinks { site url icon color }
          popularity
          averageScore
          season
          seasonYear
        }
      }
    }
  `,
  DETAIL: `
    query($id: Int!) {
      Media(id: $id, type: ANIME) {
        id
        title { romaji english }
        coverImage { large extraLarge }
        bannerImage
        episodes
        status
        description
        genres
        nextAiringEpisode { airingAt timeUntilAiring episode }
        externalLinks { site url icon color }
        popularity
        averageScore
        season
        seasonYear
      }
    }
  `,
  SEARCH: `
    query($search: String!, $page: Int = 1, $perPage: Int = 20) {
      Page(page: $page, perPage: $perPage) {
        media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
          id
          title { romaji english }
          coverImage { large extraLarge }
          bannerImage
          episodes
          status
          nextAiringEpisode { airingAt timeUntilAiring episode }
          externalLinks { site url icon color }
          popularity
          averageScore
          season
          seasonYear
        }
      }
    }
  `,
  BY_IDS: `
    query($ids: [Int]!) {
      Page {
        media(id_in: $ids, type: ANIME) {
          id
          title { romaji english }
          coverImage { large extraLarge }
          bannerImage
          episodes
          status
          nextAiringEpisode { airingAt timeUntilAiring episode }
          externalLinks { site url icon color }
          popularity
          averageScore
          season
          seasonYear
        }
      }
    }
  `
};
