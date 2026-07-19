import { useState, useRef, useCallback, useEffect } from "react";
import {
  Bot,
  X,
  Send,
  Sparkles,
  Lightbulb,
  Users,
  Shield,
  DollarSign,
  Minimize2,
  Maximize2,
  Loader2,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Mic,
  MicOff,
  Building2,
  BookOpen,
  Package,
  BarChart3,
  Monitor,
  LayoutDashboard,
  GraduationCap,
  FileText,
  ShoppingCart,
  Library,
  Calendar,
  PieChart,
  Projector,
  HeadphonesIcon,
  UserCheck,
  BrainCircuit,
  type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { searchKnowledgeWithFeedback, getActionResponseWithFeedback } from "@/constants/assistant-knowledge";
import { processQuery, type ProcessedQuery } from "@/constants/nlp-engine";
import { getTopModules, type VisitEntry } from "@/hooks/use-navigation-tracker";
import { detectVoiceCommand, getVoiceHelpText } from "@/constants/voice-commands";
import {
  type SupportedLang,
  LANG_CONFIGS,
  detectLanguage,
  getSavedLanguage,
  saveLanguagePreference,
  LISTENING_MESSAGES,
} from "@/constants/language-detector";
import { recordQuestionSmart, getTopQuestions } from "@/constants/faq-tracker";
import { getContextualHelp, type PageHelp } from "@/constants/contextual-help";
import { WaveAnimation } from "./wave-animation";
import { useAI } from "@/hooks/use-ai";
import { type AIProvider, getModelDisplayName, getProviderIcon } from "@/services/ai-service";

// ============================================================
// Speech Recognition type declarations
// ============================================================
declare class SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

// ============================================================
// Quick action suggestions
// ============================================================
const QUICK_ACTIONS = [
  { label: "Como cadastrar um aluno?", icon: Users, action: "cadastrar_aluno" },
  { label: "Gerenciar permissões", icon: Shield, action: "gerenciar_permissoes" },
  { label: "Módulo Patrimônio", icon: Building2, action: "modulo_patrimonio" },
  { label: "Módulo Financeiro", icon: DollarSign, action: "modulo_financeiro" },
  { label: "Recursos Humanos", icon: Users, action: "modulo_rh" },
  { label: "Biblioteca", icon: BookOpen, action: "modulo_biblioteca" },
  { label: "Almoxarifado", icon: Package, action: "modulo_almoxarifado" },
  { label: "BI & Relatórios", icon: BarChart3, action: "banco_dados" },
  { label: "Atalhos do Teclado", icon: Monitor, action: "ajuda_sistema" },
  { label: "Dicas do Sistema", icon: Lightbulb, action: "ajuda_sistema" },
  { label: "🎤 Comandos de Voz", icon: Mic, action: "comandos_voz" },
];

// ============================================================
// Fallback suggestions when no answer is found
// ============================================================
// ============================================================
// NLP: Saudacoes variadas
// ============================================================
const saudacoes = [
  "Olá! 😊 Como posso ajudar você hoje?",
  "Oi! 👋 Em que posso ser útil?",
  "Olá! Tudo bem? 🚀 Como posso ajudar?",
  "Bem-vindo! 💬 Estou aqui para ajudar com o sistema!",
  "Olá! Precisa de ajuda com algum módulo? 🤖",
  "Oi! Como posso auxiliar no IDEP-Gestor hoje? 😄",
];

// ============================================================
// NLP: Emoji por intenção
// ============================================================
function getIntentEmoji(intent: string): string {
  const map: Record<string, string> = {
    TUTORIAL: "🎓",
    NAVEGACAO: "🧭",
    ACAO: "⚡",
    MODULO_INFO: "ℹ️",
    DICA: "💡",
    AJUDA: "🆘",
    SAUDACAO: "🤖",
    RELATORIO: "📊",
    GENERAL: "🤖",
  };
  return map[intent] || "🤖";
}

// ============================================================
// Module icon mapping for most visited
// ============================================================
const MODULE_ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  alunos: Users,
  cursos: GraduationCap,
  turmas: BookOpen,
  secretaria: FileText,
  rh: UserCheck,
  financeiro: DollarSign,
  compras: ShoppingCart,
  almoxarifado: Package,
  patrimonio: Building2,
  biblioteca: Library,
  agenda: Calendar,
  ti: Monitor,
  ouvidoria: HeadphonesIcon,
  relatorios: BarChart3,
  bi: PieChart,
  projetos: Projector,
  auditoria: Shield,
  configuracoes: Shield,
  admin: Shield,
  notificacoes: BarChart3,
  perfil: Users,
  chat: Bot,
};

const MODULE_PATHS: Record<string, string> = {
  dashboard: "/dashboard",
  alunos: "/alunos",
  cursos: "/cursos",
  turmas: "/turmas",
  secretaria: "/secretaria/protocolos",
  rh: "/rh/servidores",
  financeiro: "/financeiro/dashboard",
  compras: "/compras/solicitacoes",
  almoxarifado: "/almoxarifado/entradas",
  patrimonio: "/patrimonio/bens",
  biblioteca: "/biblioteca/acervo",
  agenda: "/agenda/eventos",
  ti: "/ti/chamados",
  ouvidoria: "/ouvidoria/sugestoes",
  relatorios: "/relatorios",
  bi: "/bi",
  projetos: "/projetos",
  auditoria: "/auditoria",
  configuracoes: "/configuracoes",
  admin: "/admin/usuarios",
  notificacoes: "/notificacoes",
  perfil: "/perfil",
};

