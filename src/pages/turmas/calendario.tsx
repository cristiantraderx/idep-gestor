import { useState, useEffect, useCallback } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  MapPin,
  Clock,
  Users,
  GraduationCap,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { Turma } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const turnoLabels: Record<string, string> = {
  matutino: "Matutino",
  vespertino: "Vespertino",
  noturno: "Noturno",
  integral: "Integral",
};

export function CalendarioPage() {
  const [turmas, setTurmas] = useState<(Turma & { curso_nome?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("turmas")
        .select("*, cursos(nome)")
        .eq("ativo", true)
        .order("data_inicio", { ascending: true });

      if (data) {
        setTurmas(
          (data as any[]).map((t) => ({
            ...t,
            curso_nome: t.cursos?.nome || "Curso não encontrado",
          }))
        );
      }
    } catch (err) {
      console.error("Erro ao carregar turmas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredTurmas = turmas.filter((t) => {
    if (!t.data_inicio) return false;
    const startDate = new Date(t.data_inicio);
    return startDate.getFullYear() === currentYear && startDate.getMonth() === selectedMonth;
  });

  const activeTurmas = turmas.filter((t) => {
    if (!t.data_inicio) return false;
    const startDate = new Date(t.data_inicio);
    return startDate.getFullYear() === currentYear;
  });

  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  // Stats
  const totalAtivas = activeTurmas.length;
  const totalVagas = activeTurmas.reduce((acc, t) => acc + (t.vagas || 0), 0);
  const monthlyCount = filteredTurmas.length;

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
            <CalendarDays className="h-6 w-6" />
          </div>
          <div>
            <h2 className="page-title">Calendário Acadêmico</h2>
            <p className="page-subtitle mt-1">
              Visualize as turmas em andamento por mês e período letivo
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={fetchData}>
          <RefreshCw className="h-3.5 w-3.5" />
          Atualizar
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="stats-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Turmas em {currentYear}</p>
                <p className="text-2xl font-bold text-foreground">{totalAtivas}</p>
              </div>
              <div className="rounded-lg p-2.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600">
                <BookOpen className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stats-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Total de Vagas</p>
                <p className="text-2xl font-bold text-foreground">{totalVagas}</p>
              </div>
              <div className="rounded-lg p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stats-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Turmas em {MONTHS[selectedMonth]}</p>
                <p className="text-2xl font-bold text-foreground">{monthlyCount}</p>
              </div>
              <div className="rounded-lg p-2.5 bg-violet-50 dark:bg-violet-950/50 text-violet-600">
                <CalendarDays className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Month Navigator */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon-sm" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">
                {MONTHS[selectedMonth]} {currentYear}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {monthlyCount} turma{monthlyCount !== 1 ? "s" : ""} iniciando neste mês
              </p>
            </div>
            <Button variant="outline" size="icon-sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Turmas List for selected month */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            Turmas com início em {MONTHS[selectedMonth]} de {currentYear}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTurmas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CalendarDays className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-foreground">
                Nenhuma turma iniciando neste mês
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Navegue pelos meses para ver as turmas de outros períodos
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredTurmas.map((turma, index) => {
                const startDate = turma.data_inicio ? new Date(turma.data_inicio) : null;
                const endDate = turma.data_fim ? new Date(turma.data_fim) : null;

                return (
                  <motion.div
                    key={turma.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-4 hover:bg-accent/30 transition-colors"
                  >
                    {/* Date indicator */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex flex-col items-center rounded-lg border border-border bg-muted/50 px-3 py-1.5 min-w-[56px]">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase leading-tight">
                          {startDate ? MONTHS[startDate.getMonth()].slice(0, 3) : "---"}
                        </span>
                        <span className="text-lg font-bold text-foreground leading-tight">
                          {startDate ? startDate.getDate() : "--"}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">
                          {turma.nome}
                        </p>
                        {turma.codigo && (
                          <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                            #{turma.codigo}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-0.5">
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <GraduationCap className="h-3 w-3" />
                          {turma.curso_nome}
                        </span>
                        {turma.turno && (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {turnoLabels[turma.turno]}
                          </span>
                        )}
                        {turma.sala && (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            Sala {turma.sala}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {turma.vagas} vagas
                        </span>
                      </div>
                    </div>

                    {/* Period badge */}
                    {startDate && endDate && (
                      <div className="shrink-0">
                        <Badge variant="secondary" className="text-[10px] whitespace-nowrap">
                          {startDate.toLocaleDateString("pt-BR")} — {endDate.toLocaleDateString("pt-BR")}
                        </Badge>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Year overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            Visão Geral do Ano — {currentYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {MONTHS.map((month, idx) => {
              const count = turmas.filter((t) => {
                if (!t.data_inicio) return false;
                const d = new Date(t.data_inicio);
                return d.getFullYear() === currentYear && d.getMonth() === idx;
              }).length;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedMonth(idx)}
                  className={cn(
                    "rounded-lg border border-border p-3 text-center transition-all duration-200 hover:shadow-sm",
                    selectedMonth === idx
                      ? "bg-idep-700 text-white border-idep-700"
                      : count > 0
                      ? "bg-muted/50 hover:bg-accent"
                      : "bg-background opacity-50"
                  )}
                >
                  <p className={cn(
                    "text-xs font-semibold",
                    selectedMonth === idx ? "text-white" : "text-foreground"
                  )}>
                    {month.slice(0, 3)}
                  </p>
                  <p className={cn(
                    "text-lg font-bold",
                    selectedMonth === idx ? "text-white" : "text-foreground"
                  )}>
                    {count}
                  </p>
                  <p className={cn(
                    "text-[9px]",
                    selectedMonth === idx ? "text-white/70" : "text-muted-foreground"
                  )}>
                    turmas
                  </p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
