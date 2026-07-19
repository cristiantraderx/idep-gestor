import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Send,
  Search,
  MessageSquare,
  Users,
  ChevronLeft,
  Loader2,
  MoreVertical,
  Paperclip,
  Phone,
  Video,
  Check,
  CheckCheck,
} from "lucide-react";

interface ChatUser {
  id: string;
  nome: string;
  email?: string;
  avatar_url?: string;
  ultimo_acesso?: string;
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  created_at: string;
  read_at?: string;
}

interface Conversation {
  id: string;
  participant: ChatUser;
  lastMessage?: string;
  lastMessageAt?: string;
  unread?: number;
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (days === 1) return "Ontem";
  if (days < 7) return `${days}d atr\u00e1s`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function formatLastSeen(dateStr: string | null) {
  if (!dateStr) return "Offline";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 5) return "Online agora";
  if (mins < 60) return `Visto h\u00e1 ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Visto h\u00e1 ${hours}h`;
  return `Visto em ${date.toLocaleDateString("pt-BR")}`;
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function ChatPage() {
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [inputText, setInputText] = useState("");
  const [searchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    const loadConversations = async () => {
      setLoading(true);
      try {
        const { data: convs } = await supabase
          .from("conversations")
          .select("*")
          .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
          .order("updated_at", { ascending: false });
        if (convs) {
          const mapped = await Promise.all(
            convs.map(async (c: Record<string, unknown>) => {
              const otherId = c.user1_id === currentUserId ? c.user2_id : c.user1_id;
              const { data: u } = await supabase
                .from("usuarios")
                .select("id, nome, email, avatar_url, ultimo_acesso")
                .eq("id", otherId)
                .single();
              return {
                id: c.id,
                participant: u || { id: otherId, nome: "Usu\u00e1rio" },
                lastMessage: c.last_message,
                lastMessageAt: c.updated_at,
                unread: 0,
              };
            })
          );
          setConversations(mapped);
        }
      } catch (err) {
        console.error("Erro ao carregar conversas:", err);
      } finally {
        setLoading(false);
      }
    };
    loadConversations();
  }, [currentUserId]);

  useEffect(() => {
    if (!selectedConv) return;
    const loadMessages = async () => {
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", selectedConv)
        .order("created_at", { ascending: true });
      if (msgs) setMessages(msgs as ChatMessage[]);
    };
    loadMessages();
    const channel = supabase
      .channel(`messages:${selectedConv}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${selectedConv}` }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        setMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedConv]);

  useEffect(() => {
    if (!showNewChat || !currentUserId) return;
    const loadUsers = async () => {
      const { data } = await supabase
        .from("usuarios")
        .select("id, nome, email, avatar_url, ultimo_acesso")
        .neq("id", currentUserId)
        .order("nome");
      if (data) setUsers(data as ChatUser[]);
    };
    loadUsers();
  }, [showNewChat, currentUserId]);

