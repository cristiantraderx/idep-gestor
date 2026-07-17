import { ChevronRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { navigationItems } from "@/constants/navigation";
import type { NavItem } from "@/types/navigation";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  isCollapsed: boolean;
  mobileOpen: boolean;
  activeSection: string;
  openSubMenus: string[];
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
  onNavigate: (href: string) => void;
  onToggleSubMenu: (label: string) => void;
}

export function Sidebar({
  isCollapsed,
  mobileOpen,
  activeSection,
  openSubMenus,
  onToggleCollapse,
  onCloseMobile,
  onNavigate,
  onToggleSubMenu,
}: SidebarProps) {
  const isActive = (href: string) => {
    // For admin routes, match by full 2-segment path (e.g., /admin/usuarios)
    // For regular routes, match by first segment (e.g., /alunos, /dashboard)
    const hrefParts = href.split("/").filter(Boolean);
    const currentParts = activeSection.split("/").filter(Boolean);
    
    if (hrefParts.length >= 2 && hrefParts[0] === "admin") {
      // Admin route matching (e.g., /admin/usuarios matches admin/usuarios)
      return activeSection.startsWith(hrefParts.slice(0, 2).join("/"));
    }
    
    // Regular route matching (first segment only)
    return currentParts[0] === hrefParts[0];
  };

  const handleNavigate = (href: string) => {
    onNavigate(href);
    onCloseMobile();
  };

  const handleSubMenuToggle = (label: string) => {
    onToggleSubMenu(label);
  };

  // Desktop sidebar
  const desktopSidebar = (
    <aside
      className={cn(
        "hidden lg:flex fixed left-0 top-0 z-40 h-screen flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[60px]" : "w-[260px]"
      )}
    >
      <DesktopContent
        isCollapsed={isCollapsed}
        activeSection={activeSection}
        openSubMenus={openSubMenus}
        onToggleCollapse={onToggleCollapse}
        onNavigate={handleNavigate}
        onToggleSubMenu={handleSubMenuToggle}
        isActive={isActive}
      />
    </aside>
  );

  // Mobile sidebar overlay
  const mobileSidebar = (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen flex-col bg-sidebar border-r border-sidebar-border shadow-2xl lg:hidden transition-transform duration-300 ease-in-out w-[280px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <img
              src="/IDEP_2019-VERTICAL%20(1).png"
              alt="IDEP Logo"
              className="h-8 w-auto object-contain"
            />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sidebar-foreground leading-tight">
                IDEP-Gestor
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                Enterprise
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onCloseMobile}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="sidebar-scrollbar flex-1 overflow-y-auto overflow-x-hidden px-3 py-3">
          {navigationItems.map((entry, index) => {
            if (entry.type === "section") {
              return (
                <div
                  key={index}
                  className="px-2 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {entry.label}
                </div>
              );
            }

            const item = entry as NavItem;
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isSubMenuOpen = openSubMenus.includes(item.label);
            const isItemActive = isActive(item.href);

            return (
              <div key={index}>
                <button
                  onClick={() => {
                    if (hasSubItems) {
                      handleSubMenuToggle(item.label);
                    } else {
                      handleNavigate(item.href);
                    }
                  }}
                  className={cn(
                    "group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-150",
                    isItemActive
                      ? "bg-idep-700 text-white shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="flex-1 text-left truncate">
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="inline-flex items-center justify-center rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold">
                      {item.badge}
                    </span>
                  )}
                  {hasSubItems && (
                    <ChevronRight
                      className={cn(
                        "h-3.5 w-3.5 transition-transform duration-200",
                        isSubMenuOpen && "rotate-90"
                      )}
                    />
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {hasSubItems && isSubMenuOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="ml-3 mt-0.5 border-l border-sidebar-border pl-2 space-y-0.5">
                        {item.subItems!.map((sub, subIndex) => (
                          <button
                            key={subIndex}
                            onClick={() => handleNavigate(sub.href)}
                            className={cn(
                              "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all duration-150",
                              isActive(sub.href)
                                ? "text-idep-700 dark:text-idep-300 bg-idep-50 dark:bg-idep-950"
                                : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
                            )}
                          >
                            <sub.icon className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{sub.label}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>
      </div>
    </>
  );

  return (
    <>
      {desktopSidebar}
      {mobileSidebar}
    </>
  );
}

// Desktop sidebar content (extracted for reuse with collapse)
function DesktopContent({
  isCollapsed,
  activeSection,
  openSubMenus,
  onToggleCollapse,
  onNavigate,
  onToggleSubMenu,
  isActive,
}: {
  isCollapsed: boolean;
  activeSection: string;
  openSubMenus: string[];
  onToggleCollapse: () => void;
  onNavigate: (href: string) => void;
  onToggleSubMenu: (label: string) => void;
  isActive: (href: string) => boolean;
}) {
  return (
    <>
      {/* Brand */}
      <div
        className={cn(
          "flex h-14 items-center border-b border-sidebar-border shrink-0",
          isCollapsed ? "justify-center px-2" : "justify-between px-4"
        )}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-2.5">
            <img
              src="/IDEP_2019-VERTICAL%20(1).png"
              alt="IDEP Logo"
              className="h-8 w-auto object-contain"
            />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sidebar-foreground leading-tight">
                IDEP-Gestor
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                Enterprise
              </span>
            </div>
          </div>
        )}
        {isCollapsed && (
          <img
            src="/IDEP_2019-VERTICAL%20(1).png"
            alt="IDEP Logo"
            className="h-7 w-auto max-w-[44px] object-contain"
          />
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleCollapse}
          className={cn(
            "shrink-0 text-muted-foreground hover:text-foreground hidden lg:flex",
            isCollapsed && "hidden"
          )}
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-scrollbar flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
        {navigationItems.map((entry, index) => {
          if (entry.type === "section") {
            if (isCollapsed)
              return (
                <div key={index} className="my-2 h-px bg-sidebar-border" />
              );
            return (
              <div
                key={index}
                className="px-2 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {entry.label}
              </div>
            );
          }

          const item = entry as NavItem;
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isSubMenuOpen = openSubMenus.includes(item.label);
          const isItemActive = isActive(item.href);

          return (
            <div key={index}>
              <button
                onClick={() => {
                  if (hasSubItems) {
                    onToggleSubMenu(item.label);
                  } else {
                    onNavigate(item.href);
                  }
                }}
                className={cn(
                  "group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-150",
                  isItemActive && !isCollapsed
                    ? "bg-idep-700 text-white shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isCollapsed && "justify-center px-0"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    isCollapsed ? "h-5 w-5" : "h-5 w-5"
                  )}
                />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left truncate">
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="inline-flex items-center justify-center rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold">
                        {item.badge}
                      </span>
                    )}
                    {hasSubItems && (
                      <ChevronRight
                        className={cn(
                          "h-3.5 w-3.5 transition-transform duration-200",
                          isSubMenuOpen && "rotate-90"
                        )}
                      />
                    )}
                  </>
                )}
              </button>

              {/* Submenu */}
              <AnimatePresence initial={false}>
                {hasSubItems && isSubMenuOpen && !isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="ml-3 mt-0.5 border-l border-sidebar-border pl-2 space-y-0.5">
                      {item.subItems!.map((sub, subIndex) => (
                        <button
                          key={subIndex}
                          onClick={() => onNavigate(sub.href)}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all duration-150",
                            isActive(sub.href)
                              ? "text-idep-700 dark:text-idep-300 bg-idep-50 dark:bg-idep-950"
                              : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
                          )}
                        >
                          <sub.icon className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{sub.label}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Bottom collapsed toggle */}
      {isCollapsed && (
        <div className="border-t border-sidebar-border p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      )}
    </>
  );
}
