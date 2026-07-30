"use client";

import Sidebar from "@/components/layout/Sidebar";
import TopNavbar from "@/components/layout/TopNavbar";
import { useSidebarStore } from "@/hooks/useSidebarStore";

/**
 * Dashboard Layout Shell - Bright Luxury Theme
 */
export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isCollapsed } = useSidebarStore();

  return (
    <div className="min-h-screen bg-[#FFF8F0] relative overflow-hidden text-[#2B1B1B]">
      {/* Background Subtle Luxury Glow Elements */}
      <div className="fixed top-0 left-1/3 -translate-x-1/2 w-96 h-96 bg-[#D4AF7A]/10 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed bottom-10 right-10 w-96 h-96 bg-[#7B1E3A]/5 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Navigation sidebar */}
      <Sidebar />

      {/* Main panel layout content wrapper */}
      <div
        className={`flex flex-col min-h-screen transition-all duration-300 relative z-10 ${
          isCollapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        {/* Top Header Navbar */}
        <TopNavbar />

        {/* Dynamic page contents nested inside */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
