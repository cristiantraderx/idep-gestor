import {
  Search,
  Moon,
  Sun,
  Maximize2,
  ChevronDown,
  Menu,
  LogOut,
  User,
  Settings,
} from "lucide-react";
import { useTheme } from "@/contexts/theme-context";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { GlobalSearch, useGlobalSearch } from "@/components/search/global-search";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onToggleMobile?: () => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Header({ title, subtitle, onToggleMobile }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const { isOpen: searchOpen, setIsOpen: setSearchOpen } = useGlobalSearch();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const userName = profile?.nome || user?.email?.split("@")[0] || "Usuário";
  const userRole = profile?.perfil || "Usuário";
  const userInitials = getInitials(userName);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    navigate("/auth/login", { replace: true });
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 sm:px-4 lg:px-6">
        {/* Left side - Mobile hamburger + title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleMobile}
            className="lg:hidden text-muted-foreground hover:text-foreground -ml-1 shrink-0"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-semibold text-foreground truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate hidden xs:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {/* Global Search Button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="relative hidden sm:flex items-center gap-2 h-8 w-32 md:w-40 lg:w-48 rounded-md border border-input bg-background px-8 text-xs text-muted-foreground hover:text-foreground hover:border-ring transition-all duration-200"
            title="Pesquisar (Ctrl+K)"
          >
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <span className="truncate">Pesquisar...</span>
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </button>

          {/* Mobile search */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setSearchOpen(true)}
            className="sm:hidden text-muted-foreground hover:text-foreground"
            title="Pesquisar"
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground"
            title={theme === "light" ? "Modo escuro" : "Modo claro"}
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>

          {/* Fullscreen */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => document.documentElement.requestFullscreen()}
            className="text-muted-foreground hover:text-foreground hidden md:flex"
            title="Tela cheia"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>

          {/* Notifications */}
          <NotificationDropdown />

          {/* User menu with dropdown */}
          <div className="relative ml-1 sm:ml-2" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-1.5 sm:gap-2 border-l border-border pl-1.5 sm:pl-2 hover:opacity-80 transition-opacity"
            >
              <Avatar className="h-6 w-6 sm:h-7 sm:w-7">
                <AvatarFallback className="bg-idep-700 text-white text-[9px] sm:text-[10px]">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-medium text-foreground leading-tight max-w-[120px] truncate">
                  {userName}
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  {userRole}
                </p>
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground hidden lg:block" />
            </button>

            {/* Dropdown */}
            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-border bg-card shadow-lg z-50"
                >
                  <div className="p-1">
                    <button
                      onClick={() => { setUserMenuOpen(false); navigate("/configuracoes"); }}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-foreground hover:bg-accent transition-colors"
                    >
                      <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                      Configurações
                    </button>
                    <button
                      onClick={() => { setUserMenuOpen(false); navigate("/perfil"); }}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-foreground hover:bg-accent transition-colors"
                    >
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      Meu Perfil
                    </button>
                    <div className="my-1 border-t border-border" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sair do Sistema
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
