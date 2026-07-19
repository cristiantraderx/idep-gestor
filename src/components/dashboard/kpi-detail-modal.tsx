import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  CalendarDays,
  ArrowRight,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { KPI_DETAILS } from "@/data/mock-data";

// ============================================================
// Trend Indicator Component
// ============================================================
function TrendBadge({ trend, change }: { trend: string; change: string }) {
  return (
    <div className="flex items-center gap-1">
      {trend === "up" ? (
        <TrendingUp className="h-3 w-3 text-emerald-500" />
      ) : trend === "down" ? (
        <TrendingDown className="h-3 w-3 text-red-500" />
      ) : (
        <Minus className="h-3 w-3 text-muted-foreground" />
      )}
      <span
        className={cn(
          "text-xs font-medium",
          trend === "up"
            ? "text-emerald-500"
            : trend === "down"
            ? "text-red-500"
            : "text-muted-foreground"
        )}
      >
        {change} vs. mês anterior
      </span>
    </div>
  );
}

// ============================================================
// Main KPI Detail Modal
// ============================================================
interface KpiDetailModalProps {
  kpiId: string | null;
  open: boolean;
  onClose: () => void;
}

export function KpiDetailModal({ kpiId, open, onClose }: KpiDetailModalProps) {
  const navigate = useNavigate();
  const [showAllBreakdown, setShowAllBreakdown] = useState(false);

  if (!kpiId || !KPI_DETAILS[kpiId]) return null;

  const detail = KPI_DETAILS[kpiId];
  const Icon = detail.icon;

  return (
    <Dialog open={open} onClose={onClose} size="full" className="max-w-3xl">
      <div className="space-y-6 py-2">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`rounded-xl p-3 ${detail.color}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-foreground">{detail.title}</h3>
                <Badge variant="outline" className="text-[10px] gap-1">
                  <Clock className="h-3 w-3" />
                  {detail.lastUpdate}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                {detail.description}
              </p>
            </div>
          </div>
        </div>

        {/* Main Value */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-background to-muted/30 p-6">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-4xl font-bold text-foreground tracking-tight">
                {detail.totalValue}
              </p>
              <TrendBadge trend={detail.trend} change={detail.change} />
            </div>
            {detail.link && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => {
                  onClose();
                  navigate(detail.link!);
                }}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Ver completo
              </Button>
            )}
          </div>

          {/* Evolution Chart (Recharts AreaChart) */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Evolução Mensal
              </span>
              <span className="text-[10px] text-muted-foreground">
                Últimos 6 meses
              </span>
            </div>
            <div className="h-32 sm:h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={detail.monthlyEvolution} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                    labelStyle={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}
                    formatter={(val: number) => [val.toLocaleString('pt-BR'), 'Valor']}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                    activeDot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: 'hsl(var(--background))', r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Breakdown Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Detailed breakdown with PieChart */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Composição Detalhada
            </h4>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Mini PieChart */}
              <div className="h-28 w-28 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={detail.breakdown.map((b, _i) => ({
                        name: b.label,
                        value: parseInt(b.value.replace(/[^\d]/g, '')) || 1,
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={24}
                      outerRadius={40}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {detail.breakdown.map((_b, idx) => {
                        const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
                        return <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} fillOpacity={0.85} />;
                      })}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '11px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Text breakdown */}
              <div className="flex-1 w-full space-y-2.5">
                {detail.breakdown.slice(0, showAllBreakdown ? undefined : 4).map((item, i) => {
                  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
                  const pctMatch = item.sublabel?.match(/(\d+[.,]?\d*)/)?.[0];
                  const barWidth = pctMatch
                    ? `${Math.min(parseFloat(pctMatch.replace(",", ".")), 100)}%`
                    : "0%";
                  return (
                    <div key={i} className="space-y-0.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-foreground font-medium">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i] }} />
                          {item.label}
                        </span>
                        <span className="font-semibold text-foreground">{item.value}</span>
                      </div>
                      {item.sublabel && (
                        <div className="flex items-center gap-2 pl-4">
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: barWidth,
                                backgroundColor: PIE_COLORS[i],
                                opacity: 0.6,
                              }}
                            />
                          </div>
                          <span className="text-[9px] text-muted-foreground shrink-0">
                            {item.sublabel}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
                {detail.breakdown.length > 4 && (
                  <button
                    onClick={() => setShowAllBreakdown(!showAllBreakdown)}
                    className="flex items-center gap-1 text-[10px] font-medium text-idep-700 dark:text-idep-300 hover:underline mt-1"
                  >
                    {showAllBreakdown ? "Mostrar menos" : `Mostrar mais ${detail.breakdown.length - 4} itens`}
                    <ChevronDown className={cn("h-3 w-3 transition-transform", showAllBreakdown && "rotate-180")} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Per unit breakdown - Recharts BarChart */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Distribuição por Unidade
            </h4>
            <div className="h-44 sm:h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={detail.byUnit.map(u => ({ name: u.name.split(' ').pop(), value: u.value, fullName: u.name }))} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                    formatter={(val: number) => [val.toLocaleString('pt-BR'), 'Quantidade']}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {detail.byUnit.map((_, i) => (
                      <Cell
                        key={i}
                        fill={i === 0 ? '#3b82f6' : i === 1 ? '#10b981' : '#f59e0b'}
                        fillOpacity={0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-2">
              {detail.byUnit.map((unit, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: i === 0 ? '#3b82f6' : i === 1 ? '#10b981' : '#f59e0b' }}
                  />
                  <span>{unit.name}: <strong>{unit.percentage}%</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related Metrics */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Métricas Relacionadas
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {detail.relatedMetrics.map((metric, i) => (
              <div key={i} className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                <p className="text-[10px] text-muted-foreground mb-1">{metric.label}</p>
                <p className="text-lg font-bold text-foreground">{metric.value}</p>
                <div className="flex items-center justify-center gap-0.5 mt-0.5">
                  {metric.trend === "up" ? (
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                  ) : metric.trend === "down" ? (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  ) : (
                    <Minus className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span
                    className={cn(
                      "text-[10px]",
                      metric.trend === "up"
                        ? "text-emerald-500"
                        : metric.trend === "down"
                        ? "text-red-500"
                        : "text-muted-foreground"
                    )}
                  >
                    {metric.trend === "up" ? "Positivo" : metric.trend === "down" ? "Negativo" : "Estável"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <CalendarDays className="h-3 w-3" />
            Dados atualizados em {detail.lastUpdate}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
              Fechar
            </Button>
            {detail.link && (
              <Button
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => {
                  onClose();
                  navigate(detail.link!);
                }}
              >
                <ArrowRight className="h-3.5 w-3.5" />
                Acessar {detail.title.split(" ")[0]}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
