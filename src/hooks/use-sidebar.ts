import { useState, useCallback } from "react";
import type { SidebarState } from "@/types/navigation";

const initialState: SidebarState = {
  isOpen: true,
  isCollapsed: false,
  activeSection: "dashboard",
  openSubMenus: [],
};

export function useSidebar() {
  const [state, setState] = useState<SidebarState>(initialState);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setState((prev) => ({ ...prev, isCollapsed: !prev.isCollapsed }));
  }, []);

  const toggleMobileSidebar = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  const openMobileSidebar = useCallback(() => {
    setMobileOpen(true);
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setMobileOpen(false);
  }, []);

  const setActiveSection = useCallback((section: string) => {
    setState((prev) => ({ ...prev, activeSection: section }));
  }, []);

  const toggleSubMenu = useCallback((label: string) => {
    setState((prev) => ({
      ...prev,
      openSubMenus: prev.openSubMenus.includes(label)
        ? prev.openSubMenus.filter((item) => item !== label)
        : [...prev.openSubMenus, label],
    }));
  }, []);

  const isSubMenuOpen = useCallback(
    (label: string) => state.openSubMenus.includes(label),
    [state.openSubMenus]
  );

  return {
    ...state,
    mobileOpen,
    toggleSidebar,
    toggleMobileSidebar,
    openMobileSidebar,
    closeMobileSidebar,
    setActiveSection,
    toggleSubMenu,
    isSubMenuOpen,
  };
}
