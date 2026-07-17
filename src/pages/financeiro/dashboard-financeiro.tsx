import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  Plus,
  Loader2,
  RefreshCw,
  Wallet,
  PiggyBank,
  AlertTriangle,
  CheckCircle2,
  PieChartIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from "recharts";

const CATEGORIA_RECEITA_LABELS: Record<string, string> = {
  mensalidade: "Mensalidade",
  convenio: "Convênio",
  subvencao: "Subvenção",
  projeto: "Projeto",
  outros: "Outros",
};

const CATEGORIA_DESPESA_LABELS: Record<string, string> = {
  pessoal: "Pessoal",
  material: "Material",
  servico: "Serviço",
  utilidade: "Utilidade",
  investimento: "Investimento",
  outros: "Outros",
};

const DONUT_COLORS = [
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-sm">
        {label && <p className="font-medium text-foreground mb-1">{label}</p>}
        {payload.map((entry: any, i: number) => (
          <p key={i} style={{ color: entry.color }} className="font-medium">
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-sm">
        <p className="font-medium text-foreground">{data.name}</p>
        <p className="font-medium" style={{ color: payload[0].color }}>
          {formatCurrency(data.value)} ({data.pct}%)
        </p>
      </div>
    );
  }
  return null;
};

export function FinanceiroDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    receitasMes: 0,
    despesasMes: 0,
    saldoMes: 0,
    receitasMesAnterior: 0,
    despesasMesAnterior: 0,
    totalReceitas: 0,
    totalDespesas: 0,
    receitasCount: 0,
    despesasCount: 0,
    receitasPendentes: 0,
    despesasAPagar: 0,
  });
  const [recentReceitas, setRecentReceitas] = useState<any[]>([]);
  const [recentDespesas, setRecentDespesas] = useState<any[]>([]);
  const [receitasByCategoria, setReceitasByCategoria] = useState<{ name: string; value: number; pct: string; color: string }[]>([]);
  const [despesasByCategoria, setDespesasByCategoria] = useState<{ name: string; value: number; pct: string; color: string }[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; receitas: number; despesas: number; saldo: number }[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

      // Monthly data for last 6 months (for charts)
      const months: { month: string; start: string; end: string }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString();
        months.push({
          month: d.toLocaleDateString("pt-BR", { month: "short" }),
          start,
          end,
        });
      }

      const [
        receitasMes,
        despesasMes,
        receitasMesAnt,
        despesasMesAnt,
        totalReceitas,
        totalDespesas,
        recentR,
        recentD,
        receitasCateg,
        despesasCateg,
      ] = await Promise.all([
        supabase.from("receitas").select("valor").gte("data_recebimento", monthStart),
        supabase.from("despesas").select("valor").gte("data_pagamento", monthStart),
        supabase.from("receitas").select("valor").gte("data_recebimento", prevMonthStart).lte("data_recebimento", prevMonthEnd),
        supabase.from("despesas").select("valor").gte("data_pagamento", prevMonthStart).lte("data_pagamento", prevMonthEnd),
        supabase.from("receitas").select("valor"),
        supabase.from("despesas").select("valor"),
        supabase.from("receitas").select("*, unidades(nome)").order("data_recebimento", { ascending: false }).limit(3),
        supabase.from("despesas").select("*, unidades(nome)").order("data_pagamento", { ascending: false }).limit(3),
        supabase.from("receitas").select("categoria, valor").gte("data_recebimento", monthStart),
        supabase.from("despesas").select("categoria, valor").gte("data_pagamento", monthStart),
      ]);

      const sum = (arr: any[] | null) => (arr || []).reduce((acc: number, r: any) => acc + (r.valor || 0), 0);

      const receitasVal = sum(receitasMes.data);
      const despesasVal = sum(despesasMes.data);

      setSummary({
        receitasMes: receitasVal,
        despesasMes: despesasVal,
        saldoMes: receitasVal - despesasVal,
        receitasMesAnterior: sum(receitasMesAnt.data),
        despesasMesAnterior: sum(despesasMesAnt.data),
        totalReceitas: sum(totalReceitas.data),
        totalDespesas: sum(totalDespesas.data),
        receitasCount: totalReceitas.data?.length || 0,
        despesasCount: totalDespesas.data?.length || 0,
        receitasPendentes: totalReceitas.data?.filter((r: any) => new Date(r.data_recebimento) > now).length || 0,
        despesasAPagar: totalDespesas.data?.filter((r: any) => new Date(r.data_pagamento) > now).length || 0,
      });

      if (recentR.data) setRecentReceitas(recentR.data);
      if (recentD.data) setRecentDespesas(recentD.data);

      // Process category data for pie charts
      const catReceitas: Record<string, number> = {};
      (receitasCateg.data || []).forEach((r: any) => {
        const cat = r.categoria || "outros";
        catReceitas[cat] = (catReceitas[cat] || 0) + (r.valor || 0);
      });
      const catDespesas: Record<string, number> = {};
      (despesasCateg.data || []).forEach((d: any) => {
        const cat = d.categoria || "outros";
        catDespesas[cat] = (catDespesas[cat] || 0) + (d.valor || 0);
      });

      const receitasTotal = Object.values(catReceitas).reduce((a, b) => a + b, 0);
      const despesasTotal = Object.values(catDespesas).reduce((a, b) => a + b, 0);

      const getReceitaName = (key: string) => CATEGORIA_RECEITA_LABELS[key] || key;
      const getDespesaName = (key: string) => CATEGORIA_DESPESA_LABELS[key] || key;

      setReceitasByCategoria(
        Object.entries(catReceitas)
          .sort(([, a], [, b]) => b - a)
          .map(([key, value], i) => ({
            name: getReceitaName(key),
            value: Math.round(value),
            pct: receitasTotal > 0 ? ((value / receitasTotal) * 100).toFixed(1) : "0",
            color: DONUT_COLORS[i % DONUT_COLORS.length],
          }))
      );

      setDespesasByCategoria(
        Object.entries(catDespesas)
          .sort(([, a], [, b]) => b - a)
          .map(([key, value], i) => ({
            name: getDespesaName(key),
            value: Math.round(value),
            pct: despesasTotal > 0 ? ((value / despesasTotal) * 100).toFixed(1) : "0",
            color: DONUT_COLORS[i % DONUT_COLORS.length],
          }))
      );

      // Build monthly data
      const monthlyResults = await Promise.all(
        months.map(async (m) => {
          const [recRes, despRes] = await Promise.all([
            supabase.from("receitas").select("valor")
              .gte("data_recebimento", m.start)
              .lte("data_recebimento", m.end),
            supabase.from("despesas").select("valor")
              .gte("data_pagamento", m.start)
              .lte("data_pagamento", m.end),
          ]);

          const recVal = (recRes.data || []).reduce((acc, r) => acc + (r.valor || 0), 0);
          const despVal = (despRes.data || []).reduce((acc, r) => acc + (r.valor || 0), 0);

          return {
            month: m.month,
            receitas: Math.round(recVal),
            despesas: Math.round(despVal),
            saldo: Math.round(recVal - despVal),
          };
        })
      );

      setMonthlyData(monthlyResults);
    } catch (err) {
      console.error("Erro ao carregar dados financeiros:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const receitaChange = summary.receitasMesAnterior > 0
    ? ((summary.receitasMes - summary.receitasMesAnterior) / summary.receitasMesAnterior * 100).toFixed(1)
    : "0";

  const despesaChange = summary.despesasMesAnterior > 0
    ? ((summary.despesasMes - summary.despesasMesAnterior) / summary.despesasMesAnterior * 100).toFixed(1)
    : "0";

  const saldoPct = summary.receitasMes > 0
    ? ((summary.saldoMes / summary.receitasMes) * 100).toFixed(1)
    : "0";

  const totalReceitasDonut = receitasByCategoria.reduce((a, b) => a + b.value, 0);
  const totalDespesasDonut = despesasByCategoria.reduce((a, b) => a + b.value, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="rounded-xl p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-600">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <h2 className="page-title">Financeiro</h2>
            <p className="page-subtitle mt-1">
              Dashboard avançado com análises e gráficos do mês atual
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => navigate("/financeiro/receitas")}>
            <Plus className="h-4 w-4" />
            Nova Receita
          </Button>
          <Button className="gap-2" onClick={() => navigate("/financeiro/despesas")}>
            <Plus className="h-4 w-4" />
            Nova Despesa
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Receitas do Mês</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(summary.receitasMes)}</p>
                <div className="flex items-center gap-1">
                  <TrendingUp className={cn("h-3 w-3", parseFloat(receitaChange) >= 0 ? "text-emerald-500" : "text-red-500")} />
                  <span className={cn("text-xs font-medium", parseFloat(receitaChange) >= 0 ? "text-emerald-500" : "text-red-500")}>
                    {receitaChange}%
                  </span>
                  <span className="text-xs text-muted-foreground">vs. mês anterior</span>
                </div>
              </div>
              <div className="rounded-lg p-2.5 bg-emerald-50 dark:bg-emerald-950/50">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Despesas do Mês</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.despesasMes)}</p>
                <div className="flex items-center gap-1">
                  <TrendingDown className={cn("h-3 w-3", parseFloat(despesaChange) <= 0 ? "text-emerald-500" : "text-red-500")} />
                  <span className={cn("text-xs font-medium", parseFloat(despesaChange) <= 0 ? "text-emerald-500" : "text-red-500")}>
                    {despesaChange}%
                  </span>
                  <span className="text-xs text-muted-foreground">vs. mês anterior</span>
                </div>
              </div>
              <div className="rounded-lg p-2.5 bg-red-50 dark:bg-red-950/50">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Saldo do Mês</p>
                <p className={cn("text-2xl font-bold", summary.saldoMes >= 0 ? "text-emerald-600" : "text-red-600")}>
                  {formatCurrency(summary.saldoMes)}
                </p>
                <div className="flex items-center gap-1">
                  <Wallet className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Margem de {saldoPct}%
                  </span>
                </div>
              </div>
              <div className={cn("rounded-lg p-2.5", summary.saldoMes >= 0 ? "bg-emerald-50 dark:bg-emerald-950/50" : "bg-red-50 dark:bg-red-950/50")}>
                <Wallet className={cn("h-5 w-5", summary.saldoMes >= 0 ? "text-emerald-600" : "text-red-600")} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Total Geral</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(summary.totalReceitas - summary.totalDespesas)}</p>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs text-emerald-600">
                    <ArrowUpRight className="h-3 w-3" />
                    {formatCurrency(summary.totalReceitas)}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-red-600">
                    <ArrowDownRight className="h-3 w-3" />
                    {formatCurrency(summary.totalDespesas)}
                  </span>
                </div>
              </div>
              <div className="rounded-lg p-2.5 bg-idep-50 dark:bg-idep-950/50">
                <PiggyBank className="h-5 w-5 text-idep-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 1: Donut Charts - Category Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Receitas por Categoria */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Receitas por Categoria</CardTitle>
              <PieChartIcon className="h-4 w-4 text-emerald-600" />
            </div>
            <CardDescription>Distribuição das receitas do mês atual</CardDescription>
          </CardHeader>
          <CardContent>
            {receitasByCategoria.length > 0 ? (
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <div className="h-52 w-52 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={receitasByCategoria}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {receitasByCategoria.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 w-full space-y-2">
                  {receitasByCategoria.map((cat, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="text-xs text-foreground truncate">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-medium text-foreground">{formatCurrency(cat.value)}</span>
                        <span className="text-[10px] text-muted-foreground w-10 text-right">{cat.pct}%</span>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">Total</span>
                    <span className="text-xs font-bold text-emerald-600">{formatCurrency(totalReceitasDonut)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-xs text-muted-foreground">
                Nenhuma receita no mês atual
              </div>
            )}
          </CardContent>
        </Card>

        {/* Despesas por Categoria */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Despesas por Categoria</CardTitle>
              <PieChartIcon className="h-4 w-4 text-red-600" />
            </div>
            <CardDescription>Distribuição das despesas do mês atual</CardDescription>
          </CardHeader>
          <CardContent>
            {despesasByCategoria.length > 0 ? (
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <div className="h-52 w-52 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={despesasByCategoria}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {despesasByCategoria.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 w-full space-y-2">
                  {despesasByCategoria.map((cat, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="text-xs text-foreground truncate">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-medium text-foreground">{formatCurrency(cat.value)}</span>
                        <span className="text-[10px] text-muted-foreground w-10 text-right">{cat.pct}%</span>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">Total</span>
                    <span className="text-xs font-bold text-red-600">{formatCurrency(totalDespesasDonut)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-xs text-muted-foreground">
                Nenhuma despesa no mês atual
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Bar Chart + Area Chart */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Comparativo Mensal */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Comparativo Receitas × Despesas</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false}
                    tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="receitas" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Evolução do Saldo */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Evolução do Saldo</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription>Saldo líquido mensal nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradSaldo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gradPositive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gradNegative" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false}
                    tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="saldo"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#gradSaldo)"
                    dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      const isPositive = payload.saldo >= 0;
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={4}
                          fill={isPositive ? "#10b981" : "#ef4444"}
                          stroke="hsl(var(--background))"
                          strokeWidth={2}
                        />
                      );
                    }}
                    activeDot={{ fill: '#3b82f6', strokeWidth: 2, stroke: 'hsl(var(--background))', r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Indicators + Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Indicadores Financeiros</CardTitle>
            <CardDescription>Resumo das movimentações financeiras</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total de Receitas", value: formatCurrency(summary.totalReceitas), count: `${summary.receitasCount} registros`, icon: DollarSign, color: "text-emerald-600" },
                { label: "Total de Despesas", value: formatCurrency(summary.totalDespesas), count: `${summary.despesasCount} registros`, icon: DollarSign, color: "text-red-600" },
                { label: "Receitas a Receber", value: `${summary.receitasPendentes}`, count: "registros futuros", icon: CalendarDays, color: "text-amber-600" },
                { label: "Despesas a Pagar", value: `${summary.despesasAPagar}`, count: "registros futuros", icon: CalendarDays, color: "text-red-600" },
              ].map((stat, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
                  <div className="space-y-0.5">
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                    <p className="text-sm font-bold text-foreground">{stat.value}</p>
                    <span className="text-[10px] text-muted-foreground">{stat.count}</span>
                  </div>
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Últimas Movimentações</CardTitle>
              <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <CardDescription>Receitas e despesas recentes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-0">
            {recentReceitas.map((rec) => (
              <div key={rec.id} className="flex items-start gap-3 border-b border-border py-2.5 last:border-0">
                <div className="rounded-lg p-1.5 bg-emerald-50 dark:bg-emerald-950/50">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{rec.descricao}</p>
                  <p className="text-[10px] text-emerald-600 font-semibold">{formatCurrency(rec.valor)}</p>
                </div>
                <Badge variant="outline" className="text-[8px] bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
                  Receita
                </Badge>
              </div>
            ))}
            {recentDespesas.map((desp) => (
              <div key={desp.id} className="flex items-start gap-3 border-b border-border py-2.5 last:border-0">
                <div className="rounded-lg p-1.5 bg-red-50 dark:bg-red-950/50">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{desp.descricao}</p>
                  <p className="text-[10px] text-red-600 font-semibold">{formatCurrency(desp.valor)}</p>
                </div>
                <Badge variant="outline" className="text-[8px] bg-red-50 dark:bg-red-950/50 text-red-600">
                  Despesa
                </Badge>
              </div>
            ))}
            {recentReceitas.length === 0 && recentDespesas.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhuma movimentação recente</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Navigation cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <button
          onClick={() => navigate("/financeiro/receitas")}
          className="group rounded-xl border border-border bg-card p-5 text-left hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all duration-200"
        >
          <div className="rounded-lg p-2.5 bg-emerald-50 dark:bg-emerald-950/50 w-fit mb-3 group-hover:scale-110 transition-transform">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Receitas</h3>
          <p className="text-xs text-muted-foreground mt-1">Gerencie todas as receitas da instituição</p>
          <span className="text-[10px] font-medium text-emerald-600 mt-2 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Gerenciar receitas →
          </span>
        </button>

        <button
          onClick={() => navigate("/financeiro/despesas")}
          className="group rounded-xl border border-border bg-card p-5 text-left hover:border-red-300 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-all duration-200"
        >
          <div className="rounded-lg p-2.5 bg-red-50 dark:bg-red-950/50 w-fit mb-3 group-hover:scale-110 transition-transform">
            <TrendingDown className="h-5 w-5 text-red-600" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Despesas</h3>
          <p className="text-xs text-muted-foreground mt-1">Controle todas as despesas e saídas financeiras</p>
          <span className="text-[10px] font-medium text-red-600 mt-2 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Gerenciar despesas →
          </span>
        </button>

        <button
          onClick={() => navigate("/financeiro/fluxo")}
          className="group rounded-xl border border-border bg-card p-5 text-left hover:border-idep-300 hover:bg-idep-50/50 dark:hover:bg-idep-950/20 transition-all duration-200"
        >
          <div className="rounded-lg p-2.5 bg-idep-50 dark:bg-idep-950/50 w-fit mb-3 group-hover:scale-110 transition-transform">
            <BarChart3 className="h-5 w-5 text-idep-700" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Fluxo de Caixa</h3>
          <p className="text-xs text-muted-foreground mt-1">Visualize o fluxo financeiro consolidado</p>
          <span className="text-[10px] font-medium text-idep-700 mt-2 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Ver fluxo de caixa →
          </span>
        </button>
      </div>
    </motion.div>
  );
}