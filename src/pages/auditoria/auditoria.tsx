import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Search,
  Loader2,
  RefreshCw,
  CalendarDays,
  User,
  Monitor,
  Globe,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatFullDate } from "@/lib/utils";

interface LogEntry {
  id: string;
  acao: string;
  modulo: string;
  usuario_nome: string;
  usuario_id?: string;
  ip?: string;
  created_at: string;
  registro_id?: string;
  dados_antigos?: unknown;
  dados_novos?: unknown;
  usuarios?: { nome: string };
}

const MODULOS = [
  "Todos", "dashboard", "alunos", "cursos", "turmas", "secretaria", "rh", "financeiro",
  "compras", "almoxarifado", "patrimonio", "biblioteca", "ti", "ouvidoria", "agenda",
  "admin", "auth", "configuracoes",
];

export function AuditoriaPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [moduloFilter, setModuloFilter] = useState("Todos");
  const [stats, setStats] = useState({ total: 0, hoje: 0, usuarios: 0, modulos: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const hoje = new Date().toISOString().split("T")[0];

      const [logRes, countRes, hojeRes] = await Promise.all([
        supabase.from("auditoria").select("*, usuarios(nome)")
          .order("created_at", { ascending: false }).limit(50),
        supabase.from("auditoria").select("id", { count: "exact" }),
        supabase.from("auditoria").select("id", { count: "exact" }).gte("created_at", hoje),
      ]);

      if (logRes.data) {
        setLogs((logRes.data as LogEntry[]).map((l: LogEntry) => ({
          ...l,
          usuario_nome: l.usuarios?.nome || "Sistema",
        })));
      }

      // Get unique users count
      const { data: userData } = await supabase.from("auditoria").select("usuario_id");
      const uniqueUsers = new Set((userData || []).map((u: LogEntry) => u.usuario_id).filter(Boolean));
      const { data: modData } = await supabase.from("auditoria").select("modulo");
      const uniqueModules = new Set((modData || []).map((m: LogEntry) => m.modulo));

      setStats({
        total: countRes.count || 0,
        hoje: hojeRes.count || 0,
        usuarios: uniqueUsers.size,
        modulos: uniqueModules.size,
      });
    } catch (err) {
      console.error("Erro ao carregar auditoria:", err);
    } finally {
      setLoading(false);
    }
  }, []);  useEffect(() => { let c = false; queueMicrotask(() => { if (!c) fetchData(); }); return () => { c = true; }; }, [fetchData]);

  const filtered = logs.filter((l) => {
    const matchSearch = search === "" ||
      (l.acao && l.acao.toLowerCase().includes(search.toLowerCase())) ||
      (l.modulo && l.modulo.toLowerCase().includes(search.toLowerCase())) ||
      (l.usuario_nome && l.usuario_nome.toLowerCase().includes(search.toLowerCase())) ||
      (l.ip && l.ip.includes(search));
    if (moduloFilter !== "Todos") return matchSearch && l.modulo === moduloFilter;
    return matchSearch;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="rounded-xl p-3 bg-zinc-50 dark:bg-zinc-950/50 text-zinc-600">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h2 className="page-title">Auditoria</h2>
            <p className="page-subtitle mt-1">Logs completos de auditoria e rastreamento de ações</p>
          </div>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={fetchData}><RefreshCw className="h-3.5 w-3.5" /></Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg p-2 bg-zinc-100 dark:bg-zinc-800"><Shield className="h-4 w-4 text-zinc-600" /></div>
          <div><p className="text-[10px] text-muted-foreground">Total de Registros</p><p className="text-sm font-bold text-foreground">{stats.total}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg p-2 bg-blue-100 dark:bg-blue-950/50"><CalendarDays className="h-4 w-4 text-blue-600" /></div>
          <div><p className="text-[10px] text-muted-foreground">Registros Hoje</p><p className="text-sm font-bold text-blue-600">{stats.hoje}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg p-2 bg-emerald-100 dark:bg-emerald-950/50"><User className="h-4 w-4 text-emerald-600" /></div>
          <div><p className="text-[10px] text-muted-foreground">Usuários Ativos</p><p className="text-sm font-bold text-emerald-600">{stats.usuarios}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg p-2 bg-violet-100 dark:bg-violet-950/50"><Monitor className="h-4 w-4 text-violet-600" /></div>
          <div><p className="text-[10px] text-muted-foreground">Módulos</p><p className="text-sm font-bold text-violet-600">{stats.modulos}</p></div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Logs de Auditoria</CardTitle>
          <CardDescription>Últimas 50 ações registradas no sistema</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-b border-border px-4 sm:px-6 py-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="text" placeholder="Buscar por ação, módulo, usuário ou IP..." value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
              <div className="flex items-center gap-2">
                <select value={moduloFilter} onChange={(e) => setModuloFilter(e.target.value)}
                  className="h-7 rounded-lg border border-input bg-background px-2 text-[10px] font-medium text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                  {MODULOS.map((m) => (<option key={m} value={m}>{m === "Todos" ? "Todos os módulos" : m}</option>))}
                </select>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{filtered.length} registro{filtered.length !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Shield className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-foreground">Nenhum registro encontrado</p>
              <p className="text-xs text-muted-foreground mt-1">Tente alterar os filtros da busca</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((log, index) => (
                <motion.div key={log.id} initial={{ opacity: 0, y: 2 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.01 }}
                  className="group flex items-start gap-3 px-4 sm:px-6 py-3 hover:bg-accent/30 transition-colors">
                  <div className="rounded-lg p-1.5 bg-zinc-100 dark:bg-zinc-800 mt-0.5 shrink-0">
                    <Shield className="h-3.5 w-3.5 text-zinc-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-foreground">{log.usuario_nome}</span>
                      <span className="text-[10px] text-muted-foreground">realizou</span>
                      <Badge variant="outline" className="text-[9px] font-mono">{log.acao}</Badge>
                      <span className="text-[10px] text-muted-foreground">em</span>
                      <Badge variant="secondary" className="text-[9px]">{log.modulo}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        {formatFullDate(log.created_at)}
                      </span>
                      {log.ip && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                          <Globe className="h-3 w-3" />
                          {log.ip}
                        </span>
                      )}
                      {log.registro_id && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          ID: {log.registro_id.substring(0, 8)}...
                        </span>
                      )}
                    </div>
                    {(log.dados_antigos || log.dados_novos) && (
                      <div className="mt-1.5 flex gap-2">
                        {log.dados_antigos && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950/50 text-red-600 font-mono">
                            Antigo: {JSON.stringify(log.dados_antigos).substring(0, 60)}...
                          </span>
                        )}
                        {log.dados_novos && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 font-mono">
                            Novo: {JSON.stringify(log.dados_novos).substring(0, 60)}...
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}