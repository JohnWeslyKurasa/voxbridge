"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UploadCloud,
  FolderKanban,
  History,
  User,
} from "lucide-react";

/**
 * MobileBottomNav — Floating Bottom Navigation Bar for Mobile Phones (Bright Luxury Theme)
 */
export default function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/dashboard", icon: LayoutDashboard },
    { name: "Upload", href: "/dashboard/upload", icon: UploadCloud },
    { name: "Projects", href: "/dashboard/projects", icon: FolderKanban },
    { name: "History", href: "/dashboard/history", icon: History },
    { name: "Profile", href: "/dashboard/profile", icon: User },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="lg:hidden fixed bottom-3 left-3 right-3 z-50">
      <nav className="bg-white/95 backdrop-blur-xl border border-[#F2E8DC] rounded-full p-1.5 shadow-2xl flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-full transition-all duration-200 ${
                active
                  ? "bg-gradient-to-r from-[#7B1E3A] to-[#A23B5A] text-white shadow-md"
                  : "text-[#7A6B6B] hover:text-[#7B1E3A]"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-[#D4AF7A]" : "text-[#7A6B6B]"}`} />
              <span className="text-[9px] font-extrabold tracking-tight mt-0.5">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
