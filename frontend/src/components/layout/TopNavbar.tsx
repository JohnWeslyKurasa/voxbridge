"use client";

import { useState, useEffect } from "react";
import { useSidebarStore } from "@/hooks/useSidebarStore";
import { UserButton } from "@clerk/nextjs";
import {
  Search,
  Bell,
  Menu,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Volume2,
  Video,
  Trash2,
  CheckCheck,
  ExternalLink,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  type: "success" | "info" | "audio" | "video";
  time: string;
  read: boolean;
  link?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "100% Free Unlimited Access",
    desc: "Your account has full unlimited access to all AI translation & speech features.",
    type: "info",
    time: "Just now",
    read: true,
    link: "/dashboard",
  },
  {
    id: "notif-2",
    title: "VoxBridge Neural Engine Online",
    desc: "Live speech recognition, translation, and lip-sync presenter active.",
    type: "success",
    time: "Just now",
    read: true,
    link: "/dashboard/projects",
  },
];

/**
 * TopNavbar Component - Bright Luxury Theme with Advanced Notifications Center
 */
export default function TopNavbar() {
  const { toggleMobileOpen } = useSidebarStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const refreshNotifications = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        const liveProjects = data.projects || [];
        if (liveProjects.length > 0) {
          const freshNotifs: NotificationItem[] = liveProjects.slice(0, 5).map((p: any) => ({
            id: `proj-${p._id}`,
            title: `Project: ${p.name}`,
            desc: `Target Language: ${p.targetLanguage} | Status: ${p.status.toUpperCase()}`,
            type: p.inputType === "upload_video" ? "video" : "audio",
            time: "Recently updated",
            read: true,
            link: `/dashboard/project/${p._id}`,
          }));
          setNotifications(freshNotifs);
        }
      }
    } catch {
      // Keep clean notifications
    }
  };

  useEffect(() => {
    refreshNotifications();
  }, []);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markSingleAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const filteredNotifications =
    activeTab === "unread"
      ? notifications.filter((n) => !n.read)
      : notifications;

  return (
    <header className="sticky top-0 right-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#F2E8DC] bg-white/90 backdrop-blur-md px-4 sm:px-6 shadow-soft">
      {/* Left side: Hamburger (Mobile Only) & Search */}
      <div className="flex items-center gap-4 flex-1">
        {/* Toggle mobile sidebar */}
        <button
          onClick={toggleMobileOpen}
          className="lg:hidden p-2 rounded-xl text-[#7A6B6B] hover:bg-[#F8EFE6] hover:text-[#7B1E3A] focus:outline-none transition-colors cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Search Input Bar */}
        <div className="relative w-full max-w-md hidden sm:block">
          <span className="absolute inset-y-0 left-3.5 flex items-center text-[#7A6B6B] pointer-events-none">
            <Search className="h-4 w-4 text-[#D4AF7A]" />
          </span>
          <input
            type="search"
            placeholder="Search projects, transcripts, or voice styles..."
            className="w-full rounded-full border border-[#F2E8DC] bg-[#FFF8F0] pl-10 pr-4 py-2 text-xs font-bold text-[#2B1B1B] outline-none focus:bg-white focus:border-[#7B1E3A] focus:ring-2 focus:ring-[#7B1E3A]/10 transition-all placeholder:text-[#7A6B6B]"
          />
        </div>
      </div>

      {/* Right side: Actions (Studio Plan Badge, Notifications, Profile Button) */}
      <div className="flex items-center gap-3.5">
        {/* Luxury Studio Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FFF8F0] border border-[#D4AF7A]/40 text-xs font-bold text-[#7B1E3A]">
          <Sparkles className="h-3.5 w-3.5 text-[#D4AF7A]" />
          <span>Pro Studio</span>
        </div>

        {/* Notifications Icon with dropdown */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2.5 rounded-xl text-[#7A6B6B] hover:bg-[#FFF8F0] hover:text-[#7B1E3A] transition-colors focus:outline-none relative cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7B1E3A] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#7B1E3A] text-[9px] font-extrabold text-white items-center justify-center border border-white">
                  {unreadCount}
                </span>
              </span>
            )}
          </button>

          {/* Rebuilt Notifications Dropdown */}
          <AnimatePresence>
            {notifOpen && (
              <>
                {/* Backdrop handler to close when clicking anywhere outside */}
                <div
                  onClick={() => setNotifOpen(false)}
                  className="fixed inset-0 z-40 bg-black/5"
                />

                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute right-0 mt-3 w-80 sm:w-96 rounded-[24px] border border-[#F2E8DC] bg-white p-5 shadow-2xl z-50 origin-top-right space-y-4"
                >
                  {/* Dropdown Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#F2E8DC]">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-xl bg-[#FFF8F0] border border-[#F2E8DC] flex items-center justify-center">
                        <Bell className="w-4 h-4 text-[#D4AF7A]" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-[#2B1B1B] text-sm flex items-center gap-1.5">
                          Notifications
                          {unreadCount > 0 && (
                            <span className="bg-[#FFF8F0] text-[#7B1E3A] border border-[#D4AF7A]/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {unreadCount} new
                            </span>
                          )}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-[11px] text-[#7B1E3A] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                          title="Mark all as read"
                        >
                          <CheckCheck className="h-3.5 w-3.5 text-[#D4AF7A]" />
                          Read All
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button
                          onClick={clearAllNotifications}
                          className="p-1 rounded-lg text-[#7A6B6B] hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Clear all notifications"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => setNotifOpen(false)}
                        className="p-1.5 rounded-xl text-[#7A6B6B] hover:bg-[#FFF8F0] hover:text-[#7B1E3A] transition-colors cursor-pointer ml-1"
                        aria-label="Close notifications"
                        title="Close"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Notification Tabs (All vs Unread) */}
                  <div className="flex items-center gap-2 bg-[#FFF8F0] p-1 rounded-xl border border-[#F2E8DC]">
                    <button
                      onClick={() => setActiveTab("all")}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        activeTab === "all"
                          ? "bg-white text-[#7B1E3A] shadow-sm border border-[#F2E8DC]"
                          : "text-[#7A6B6B] hover:text-[#2B1B1B]"
                      }`}
                    >
                      All ({notifications.length})
                    </button>
                    <button
                      onClick={() => setActiveTab("unread")}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        activeTab === "unread"
                          ? "bg-white text-[#7B1E3A] shadow-sm border border-[#F2E8DC]"
                          : "text-[#7A6B6B] hover:text-[#2B1B1B]"
                      }`}
                    >
                      Unread ({unreadCount})
                    </button>
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
                    {filteredNotifications.length === 0 ? (
                      <div className="py-8 text-center space-y-1">
                        <CheckCircle2 className="h-8 w-8 text-[#D4AF7A] mx-auto opacity-75" />
                        <p className="text-xs font-bold text-[#2B1B1B]">All caught up!</p>
                        <p className="text-[11px] text-[#7A6B6B] font-semibold">No notifications right now.</p>
                      </div>
                    ) : (
                      filteredNotifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markSingleAsRead(n.id)}
                          className={`flex gap-3 text-left p-3 rounded-2xl border transition-all cursor-pointer relative group ${
                            !n.read
                              ? "bg-[#FFF8F0] border-[#D4AF7A]/40 shadow-sm"
                              : "bg-white border-[#F2E8DC] hover:bg-[#FFF8F0]/50"
                          }`}
                        >
                          {/* Unread indicator dot */}
                          {!n.read && (
                            <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-[#7B1E3A]" />
                          )}

                          {/* Category Icon */}
                          <div className="mt-0.5 shrink-0">
                            {n.type === "audio" ? (
                              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#7B1E3A] to-[#A23B5A] text-white flex items-center justify-center shadow-sm">
                                <Volume2 className="h-4 w-4 text-[#D4AF7A]" />
                              </div>
                            ) : n.type === "video" ? (
                              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#7B1E3A] to-[#A23B5A] text-white flex items-center justify-center shadow-sm">
                                <Video className="h-4 w-4 text-[#D4AF7A]" />
                              </div>
                            ) : n.type === "success" ? (
                              <div className="h-9 w-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                                <CheckCircle2 className="h-4.5 w-4.5" />
                              </div>
                            ) : (
                              <div className="h-9 w-9 rounded-xl bg-[#FFF8F0] border border-[#F2E8DC] text-[#7B1E3A] flex items-center justify-center">
                                <AlertCircle className="h-4.5 w-4.5 text-[#D4AF7A]" />
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="space-y-1 flex-1 min-w-0 pr-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-[#2B1B1B] group-hover:text-[#7B1E3A] transition-colors truncate">
                                {n.title}
                              </h4>
                            </div>
                            <p className="text-[11px] text-[#7A6B6B] leading-snug font-semibold line-clamp-2">
                              {n.desc}
                            </p>
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[10px] text-[#D4AF7A] font-extrabold">{n.time}</span>
                              {n.link && (
                                <Link
                                  href={n.link}
                                  onClick={() => setNotifOpen(false)}
                                  className="text-[10px] font-extrabold text-[#7B1E3A] hover:underline flex items-center gap-0.5"
                                >
                                  View
                                  <ExternalLink className="h-2.5 w-2.5" />
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="h-5 w-px bg-[#F2E8DC]" />

        {/* User Button Profile Dropdown from Clerk */}
        <div className="flex items-center gap-2">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                userButtonAvatarBox: "h-9 w-9 rounded-full border border-[#F2E8DC] ring-2 ring-[#D4AF7A]/30 hover:scale-105 transition-transform duration-200 shadow-sm",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
