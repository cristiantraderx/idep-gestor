// ============================================================
// IDEP-Gestor · Dados Mock (Dashboard & KPI)
// ============================================================
// Centralizado para facilitar a substituição futura por dados
// reais vindos do Supabase.
// ============================================================

import {
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";

// ============================================================
// Tipos Compartilhados
// ============================================================

export type TrendDirection = "up" | "down" | "neutral";

export type BadgeVariant = "default" | "success" | "warning" | "destructive";

export interface KpiCardData {
  id: string;
  title: string;
  value: string;
  change: string;
  trend: TrendDirection;
  icon: LucideIcon;
  color: string;
}

export interface StatsGridItem {
  label: string;
  value: string;
  variant: BadgeVariant;
}

export interface RecentActivity {
  icon: LucideIcon;
  title: string;
  description: string;
  time: string;
  color: string;
}

export interface UnitData {
  name: string;
  value: number;
  percentage: number;
}

export interface MonthlyData {
  month: string;
  value: number;
  previousValue?: number;
}

export interface KpiDetailData {
  id: string;
  title: string;
  totalValue: string;
  change: string;
  trend: TrendDirection;
  icon: LucideIcon;
  color: string;
  description: string;
  breakdown: { label: string; value: string; sublabel?: string }[];
  byUnit: UnitData[];
  monthlyEvolution: MonthlyData[];
  relatedMetrics: { label: string; value: string; trend: TrendDirection }[];
  link?: string;
  lastUpdate: string;
}

export interface UnitComparison {
  name: string;
  alunos: number;
  professores: number;
  cursos: number;
  receita: string;
}

// ============================================================
// Dashboard — KPI Cards
// ============================================================

export const kpiCards: KpiCardData[] = [
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

// ============================================================
// Dashboard — Stats Grid
// ============================================================

export const statsGrid: StatsGridItem[] = [
  { label: "Frequência Média", value: "87%", variant: "success" },
  { label: "Salas Ocupadas", value: "32/45", variant: "default" },
  { label: "Contratos Vigentes", value: "156", variant: "success" },
  { label: "Estoque Baixo", value: "12", variant: "destructive" },
  { label: "Chamados Abertos", value: "8", variant: "warning" },
  { label: "Protocolos Pendentes", value: "23", variant: "warning" },
];

// ============================================================
// Dashboard — Recent Activities
// ============================================================

export const recentActivities: RecentActivity[] = [
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

// ============================================================
// Dashboard — Unit Comparison
// ============================================================

export const unitComparison: UnitComparison[] = [
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
];

// ============================================================
// KPI Detail Modal — Dados Detalhados
// ============================================================

export const KPI_DETAILS: Record<string, KpiDetailData> = {
  alunos: {
    id: "alunos",
    title: "Total de Alunos",
    totalValue: "1.247",
    change: "+12%",
    trend: "up",
    icon: Users,
    color: "text-blue-600 bg-blue-50 dark:bg-blue-950/50",
    description:
      "Total de alunos matriculados ativamente na instituição, incluindo todas as unidades e modalidades de ensino.",
    breakdown: [
      { label: "Matriculados", value: "1.104", sublabel: "88,5% do total" },
      { label: "Trancados", value: "89", sublabel: "7,1% do total" },
      { label: "Concluídos no mês", value: "32", sublabel: "2,6% do total" },
      { label: "Cancelados", value: "22", sublabel: "1,8% do total" },
      { label: "Novas matrículas (mês)", value: "47", sublabel: "crescimento de +12%" },
    ],
    byUnit: [
      { name: "Unidade Sede", value: 587, percentage: 47 },
      { name: "Filial 01", value: 389, percentage: 31 },
      { name: "Filial 02", value: 271, percentage: 22 },
    ],
    monthlyEvolution: [
      { month: "Fev", value: 1120, previousValue: 1080 },
      { month: "Mar", value: 1145, previousValue: 1120 },
      { month: "Abr", value: 1168, previousValue: 1145 },
      { month: "Mai", value: 1190, previousValue: 1168 },
      { month: "Jun", value: 1215, previousValue: 1190 },
      { month: "Jul", value: 1247, previousValue: 1215 },
    ],
    relatedMetrics: [
      { label: "Frequência Média", value: "87%", trend: "up" },
      { label: "Alunos por Turma", value: "32", trend: "neutral" },
      { label: "Taxa de Conclusão", value: "76%", trend: "up" },
      { label: "Evasão Escolar", value: "4,2%", trend: "down" },
    ],
    link: "/alunos",
    lastUpdate: "Hoje às 14:32",
  },
  professores: {
    id: "professores",
    title: "Professores Ativos",
    totalValue: "89",
    change: "+3%",
    trend: "up",
    icon: GraduationCap,
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50",
    description:
      "Corpo docente ativo composto por professores efetivos, temporários e substitutos em exercício.",
    breakdown: [
      { label: "Efetivos", value: "52", sublabel: "58,4% do total" },
      { label: "Temporários", value: "24", sublabel: "27,0% do total" },
      { label: "Substitutos", value: "13", sublabel: "14,6% do total" },
      { label: "Com Mestrado/Doutorado", value: "41", sublabel: "46,1% do total" },
      { label: "Novos contratos (mês)", value: "3", sublabel: "crescimento de +3%" },
    ],
    byUnit: [
      { name: "Unidade Sede", value: 38, percentage: 43 },
      { name: "Filial 01", value: 28, percentage: 31 },
      { name: "Filial 02", value: 23, percentage: 26 },
    ],
    monthlyEvolution: [
      { month: "Fev", value: 82, previousValue: 80 },
      { month: "Mar", value: 84, previousValue: 82 },
      { month: "Abr", value: 85, previousValue: 84 },
      { month: "Mai", value: 86, previousValue: 85 },
      { month: "Jun", value: 87, previousValue: 86 },
      { month: "Jul", value: 89, previousValue: 87 },
    ],
    relatedMetrics: [
      { label: "Carga Horária Média", value: "32h/sem", trend: "neutral" },
      { label: "Alunos por Professor", value: "14:1", trend: "up" },
      { label: "Titulação Mínima", value: "Especialização", trend: "neutral" },
      { label: "Rotatividade Anual", value: "8%", trend: "down" },
    ],
    link: "/rh/professores",
    lastUpdate: "Hoje às 14:30",
  },
  cursos: {
    id: "cursos",
    title: "Cursos Ativos",
    totalValue: "24",
    change: "0%",
    trend: "neutral",
    icon: BookOpen,
    color: "text-violet-600 bg-violet-50 dark:bg-violet-950/50",
    description:
      "Cursos técnicos e de qualificação profissional em andamento na instituição.",
    breakdown: [
      { label: "Técnicos", value: "12", sublabel: "50,0% do total" },
      { label: "Qualificação Profissional", value: "7", sublabel: "29,2% do total" },
      { label: "Extensão", value: "3", sublabel: "12,5% do total" },
      { label: "Aperfeiçoamento", value: "2", sublabel: "8,3% do total" },
      { label: "Novos cursos (ano)", value: "2", sublabel: "em implantação" },
    ],
    byUnit: [
      { name: "Unidade Sede", value: 10, percentage: 42 },
      { name: "Filial 01", value: 8, percentage: 33 },
      { name: "Filial 02", value: 6, percentage: 25 },
    ],
    monthlyEvolution: [
      { month: "Fev", value: 22, previousValue: 22 },
      { month: "Mar", value: 23, previousValue: 22 },
      { month: "Abr", value: 23, previousValue: 23 },
      { month: "Mai", value: 24, previousValue: 23 },
      { month: "Jun", value: 24, previousValue: 24 },
      { month: "Jul", value: 24, previousValue: 24 },
    ],
    relatedMetrics: [
      { label: "Disciplinas Ativas", value: "186", trend: "up" },
      { label: "Turmas em Andamento", value: "48", trend: "up" },
      { label: "Duração Média", value: "18 meses", trend: "neutral" },
      { label: "Carga Horária Total", value: "11.520h", trend: "neutral" },
    ],
    link: "/cursos",
    lastUpdate: "Hoje às 14:28",
  },
  receita: {
    id: "receita",
    title: "Receita Mensal",
    totalValue: "R$ 1.2M",
    change: "+8%",
    trend: "up",
    icon: DollarSign,
    color: "text-amber-600 bg-amber-50 dark:bg-amber-950/50",
    description:
      "Receita bruta mensal consolidada de todas as unidades, incluindo mensalidades, convênios e projetos.",
    breakdown: [
      { label: "Mensalidades", value: "R$ 720K", sublabel: "60,0% da receita" },
      { label: "Convênios", value: "R$ 288K", sublabel: "24,0% da receita" },
      { label: "Projetos", value: "R$ 120K", sublabel: "10,0% da receita" },
      { label: "Outros", value: "R$ 72K", sublabel: "6,0% da receita" },
      { label: "Receita Líquida", value: "R$ 980K", sublabel: "margem de 81,7%" },
    ],
    byUnit: [
      { name: "Unidade Sede", value: 580, percentage: 48 },
      { name: "Filial 01", value: 390, percentage: 32 },
      { name: "Filial 02", value: 270, percentage: 22 },
    ],
    monthlyEvolution: [
      { month: "Fev", value: 1050, previousValue: 1020 },
      { month: "Mar", value: 1080, previousValue: 1050 },
      { month: "Abr", value: 1110, previousValue: 1080 },
      { month: "Mai", value: 1140, previousValue: 1110 },
      { month: "Jun", value: 1170, previousValue: 1140 },
      { month: "Jul", value: 1240, previousValue: 1170 },
    ],
    relatedMetrics: [
      { label: "Ticket Médio", value: "R$ 962", trend: "up" },
      { label: "Inadimplência", value: "5,8%", trend: "down" },
      { label: "Despesas Mensais", value: "R$ 860K", trend: "up" },
      { label: "Margem Líquida", value: "31,7%", trend: "up" },
    ],
    link: "/financeiro",
    lastUpdate: "Hoje às 14:35",
  },
};
