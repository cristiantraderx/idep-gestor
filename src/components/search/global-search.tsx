import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Users,
  MessageSquare,
  ShieldCheck,
  KeyRound,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { navigationItems } from "@/constants/navigation";
import { modules, getModuleInfo } from "@/constants/modules";
import type { NavItem } from "@/types/navigation";

// ============================================================
// Types
// ============================================================
interface SearchResult {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  category: "pagina" | "modulo" | "acao" | "recente";
  badge?: string;
}

// ============================================================
// Recently visited (stored in localStorage)
// ============================================================
const RECENT_KEY = "idep-search-recent";
const MAX_RECENT = 5;

function getRecent(): SearchResult[] {
  try {
    const stored = localStorage.getItem(RECENT_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addRecent(result: SearchResult) {
  try {
    const recent = getRecent().filter((r) => r.href !== result.href);
    recent.unshift(result);
    if (recent.length > MAX_RECENT) recent.pop();
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  } catch {
    // ignore
  }
}

// ============================================================
// Build search index from navigation + modules
// ============================================================
function buildSearchIndex(): SearchResult[] {
  const index: SearchResult[] = [];

  // Navigation items (all pages)
  for (const entry of navigationItems) {
    if (entry.type === "item") {
      const item = entry as NavItem;
      const moduleInfo = getModuleInfo(item.href!.split("/")[0]! === "" ? item.href!.split("/")[1]! : item.href!.split("/")[0]!);

      index.push({
        id: `nav-${item.href}`,
        label: item.label,
        description: moduleInfo?.description || `Acessar ${item.label}`,
        href: item.href,
        icon: item.icon,
        category: "pagina",
        badge: item.badge?.toString(),
      });

      // Sub-items
      if (item.subItems) {
        for (const sub of item.subItems) {
          index.push({
            id: `nav-${sub.href}`,
            label: `${item.label} › ${sub.label}`,
            description: `Acessar ${sub.label} de ${item.label}`,
            href: sub.href,
            icon: sub.icon,
            category: "pagina",
          });
        }
      }
    }
  }

  // Module information (from modules.ts)
  for (const [slug, mod] of Object.entries(modules)) {
    index.push({
      id: `mod-${slug}`,
      label: mod.name,
      description: mod.description,
      href: `/${slug}`,
      icon: mod.icon,
      category: "modulo",
    });

    // Features as searchable items
    for (const feature of mod.features) {
      index.push({
        id: `mod-${slug}-feat-${feature}`,
        label: `${mod.name}: ${feature}`,
        description: `Funcionalidade do módulo ${mod.name}`,
        href: `/${slug}`,
        icon: mod.icon,
        category: "modulo",
      });
    }
  }

  // Quick actions
  index.push(
    {
      id: "action-notificacoes",
      label: "Central de Notificações",
      description: "Ver todas as notificações do sistema",
      href: "/notificacoes",
      icon: MessageSquare,
      category: "acao",
    },
    {
      id: "action-admin-usuarios",
      label: "Administrar Usuários",
      description: "Gerenciar usuários do sistema",
      href: "/admin/usuarios",
      icon: Users,
      category: "acao",
    },
    {
      id: "action-admin-perfis",
      label: "Gerenciar Perfis",
      description: "Perfis de acesso e níveis",
      href: "/admin/perfis",
      icon: ShieldCheck,
      category: "acao",
    },
    {
      id: "action-admin-permissoes",
      label: "Configurar Permissões",
      description: "Matriz de permissões por módulo",
      href: "/admin/permissoes",
      icon: KeyRound,
      category: "acao",
    },
    {
      id: "action-alunos-matriculas",
      label: "Gerenciar Matrículas",
      description: "Matrículas de alunos em cursos",
      href: "/alunos/matriculas",
      icon: Users,
      category: "acao",
    },
    {
      id: "action-assistente",
      label: "Abrir Assistente Virtual",
      description: "Chat de ajuda inteligente do sistema",
      href: "#assistente",
      icon: Sparkles,
      category: "acao",
    }
  );

  return index;
}

// ============================================================
// GlobalSearch Component (modal dialog)
// ============================================================
interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const searchIndex = useMemo(() => buildSearchIndex(), []);

  // Filter results based on query
  const results = useMemo(() => {
    if (!query.trim()) {
      // Show recent items when no query
      const recent = getRecent();
      if (recent.length > 0) return recent;
      // Fallback: show all pages
      return searchIndex.filter((r) => r.category === "pagina").slice(0, 6);
    }

    const lower = query.toLowerCase().trim();
    const scored = searchIndex
      .map((item) => {
        let score = 0;
        const labelLower = item.label.toLowerCase();
        const descLower = item.description.toLowerCase();

        // Exact match on label
        if (labelLower === lower) score += 100;
        // Starts with query
        if (labelLower.startsWith(lower)) score += 50;
        // Contains query
        if (labelLower.includes(lower)) score += 20;
        // Description match
        if (descLower.includes(lower)) score += 10;
        // Partial word match
        const words = labelLower.split(/\s+/);
        for (const word of words) {
          if (word.startsWith(lower)) score += 5;
        }

        return { item, score };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((s) => s.item);

    return scored;
  }, [query, searchIndex]);

  // Reset selected index when results change
  useEffect(() => {
    let c = false; queueMicrotask(() => { if (!c) setSelectedIndex(0); }); return () => { c = true; };
  }, [results.length]);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
    if (!open) {
      let c = false; queueMicrotask(() => { if (!c) setQuery(""); }); return () => { c = true; };
    }
  }, [open]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        const result = results[selectedIndex];
        if (result.href === "#assistente") {
          // Open the assistant - dispatch a custom event
          window.dispatchEvent(new CustomEvent("open-assistant"));
          onClose();
          return;
        }
        addRecent(result);
        navigate(result.href);
        onClose();
      }
    },
    [results, selectedIndex, navigate, onClose]
  );

  const handleClick = (result: SearchResult) => {
    if (result.href === "#assistente") {
      window.dispatchEvent(new CustomEvent("open-assistant"));
      onClose();
      return;
    }
    addRecent(result);
    navigate(result.href);
    onClose();
  };

  const categoryColors: Record<string, string> = {
    pagina: "text-blue-500 bg-blue-50 dark:bg-blue-950/30",
    modulo: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30",
    acao: "text-purple-500 bg-purple-50 dark:bg-purple-950/30",
    recente: "text-amber-500 bg-amber-50 dark:bg-amber-950/30",
  };

  const categoryLabels: Record<string, string> = {
    pagina: "Página",
    modulo: "Funcionalidade",
    acao: "Ação Rápida",
    recente: "Recente",
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] sm:pt-[20vh]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-lg mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pesquisar páginas, módulos, ações..."
                className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
                autoComplete="off"
                spellCheck={false}
              />
              <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[360px] overflow-y-auto sidebar-scrollbar p-2">
              {results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Search className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-xs font-medium text-foreground">
                    {query ? "Nenhum resultado encontrado" : "Digite para pesquisar"}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                    {query
                      ? "Tente termos como \"alunos\", \"financeiro\", \"admin\""
                      : "Pesquise por páginas, módulos e ações do sistema"}
                  </p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {results.map((result, index) => {
                    const Icon = result.icon;
                    const isSelected = index === selectedIndex;

                    return (
                      <button
                        key={result.id}
                        onClick={() => handleClick(result)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150",
                          isSelected
                            ? "bg-idep-700 text-white"
                            : "hover:bg-accent text-foreground"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-lg shrink-0",
                            isSelected
                              ? "bg-white/20"
                              : categoryColors[result.category] || "bg-muted"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "text-sm leading-tight truncate",
                              isSelected ? "font-medium text-white" : "font-medium text-foreground"
                            )}
                          >
                            {result.label}
                          </p>
                          <p
                            className={cn(
                              "text-[11px] truncate mt-0.5",
                              isSelected ? "text-white/70" : "text-muted-foreground"
                            )}
                          >
                            {result.description}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "text-[9px] font-medium px-1.5 py-0.5 rounded shrink-0",
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {categoryLabels[result.category]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer hints */}
            <div className="border-t border-border px-4 py-2 flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <kbd className="inline-flex items-center rounded border border-border bg-muted px-1 py-0.5 text-[9px] font-medium">
                  ↑↓
                </kbd>
                <span>Navegar</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <kbd className="inline-flex items-center rounded border border-border bg-muted px-1 py-0.5 text-[9px] font-medium">
                  ↵
                </kbd>
                <span>Abrir</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <kbd className="inline-flex items-center rounded border border-border bg-muted px-1 py-0.5 text-[9px] font-medium">
                  Esc
                </kbd>
                <span>Fechar</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ============================================================
// Hook to manage global search state
// ============================================================
export function useGlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);

  // Ctrl+K / Cmd+K to open, Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  return { isOpen, setIsOpen, close };
}
