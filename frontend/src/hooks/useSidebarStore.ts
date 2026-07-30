import { create } from "zustand";

interface SidebarState {
  isCollapsed: boolean; // For desktop collapse-to-icons
  isMobileOpen: boolean; // For mobile slide-over drawer
  toggleCollapse: () => void;
  toggleMobileOpen: () => void;
  closeMobile: () => void;
}

/**
 * Zustand Sidebar Store
 * 
 * Why it is needed:
 * - Coordinates the width of the sidebar globally.
 * - Allows main page layouts and top headers to dynamically adjust margins and padding
 *   based on whether the sidebar is collapsed or expanded.
 * 
 * How it works:
 * - Uses simple boolean flags (`isCollapsed`, `isMobileOpen`) and toggles.
 * - Persists state in memory for the duration of the page session.
 */
export const useSidebarStore = create<SidebarState>((set) => ({
  isCollapsed: false,
  isMobileOpen: false,
  toggleCollapse: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
  toggleMobileOpen: () => set((state) => ({ isMobileOpen: !state.isMobileOpen })),
  closeMobile: () => set({ isMobileOpen: false }),
}));
