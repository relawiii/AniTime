import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, Check, Trash2, Radio, Clock, AlertTriangle, Info } from "lucide-react";
import { useNotifications, AppNotification } from "@/hooks/use-notifications";
import { useLocation } from "wouter";

function timeAgo(timestamp: number): string {
  const secs = Math.floor((Date.now() - timestamp) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function NotifIcon({ type }: { type: AppNotification["type"] }) {
  if (type === "airing_now") return <Radio className="w-4 h-4 text-primary" />;
  if (type === "airing_soon") return <Clock className="w-4 h-4 text-yellow-400" />;
  if (type === "delayed") return <AlertTriangle className="w-4 h-4 text-orange-400" />;
  return <Info className="w-4 h-4 text-white/40" />;
}

function NotifItem({ notif, onRead }: { notif: AppNotification; onRead: (id: string) => void }) {
  const [, navigate] = useLocation();

  const handleClick = () => {
    onRead(notif.id);
    if (notif.animeId > 0) navigate(`/anime/${notif.animeId}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      onClick={handleClick}
      className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-white/5 ${
        !notif.read ? "bg-primary/5 border-l-2 border-primary" : "border-l-2 border-transparent"
      }`}
    >
      {/* Cover or icon */}
      {notif.coverImage ? (
        <img
          src={notif.coverImage}
          alt=""
          className="w-9 h-12 object-cover rounded flex-shrink-0 mt-0.5"
        />
      ) : (
        <div className="w-9 h-12 rounded bg-white/5 flex items-center justify-center flex-shrink-0">
          <NotifIcon type={notif.type} />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-semibold truncate">{notif.animeTitle}</p>
        <p className="text-white/60 text-xs mt-0.5 leading-snug">{notif.message}</p>
        <p className="text-white/30 text-[10px] mt-1">{timeAgo(notif.timestamp)}</p>
      </div>

      {!notif.read && (
        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
      )}
    </motion.div>
  );
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    markAllRead,
    markRead,
    clearAll,
    permissionGranted,
    requestPermission,
  } = useNotifications();
  const safeNotifications = Array.isArray(notifications) ? notifications : []

  // Close on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-white/70 hover:text-white transition-colors rounded-md hover:bg-white/5"
      >
        <Bell className="w-5 h-5" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-0.5"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 bg-[#111111] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span className="text-white font-bold text-sm">Notifications</span>
              <div className="flex items-center gap-2">
                {!permissionGranted && (
                  <button
                    onClick={requestPermission}
                    className="text-[11px] text-primary hover:underline font-medium"
                  >
                    Enable push
                  </button>
                )}
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    title="Mark all read"
                    className="text-white/40 hover:text-white transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                {safeNotifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    title="Clear all"
                    className="text-white/40 hover:text-white transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Notification permission banner */}
            {!permissionGranted && (
              <div className="mx-3 my-2 p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-start gap-2">
                <BellOff className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white text-xs font-semibold">Enable push notifications</p>
                  <p className="text-white/50 text-xs mt-0.5">
                    Get notified on Windows and Android when episodes air.
                  </p>
                  <button
                    onClick={requestPermission}
                    className="mt-2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full hover:bg-primary/80 transition-colors"
                  >
                    Allow Notifications
                  </button>
                </div>
              </div>
            )}

            {/* List */}
            <div className="overflow-y-auto max-h-96">
              <AnimatePresence initial={false}>
                {safeNotifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <Bell className="w-8 h-8 text-white/10 mx-auto mb-3" />
                    <p className="text-white/30 text-sm">No notifications yet</p>
                    <p className="text-white/20 text-xs mt-1">Follow anime to get alerts</p>
                  </div>
                ) : (
                  safeNotifications.map(notif => (
                    <NotifItem key={notif.id} notif={notif} onRead={markRead} />
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
