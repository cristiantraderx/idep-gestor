import { useState } from "react";
import {
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  CheckCircle2,
  Building2,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiDetailModal } from "@/components/dashboard/kpi-detail-modal";

const kpiCards = [
  {
    id: "alunos",
    title: "Total de Alunos",
    value: "1.247",
    change: "+12%",
    trend: "up",
    icon: Users,
    color: "text-blue-600 bg-blue-50 dark:bg-blue-950/50",
  },
  {
    id: "professores",
    title: "Professores Ativos",
    value: "89",
    change: "+3%",
    trend: "up",
    icon: GraduationCap,
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50",
  },
  {
    id: "cursos",
    title: "Cursos Ativos",
    value: "24",
    change: "0%",
    trend: "neutral",
    icon: BookOpen,
    color: "text-violet-600 bg-violet-50 dark:bg-violet-950/50",
  },
  {
    id: "receita",
    title: "Receita Mensal",
    value: "R$ 1.2M",
    change: "+8%",
    trend: "up",
    icon: DollarSign,
    color: "text-amber-600 bg-amber-50 dark:bg-amber-950/50",
  },
];

const statsGrid = [
  { label: "Frequência Média", value: "87%", variant: "success" as const },
  { label: "Salas Ocupadas", value: "32/45", variant: "default" as const },
  { label: "Contratos Vigentes", value: "156", variant: "success" as const },
  { label: "Estoque Baixo", value: "12", variant: "destructive" as const },
  { label: "Chamados Abertos", value: "8", variant: "warning" as const },
  { label: "Protocolos Pendentes", value: "23", variant: "warning" as const },
];

const recentActivities = [
  {
    icon: Users,
    title: "Nova matrícula",
    description: "Ana Silva - Técnico em Enfermagem",
    time: "5 min atrás",
    color: "text-blue-600",
  },
  {
    icon: DollarSign,
    title: "Pagamento recebido",
    description: "Parcela #458 - R$ 1.200,00",
    time: "15 min atrás",
    color: "text-emerald-600",
  },
  {
    icon: AlertCircle,
    title: "Chamado aberto",
    description: "Laboratório de Informática - Equipamento com defeito",
    time: "1 hora atrás",
    color: "text-amber-600",
  },
  {
    icon: CheckCircle2,
    title: "Protocolo concluído",
    description: "Solicitação de declaração #892",
    time: "2 horas atrás",
    color: "text-violet-600",
  },
];

export function DashboardPage() {
  const [selectedKpi, setSelectedKpi] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleKpiClick = (kpiId: string) => {
    setSelectedKpi(kpiId);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Dashboard Executivo</h2>
          <p className="page-subtitle">
            Visão geral das métricas institucionais do IDEP
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            Sistema Online
          </Badge>
          <select className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring">
            <option>Unidade Sede</option>
            <option>Filial 01</option>
            <option>Filial 02</option>
            <option>Todas as Unidades</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi, index) => (
          <Card
            key={index}
            className="stats-card cursor-pointer group"
            onClick={() => handleKpiClick(kpi.id)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {kpi.title}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {kpi.value}
                  </p>
                  <div className="flex items-center gap-1">
                    {kpi.trend === "up" ? (
                      <TrendingUp className="h-3 w-3 text-emerald-500" />
                    ) : kpi.trend === "down" ? (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    ) : null}
                    <span
                      className={`text-xs font-medium ${
                        kpi.trend === "up"
                          ? "text-emerald-500"
                          : kpi.trend === "down"
                          ? "text-red-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      {kpi.change}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      vs. mês anterior
                    </span>
                  </div>
                </div>
                <div
                  className={`rounded-lg p-2.5 ${kpi.color} group-hover:scale-110 transition-transform duration-200`}
                >
                  <kpi.icon className="h-5 w-5" />
                </div>
              </div>
              {/* Subtle indicator that it's clickable */}
              <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <span className="text-[10px] font-medium text-idep-700 dark:text-idep-300 flex items-center gap-1">
                  Ver detalhes completos →
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* KPI Detail Modal */}
      <KpiDetailModal
        kpiId={selectedKpi}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedKpi(null);
        }}
      />

      {/* Middle section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Stats */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Indicadores Institucionais
            </CardTitle>
            <CardDescription>
              Métricas em tempo real das unidades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {statsGrid.map((stat, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3"
                >
                  <span className="text-xs text-muted-foreground">
                    {stat.label}
                  </span>
                  <Badge variant={stat.variant}>{stat.value}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                Atividades Recentes
              </CardTitle>
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <CardDescription>Últimas movimentações</CardDescription>
          </CardHeader>
          <CardContent className="space-y-0">
            {recentActivities.map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-3 border-b border-border py-3 last:border-0"
              >
                <div className={`rounded-lg p-1.5 ${activity.color} bg-muted`}>
                  <activity.icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">
                    {activity.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {activity.description}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Bottom section - Unit comparison */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">
                Comparativo entre Unidades
              </CardTitle>
              <CardDescription>
                Dados consolidados das unidades do IDEP
              </CardDescription>
            </div>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                name: "Unidade Sede",
                alunos: 587,
                professores: 38,
                cursos: 10,
                receita: "R$ 580K",
              },
              {
                name: "Filial 01",
                alunos: 389,
                professores: 28,
                cursos: 8,
                receita: "R$ 390K",
              },
              {
                name: "Filial 02",
                alunos: 271,
                professores: 23,
                cursos: 6,
                receita: "R$ 270K",
              },
            ].map((unit, index) => (
              <div
                key={index}
                className="rounded-lg border border-border bg-muted/30 p-4 space-y-3"
              >
                <h4 className="text-sm font-semibold text-foreground">
                  {unit.name}
                </h4>
                <div className="space-y-1.5">
                  {[
                    { label: "Alunos", value: unit.alunos },
                    { label: "Professores", value: unit.professores },
                    { label: "Cursos", value: unit.cursos },
                    { label: "Receita", value: unit.receita },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-muted-foreground">
                        {item.label}
                      </span>
                      <span className="font-medium text-foreground">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
