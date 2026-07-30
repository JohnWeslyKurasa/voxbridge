"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebarStore } from "@/hooks/useSidebarStore";
import { SignOutButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  UploadCloud,
  FolderKanban,
  History,
  Settings,
  User,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Languages,
  X,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Collapsible Responsive Sidebar Component - Bright Luxury Theme
 */
export default function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, isMobileOpen, toggleCollapse, closeMobile } = useSidebarStore();

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Upload Workspace", href: "/dashboard/upload", icon: UploadCloud },
    { name: "Projects", href: "/dashboard/projects", icon: FolderKanban },
    { name: "History", href: "/dashboard/history", icon: History },
    { name: "Profile", href: "/dashboard/profile", icon: User },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
    { name: "Help & Docs", href: "/dashboard/help", icon: HelpCircle },
  ];

  // Helper check for active links
  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white/95 backdrop-blur-xl border-r border-[#F2E8DC] p-4 shadow-soft">
      {/* Top Header Logo */}
      <div>
        <div className="flex h-16 items-center justify-between px-2 mb-4">
          <Link href="/" className="flex items-center gap-2.5 group overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#7B1E3A] to-[#A23B5A] text-white shadow-md shadow-[#7B1E3A]/20 group-hover:scale-105 transition-transform duration-200">
              <Languages className="h-5 w-5 text-[#D4AF7A]" />
            </div>
            {!isCollapsed && (
              <span className="text-lg font-bold tracking-tight text-[#2B1B1B] animate-fade-in whitespace-nowrap">
                VoxBridge<span className="gradient-text">AI</span>
              </span>
            )}
          </Link>
          
          {/* Mobile Drawer Close Button */}
          <button
            onClick={closeMobile}
            className="lg:hidden p-1.5 rounded-lg text-[#7A6B6B] hover:bg-[#F8EFE6] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="space-y-1.5 mt-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={closeMobile}
                className={`flex items-center gap-3.5 rounded-2xl px-3.5 py-3 text-sm font-semibold transition-all duration-200 group relative ${
                  active
                    ? "bg-gradient-to-r from-[#7B1E3A] to-[#A23B5A] text-white shadow-md shadow-[#7B1E3A]/20 border-r-4 border-[#D4AF7A]"
                    : "text-[#7A6B6B] hover:bg-[#F8EFE6] hover:text-[#7B1E3A]"
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 transition-transform group-hover:scale-110 duration-200 ${
                  active ? "text-[#D4AF7A]" : "text-[#7A6B6B] group-hover:text-[#7B1E3A]"
                }`} />
                
                {!isCollapsed && (
                  <span className="animate-fade-in flex-1">{item.name}</span>
                )}

                {active && !isCollapsed && (
                  <Sparkles className="h-3.5 w-3.5 text-[#D4AF7A] shrink-0" />
                )}

                {/* Hover tooltips when collapsed */}
                {isCollapsed && (
                  <div className="absolute left-16 scale-0 rounded-xl bg-[#2B1B1B] px-3 py-1.5 text-xs font-semibold text-white group-hover:scale-100 transition-all origin-left z-50 shadow-lg border border-[#D4AF7A]/30 whitespace-nowrap">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Profile / SignOut */}
      <div className="space-y-3 pt-4 border-t border-[#F2E8DC]">
        <SignOutButton redirectUrl="/">
          <button className="flex w-full items-center gap-3.5 rounded-2xl px-3.5 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-50 hover:border-rose-200 border border-transparent transition-all group relative">
            <LogOut className="h-5 w-5 shrink-0 text-rose-500 group-hover:text-rose-700 group-hover:scale-105 transition-transform" />
            {!isCollapsed && <span className="animate-fade-in">Logout</span>}
            
            {isCollapsed && (
              <div className="absolute left-16 scale-0 rounded-xl bg-rose-950 px-3 py-1.5 text-xs font-semibold text-white group-hover:scale-100 transition-all origin-left z-50 shadow-md whitespace-nowrap">
                Logout
              </div>
            )}
          </button>
        </SignOutButton>

        {/* Collapse toggle button on Desktop */}
        <button
          onClick={toggleCollapse}
          className="hidden lg:flex w-full items-center justify-center gap-2 rounded-xl border border-[#F2E8DC] py-2 text-xs font-semibold text-[#7A6B6B] hover:bg-[#F8EFE6] hover:text-[#7B1E3A] transition-colors"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!isCollapsed && <span>Collapse Sidebar</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block fixed top-0 bottom-0 left-0 z-40 transition-all duration-300 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop filter cover */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={closeMobile}
              className="lg:hidden fixed inset-0 bg-[#2B1B1B] z-40"
            />
            {/* Slide menu content container */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed top-0 bottom-0 left-0 w-64 z-50 overflow-y-auto"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
