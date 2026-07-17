import { useState } from "react";
import {
  PieChart,
  TrendingUp,
  Loader2,
  RefreshCw,
  Users,
  GraduationCap,
  DollarSign,
  Building2,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

const kpiData = [
  { label: "Alunos Ativos", value: "1.247", change: "+12.3%", trend: "up", icon: Users, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50" },
  { label: "Cursos Oferecidos", value: "24", change: "+2", trend: "up", icon: GraduationCap, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50" },
  { label: "Receita Anual", value: formatCurrency(2850000), change: "+8.7%", trend: "up", icon: DollarSign, color: "text-green-600 bg-green-50 dark:bg-green-950/50" },
  { label: "Unidades", value: "3", change: "0", trend: "neutral", icon: Building2, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/50" },
  { label: "Turmas Ativas", value: "48", change: "+5.2%", trend: "up", icon: GraduationCap, color: "text-violet-600 bg-violet-50 dark:bg-violet-950/50" },
  { label: "Servidores", value: "186", change: "+3.9%", trend: "up", icon: Users, color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/50" },
];

const performanceData = [
  { indicator: "Evasão", atual: 8.2, meta: 10, unidade: "%" },
  { indicator: "Aprovação", atual: 87.5, meta: 85, unidade: "%" },
  { indicator: "Frequência", atual: 91.3, meta: 90, unidade: "%" },
  { indicator: "Satisfação", atual: 78.0, meta: 80, unidade: "%" },
  { indicator: "Empregabilidade", atual: 72.5, meta: 70, unidade: "%" },
  { indicator: "Retenção", atual: 84.0, meta: 80, unidade: "%" },
];

const monthlyEvolData = [
  { month: "Fev", alunos: 1120, cursos: 22 },
  { month: "Mar", alunos: 1150, cursos: 22 },
  { month: "Abr", alunos: 1180, cursos: 23 },
  { month: "Mai", alunos: 1210, cursos: 23 },
  { month: "Jun", alunos: 1240, cursos: 24 },
  { month: "Jul", alunos: 1247, cursos: 24 },
];

export function BIPage() {
  const [loading, setLoading] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="rounded-xl p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
            <PieChart className="h-6 w-6" />
          </div>
          <div>
            <h2 className="page-title">Business Intelligence</h2>
            <p className="page-subtitle mt-1">Indicadores estratégicos e analytics institucionais</p>
          </div>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={() => setLoading(true)}><RefreshCw className="h-3.5 w-3.5" /></Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {kpiData.map((kpi, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`rounded-lg p-1.5 ${kpi.color}`}><kpi.icon className="h-4 w-4" /></div>
                    <Badge variant={kpi.trend === "up" ? "success" : "secondary"} className="text-[8px]">
                      <span className="flex items-center gap-0.5">
                        {kpi.trend === "up" ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
                        {kpi.change}
                      </span>
                    </Badge>
                  </div>
                  <p className="text-lg font-bold text-foreground">{kpi.value}</p>
                  <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Performance Radar */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Performance vs Metas</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardDescription>Indicadores atuais vs metas institucionais</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={performanceData} cx="50%" cy="50%" outerRadius="70%">
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="indicator" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                        formatter={(val: number) => [`${val}%`]} />
                      <Radar name="Atual" dataKey="atual" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
                      <Radar name="Meta" dataKey="meta" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} strokeDasharray="4 4" />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-2">
                  <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-indigo-500" /><span className="text-[10px] text-muted-foreground">Atual</span></div>
                  <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /><span className="text-[10px] text-muted-foreground">Meta</span></div>
                </div>
              </CardContent>
            </Card>

            {/* Evolução Alunos/Cursos */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Evolução Institucional</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardDescription>Alunos e cursos nos últimos meses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyEvolData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="left" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                      <Bar yAxisId="left" dataKey="alunos" name="Alunos" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={24} />
                      <Bar yAxisId="right" dataKey="cursos" name="Cursos" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed KPIs */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Indicadores de Performance Detalhados</CardTitle>
              <CardDescription>Comparativo entre valor atual e meta estabelecida</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {performanceData.map((item, i) => {
                const pct = item.meta > 0 ? (item.atual / item.meta) * 100 : 0;
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">{item.indicator}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">Meta: {item.meta}{item.unidade}</span>
                        <span className={cn("text-xs font-bold", pct >= 100 ? "text-emerald-600" : "text-amber-600")}>
                          {item.atual}{item.unidade}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", pct >= 100 ? "bg-emerald-500" : "bg-amber-500")}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </>
      )}
    </motion.div>
  );
}