import { useState, useRef, useCallback, useEffect } from "react";
import {
  Bot,
  X,
  Send,
  Sparkles,
  Lightbulb,
  HelpCircle,
  FileText,
  Users,
  Shield,
  KeyRound,
  DollarSign,
  Library,
  Minimize2,
  Maximize2,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { searchKnowledge, getActionResponse } from "@/constants/assistant-knowledge";

// ============================================================
// Quick action suggestions (dynamic, more options)
// ============================================================
const QUICK_ACTIONS = [
  {
    label: "Como cadastrar um aluno?",
    icon: Users,
    action: "cadastrar_aluno",
  },
  {
    label: "Gerenciar permissões",
    icon: Shield,
    action: "gerenciar_permissoes",
  },
  {
    label: "Criar usuário",
    icon: KeyRound,
    action: "criar_usuario",
  },
  {
    label: "Dicas do sistema",
    icon: Lightbulb,
    action: "ajuda_sistema",
  },
  {
    label: "Sobre o Financeiro",
    icon: DollarSign,
    action: "modulo_financeiro",
  },
  {
    label: "Estrutura do BD",
    icon: Library,
    action: "banco_dados",
  },
];

// ============================================================
// Get smart response using the knowledge base
// ============================================================
function getSmartResponse(input: string): { title: string; message: string; link?: string } | null {
  const results = searchKnowledge(input);
  if (results.length > 0) {
    return {
      title: results[0].title,
      message: results[0].message,
      link: results[0].link,
    };
  }
  return null;
}

// ============================================================
// Message type
// ============================================================
interface Message {
  id: string;
  type: "bot" | "user";
  text: string;
  title?: string;
  link?: string;
  quickActions?: typeof QUICK_ACTIONS;
}

// ============================================================
// Storage key for position persistence
// ============================================================
const POSITION_STORAGE_KEY = "idep-assistant-position";

interface StoredPosition {
  x: number;
  y: number;
}

function loadPosition(): StoredPosition | null {
  try {
    const stored = localStorage.getItem(POSITION_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

function savePosition(pos: StoredPosition) {
  try {
    localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(pos));
  } catch {}
}

// ============================================================
// Main Assistant Component
// ============================================================
export function AssistantBot() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "bot",
      text: "Olá! Sou o assistente virtual do **IDEP-Gestor**. Como posso ajudar?",
      title: "🤖 Assistente IDEP",
      quickActions: QUICK_ACTIONS,
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Drag state
  const [position, setPosition] = useState<StoredPosition>(() => {
    return loadPosition() || { x: 0, y: 0 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number }>({
    x: 0,
    y: 0,
    posX: 0,
    posY: 0,
  });
  const chatRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Handle pointer events for drag
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isOpen) return; // Don't drag when chat is open
    const el = dragRef.current;
    if (!el) return;

    el.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  }, [isOpen, position]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPosition({
      x: dragStartRef.current.posX + dx,
      y: dragStartRef.current.posY + dy,
    });
  }, [isDragging]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const el = dragRef.current;
    if (el) {
      el.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
    // Save the exact final position from the drag delta, not the potentially stale state
    const finalX = dragStartRef.current.posX + (e.clientX - dragStartRef.current.x);
    const finalY = dragStartRef.current.posY + (e.clientY - dragStartRef.current.y);
    savePosition({ x: finalX, y: finalY });
  }, [isDragging]);

  // Handle quick action click
  const handleQuickAction = useCallback((action: string) => {
    const response = getActionResponse(action) || getSmartResponse(action);
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        type: "user",
        text: QUICK_ACTIONS.find((qa) => qa.action === action)?.label || action,
      },
    ]);

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          type: "bot",
          text: response.message,
          title: response.title,
          link: response.link,
          quickActions: undefined,
        },
      ]);
    }, 1200);
  }, []);

  // Handle text input submission - use knowledge base for smart responses
  const handleSendMessage = useCallback(() => {
    if (!inputText.trim()) return;

    const text = inputText.trim();
    setInputText("");
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, type: "user", text },
    ]);

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      
      // Search knowledge base for the best answer
      const response = getSmartResponse(text);
      
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          type: "bot",
          text: response
            ? response.message
            : `Olá! Entendi sua pergunta sobre "**${text}**". Não encontrei uma resposta específica na minha base de conhecimento ainda. 🧠\n\nVocê pode tentar:\n• 📌 Escolher uma das opções abaixo\n• 📖 Navegar pelo menu lateral para explorar os módulos\n• 🔍 Usar **Ctrl+K** para busca rápida\n\nEstou sempre aprendendo! Pergunte sobre alunos, cursos, administração, permissões, financeiro, ou qualquer módulo do sistema!`,
          title: response?.title || "🤖 Assistente IDEP",
          link: response?.link,
          quickActions: QUICK_ACTIONS,
        },
      ]);
    }, Response ? 800 : 1200);
  }, [inputText]);

  // Handle enter key
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  return (
    <>
      {/* Floating bot button - draggable */}
      <div
        ref={dragRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="fixed z-50"
        style={{
          bottom: isOpen ? "auto" : 24,
          right: isOpen ? "auto" : 24,
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? "grabbing" : isOpen ? "default" : "grab",
          touchAction: "none",
        }}
      >
        {/* Bot avatar button */}
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-idep-600 to-idep-800 text-white shadow-lg shadow-idep-700/30 hover:shadow-xl hover:shadow-idep-700/40 transition-shadow duration-200"
          >
            <Bot className="h-7 w-7" />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-idep-700/20 animate-ping" />
            {/* Notification dot */}
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-white">
              1
            </span>
          </motion.button>
        )}

        {/* Chat dialog */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={cn(
                "flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden",
                isExpanded ? "w-[480px] h-[600px]" : "w-[360px] h-[500px]"
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between bg-gradient-to-r from-idep-700 to-idep-800 px-4 py-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white leading-tight">
                      Assistente IDEP
                    </p>
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] text-white/70">Online</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="rounded-lg p-1.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                    title={isExpanded ? "Reduzir" : "Expandir"}
                  >
                    {isExpanded ? (
                      <Minimize2 className="h-3.5 w-3.5" />
                    ) : (
                      <Maximize2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-lg p-1.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                    title="Fechar"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div
                ref={chatRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20"
              >
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      msg.type === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-2.5",
                        msg.type === "user"
                          ? "bg-idep-700 text-white rounded-br-md"
                          : "bg-card border border-border rounded-bl-md"
                      )}
                    >
                      {msg.title && (
                        <p className="text-xs font-semibold mb-1">
                          {msg.title}
                        </p>
                      )}
                      <p
                        className={cn(
                          "text-sm leading-relaxed whitespace-pre-wrap",
                          msg.type === "user"
                            ? "text-white/90"
                            : "text-foreground"
                        )}
                      >
                        {msg.text}
                      </p>
                      {msg.link && (
                        <button
                          onClick={() => {
                            navigate(msg.link!);
                            setIsOpen(false);
                          }}
                          className="mt-2 text-xs font-medium text-idep-600 dark:text-idep-300 hover:underline"
                        >
                          Ir para a página →
                        </button>
                      )}
                      {msg.quickActions && (
                        <div className="mt-3 space-y-1.5">
                          {msg.quickActions.map((action, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleQuickAction(action.action)}
                              className="flex w-full items-center gap-2 rounded-lg border border-border bg-background/50 px-3 py-2 text-xs font-medium text-foreground hover:bg-accent hover:border-idep-300 transition-all duration-150"
                            >
                              <action.icon className="h-3.5 w-3.5 text-idep-600 shrink-0" />
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input area */}
              <div className="border-t border-border p-3 bg-background shrink-0">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Digite sua pergunta..."
                      className="h-9 w-full rounded-xl border border-input bg-background px-3 pr-8 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                    />
                    <Sparkles className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputText.trim() || isTyping}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-idep-700 text-white hover:bg-idep-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                  >
                    {isTyping ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-[9px] text-muted-foreground/50 mt-1.5 text-center">
                  Assistente inteligente · Pergunte sobre funcionalidades do sistema
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
