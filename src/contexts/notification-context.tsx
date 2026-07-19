import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Notificacao } from "@/integrations/supabase/types";
import { useAuth } from "./auth-context";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface NotificationContextType {
  notifications: Notificacao[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [internalUserId, setInternalUserId] = useState<string | null>(null);

  const unreadCount = notifications.filter((n) => !n.lida).length;

  // Fetch internal user ID from usuarios table
  useEffect(() => {
    if (!user) {
      queueMicrotask(() => setInternalUserId(null));
      return;
    }

    supabase
      .from("usuarios")
      .select("id")
      .eq("auth_user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setInternalUserId(data.id);
        }
      });
  }, [user]);

  // Fetch initial notifications
  useEffect(() => {
    if (!internalUserId) {
      queueMicrotask(() => {
        setNotifications([]);
        setLoading(false);
      });
      return;
    }

    queueMicrotask(() => setLoading(true));
    supabase
      .from("notificacoes")
      .select("*")
      .eq("usuario_id", internalUserId)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (!error && data) {
          setNotifications(data as Notificacao[]);
        }
        setLoading(false);
      });
  }, [internalUserId]);

  // Subscribe to real-time changes using the internal user ID
  useEffect(() => {
    if (!internalUserId) return;

    const channel = supabase
      .channel("notificacoes-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notificacoes",
          filter: `usuario_id=eq.${internalUserId}`,
        },
        (payload: RealtimePostgresChangesPayload<Notificacao>) => {
          const newNotification = payload.new as Notificacao;
          setNotifications((prev) => [newNotification, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notificacoes",
          filter: `usuario_id=eq.${internalUserId}`,
        },
        (payload: RealtimePostgresChangesPayload<Notificacao>) => {
          const updatedNotification = payload.new as Notificacao;
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === updatedNotification.id ? updatedNotification : n
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [internalUserId]);

  const markAsRead = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("notificacoes")
      .update({ lida: true, lida_em: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("Erro ao marcar notificação como lida:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    // Get unread notifications
    const unreadIds = notifications
      .filter((n) => !n.lida)
      .map((n) => n.id);

    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from("notificacoes")
      .update({ lida: true, lida_em: new Date().toISOString() })
      .in("id", unreadIds);

    if (error) {
      console.error("Erro ao marcar todas como lidas:", error);
    } else {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.lida ? n : { ...n, lida: true, lida_em: new Date().toISOString() }))
      );
    }
  }, [notifications]);

  const deleteNotification = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("notificacoes")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erro ao deletar notificação:", error);
    } else {
      // Optimistic update
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
