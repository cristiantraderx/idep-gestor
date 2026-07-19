import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// ============================================================
// Types
// ============================================================
export interface VisitEntry {
  path: string;
  moduleName: string;
  label: string;
  count: number;
  lastVisit: number;
}

export type VisitMap = Record<string, VisitEntry>;

// ============================================================
// Storage key
// ============================================================
const STORAGE_KEY = "idep-navigation-visits";
const MAX_ENTRIES = 30;
const STALE_DAYS = 30;

// ============================================================
// Module name mapping (from path patterns)
// ============================================================
const MODULE_NAMES: Record<string, { name: string; label: string }> = {
  dashboard: { name: "dashboard", label: "Dashboard" },
  alunos: { name: "alunos", label: "Alunos" },
  cursos: { name: "cursos", label: "Cursos" },
  turmas: { name: "turmas", label: "Turmas" },
  secretaria: { name: "secretaria", label: "Secretaria" },
  rh: { name: "rh", label: "Recursos Humanos" },
  financeiro: { name: "financeiro", label: "Financeiro" },
  compras: { name: "compras", label: "Compras" },
  almoxarifado: { name: "almoxarifado", label: "Almoxarifado" },
  patrimonio: { name: "patrimonio", label: "Patrimônio" },
  biblioteca: { name: "biblioteca", label: "Biblioteca" },
  agenda: { name: "agenda", label: "Agenda" },
  ti: { name: "ti", label: "TI" },
  ouvidoria: { name: "ouvidoria", label: "Ouvidoria" },
  relatorios: { name: "relatorios", label: "Relatórios" },
  bi: { name: "bi", label: "BI" },
  projetos: { name: "projetos", label: "Projetos" },
  auditoria: { name: "auditoria", label: "Auditoria" },
  configuracoes: { name: "configuracoes", label: "Configurações" },
  admin: { name: "admin", label: "Administração" },
  notificacoes: { name: "notificacoes", label: "Notificações" },
  perfil: { name: "perfil", label: "Meu Perfil" },
  chat: { name: "chat", label: "Chat" },
};

/**
 * Extrai o slug do módulo a partir do pathname
 */
function extractModuleSlug(pathname: string): { slug: string; name: string; label: string } | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return null;

  // Admin sub-routes: /admin/usuarios → slug = admin, path = admin/usuarios
  if (parts[0] === "admin" && parts[1]) {
    const info = MODULE_NAMES["admin"];
    return { slug: `admin/${parts[1]}`, name: info.name, label: info.label };
  }

  const slug = parts[0];
  const info = MODULE_NAMES[slug];
  if (!info) return null;

  return { slug, name: info.name, label: info.label };
}

// ============================================================
// Storage helper functions (can be used outside React)
// ============================================================
function loadVisits(): VisitMap {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored) as VisitMap;

    // Remove stale entries (> 30 days)
    const now = Date.now();
    const staleThreshold = STALE_DAYS * 24 * 60 * 60 * 1000;
    const cleaned: VisitMap = {};
    for (const [key, entry] of Object.entries(parsed)) {
      if (now - entry.lastVisit < staleThreshold) {
        cleaned[key] = entry;
      }
    }
    return cleaned;
  } catch {
    return {};
  }
}

function saveVisits(visits: VisitMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visits));
  } catch { /* ignore */ }
}

/**
 * Registra uma visita a uma página
 */
function recordVisit(pathname: string) {
  const moduleInfo = extractModuleSlug(pathname);
  if (!moduleInfo) return;

  const visits = loadVisits();
  const key = moduleInfo.slug;

  if (visits[key]) {
    visits[key].count += 1;
    visits[key].lastVisit = Date.now();
  } else {
    // Limit total entries
    const keys = Object.keys(visits);
    if (keys.length >= MAX_ENTRIES) {
      // Remove least recently visited
      const oldest = keys.reduce((a, b) =>
        visits[a].lastVisit < visits[b].lastVisit ? a : b
      );
      delete visits[oldest];
    }

    visits[key] = {
      path: pathname,
      moduleName: moduleInfo.name,
      label: moduleInfo.label,
      count: 1,
      lastVisit: Date.now(),
    };
  }

  saveVisits(visits);
}

/**
 * Retorna os top N módulos mais visitados
 */
export function getTopModules(limit: number = 5): VisitEntry[] {
  const visits = loadVisits();
  return Object.values(visits)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Hook que rastreia navegação automaticamente
 */
export function useNavigationTracker() {
  const location = useLocation();

  useEffect(() => {
    recordVisit(location.pathname);
  }, [location.pathname]);
}
