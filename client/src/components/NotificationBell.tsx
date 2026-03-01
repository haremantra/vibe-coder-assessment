/**
 * NotificationBell — Header component with bell icon, unread badge, and dropdown panel
 */

import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Check,
  CheckCheck,
  Activity,
  Trophy,
  PartyPopper,
  RefreshCw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const typeIcons: Record<string, typeof Activity> = {
  assessment_complete: Trophy,
  phase_complete: PartyPopper,
  plan_complete: CheckCheck,
  reassess_reminder: RefreshCw,
};

const typeColors: Record<string, string> = {
  assessment_complete: "text-primary",
  phase_complete: "text-emerald-400",
  plan_complete: "text-amber-400",
  reassess_reminder: "text-cyan-400",
};

export default function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: unreadCount = 0 } = trpc.notification.unreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000, // Poll every 30s
  });

  const { data: notifications = [], refetch } = trpc.notification.list.useQuery(undefined, {
    enabled: isAuthenticated && open,
  });

  const markReadMutation = trpc.notification.markRead.useMutation({
    onSuccess: () => {
      refetch();
      utils.notification.unreadCount.invalidate();
    },
  });

  const markAllReadMutation = trpc.notification.markAllRead.useMutation({
    onSuccess: () => {
      refetch();
      utils.notification.unreadCount.invalidate();
    },
  });

  const utils = trpc.useUtils();

  // Close panel on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setOpen(!open);
          if (!open) refetch();
        }}
        className="relative p-2 rounded-lg hover:bg-secondary transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 max-h-[420px] rounded-xl border border-border bg-card shadow-xl overflow-hidden z-50"
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-display text-sm font-semibold text-card-foreground">
                Notifications
              </h3>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => markAllReadMutation.mutate()}
                  >
                    <CheckCheck className="w-3.5 h-3.5 mr-1" />
                    Mark all read
                  </Button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 rounded hover:bg-secondary transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto max-h-[360px]">
              {notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No notifications yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Complete an assessment to get started
                  </p>
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = typeIcons[n.type] || Activity;
                  const color = typeColors[n.type] || "text-muted-foreground";

                  return (
                    <button
                      key={n.id}
                      onClick={() => {
                        if (!n.isRead) {
                          markReadMutation.mutate({ id: n.id });
                        }
                        if (n.actionUrl) {
                          navigate(n.actionUrl);
                          setOpen(false);
                        }
                      }}
                      className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-secondary/50 transition-colors ${
                        !n.isRead ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex gap-3">
                        <div
                          className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center ${
                            !n.isRead ? "bg-primary/10" : "bg-secondary"
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${!n.isRead ? color : "text-muted-foreground/50"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`text-sm font-medium truncate ${
                                !n.isRead ? "text-card-foreground" : "text-muted-foreground"
                              }`}
                            >
                              {n.title}
                            </p>
                            {!n.isRead && (
                              <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {n.body}
                          </p>
                          <p className="text-[10px] text-muted-foreground/50 mt-1 font-mono">
                            {new Date(n.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