// ============================================================
// Most visited modules component
// ============================================================
// ============================================================
// FAQ Panel — Perguntas Frequentes
// ============================================================
function FaqPanel({ onAsk }: { onAsk: (text: string) => void }) {
  const [faqs, setFaqs] = useState<{ text: string; count: number }[]>(() => getTopQuestions(3));

  // Atualiza as FAQs a cada 10s (caso o usuário tenha feito perguntas)
  useEffect(() => {
    const interval = setInterval(() => {
      const updated = getTopQuestions(3);
      if (updated.length > 0) {
        setFaqs(updated);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  if (faqs.length === 0) return null;

  return (
    <div className="mt-4 pt-3 border-t border-border/60">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Lightbulb className="h-3 w-3" />
        <span>Perguntas frequentes</span>
      </p>
      <div className="space-y-1.5">
        {faqs.map((faq, idx) => (
          <button
            key={idx}
            onClick={() => onAsk(faq.text)}
            className="flex w-full items-center gap-2 rounded-lg border border-border bg-background/50 px-3 py-2 text-[11px] font-medium text-foreground hover:bg-accent hover:border-amber-300 transition-all duration-150 text-left"
            title={`Perguntada ${faq.count} vez(es)`}
          >
            <span className="text-amber-500 shrink-0">❓</span>
            <span className="flex-1 leading-tight line-clamp-1">{faq.text}</span>
            {faq.count > 1 && (
              <span className="text-[8px] text-muted-foreground/50 shrink-0 ml-1">{faq.count}x</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// ContextualHelpPanel — Ajuda específica da página atual
// ============================================================
function ContextualHelpPanel({ onAsk }: { onAsk: (text: string) => void }) {
  const [help, setHelp] = useState<PageHelp | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      const path = window.location.pathname;
      const detected = getContextualHelp(path);
      if (detected) {
        setHelp(detected);
      }
    });
  }, []);

  if (!help || help.moduleName === "Dashboard") return null;

  return (
    <div className="mt-3 pt-3 border-t border-border/60">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Sparkles className="h-3 w-3 text-amber-500" />
        <span>Dicas para {help.moduleName}</span>
      </p>
      <div className="space-y-1.5">
        {help.tips.map((tip, idx) => (
          <div
            key={idx}
            className="flex items-start gap-2 rounded-lg border border-border/50 bg-amber-50/30 dark:bg-amber-950/10 px-3 py-2 text-[11px] text-foreground/90 leading-tight"
          >
            <span className="shrink-0 mt-0.5">{tip.icon}</span>
            <span className="flex-1">{tip.text}</span>
            {tip.action && (
              <button
                onClick={() => onAsk(tip.action!)}
                className="shrink-0 text-[10px] text-idep-600 dark:text-idep-400 hover:underline font-medium"
                title="Perguntar ao assistente"
              >
                Saber mais
              </button>
            )}
          </div>
        ))}
      </div>
      {help.moduleName && (
        <div className="mt-1.5 flex items-center justify-between">
          <button
            onClick={() => onAsk(`Como funciona o módulo ${help.moduleName}?`)}
            className="text-[9px] text-muted-foreground/50 hover:text-idep-600 transition-colors"
          >
            💬 Perguntar sobre {help.moduleName}
          </button>
          <span className="text-[8px] text-muted-foreground/30">
            {window.location.pathname}
          </span>
        </div>
      )}
    </div>
  );
}

function MostVisitedModules({ onNavigate, isAssistantOpen }: { onNavigate: (href: string) => void; isAssistantOpen: boolean }) {
  const [topModules, setTopModules] = useState<VisitEntry[]>([]);

  useEffect(() => {
    queueMicrotask(() => {
      const modules = getTopModules(5);
      if (modules.length > 0) {
        setTopModules(modules);
      }
    });
  }, [isAssistantOpen]);

  if (topModules.length === 0) return null;

  return (
    <div className="mt-4 pt-3 border-t border-border/60">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <BarChart3 className="h-3 w-3" />
        <span>Mais visitados</span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {topModules.map((entry, idx) => {
          const Icon = MODULE_ICONS[entry.moduleName] || LayoutDashboard;
          const href = MODULE_PATHS[entry.moduleName] || `/${entry.moduleName}`;
          return (
            <button
              key={idx}
              onClick={() => onNavigate(href)}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background/50 px-2.5 py-1.5 text-[10px] font-medium text-foreground hover:bg-accent hover:border-idep-300 transition-all duration-150"
              title={`${entry.label} (${entry.count} visitas)`}
            >
              <Icon className="h-3 w-3 text-idep-600 shrink-0" />
              <span>{entry.label}</span>
              <span className="text-[8px] text-muted-foreground/50 ml-0.5">{entry.count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Fallback suggestions when no answer is found
// ============================================================
const FALLBACK_SUGGESTIONS = [
  "Ver alunos cadastrados",
  "Criar novo usuário",
  "Relatório financeiro",
  "Agendar manutenção",
  "Registrar entrada no almoxarifado",
];

// ============================================================
// Get smart response using NLP + knowledge base
// ============================================================
function getSmartResponse(input: string): { title: string; message: string; link?: string; kbIndex: number } | null {
  // Primeiro tenta busca direta na ação
  const nlp = processQuery(input);

  // Se for saudação, retorna null para deixar o componente tratar
  if (nlp.isSaudacao) return null;

  // Busca com expansão NLP e feedback
  const results = searchKnowledgeWithFeedback(input);
  if (results.length > 0) {
    return {
      title: results[0]!.entry.title,
      message: results[0]!.entry.message,
      link: results[0]!.entry.link,
      kbIndex: results[0]!.kbIndex,
    };
  }
  return null;
}

// ============================================================
// Gera mensagem de fallback inteligente baseada no NLP
// ============================================================
function getNLPFallback(input: string, nlp: ProcessedQuery): string {
  const { intent, entities } = nlp;
  const module = entities.module || "";
  const action = entities.action || "";
  const object = entities.object || "";

  // Fallback contextual por intenção
  if (intent === "TUTORIAL") {
    if (module) {
      return `Entendi que você quer aprender sobre **${module}**! 🎓\n\nAinda não encontrei um tutorial específico para "**${input}**" na minha base.\n\n📌 **Sugestões:**\n• Navegue até o módulo **${module}** pelo menu lateral\n• Explore as funcionalidades disponíveis\n• Use **Ctrl+K** para buscar páginas relacionadas`;
    }
    return `Você perguntou como fazer algo, mas não encontrei instruções específicas para "**${input}**" ainda. 🧠\n\n📌 **Tente:**\n• Ser mais específico: "Como cadastrar um aluno?"\n• Explorar o módulo desejado pelo menu lateral\n• Usar **Ctrl+K** para busca rápida`;
  }

  if (intent === "NAVEGACAO") {
    if (module) {
      return `Você quer acessar **${module}**! 🧭\n\nAinda não encontrei o link exato para sua busca.\n\n📌 **Tente:**\n• Acesse **${module}** pelo menu lateral\n• Use **Ctrl+K** e digite "${module}"\n• Pergunte de forma mais específica`;
    }
    return `Você quer navegar para algum lugar, mas não encontrei o destino exato. 🧭\n\n📌 **Tente:**\n• "Onde fica o financeiro?"\n• "Abrir patrimônio"\n• Use **Ctrl+K** para busca global`;
  }

  if (intent === "ACAO" && module) {
    return `Você quer **${action} ${object || module}**! ⚡\n\nAinda não tenho instruções exatas para isso na minha base.\n\n📌 **Sugestões:**\n• Acesse o módulo **${module}** pelo menu lateral\n• Procure pelo botão **+** ou **Novo** na página\n• Pergunte "Como ${action} ${object || "neste módulo"}?"`;
  }

  if (intent === "RELATORIO") {
    return `Você quer ver **relatórios**! 📊\n\nEncontre relatórios e dashboards:\n• 📈 **Dashboard Principal** — indicadores gerais\n• 📊 **BI & Relatórios** — relatórios detalhados\n• 💰 **Financeiro** — dashboard financeiro\n\n📌 Acesse pelo menu lateral ou use **Ctrl+K**!`;
  }

  if (intent === "MODULO_INFO") {
    if (module) {
      return `Você quer saber mais sobre **${module}**! ℹ️\n\nAinda não encontrei informações detalhadas sobre "**${input}**".\n\n📌 **Tente:**\n• "Sobre o módulo ${module}"\n• Navegue até **${module}** pelo menu lateral\n• Use o assistente de forma mais específica`;
    }
    return `Você quer informações sobre algum módulo, mas não encontrei detalhes específicos. ℹ️\n\n📌 **Pergunte sobre:**\n• Financeiro, RH, Patrimônio\n• Alunos, Turmas, Biblioteca\n• Compras, Projetos, TI`;
  }

  if (intent === "DICA") {
    return `Quer **dicas**? 💡\n\n📌 **Atalhos úteis:**\n• **Ctrl+K** → Busca Global\n• **Ctrl+Espaço** → Abrir Assistente\n• **Ctrl+Shift+A** → Assistente Expandido\n• **Ctrl+N** → Novo Registro\n\n🌙 Ative o **tema escuro** nas configurações para mais conforto!\n📱 O sistema é **responsivo** — funciona em qualquer dispositivo!`;
  }

  if (intent === "AJUDA") {
    return `Precisa de **ajuda**? 🆘\n\n📌 **Canais de suporte:**\n• 💬 **Assistente Virtual** — tire dúvidas aqui mesmo!\n• 🔍 **Busca Global (Ctrl+K)** — encontre páginas rapidamente\n• 📖 **Navegação** — explore os módulos pelo menu lateral\n\n💡 **Dica:** Seja específico na sua pergunta para obter a melhor resposta!`;
  }

  // Fallback genérico
  return `Sobre "**${input}**", não encontrei uma resposta específica na minha base de conhecimento ainda. 🧠\n\n📌 **Você pode tentar:**\n• Escolher uma das opções abaixo\n• Navegar pelo menu lateral para explorar os módulos\n• Usar **Ctrl+K** para busca rápida`;
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
  timestamp: Date;
  kbIndex?: number;  // index da entry na KB (para feedback)
}

// ============================================================
// Feedback storage
// ============================================================
const FEEDBACK_KEY = "idep-assistant-feedback";

interface FeedbackEntry {
  kbIndex: number;
  vote: "up" | "down";
  timestamp: number;
}

function loadAllFeedback(): FeedbackEntry[] {
  try {
    const stored = localStorage.getItem(FEEDBACK_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveFeedbackEntry(entry: FeedbackEntry) {
  try {
    const all = loadAllFeedback();
    // Remove voto anterior do mesmo kbIndex se existir
    const filtered = all.filter((f) => f.kbIndex !== entry.kbIndex);
    filtered.push(entry);
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(filtered.slice(-100)));
  } catch { /* ignore */ }
}

function getVotedState(kbIndex: number | undefined): "up" | "down" | null {
  if (kbIndex === undefined || kbIndex < 0) return null;
  const all = loadAllFeedback();
  const found = all.find((f) => f.kbIndex === kbIndex);
  return found?.vote || null;
}

// ============================================================
// Storage keys
// ============================================================
const POSITION_STORAGE_KEY = "idep-assistant-position";
const HISTORY_STORAGE_KEY = "idep-assistant-history";
const MAX_HISTORY = 50;

interface StoredPosition {
  x: number;
  y: number;
}

function loadPosition(): StoredPosition | null {
  try {
    const stored = localStorage.getItem(POSITION_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return null;
}

function savePosition(pos: StoredPosition) {
  try {
    localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(pos));
  } catch { /* ignore */ }
}

function loadHistory(): Message[] | null {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((m: Record<string, unknown>) => ({ ...m, timestamp: new Date(m.timestamp as string) }));
    }
  } catch { /* ignore */ }
  return null;
}

function saveHistory(messages: Message[]) {
  try {
    const toSave = messages.slice(-MAX_HISTORY).map(m => ({ ...m, quickActions: undefined }));
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(toSave));
  } catch { /* ignore */ }
}

// ============================================================
// Format message text with simple markdown-like rendering
// ============================================================
function formatMessageText(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];

  lines.forEach((line, idx) => {
    // Bullet points
    const bulletMatch = line.match(/^[•\-*]\s*(.*)/);
    if (bulletMatch) {
      inList = true;
      listItems.push(
        <li key={`li-${idx}`} className="flex items-start gap-1.5">
          <span className="text-idep-600 dark:text-idep-400 mt-0.5">•</span>
          <span>{renderInline(bulletMatch[1] ?? "")}</span>
        </li>
      );
      return;
    }

    // Numbered lists
    const numMatch = line.match(/^(\d+)[️⃣]\s*(.*)/);
    if (numMatch) {
      inList = true;
      listItems.push(
        <li key={`li-${idx}`} className="flex items-start gap-1.5">
          <span className="text-idep-600 dark:text-idep-400 font-medium min-w-[18px]">{numMatch[1]}️⃣</span>
          <span>{renderInline(numMatch[2] ?? "")}</span>
        </li>
      );
      return;
    }

    // Flush list if we were building one
    if (inList && listItems.length > 0) {
      elements.push(<ul key={`ul-${idx}`} className="space-y-0.5 my-1">{listItems}</ul>);
      listItems = [];
      inList = false;
    }

    // Empty line
    if (line.trim() === "") {
      elements.push(<br key={`br-${idx}`} />);
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${idx}`} className="leading-relaxed">
        {renderInline(line)}
      </p>
    );
  });

  // Flush remaining list
  if (inList && listItems.length > 0) {
    elements.push(<ul key={`ul-end-${elements.length}`} className="space-y-0.5 my-1">{listItems}</ul>);
  }

  return elements;
}

function renderInline(text: string): React.ReactNode {
  // Bold: **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

// ============================================================
// Main Assistant Component
// ============================================================
export function AssistantBot() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    const history = loadHistory();
    if (history && history.length > 0) {
      return history;
    }
    return [
      {
        id: "welcome",
        type: "bot",
        text: "Olá! Sou o assistente virtual do **IDEP-Gestor**. 🚀\n\nPosso ajudar com:\n• 📌 Dúvidas sobre os módulos do sistema\n• 📖 Tutoriais passo a passo\n• 💡 Dicas de produtividade\n• 🔍 Informações sobre funcionalidades\n\n**Como posso ajudar você hoje?**",
        title: "🤖 Assistente IDEP",
        quickActions: QUICK_ACTIONS,
        timestamp: new Date(),
      },
    ];
  });
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isInputHighlighted, setIsInputHighlighted] = useState(false);
  const [currentLang, setCurrentLang] = useState<SupportedLang>(() => getSavedLanguage() || "pt-BR");
  const [aiMode, setAiMode] = useState(() => localStorage.getItem("idep-ai-mode") === "true");
  const [aiProvider, setAiProvider] = useState<AIProvider>(() =>
    (localStorage.getItem("idep-ai-provider") as AIProvider) || "deepseek"
  );
  const ai = useAI(aiProvider);
  const [, setVoteTick] = useState(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcribeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceCancelledRef = useRef(false);
  const voiceInputRef = useRef<() => void>(() => {});
  const aiMsgCountRef = useRef(0);

  // Drag state
  const [position, setPosition] = useState<StoredPosition>(() => loadPosition() || { x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false); // ref para acesso síncrono nos event handlers
  const dragRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Keyboard shortcut: Ctrl+Space to toggle, Ctrl+Shift+A for expanded,
  // Ctrl+Shift+V for voice input, Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.code === "KeyA") {
        e.preventDefault();
        setIsOpen(true);
        setIsExpanded(true);
        setTimeout(() => inputRef.current?.focus(), 100);
        return;
      }
      if (e.ctrlKey && e.shiftKey && e.code === "KeyV") {
        e.preventDefault();
        if (isOpen) {
          voiceInputRef.current();
        }
        return;
      }
      if (e.ctrlKey && e.code === "Space") {
        e.preventDefault();
        setIsOpen((prev) => {
          if (!prev) {
            setTimeout(() => inputRef.current?.focus(), 100);
          }
          return !prev;
        });
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  // Drag handlers — SÓ captura o ponteiro se houver movimento real (drag)
  // Antes: setPointerCapture era chamado em qualquer clique, impedindo o onClick
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isOpen) return;
    // Apenas salva posição inicial — NÃO captura o ponteiro ainda
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  }, [isOpen, position]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    // Ignora movimentos sem botão pressionado (hover puro)
    if (e.buttons === 0) return;
    if (isOpen) return;

    if (isDraggingRef.current) {
      // Já está arrastando → move
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPosition({
        x: dragStartRef.current.posX + dx,
        y: dragStartRef.current.posY + dy,
      });
      return;
    }

    // Verifica se o usuário realmente moveu o mouse (threshold de 4px)
    const dx = Math.abs(e.clientX - dragStartRef.current.x);
    const dy = Math.abs(e.clientY - dragStartRef.current.y);
    if (dx > 4 || dy > 4) {
      // Começou a arrastar! Agora sim captura o ponteiro
      const el = dragRef.current;
      if (el) el.setPointerCapture(e.pointerId);
      isDraggingRef.current = true;
      setIsDragging(true);
    }
  }, [isOpen]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const el = dragRef.current;
    if (el) el.releasePointerCapture(e.pointerId);
    isDraggingRef.current = false;
    setIsDragging(false);
    const finalX = dragStartRef.current.posX + (e.clientX - dragStartRef.current.x);
    const finalY = dragStartRef.current.posY + (e.clientY - dragStartRef.current.y);
    savePosition({ x: finalX, y: finalY });
  }, []);

  // Clear conversation
  const handleClearConversation = useCallback(() => {
    const welcomeMsg: Message = {
      id: "welcome",
      type: "bot",
      text: "🗑️ Conversa reiniciada!\n\nOlá! Sou o assistente virtual do **IDEP-Gestor**. Como posso ajudar?",
      title: "🤖 Assistente IDEP",
      quickActions: QUICK_ACTIONS,
      timestamp: new Date(),
    };
    setMessages([welcomeMsg]);
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  }, []);

  // Handle quick action click
  const handleQuickAction = useCallback((action: string) => {
    // Ação especial: Comandos de Voz
    if (action === "comandos_voz") {
      const userMsg: Message = {
        id: `user-${Date.now()}`,
        type: "user",
        text: "🎤 Comandos de Voz",
        timestamp: new Date(),
      };
      setMessages((prev) => {
        const updated = [...prev, userMsg];
        saveHistory(updated);
        return updated;
      });
      const helpMsg: Message = {
        id: `bot-${Date.now()}`,
        type: "bot",
        text: getVoiceHelpText(),
        title: "🎤 Comandos de Voz",
        timestamp: new Date(),
      };
      setMessages((prev) => {
        const updated = [...prev, helpMsg];
        saveHistory(updated);
        return updated;
      });
      return;
    }

    const response = getActionResponseWithFeedback(action) || getSmartResponse(action);

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      type: "user",
      text: QUICK_ACTIONS.find((qa) => qa.action === action)?.label || action,
      timestamp: new Date(),
    };

    setMessages((prev) => {
      const updated = [...prev, userMsg];
      saveHistory(updated);
      return updated;
    });

    setIsTyping(true);
    const delay = response ? 600 + Math.random() * 400 : 1200;

    setTimeout(() => {
      setIsTyping(false);
      if (!response) {
        const nlp = processQuery(action);
        const fallbackMsg: Message = {
          id: `bot-${Date.now()}`,
          type: "bot",
          text: getNLPFallback(action, nlp),
          title: getIntentEmoji(nlp.intent) + " Assistente IDEP",
          timestamp: new Date(),
        };
        setMessages((prev) => {
          const updated = [...prev, fallbackMsg];
          saveHistory(updated);
          return updated;
        });
        return;
      }
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        type: "bot",
        text: response.message,
        title: response.title,
        link: response.link,
        kbIndex: response.kbIndex,
        timestamp: new Date(),
      };
      setMessages((prev) => {
        const updated = [...prev, botMsg];
        saveHistory(updated);
        return updated;
      });
    }, delay);
  }, []);

  // Escuta respostas da IA para exibir na conversa local

  useEffect(() => {
    if (aiMode && ai.state.status === "done" && ai.state.messages.length > aiMsgCountRef.current) {
      const newMsgs = ai.state.messages.slice(aiMsgCountRef.current);
      aiMsgCountRef.current = ai.state.messages.length;

      for (const msg of newMsgs) {
        if (msg.role === "assistant" && msg.content) {
          setIsTyping(false);
          const displayName = getModelDisplayName(aiProvider);
          const icon = getProviderIcon(aiProvider);
          const botMsg: Message = {
            id: `ai-bot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            type: "bot",
            text: msg.content,
            title: `${icon} ${displayName}`,
            timestamp: new Date(),
          };
          setMessages((prev) => {
            const updated = [...prev, botMsg];
            saveHistory(updated);
            return updated;
          });
        }
      }
    } else if (aiMode && ai.state.status === "error") {
      setIsTyping(false);
      const errorMsg: Message = {
        id: `ai-bot-${Date.now()}`,
        type: "bot",
        text: "❌ **Erro na comunicação com a IA.**\n\nVerifique se a chave da API DeepSeek está configurada corretamente no arquivo **.env** (`VITE_DEEPSEEK_API_KEY=sua_chave`).\n\nEnquanto isso, posso tentar responder usando a base de conhecimento local. Desative o modo IA e pergunte novamente.",
        title: "⚠️ IA Indisponível",
        timestamp: new Date(),
      };
      setMessages((prev) => {
        const updated = [...prev, errorMsg];
        saveHistory(updated);
        return updated;
      });
    } else if (aiMode && (ai.state.status === "thinking" || ai.state.status === "executing")) {
      setIsTyping(true);
    }
  }, [ai.state.status, aiMode]);

  // Handle text input with NLP enhancement (or AI when in AI mode)
  const handleSendMessage = useCallback(() => {
    if (!inputText.trim()) return;

    const text = inputText.trim();
    setInputText("");

    // Modo IA: envia para o DeepSeek
    if (aiMode) {
      const userMsg: Message = {
        id: `user-${Date.now()}`,
        type: "user",
        text,
        timestamp: new Date(),
      };
      setMessages((prev) => {
        const updated = [...prev, userMsg];
        saveHistory(updated);
        return updated;
      });
      setIsTyping(true);
      ai.sendMessage(text);
      return;
    }

    // Modo normal: usa NLP + base de conhecimento
    recordQuestionSmart(text);

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      type: "user",
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => {
      const updated = [...prev, userMsg];
      saveHistory(updated);
      return updated;
    });

    setIsTyping(true);

    // Processa com NLP em paralelo
    const nlp = processQuery(text);

    setTimeout(() => {
      setIsTyping(false);

      // Se for saudação, responde de forma amigável
      if (nlp.isSaudacao) {
        const botMsg: Message = {
          id: `bot-${Date.now()}`,
          type: "bot",
          text: saudacoes[Math.floor(Math.random() * saudacoes.length)],
          title: "🤖 Assistente IDEP",
          quickActions: QUICK_ACTIONS,
          timestamp: new Date(),
        };
        setMessages((prev) => {
          const updated = [...prev, botMsg];
          saveHistory(updated);
          return updated;
        });
        return;
      }

      const response = getSmartResponse(text);

      // Gera sugestões baseadas no NLP
      const nlpSuggestions = nlp.suggestedActions?.map((s) => ({
        label: s,
        icon: Lightbulb,
        action: s.toLowerCase().replace(/\s+/g, "_").replace(/[()]/g, ""),
      })) || [];

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        type: "bot",
        text: response
          ? response.message
          : getNLPFallback(text, nlp),
        title: response?.title || getIntentEmoji(nlp.intent) + " Assistente IDEP",
        link: response?.link,
        kbIndex: response?.kbIndex,
        quickActions: response ? undefined : (nlpSuggestions.length > 0 ? nlpSuggestions : FALLBACK_SUGGESTIONS.map((s) => ({
          label: s,
          icon: Lightbulb,
          action: s.toLowerCase().replace(/\s+/g, "_"),
        }))),
        timestamp: new Date(),
      };

      setMessages((prev) => {
        const updated = [...prev, botMsg];
        saveHistory(updated);
        return updated;
      });
    }, 500 + Math.random() * 700);
  }, [inputText, aiMode, ai]);

  // Handle voice input — simplificado: tenta pt-BR, com fallback claro
  const handleVoiceInput = useCallback(() => {
    const SpeechRecognitionAPI =
      (window as unknown as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ??
      (window as unknown as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setMessages((prev) => {
        const updated = [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            type: "bot" as const,
            text: "🎤 **Voz não suportada** — Seu navegador não suporta entrada por voz. Tente usar Chrome, Edge ou Safari.",
            timestamp: new Date(),
          },
        ];
        saveHistory(updated);
        return updated;
      });
      return;
    }

    // Se já está gravando ou transcrevendo, para/cancela
    if (isListening || isTranscribing) {
      // Cancela timeout de transcrição pendente (usando refs compartilhados entre closures)
      if (transcribeTimerRef.current) {
        clearTimeout(transcribeTimerRef.current);
        transcribeTimerRef.current = null;
      }
      voiceCancelledRef.current = true;
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      setIsListening(false);
      setIsTranscribing(false);
      return;
    }

    // Tenta o idioma preferido (pt-BR), depois en-US como fallback
    const langsToTry = [currentLang, "pt-BR", "en-US"];
    const uniqueLangs = [...new Set(langsToTry)];
    let langAttemptIndex = 0;
    let hasResult = false;

    // Reseta refs de cancelamento para uma nova tentativa
    voiceCancelledRef.current = false;

    function tryNextLang(lastError?: string) {
      if (hasResult) return;
      if (langAttemptIndex >= uniqueLangs.length) {
        // Esgotou todos os idiomas sem sucesso
        setIsListening(false);

        // Mensagem de erro mais específica baseada no último erro
        let errorMsg = "🎤 **Não foi possível acessar o microfone.** ";
        if (lastError === "not-allowed" || lastError === "permission-denied") {
          errorMsg += "Verifique se você permitiu o acesso ao microfone neste site.\n\n📌 **Como corrigir:**\n• Clique no ícone 🔒 ao lado da URL\n• Vá em **Permissões** > **Microfone** > **Permitir**\n• Recarregue a página e tente novamente";
        } else if (lastError === "no-speech" || lastError === "audio-capture") {
          errorMsg += "Nenhum microfone encontrado ou áudio não detectado.\n\n📌 **Como corrigir:**\n• Conecte um microfone ao computador\n• Verifique se o microfone não está mudo\n• Tente falar mais alto e mais próximo";
        } else if (lastError === "aborted") {
          errorMsg += "A gravação foi interrompida. Tente novamente.";
        } else if (lastError === "language-not-supported") {
          errorMsg += "O idioma detectado não é suportado. Tente falar em português.";
        } else if (lastError === "service-not-allowed") {
          errorMsg += "O serviço de reconhecimento de voz não está disponível.\n\n📌 **Dica:** Tente usar o Google Chrome ou Microsoft Edge.";
        } else {
          errorMsg += "Tente falar mais próximo ao microfone ou digitar sua pergunta.\n\n💡 Se o problema persistir, use **Ctrl+Shift+V** para tentar novamente.";
        }

        setMessages((prev) => {
          const updated = [...prev, {
            id: `bot-${Date.now()}`,
            type: "bot" as const,
            text: errorMsg,
            timestamp: new Date(),
          }];
          saveHistory(updated);
          return updated;
        });
        return;
      }

      const lang = uniqueLangs[langAttemptIndex]!;
      langAttemptIndex++;
      setCurrentLang(lang);

      try {
        const recognition = new SpeechRecognitionAPI();
        recognition.lang = lang;
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          if (hasResult) return;
          hasResult = true;

          const transcript = event.results[0][0].transcript;
          const detectedLang = detectLanguage(transcript);
          setCurrentLang(detectedLang);
          saveLanguagePreference(detectedLang);

          // Fase 1: mostra "Transcrevendo..." enquanto processa
          setIsTranscribing(true);
          recognition.stop();
          recognitionRef.current = null;

          // Fase 2: após breve delay, exibe o resultado
          transcribeTimerRef.current = setTimeout(() => {
            if (voiceCancelledRef.current) return;

            const voiceCmd = detectVoiceCommand(transcript);

            if (voiceCmd) {
              if (voiceCmd.action === "help") {
                setMessages((prev) => {
                  const updated = [...prev, { id: `bot-${Date.now()}`, type: "bot", text: getVoiceHelpText(), title: "🎤 Comandos de Voz", timestamp: new Date() }];
                  saveHistory(updated);
                  return updated;
                });
              } else if (voiceCmd.action === "back") {
                navigate(-1);
              } else if (voiceCmd.action === "home") {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
              if (voiceCmd.href) navigate(voiceCmd.href);
            } else {
              // Preenche o input com o texto reconhecido e destaca com glow
              setInputText(transcript);
              setIsInputHighlighted(true);
              setTimeout(() => {
                setIsInputHighlighted(false);
                inputRef.current?.focus();
              }, 800);
            }

            setIsTranscribing(false);
            setIsListening(false);
            setIsOpen(true);
          }, 350); // breve pausa para feedback visual
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          // Finaliza instância com erro e tenta próximo idioma com o código do erro
          const errorCode = event.error || "unknown";
          try { recognition.abort(); } catch { /* ignore */ }
          tryNextLang(errorCode);
        };

        recognition.onend = () => {
          if (!hasResult) {
            setIsListening(false);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
      } catch (err: unknown) {
        // Erro ao criar/starter reconhecimento → próximo idioma
        tryNextLang(err instanceof Error ? err.name || err.message : "unknown");
      }
    }

    tryNextLang();
  }, [isListening, currentLang, navigate]);

  // Mantém a ref do handler de voz atualizada (evita TDZ no useEffect do teclado)
  useEffect(() => {
    voiceInputRef.current = handleVoiceInput;
  }, [handleVoiceInput]);

  // Navega automaticamente quando a IA retorna um pendingNavigation
  useEffect(() => {
    if (ai.state.pendingNavigation) {
      navigate(ai.state.pendingNavigation);
      ai.clearNavigation();
      // Fecha o assistente após navegar — necessário para sincronizar
      // o estado da UI com a navegação acionada pela IA.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsOpen(false);
    }
  }, [ai.state.pendingNavigation, navigate, ai]);

  // Cleanup recognition and pending transcription on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (transcribeTimerRef.current) {
        clearTimeout(transcribeTimerRef.current);
        transcribeTimerRef.current = null;
      }
    };
  }, []);

  // Handle enter key
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  return (
    <>
      <div
        ref={dragRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="fixed z-50"
        style={{
          bottom: 24,
          right: 24,
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? "grabbing" : isOpen ? "default" : "grab",
          touchAction: "none",
        }}
      >
        {/* Bot avatar button */}
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{
              scale: 1,
              boxShadow: isListening
                ? [
                    "0 0 0 0 rgba(239, 68, 68, 0.6)",
                    "0 0 0 12px rgba(239, 68, 68, 0)",
                    "0 0 0 0 rgba(239, 68, 68, 0)",
                  ]
                : [
                    "0 0 0 0 rgba(10, 92, 168, 0.15)",
                    "0 0 0 8px rgba(10, 92, 168, 0)",
                    "0 0 0 0 rgba(10, 92, 168, 0)",
                  ],
            }}
            transition={{
              boxShadow: isListening
                ? { duration: 1.5, repeat: Infinity, ease: "easeOut" }
                : { duration: 2.5, repeat: Infinity, ease: "easeOut" },
            }}
            whileHover={{
              scale: 1.12,
              boxShadow: "0 8px 32px rgba(10, 92, 168, 0.35)",
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsOpen(true);
              setTimeout(() => inputRef.current?.focus(), 200);
            }}
            title="Clique para abrir · Arraste para reposicionar"
            className={cn(
              "relative flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-shadow duration-200 group",
              isListening
                ? "bg-gradient-to-br from-red-600 to-red-800 shadow-red-700/40 hover:shadow-red-700/50"
                : "bg-gradient-to-br from-idep-600 to-idep-800 shadow-idep-700/30 hover:shadow-xl hover:shadow-idep-700/40"
            )}
          >
            {/* Animated icon: Bot → Mic when listening */}
            <motion.div
              key={isListening ? "mic" : "bot"}
              initial={{ scale: 0.5, opacity: 0, rotate: -30 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 0.25, ease: "backOut" }}
            >
              {isListening ? (
                <Mic className="h-7 w-7" />
              ) : (
                <Bot className="h-7 w-7" />
              )}
            </motion.div>

            {/* Ping ring: idep when idle, red when listening */}
            {!isListening && (
              <span className="absolute inset-0 rounded-full bg-idep-700/20 animate-ping" />
            )}
            {isListening && (
              <>
                <span className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
                <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" style={{ animationDelay: "0.3s", animationDuration: "1.2s" }} />
              </>
            )}

            {/* Badge: green when idle, red pulse when listening */}
            <span
              className={cn(
                "absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white transition-colors duration-300",
                isListening
                  ? "bg-red-500 animate-pulse shadow-lg shadow-red-500/50"
                  : "bg-emerald-500"
              )}
            >
              {isListening ? (
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  ●
                </motion.span>
              ) : (
                <>{messages.length > 1 ? "•" : "1"}</>
              )}
            </span>

            {/* Drag handle dots — visible on hover (framer-motion controla a opacidade) */}
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              whileHover={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-[3px]"
            >
              <span className="h-1 w-1 rounded-full bg-white/80" />
              <span className="h-1 w-1 rounded-full bg-white/80" />
              <span className="h-1 w-1 rounded-full bg-white/80" />
            </motion.div>

            {/* Subtle drag hint tooltip that fades in on first visit */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: [0, 0.9, 0.9, 0], y: [8, 0, 0, -4] }}
              transition={{ duration: 4, delay: 1.5, times: [0, 0.15, 0.7, 1] }}
              className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground/90 px-2.5 py-1 text-[9px] font-medium text-background shadow-lg pointer-events-none"
            >
              <span className="flex items-center gap-1.5">
                <span>↕</span>
                <span>Arraste para mover</span>
              </span>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground/90" />
            </motion.div>
          </motion.button>
        )}

        {/* Chat dialog */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20, originX: 1, originY: 1 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20, originX: 1, originY: 1 }}
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
                      {aiMode ? "🤖 Assistente IA" : "Assistente IDEP"} {isExpanded ? "Pro" : ""}
                    </p>
                    <div className="flex items-center gap-1">
                      <span className={cn(
                        "h-1.5 w-1.5 rounded-full animate-pulse",
                        aiMode ? "bg-amber-400" : "bg-emerald-400"
                      )} />
                      <span className="text-[10px] text-white/70">
                        {isTyping
                          ? (aiMode ? "Processando..." : "Digitando...")
                          : (aiMode ? (ai.isConfigured ? "🧠 IA Ativa" : "⚙️ Configurar IA") : "Online")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {/* Toggle Modo IA */}
                  <button
                    onClick={() => {
                      const newMode = !aiMode;
                      setAiMode(newMode);
                      localStorage.setItem("idep-ai-mode", String(newMode));
                      if (newMode) {
                        ai.clearConversation();
                        aiMsgCountRef.current = 0;
                      } else {
                        handleClearConversation();
                      }
                    }}
                    className={cn(
                      "rounded-lg p-1.5 transition-colors",
                      aiMode
                        ? "text-amber-300 bg-amber-500/20 hover:bg-amber-500/30"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    )}
                    title={aiMode ? "Desativar modo IA" : "Ativar modo IA"}
                  >
                    <BrainCircuit className="h-3.5 w-3.5" />
                  </button>

                  {/* Seletor de Modelo (visível apenas no modo IA) */}
                  {aiMode && (
                    <button
                      onClick={() => {
                        const newProvider: AIProvider = aiProvider === "deepseek" ? "openai" : "deepseek";
                        setAiProvider(newProvider);
                        localStorage.setItem("idep-ai-provider", newProvider);
                        ai.setProvider(newProvider);
                        aiMsgCountRef.current = 0;
                      }}
                      className={cn(
                        "rounded-lg p-1.5 text-[9px] font-medium transition-colors",
                        aiProvider === "openai"
                          ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                          : "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
                      )}
                      title={`Trocar modelo (atual: ${getModelDisplayName(aiProvider)})`}
                    >
                      {getProviderIcon(aiProvider)} {getModelDisplayName(aiProvider)}
                    </button>
                  )}
                  <button
                    onClick={handleClearConversation}
                    className="rounded-lg p-1.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                    title="Limpar conversa"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="rounded-lg p-1.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                    title={isExpanded ? "Reduzir" : "Expandir"}
                  >
                    {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
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
              <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
                {messages.map((msg) => {
                  const votedState = msg.type === "bot" && msg.kbIndex !== undefined ? getVotedState(msg.kbIndex) : null;
                  return (<div key={msg.id} className={cn("flex", msg.type === "user" ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-2.5",
                        msg.type === "user"
                          ? "bg-idep-700 text-white rounded-br-md"
                          : "bg-card border border-border rounded-bl-md"
                      )}
                    >
                      {msg.title && (
                        <p className="text-xs font-semibold mb-1.5 text-idep-600 dark:text-idep-400">
                          {msg.title}
                        </p>
                      )}
                      <div
                        className={cn(
                          "text-sm leading-relaxed",
                          msg.type === "user" ? "text-white/90" : "text-foreground"
                        )}
                      >
                        {formatMessageText(msg.text)}
                      </div>
                      {msg.link && (
                        <button
                          onClick={() => {
                            navigate(msg.link!);
                            setIsOpen(false);
                          }}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-idep-600 dark:text-idep-300 hover:underline bg-idep-50 dark:bg-idep-950/50 px-3 py-1.5 rounded-lg hover:bg-idep-100 dark:hover:bg-idep-900/50 transition-colors"
                        >
                          <span>Ir para a página</span>
                          <span>→</span>
                        </button>
                      )}
                      {msg.id === "welcome" && (
                        <>
                          <ContextualHelpPanel
                            onAsk={(text) => {
                              setInputText(text);
                              setTimeout(() => {
                                inputRef.current?.focus();
                              }, 50);
                            }}
                          />
                          <MostVisitedModules
                            isAssistantOpen={isOpen}
                            onNavigate={(href) => {
                              navigate(href);
                              setIsOpen(false);
                            }}
                          />
                          <FaqPanel
                            onAsk={(text) => {
                              setInputText(text);
                              setTimeout(() => {
                                inputRef.current?.focus();
                              }, 50);
                            }}
                          />
                        </>
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
                      {/* Feedback buttons */}
                      {msg.kbIndex !== undefined && msg.kbIndex >= 0 && (
                        <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center gap-2">
                          <span className="text-[9px] text-muted-foreground/50">Útil?</span>
                          <button
                            onClick={() => {
                              saveFeedbackEntry({ kbIndex: msg.kbIndex!, vote: "up", timestamp: Date.now() });
                              setVoteTick((t) => t + 1);
                            }}
                            disabled={votedState !== null}
                            className={cn(
                              "flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] transition-all",
                              votedState === "up"
                                ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                                : votedState === "down"
                                ? "text-muted-foreground/30 cursor-default"
                                : "text-muted-foreground/50 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                            )}
                            title={votedState ? "Você já avaliou" : "Útil"}
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => {
                              saveFeedbackEntry({ kbIndex: msg.kbIndex!, vote: "down", timestamp: Date.now() });
                              setVoteTick((t) => t + 1);
                            }}
                            disabled={votedState !== null}
                            className={cn(
                              "flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] transition-all",
                              votedState === "down"
                                ? "bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400"
                                : votedState === "up"
                                ? "text-muted-foreground/30 cursor-default"
                                : "text-muted-foreground/50 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                            )}
                            title={votedState ? "Você já avaliou" : "Não útil"}
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      <p className="text-[9px] text-muted-foreground/30 mt-1.5 text-right">
                        {msg.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                )})}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <motion.span
                          className="h-2 w-2 rounded-full bg-idep-600"
                          animate={{ y: [0, -6, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                        />
                        <motion.span
                          className="h-2 w-2 rounded-full bg-idep-600"
                          animate={{ y: [0, -6, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                        />
                        <motion.span
                          className="h-2 w-2 rounded-full bg-idep-600"
                          animate={{ y: [0, -6, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input area */}
              <div className="border-t border-border bg-background shrink-0">
                {/* Waveform overlay: recording OR transcribing */}
                <AnimatePresence>
                  {(isListening || isTranscribing) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 40, opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className={cn(
                        "overflow-hidden border-b",
                        isTranscribing
                          ? "bg-gradient-to-b from-amber-500/5 to-transparent border-amber-500/10"
                          : "bg-gradient-to-b from-red-500/5 to-transparent border-red-500/10"
                      )}
                    >
                      <div className="flex items-center justify-center gap-2 px-4 py-1.5">
                        {/* Status dot */}
                        <motion.div
                          className={cn(
                            "h-2 w-2 rounded-full",
                            isTranscribing ? "bg-amber-500" : "bg-red-500"
                          )}
                          animate={{
                            opacity: [1, 0.3, 1],
                            scale: isTranscribing ? [1, 0.8, 1] : [1, 0.8, 1],
                          }}
                          transition={{ duration: isTranscribing ? 0.8 : 1.2, repeat: Infinity }}
                        />

                        {/* Status text */}
                        <span className={cn(
                          "text-[10px] font-medium uppercase tracking-wider",
                          isTranscribing
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-red-600 dark:text-red-400"
                        )}>
                          {isTranscribing
                            ? (LISTENING_MESSAGES[currentLang]?.transcribing || "Transcrevendo")
                            : (LISTENING_MESSAGES[currentLang]?.recording || "Gravando")
                          }
                        </span>

                        {/* Language badge */}
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-mono shrink-0",
                          isTranscribing
                            ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                            : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                        )}>
                          {LANG_CONFIGS[currentLang]?.flag || "🇧🇷"}
                          <span>{currentLang.split("-")[0]!.toUpperCase()}</span>
                        </span>

                        {/* Wave or spinner */}
                        <div className="flex-1 max-w-[140px]">
                          {isTranscribing ? (
                            <div className="flex items-center gap-1 justify-center">
                              <motion.span
                                className="h-1.5 w-1.5 rounded-full bg-amber-500"
                                animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                              />
                              <motion.span
                                className="h-1.5 w-1.5 rounded-full bg-amber-500"
                                animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                              />
                              <motion.span
                                className="h-1.5 w-1.5 rounded-full bg-amber-500"
                                animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                              />
                            </div>
                          ) : (
                            <WaveAnimation
                              isListening={true}
                              barCount={20}
                              barColor="239, 68, 68"
                            />
                          )}
                        </div>

                        {/* Status badge */}
                        <span className="text-[9px] text-muted-foreground/50 font-mono">
                          <motion.span
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ duration: isTranscribing ? 0.8 : 1, repeat: Infinity }}
                          >
                            {isTranscribing ? "⚡ PROC" : "● REC"}
                          </motion.span>
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="p-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleVoiceInput}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl transition-all shrink-0",
                        isListening
                          ? "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30"
                          : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                      title={isListening ? "Parar gravação" : "Perguntar por voz"}
                    >
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </button>
                    <div className="relative flex-1">
                      <input
                        ref={inputRef}
                        id="assistant-chat-input"
                        name="assistant-message"
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isListening ? "🎤 Falando... A transcrição aparecerá aqui" : "Digite sua pergunta..."}
                        className={cn(
                          "h-9 w-full rounded-xl border bg-background px-3 pr-8 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all duration-300",
                          isInputHighlighted
                            ? "border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.3)] ring-1 ring-emerald-400/50"
                            : isListening
                            ? "border-red-400/50 focus:ring-red-400/50"
                            : "border-input"
                        )}
                      />
                      <Sparkles className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputText.trim() || isTyping}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-idep-700 text-white hover:bg-idep-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                    >
                      {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-[9px] text-muted-foreground/50">
                      {messages.length > 1 && `${messages.filter(m => m.type === 'bot').length} respostas`}
                    </p>
                    <p className="text-[9px] text-muted-foreground/50 flex items-center gap-1.5 flex-wrap">
                      <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[8px]">Ctrl+Espaço</kbd>
                      <span className="text-muted-foreground/30">·</span>
                      <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[8px]">Ctrl+Shift+A</kbd>
                      <span className="text-muted-foreground/30">·</span>
                      <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[8px]">Ctrl+Shift+V</kbd>
                      <span className="text-muted-foreground/30">·</span>
                      <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[8px]">Esc</kbd>
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