  const startConversation = async (targetUser: ChatUser) => {
    const existing = conversations.find((c) => c.participant.id === targetUser.id);
    if (existing) {
      setSelectedConv(existing.id);
      setSelectedUser(existing.participant);
      setShowNewChat(false);
      return;
    }
    const { data: conv } = await supabase
      .from("conversations")
      .insert({ user1_id: currentUserId, user2_id: targetUser.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .select()
      .single();
    if (conv) {
      setConversations((prev) => [{ id: conv.id, participant: targetUser }, ...prev]);
      setSelectedConv(conv.id);
      setSelectedUser(targetUser);
      setMessages([]);
      setShowNewChat(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !selectedConv || !currentUserId) return;
    const text = inputText.trim();
    setInputText("");
    setSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: selectedConv,
        sender_id: currentUserId,
        text,
        created_at: new Date().toISOString(),
      });
      if (!error) {
        await supabase.from("conversations").update({ last_message: text, updated_at: new Date().toISOString() }).eq("id", selectedConv);
      }
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const filteredUsers = users.filter(
    (u) => u.nome.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-[calc(100vh-8rem)]"><Loader2 className="h-8 w-8 animate-spin text-idep-600" /></div>;
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-2xl border border-border bg-card overflow-hidden shadow-lg">
      {/* Sidebar */}
      <div className={cn("w-80 border-r border-border flex flex-col bg-muted/10", selectedConv ? "hidden md:flex" : "flex")}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg">Mensagens</h2>
            <Button variant="ghost" size="sm" onClick={() => setShowNewChat(true)} className="text-xs">
              <Users className="h-4 w-4 mr-1" /> Novo Chat
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="Buscar conversas..." value={searchTerm} className="w-full h-9 rounded-xl border border-input bg-background pl-9 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nenhuma conversa ainda</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowNewChat(true)}>Iniciar conversa</Button>
            </div>
          ) : (
            conversations.map((conv) => (
              <button key={conv.id} onClick={() => { setSelectedConv(conv.id); setSelectedUser(conv.participant); }}
                className={cn("w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left border-b border-border/50", selectedConv === conv.id && "bg-idep-50 dark:bg-idep-950/30")}>
                <div className="relative shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-idep-600 to-idep-800 flex items-center justify-center text-white text-sm font-medium">
                    {getInitials(conv.participant.nome)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{conv.participant.nome}</p>
                    {conv.lastMessageAt && <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{formatTime(conv.lastMessageAt)}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage || "Clique para iniciar conversa"}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className={cn("flex-1 flex flex-col", !selectedConv ? "hidden md:flex" : "flex")}>
        {!selectedConv ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="text-lg font-medium text-muted-foreground">Selecione uma conversa</h3>
              <p className="text-sm text-muted-foreground/60 mt-1">Escolha um chat \u00e0 esquerda ou inicie uma nova conversa</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 p-4 border-b border-border bg-background">
              <button onClick={() => { setSelectedConv(null); setSelectedUser(null); }} className="md:hidden p-1 rounded-md hover:bg-muted transition-colors">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-idep-600 to-idep-800 flex items-center justify-center text-white text-sm font-medium shrink-0">
                {selectedUser ? getInitials(selectedUser.nome) : "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{selectedUser?.nome || "Carregando..."}</p>
                <p className="text-[10px] text-muted-foreground">{formatLastSeen(selectedUser?.ultimo_acesso || null)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 rounded-lg hover:bg-muted transition-colors"><Phone className="h-4 w-4 text-muted-foreground" /></button>
                <button className="p-2 rounded-lg hover:bg-muted transition-colors"><Video className="h-4 w-4 text-muted-foreground" /></button>
                <button className="p-2 rounded-lg hover:bg-muted transition-colors"><MoreVertical className="h-4 w-4 text-muted-foreground" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageSquare className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda. Envie a primeira!</p>
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMine = msg.sender_id === currentUserId;
                  const showAvatar = idx === 0 || messages[idx - 1]?.sender_id !== msg.sender_id;
                  return (
                    <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className={cn("flex", isMine ? "justify-end" : "justify-start", showAvatar ? "mt-4" : "mt-0.5")}>
                      <div className={cn("max-w-[75%] rounded-2xl px-4 py-2.5", isMine ? "bg-idep-700 text-white rounded-br-md" : "bg-card border border-border rounded-bl-md")}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        <div className={cn("flex items-center gap-1 mt-1", isMine ? "justify-end" : "justify-start")}>
                          <span className="text-[9px] opacity-60">{formatTime(msg.created_at)}</span>
                          {isMine && (msg.read_at ? <CheckCheck className="h-3 w-3 text-blue-400" /> : <Check className="h-3 w-3 opacity-60" />)}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-border bg-background">
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-muted transition-colors shrink-0"><Paperclip className="h-4 w-4 text-muted-foreground" /></button>
                <div className="relative flex-1">
                  <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder="Digite sua mensagem..."
                    className="w-full h-10 rounded-xl border border-input bg-muted/30 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all" />
                </div>
                <button onClick={sendMessage} disabled={!inputText.trim() || sending}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-idep-700 text-white hover:bg-idep-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* New Chat Modal */}
      <AnimatePresence>
        {showNewChat && (
          <>
            <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowNewChat(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-4 md:inset-x-1/3 md:inset-y-1/4 z-50 bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Nova Conversa</h3>
                  <button onClick={() => setShowNewChat(false)} className="p-1 rounded-md hover:bg-muted transition-colors"><span className="text-lg">\u2715</span></button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input type="text" placeholder="Buscar usu\u00e1rios..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full h-9 rounded-xl border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" autoFocus />
                </div>
              </div>
              <div className="overflow-y-auto max-h-80">
                {filteredUsers.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">Nenhum usu\u00e1rio encontrado</div>
                ) : (
                  filteredUsers.map((user) => (
                    <button key={user.id} onClick={() => startConversation(user)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left border-b border-border/50">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-idep-600 to-idep-800 flex items-center justify-center text-white text-sm font-medium shrink-0">
                        {getInitials(user.nome)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{user.nome}</p>
                        <p className="text-xs text-muted-foreground">{formatLastSeen(user.ultimo_acesso || null)}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
