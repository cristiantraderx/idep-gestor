import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  Loader2,
  RefreshCw,
  Wallet,
  PiggyBank,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export function FluxoCaixaPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [fluxoData, setFluxoData] = useState<{ month: string; receitas: number; despesas: number; saldo: number }[]>([]);
  const [summary, setSummary] = useState({
    totalReceitas: 0,
    totalDespesas: 0,
    saldoTotal: 0,
    meses: 0,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Get last 6 months of data
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

      const results = await Promise.all(
        months.map(async (m) => {
          const [recRes, despRes] = await Promise.all([
            supabase.from("receitas").select("valor")
              .gte("data_recebimento", m.start)
              .lte("data_recebimento", m.end),
            supabase.from("despesas").select("valor")
              .gte("data_pagamento", m.start)
              .lte("data_pagamento", m.end),
          ]);

          const receitas = (recRes.data || []).reduce((acc, r) => acc + (r.valor || 0), 0);
          const despesas = (despRes.data || []).reduce((acc, d) => acc + (d.valor || 0), 0);

          return {
            month: m.month,
            receitas: Math.round(receitas),
            despesas: Math.round(despesas),
            saldo: Math.round(receitas - despesas),
          };
        })
      );

      setFluxoData(results);

      const totalRec = results.reduce((acc, r) => acc + r.receitas, 0);
      const totalDesp = results.reduce((acc, r) => acc + r.despesas, 0);
      setSummary({
        totalReceitas: totalRec,
        totalDespesas: totalDesp,
        saldoTotal: totalRec - totalDesp,
        meses: results.length,
      });
    } catch (err) {
      console.error("Erro ao carregar fluxo de caixa:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const bestMonth = fluxoData.length > 0
    ? fluxoData.reduce((best, curr) => curr.saldo > best!.saldo ? curr : best, fluxoData[0])
    : null;
  const worstMonth = fluxoData.length > 0
    ? fluxoData.reduce((worst, curr) => curr.saldo < worst!.saldo ? curr : worst, fluxoData[0])
    : null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="rounded-xl p-3 bg-idep-50 dark:bg-idep-950/50 text-idep-700">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="page-title">Fluxo de Caixa</h2>
            <p className="page-subtitle mt-1">Acompanhamento do fluxo financeiro nos últimos 6 meses</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => navigate("/financeiro/receitas")}>
            <TrendingUp className="h-4 w-4" /> Receitas
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => navigate("/financeiro/despesas")}>
            <TrendingDown className="h-4 w-4" /> Despesas
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={fetchData}><RefreshCw className="h-3.5 w-3.5" /></Button>
        </div>
      </div>

      {/* Summary KPI */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg p-2 bg-emerald-50 dark:bg-emerald-950/50">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Total Receitas ({summary.meses} meses)</p>
              <p className="text-sm font-bold text-emerald-600">{formatCurrency(summary.totalReceitas)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg p-2 bg-red-50 dark:bg-red-950/50">
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Total Despesas ({summary.meses} meses)</p>
              <p className="text-sm font-bold text-red-600">{formatCurrency(summary.totalDespesas)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={cn("rounded-lg p-2", summary.saldoTotal >= 0 ? "bg-emerald-50 dark:bg-emerald-950/50" : "bg-red-50 dark:bg-red-950/50")}>
              <Wallet className={cn("h-4 w-4", summary.saldoTotal >= 0 ? "text-emerald-600" : "text-red-600")} />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Saldo do Período</p>
              <p className={cn("text-sm font-bold", summary.saldoTotal >= 0 ? "text-emerald-600" : "text-red-600")}>
                {formatCurrency(summary.saldoTotal)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg p-2 bg-amber-50 dark:bg-amber-950/50">
              <CalendarDays className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Melhor Mês</p>
              <p className="text-sm font-bold text-foreground">{bestMonth ? `${bestMonth.month} (${formatCurrency(bestMonth.saldo)})` : "—"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Area Chart - Saldo */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Evolução do Saldo</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </div>
          <CardDescription>Saldo mensal (receitas - despesas) ao longo dos meses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={fluxoData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradSaldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false}
                  tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: number) => [formatCurrency(val)]} />
                <Area type="monotone" dataKey="saldo" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#gradSaldo)"
                  dot={{ fill: '#3b82f6', strokeWidth: 0, r: 3 }}
                  activeDot={{ fill: '#3b82f6', strokeWidth: 2, stroke: 'hsl(var(--background))', r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Bar Chart - Receitas vs Despesas */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Comparativo Receitas × Despesas</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </div>
          <CardDescription>Comparação mensal entre entradas e saídas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fluxoData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false}
                  tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: number) => [formatCurrency(val)]} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="receitas" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Monthly breakdown table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Detalhamento Mensal</CardTitle>
          <CardDescription>Valores em reais (R$)</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Mês</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Receitas</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Despesas</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Saldo</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Margem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {fluxoData.map((row, i) => {
                  const margem = row.receitas > 0 ? ((row.saldo / row.receitas) * 100).toFixed(1) : "0";
                  return (
                    <tr key={i} className="hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground capitalize">{row.month}</td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-medium">{formatCurrency(row.receitas)}</td>
                      <td className="px-4 py-3 text-right text-red-600 font-medium">{formatCurrency(row.despesas)}</td>
                      <td className={cn("px-4 py-3 text-right font-bold", row.saldo >= 0 ? "text-emerald-600" : "text-red-600")}>
                        {formatCurrency(row.saldo)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant={parseFloat(margem) >= 0 ? "success" : "destructive"} className="text-[9px]">
                          {margem}%
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
