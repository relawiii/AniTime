import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useFollowsContext } from "@/hooks/use-follows";
import { useTrendingAnime, useUpcomingAnime } from "@/hooks/use-anime";

export interface AppNotification {
  id: string;
  animeId: number;
  animeTitle: string;
  coverImage?: string | null;
  message: string;
  type: "airing_now" | "airing_soon" | "delayed" | "system";
  timestamp: number;
  read: boolean;
}

interface NotificationsContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearAll: () => void;
  permissionGranted: boolean;
  requestPermission: () => Promise<void>;
  addNotification: (n: Omit<AppNotification, "id" | "timestamp" | "read">) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

const STORAGE_KEY = "anistream_notifications";
const MAX_NOTIFICATIONS = 50;

function loadFromStorage(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToStorage(notifications: AppNotification[]) {
  try {
    const safeNotifications = Array.isArray(notifications) ? notifications : [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeNotifications.slice(0, MAX_NOTIFICATIONS)));
  } catch {}
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    return reg;
  } catch {
    return null;
  }
}

async function sendBrowserNotification(
  title: string,
  body: string,
  tag: string,
  animeId?: number,
  delay = 0
) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const reg = await navigator.serviceWorker?.ready.catch(() => null);
  if (reg) {
    const payload = { title, body, tag, data: { animeId }, delay };
    if (delay > 0) {
      reg.active?.postMessage({ type: "SCHEDULE_NOTIFICATION", payload });
    } else {
      reg.active?.postMessage({ type: "SHOW_NOTIFICATION", payload });
    }
  } else {
    // Fallback: direct Notification API
    if (delay > 0) {
      setTimeout(() => new Notification(title, { body, tag, icon: "/favicon.svg" }), delay);
    } else {
      new Notification(title, { body, tag, icon: "/favicon.svg" });
    }
  }
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(loadFromStorage);
  const [permissionGranted, setPermissionGranted] = useState(
    typeof window !== "undefined" && Notification.permission === "granted"
  );
  const scheduledRef = useRef<Set<string>>(new Set());
  const { follows } = useFollowsContext();
  const trending = useTrendingAnime();
  const upcoming = useUpcomingAnime();

  // Persist on change
  useEffect(() => {
    saveToStorage(notifications);
  }, [notifications]);

  // Register SW on mount
  useEffect(() => {
    registerServiceWorker();
  }, []);

  const addNotification = useCallback((n: Omit<AppNotification, "id" | "timestamp" | "read">) => {
    const notif: AppNotification = {
      ...n,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: Date.now(),
      read: false,
    };
    setNotifications(prev => [notif, ...prev].slice(0, MAX_NOTIFICATIONS));
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermissionGranted(result === "granted");
    if (result === "granted") {
      addNotification({
        animeId: 0,
        animeTitle: "AniStream",
        message: "Notifications enabled. You'll be alerted before episodes air.",
        type: "system",
      });
    }
  }, [addNotification]);

  // Schedule browser push notifications and in-app alerts for followed anime
  useEffect(() => {
    const safeFollows = Array.isArray(follows) ? follows : [];
    if (safeFollows.length === 0) return;
    const allAnime = [...(trending.data ?? []), ...(upcoming.data ?? [])];

    safeFollows.forEach(follow => {
      const anime = allAnime.find(a => a.id === follow.animeId);
      if (!anime?.nextAiringEpisode) return;

      const { airingAt, episode } = anime.nextAiringEpisode;
      const nowSec = Math.floor(Date.now() / 1000);
      const secondsUntil = airingAt - nowSec;
      const notifyBeforeSec = (follow.notifyBeforeMinutes ?? 10) * 60;

      // Key for "before" and "at" notifications to avoid re-scheduling
      const beforeKey = `before-${follow.animeId}-${episode}`;
      const atKey = `at-${follow.animeId}-${episode}`;

      // Schedule "X minutes before" notification
      if (secondsUntil > notifyBeforeSec && !scheduledRef.current.has(beforeKey)) {
        scheduledRef.current.add(beforeKey);
        const delayMs = (secondsUntil - notifyBeforeSec) * 1000;
        setTimeout(() => {
          const title = follow.animeTitle;
          const body = `Episode ${episode} airs in ${follow.notifyBeforeMinutes} minutes`;
          sendBrowserNotification(title, body, beforeKey, follow.animeId);
          addNotification({
            animeId: follow.animeId,
            animeTitle: follow.animeTitle,
            coverImage: follow.animeCoverImage,
            message: `Episode ${episode} airs in ${follow.notifyBeforeMinutes} minutes`,
            type: "airing_soon",
          });
        }, delayMs);
      }

      // Schedule "Now Airing" notification
      if (secondsUntil > 0 && !scheduledRef.current.has(atKey)) {
        scheduledRef.current.add(atKey);
        const delayMs = secondsUntil * 1000;
        setTimeout(() => {
          const title = follow.animeTitle;
          const body = `Episode ${episode} is now airing!`;
          sendBrowserNotification(title, body, atKey, follow.animeId);
          addNotification({
            animeId: follow.animeId,
            animeTitle: follow.animeTitle,
            coverImage: follow.animeCoverImage,
            message: `Episode ${episode} is now airing!`,
            type: "airing_now",
          });
        }, delayMs);
      }

      // If already airing, add in-app notification if not already shown
      if (secondsUntil <= 0 && secondsUntil > -300) {
        const liveKey = `live-${follow.animeId}-${episode}`;
        if (!scheduledRef.current.has(liveKey)) {
          scheduledRef.current.add(liveKey);
          addNotification({
            animeId: follow.animeId,
            animeTitle: follow.animeTitle,
            coverImage: follow.animeCoverImage,
            message: `Episode ${episode} is now airing!`,
            type: "airing_now",
          });
        }
      }
    });
  }, [follows, trending.data, upcoming.data, addNotification]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationsContext.Provider value={{
      notifications,
      unreadCount,
      markAllRead,
      markRead,
      clearAll,
      permissionGranted,
      requestPermission,
      addNotification,
    }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
