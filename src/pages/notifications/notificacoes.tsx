import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Trash2,
  Info,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  BellOff,
  Settings,
  Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "@/contexts/notification-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatFullDate } from "@/lib/utils";

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

const typeLabels: Record<string, string> = {
  info: "Informativo",
  success: "Sucesso",
  warning: "Aviso",
  error: "Erro",
  system: "Sistema",
};

type FilterType = "todas" | "nao-lidas" | "info" | "success" | "warning" | "error" | "system";

export function NotificacoesPage() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();
  const [filter, setFilter] = useState<FilterType>("todas");
  const [showFilters, setShowFilters] = useState(false);

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "nao-lidas") return !n.lida;
    if (filter === "todas") return true;
    return n.tipo === filter;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="page-title">Central de Notificações</h2>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                  {unreadCount} nova{unreadCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <p className="page-subtitle mt-1">
              Acompanhe todas as notificações e alertas do sistema
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="gap-1.5 text-xs h-8"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar todas como lidas
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "text-muted-foreground hover:text-foreground",
              showFilters && "text-foreground bg-accent"
            )}
            title="Filtrar"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 pb-2">
              {[
                { value: "todas" as FilterType, label: "Todas" },
                { value: "nao-lidas" as FilterType, label: "Não lidas", count: unreadCount },
                { value: "info" as FilterType, label: "Informativo" },
                { value: "success" as FilterType, label: "Sucesso" },
                { value: "warning" as FilterType, label: "Aviso" },
                { value: "error" as FilterType, label: "Erro" },
                { value: "system" as FilterType, label: "Sistema" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150",
                    filter === opt.value
                      ? "bg-idep-700 text-white shadow-sm"
                      : "bg-muted text-muted-foreground hover:text-foreground border border-border"
                  )}
                >
                  {opt.label}
                  {opt.count !== undefined && opt.count > 0 && (
                    <span className="inline-flex items-center justify-center rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
                      {opt.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            {filter === "todas"
              ? "Todas as notificações"
              : filter === "nao-lidas"
              ? "Não lidas"
              : typeLabels[filter] || "Notificações"}
            <span className="text-xs font-normal text-muted-foreground">
              ({filteredNotifications.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-3">
                <BellOff className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Nenhuma notificação encontrada
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {filter !== "todas"
                  ? "Tente alterar o filtro para ver mais notificações"
                  : "Você receberá notificações sobre eventos importantes aqui"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredNotifications.map((notif, index) => {
                const Icon = iconMap[notif.tipo] || Info;
                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    className={cn(
                      "group flex gap-4 px-4 py-4 rounded-lg transition-colors duration-150",
                      !notif.lida ? "bg-primary/5 -mx-4 px-4" : "hover:bg-accent/30 -mx-4 px-4"
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                        colorMap[notif.tipo] || colorMap.info
                      )}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p
                            className={cn(
                              "text-sm leading-tight",
                              !notif.lida
                                ? "font-semibold text-foreground"
                                : "text-muted-foreground"
                            )}
                          >
                            {notif.titulo}
                          </p>
                          <span className="text-[10px] text-muted-foreground/50 mt-0.5 inline-block">
                            {typeLabels[notif.tipo]} · {formatFullDate(notif.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!notif.lida && (
                            <button
                              onClick={() => markAsRead(notif.id)}
                              className="rounded p-1 text-muted-foreground/40 hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"
                              title="Marcar como lida"
                            >
                              <CheckCheck className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notif.id)}
                            className="rounded p-1 text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                            title="Excluir"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground/80 mt-1.5 leading-relaxed">
                        {notif.mensagem}
                      </p>
                      {notif.link && (
                        <button
                          onClick={() => notif.link && navigate(notif.link)}
                          className="mt-2 text-xs font-medium text-idep-700 hover:text-idep-800 dark:text-idep-300 transition-colors"
                        >
                          Ver detalhes →
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
