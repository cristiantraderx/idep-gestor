import { useState } from "react";
import {
  BarChart3,
  Download,
  FileText,
  CalendarDays,
  Loader2,
  Building2,
  GraduationCap,
  DollarSign,
  Users,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";


type ReportType = {
  id: string;
  title: string;
  description: string;
  category: "academico" | "financeiro" | "rh" | "patrimonio" | "ouvidoria";
  icon: LucideIcon;
  color: string;
  formats: ("pdf" | "excel" | "csv")[];
};

const REPORT_TYPES: ReportType[] = [
  { id: "alunos", title: "Relatório de Alunos", description: "Listagem completa de alunos com dados cadastrais e status", category: "academico", icon: Users, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50", formats: ["pdf", "excel", "csv"] },
  { id: "matriculas", title: "Relatório de Matrículas", description: "Matrículas por curso, turma e período letivo", category: "academico", icon: GraduationCap, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50", formats: ["pdf", "excel"] },
  { id: "desempenho", title: "Relatório de Desempenho", description: "Notas, frequência e rendimento acadêmico por turma", category: "academico", icon: TrendingUp, color: "text-violet-600 bg-violet-50 dark:bg-violet-950/50", formats: ["pdf", "excel"] },
  { id: "receitas", title: "Relatório de Receitas", description: "Receitas por período, categoria e unidade", category: "financeiro", icon: DollarSign, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50", formats: ["pdf", "excel", "csv"] },
  { id: "despesas", title: "Relatório de Despesas", description: "Despesas por categoria, centro de custo e unidade", category: "financeiro", icon: DollarSign, color: "text-red-600 bg-red-50 dark:bg-red-950/50", formats: ["pdf", "excel", "csv"] },
  { id: "fluxo", title: "Relatório de Fluxo de Caixa", description: "Fluxo financeiro consolidado com saldos mensais", category: "financeiro", icon: BarChart3, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/50", formats: ["pdf", "excel"] },
  { id: "servidores", title: "Relatório de Servidores", description: "Servidores ativos por cargo, setor e regime", category: "rh", icon: Users, color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/50", formats: ["pdf", "excel"] },
  { id: "ferias", title: "Relatório de Férias", description: "Férias agendadas, em andamento e concluídas", category: "rh", icon: CalendarDays, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/50", formats: ["pdf", "excel"] },
  { id: "bens", title: "Relatório de Bens Patrimoniais", description: "Inventário de bens por categoria e localização", category: "patrimonio", icon: Building2, color: "text-slate-600 bg-slate-50 dark:bg-slate-950/50", formats: ["pdf", "excel", "csv"] },
  { id: "ouvidoria", title: "Relatório da Ouvidoria", description: "Manifestações por tipo, status e período", category: "ouvidoria", icon: BarChart3, color: "text-purple-600 bg-purple-50 dark:bg-purple-950/50", formats: ["pdf", "excel"] },
];

const CATEGORIES = [
  { value: "todas", label: "Todas as categorias" },
  { value: "academico", label: "Acadêmico" },
  { value: "financeiro", label: "Financeiro" },
  { value: "rh", label: "Recursos Humanos" },
  { value: "patrimonio", label: "Patrimônio" },
  { value: "ouvidoria", label: "Ouvidoria" },
];

export function RelatoriosPage() {
  const [categoryFilter, setCategoryFilter] = useState("todas");
  const [generating, setGenerating] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState("30");

  const filtered = REPORT_TYPES.filter((r) => categoryFilter === "todas" || r.category === categoryFilter);

  const handleGenerate = (id: string) => {
    setGenerating(id);
    setTimeout(() => setGenerating(null), 1500);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="rounded-xl p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="page-title">Relatórios</h2>
            <p className="page-subtitle mt-1">Gere relatórios personalizados em PDF, Excel ou CSV</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select value={periodo} onChange={(e) => setPeriodo(e.target.value)}
            className="h-7 rounded-lg border border-input bg-background px-2 text-[10px] font-medium text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="7">Últimos 7 dias</option>
            <option value="30">Último mês</option>
            <option value="90">Últimos 3 meses</option>
            <option value="180">Últimos 6 meses</option>
            <option value="365">Último ano</option>
            <option value="0">Todo período</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button key={cat.value} onClick={() => setCategoryFilter(cat.value)}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors ${
              categoryFilter === cat.value
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}>
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((report) => (
          <Card key={report.id} className="group hover:shadow-md transition-all duration-200">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`rounded-lg p-2.5 ${report.color} group-hover:scale-110 transition-transform`}>
                  <report.icon className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="text-[9px] capitalize">
                  {report.category}
                </Badge>
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{report.title}</h3>
              <p className="text-[11px] text-muted-foreground mb-4">{report.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {report.formats.includes("pdf") && (
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300">
                      PDF
                    </span>
                  )}
                  {report.formats.includes("excel") && (
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                      XLSX
                    </span>
                  )}
                  {report.formats.includes("csv") && (
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                      CSV
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 h-7 text-[10px]"
                  onClick={() => handleGenerate(report.id)}
                  disabled={generating === report.id}
                >
                  {generating === report.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Download className="h-3 w-3" />
                  )}
                  {generating === report.id ? "Gerando..." : "Gerar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Relatórios Recentes</CardTitle>
          <CardDescription>Últimos relatórios gerados pelo sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { name: "Relatório de Matrículas", date: "15/07/2026", format: "PDF", size: "2.4 MB" },
              { name: "Relatório de Receitas", date: "14/07/2026", format: "XLSX", size: "1.8 MB" },
              { name: "Relatório de Servidores", date: "10/07/2026", format: "PDF", size: "3.1 MB" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg p-1.5 bg-muted">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground">{item.date} · {item.size}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px]">{item.format}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}