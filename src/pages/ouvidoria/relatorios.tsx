import { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  Loader2,
  RefreshCw,
  CalendarDays,
  Mic,
  MessageSquare,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ManifestacaoRow {
  id: string;
  tipo?: string;
  categoria?: string;
  status?: string;
  data_abertura?: string;
  data_conclusao?: string;
  created_at?: string;
  descricao?: string;
  titulo?: string;
  assunto?: string;
}

export function RelatoriosOuvidoriaPage() {
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState("6");
  const [stats, setStats] = useState({
    totalReclamacoes: 0,
    totalSugestoes: 0,
    concluidas: 0,
    pendentes: 0,
    taxaResolucao: "0",
    tempoMedio: "0",
    reclamacoesPorTipo: [] as { tipo: string; count: number; label: string }[],
    sugestoesPorCategoria: [] as { categoria: string; count: number; label: string }[],
    statusReclamacoes: [] as { status: string; count: number; label: string }[],
    ultimasManifestacoes: [] as Array<{ id: string; tipo: string; descricao: string; created_at: string; status: string }>,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const months = parseInt(periodo);
      const dateLimit = new Date();
      dateLimit.setMonth(dateLimit.getMonth() - months);
      const dateStr = dateLimit.toISOString();

      const [recRes, sugRes, recAll] = await Promise.all([
        supabase.from("reclamacoes").select("*").gte("data_abertura", dateStr).order("data_abertura", { ascending: false }),
        supabase.from("sugestoes").select("*").gte("data_envio", dateStr).order("data_envio", { ascending: false }),
        supabase.from("reclamacoes").select("*"),
      ]);

      const reclamacoes = recRes.data || [];
      const sugestoes = sugRes.data || [];
      const reclamacoesAll = recAll.data || [];

      // Tipos
      const tipoCount: Record<string, number> = {};
      reclamacoes.forEach((r: ManifestacaoRow) => { const t = r.tipo || "outros"; tipoCount[t] = (tipoCount[t] || 0) + 1; });
      const tipoLabels: Record<string, string> = { reclamacao: "Reclamação", denuncia: "Denúncia", elogio: "Elogio", solicitacao: "Solicitação", outros: "Outros" };

      // Categorias
      const catCount: Record<string, number> = {};
      sugestoes.forEach((s: ManifestacaoRow) => { const c = s.categoria || "outros"; catCount[c] = (catCount[c] || 0) + 1; });
      const catLabels: Record<string, string> = { academica: "Acadêmica", administrativa: "Administrativa", infraestrutura: "Infraestrutura", tecnologia: "Tecnologia", outros: "Outros" };

      // Status
      const statusCount: Record<string, number> = {};
      reclamacoesAll.forEach((r: ManifestacaoRow) => { const s = r.status || "recebida"; statusCount[s] = (statusCount[s] || 0) + 1; });
      const statusLabels: Record<string, string> = { recebida: "Recebida", em_analise: "Em Análise", em_andamento: "Em Andamento", concluida: "Concluída", cancelada: "Cancelada" };

      const concluidas = reclamacoesAll.filter((r: ManifestacaoRow) => r.status === "concluida").length;
      const total = reclamacoesAll.length;
      const taxaResolucao = total > 0 ? ((concluidas / total) * 100).toFixed(1) : "0";

      // Tempo médio (simulado - calculado pela diferença entre abertura e conclusão)
      const concluidasComData = reclamacoesAll.filter((r: ManifestacaoRow) => r.status === "concluida" && r.data_conclusao);
      const tempoTotal = concluidasComData.reduce((acc: number, r: ManifestacaoRow) => {
        const abertura = new Date(r.data_abertura!).getTime();
        const conclusao = new Date(r.data_conclusao!).getTime();
        return acc + (conclusao - abertura);
      }, 0);
      const tempoMedioDias = concluidasComData.length > 0
        ? Math.round(tempoTotal / (concluidasComData.length * 86400000))
        : 0;

      setStats({
        totalReclamacoes: reclamacoesAll.length,
        totalSugestoes: sugestoes.length,
        concluidas,
        pendentes: total - concluidas,
        taxaResolucao,
        tempoMedio: `${tempoMedioDias} dias`,
        reclamacoesPorTipo: Object.entries(tipoCount)
          .sort(([, a], [, b]) => b - a)
          .map(([tipo, count]) => ({ tipo, count, label: tipoLabels[tipo] || tipo })),
        sugestoesPorCategoria: Object.entries(catCount)
          .sort(([, a], [, b]) => b - a)
          .map(([categoria, count]) => ({ categoria, count, label: catLabels[categoria] || categoria })),
        statusReclamacoes: Object.entries(statusCount)
          .sort(([, a], [, b]) => b - a)
          .map(([status, count]) => ({ status, count, label: statusLabels[status] || status })),
        ultimasManifestacoes: [...reclamacoes.slice(0, 3), ...sugestoes.slice(0, 2)].sort(
          (a: ManifestacaoRow, b: ManifestacaoRow) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
        ).slice(0, 5),
      });
    } catch (err) {
      console.error("Erro ao carregar relatórios:", err);
    } finally {
      setLoading(false);
    }
  }, [periodo]);  useEffect(() => { let c = false; queueMicrotask(() => { if (!c) fetchData(); }); return () => { c = true; }; }, [fetchData]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const maxTipo = Math.max(...stats.reclamacoesPorTipo.map((t) => t.count), 1);
  const maxCat = Math.max(...stats.sugestoesPorCategoria.map((c) => c.count), 1);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="rounded-xl p-3 bg-purple-50 dark:bg-purple-950/50 text-purple-600">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="page-title">Relatórios da Ouvidoria</h2>
            <p className="page-subtitle mt-1">Indicadores e métricas das manifestações</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select value={periodo} onChange={(e) => setPeriodo(e.target.value)}
            className="h-7 rounded-lg border border-input bg-background px-2 text-[10px] font-medium text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="1">Último mês</option>
            <option value="3">Últimos 3 meses</option>
            <option value="6">Últimos 6 meses</option>
            <option value="12">Último ano</option>
          </select>
          <Button variant="ghost" size="icon-sm" onClick={fetchData}><RefreshCw className="h-3.5 w-3.5" /></Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Total de Manifestações</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalReclamacoes + stats.totalSugestoes}</p>
              <div className="flex gap-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><Mic className="h-3 w-3" />{stats.totalReclamacoes}</span>
                <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{stats.totalSugestoes}</span>
              </div>
            </div>
            <div className="rounded-lg p-2.5 bg-purple-50 dark:bg-purple-950/50"><BarChart3 className="h-5 w-5 text-purple-600" /></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Concluídas</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.concluidas}</p>
              <span className="text-[10px] text-muted-foreground">{stats.taxaResolucao}% de resolução</span>
            </div>
            <div className="rounded-lg p-2.5 bg-emerald-50 dark:bg-emerald-950/50"><TrendingUp className="h-5 w-5 text-emerald-600" /></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-bold text-amber-600">{stats.pendentes}</p>
              <span className="text-[10px] text-muted-foreground">Aguardando conclusão</span>
            </div>
            <div className="rounded-lg p-2.5 bg-amber-50 dark:bg-amber-950/50"><TrendingDown className="h-5 w-5 text-amber-600" /></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Tempo Médio</p>
              <p className="text-2xl font-bold text-foreground">{stats.tempoMedio}</p>
              <span className="text-[10px] text-muted-foreground">Da abertura à conclusão</span>
            </div>
            <div className="rounded-lg p-2.5 bg-blue-50 dark:bg-blue-950/50"><CalendarDays className="h-5 w-5 text-blue-600" /></div>
          </div>
        </CardContent></Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Reclamações por Tipo */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Reclamações por Tipo</CardTitle>
            <CardDescription>Distribuição por tipo de manifestação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.reclamacoesPorTipo.map((item, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{item.label}</span>
                  <span className="text-muted-foreground">{item.count}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-purple-500 transition-all duration-500"
                    style={{ width: `${(item.count / maxTipo) * 100}%` }} />
                </div>
              </div>
            ))}
            {stats.reclamacoesPorTipo.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhum dado no período</p>
            )}
          </CardContent>
        </Card>

        {/* Sugestões por Categoria */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Sugestões por Categoria</CardTitle>
            <CardDescription>Distribuição por categoria</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.sugestoesPorCategoria.map((item, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{item.label}</span>
                  <span className="text-muted-foreground">{item.count}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-violet-500 transition-all duration-500"
                    style={{ width: `${(item.count / maxCat) * 100}%` }} />
                </div>
              </div>
            ))}
            {stats.sugestoesPorCategoria.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhum dado no período</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status geral */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Status Geral das Manifestações</CardTitle>
          <CardDescription>Situação de todas as reclamações registradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {stats.statusReclamacoes.map((item, i) => {
              const colorMap: Record<string, string> = {
                recebida: "bg-slate-400",
                em_analise: "bg-blue-500",
                em_andamento: "bg-amber-500",
                concluida: "bg-emerald-500",
                cancelada: "bg-red-500",
              };
              const total = stats.statusReclamacoes.reduce((acc, s) => acc + s.count, 0);
              const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : "0";
              return (
                <div key={i} className="flex-1 min-w-[120px] rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${colorMap[item.status] || "bg-muted"}`} />
                    <span className="text-xs font-medium text-foreground">{item.label}</span>
                  </div>
                  <p className="text-lg font-bold text-foreground">{item.count}</p>
                  <span className="text-[10px] text-muted-foreground">{pct}% do total</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Últimas manifestações */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Últimas Manifestações</CardTitle>
          <CardDescription>Atividades recentes registradas na ouvidoria</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {stats.ultimasManifestacoes.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">Nenhuma manifestação registrada</p>
          ) : (
            <div className="divide-y divide-border">
              {stats.ultimasManifestacoes.map((m, i: number) => (
                <div key={i} className="flex items-center gap-3 px-6 py-3">
                  <div className={`rounded-lg p-1.5 ${m.tipo ? "bg-purple-50 dark:bg-purple-950/50" : "bg-violet-50 dark:bg-violet-950/50"}`}>
                    {m.tipo ? <Mic className="h-3.5 w-3.5 text-purple-600" /> : <MessageSquare className="h-3.5 w-3.5 text-violet-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{m.titulo || m.assunto}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {m.tipo ? "Reclamação" : "Sugestão"} · {new Date(m.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[9px]">
                    {m.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}