import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  X,
  Info,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Loader2,
  BellOff,
  Settings,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "@/contexts/notification-context";
import { Button } from "@/components/ui/button";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Notificacao } from "@/integrations/supabase/types";

const iconMap = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
  system: Settings,
} as const;

const colorMap = {
  info: "text-blue-500 bg-blue-50 dark:bg-blue-950/30",
  success: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30",
  warning: "text-amber-500 bg-amber-50 dark:bg-amber-950/30",
  error: "text-red-500 bg-red-50 dark:bg-red-950/30",
  system: "text-purple-500 bg-purple-50 dark:bg-purple-950/30",
} as const;

export function NotificationDropdown() {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleNotificationClick = async (notif: Notificacao) => {
    if (!notif.lida) {
      await markAsRead(notif.id);
    }
    if (notif.link) {
      navigate(notif.link);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setIsOpen(!isOpen)}
        className="text-muted-foreground hover:text-foreground relative"
        title="Notificações"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 min-w-[14px] items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-white animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-lg border border-border bg-card shadow-lg z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">
                  Notificações
                </span>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                    {unreadCount} nova{unreadCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    title="Marcar todas como lidas"
                  >
                    <CheckCheck className="h-3 w-3" />
                    Ler todas
                  </button>
                )}
                <button
                  onClick={() => {
                    navigate("/notificacoes");
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  title="Ver todas"
                >
                  <ExternalLink className="h-3 w-3" />
                  Ver todas
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-[360px] overflow-y-auto sidebar-scrollbar">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <BellOff className="h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-xs text-muted-foreground">
                    Nenhuma notificação
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                    Você será notificado sobre eventos importantes aqui
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.slice(0, 10).map((notif) => {
                    const Icon = iconMap[notif.tipo] || Info;
                    return (
                      <button
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={cn(
                          "flex w-full gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-accent/50",
                          !notif.lida && "bg-primary/5"
                        )}
                      >
                        <div
                          className={cn(
                            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                            colorMap[notif.tipo] || colorMap.info
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={cn(
                                "text-xs leading-tight",
                                !notif.lida
                                  ? "font-semibold text-foreground"
                                  : "text-muted-foreground"
                              )}
                            >
                              {notif.titulo}
                            </p>                            <span className="shrink-0 text-[10px] text-muted-foreground/60 whitespace-nowrap">
                                  {formatRelativeTime(notif.created_at)}
                                </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground/80 mt-0.5 line-clamp-2">
                            {notif.mensagem}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif.id);
                          }}
                          className="shrink-0 self-start rounded p-0.5 text-muted-foreground/40 hover:text-muted-foreground opacity-0 hover:opacity-100 transition-opacity"
                          title="Remover"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 10 && (
              <div className="border-t border-border px-4 py-2 text-center">
                <button
                  onClick={() => {
                    navigate("/notificacoes");
                    setIsOpen(false);
                  }}
                  className="text-[11px] font-medium text-idep-700 hover:text-idep-800 dark:text-idep-300 transition-colors"
                >
                  Ver todas as {notifications.length} notificações
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
