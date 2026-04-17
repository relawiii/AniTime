import { createContext, useContext, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetFollows,
  useFollowAnime,
  useUnfollowAnime,
  getGetFollowsQueryKey,
} from "@workspace/api-client-react";

interface FollowInput {
  animeId: number;
  animeTitle: string;
  animeCoverImage: string | null;
  notifyBeforeMinutes: number;
}

interface FollowsContextType {
  follows: ReturnType<typeof useGetFollows>["data"];
  isLoading: boolean;
  isFollowing: (animeId: number) => boolean;
  follow: (input: FollowInput) => void;
  unfollow: (animeId: number) => void;
}

const FollowsContext = createContext<FollowsContextType | undefined>(undefined);

export function FollowsProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { data: follows, isLoading } = useGetFollows();
  const followMutation = useFollowAnime();
  const unfollowMutation = useUnfollowAnime();

  const isFollowing = useCallback(
    (animeId: number) => {
      return follows?.some((f: { animeId: number }) => f.animeId === animeId) ?? false;
    },
    [follows]
  );

  const follow = useCallback(
    (input: FollowInput) => {
      // Request notification permission on first follow
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "default") {
          Notification.requestPermission();
        }
      }

      followMutation.mutate(
        {
          data: {
            animeId: input.animeId,
            animeTitle: input.animeTitle,
            animeCoverImage: input.animeCoverImage ?? undefined,
            notifyBeforeMinutes: input.notifyBeforeMinutes,
          },
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetFollowsQueryKey() });
          },
        }
      );
    },
    [followMutation, queryClient]
  );

  const unfollow = useCallback(
    (animeId: number) => {
      unfollowMutation.mutate(
        { animeId },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetFollowsQueryKey() });
          },
        }
      );
    },
    [unfollowMutation, queryClient]
  );

  return (
    <FollowsContext.Provider value={{ follows, isLoading, isFollowing, follow, unfollow }}>
      {children}
    </FollowsContext.Provider>
  );
}

export function useFollowsContext() {
  const context = useContext(FollowsContext);
  if (!context) {
    throw new Error("useFollowsContext must be used within FollowsProvider");
  }
  return context;
}
