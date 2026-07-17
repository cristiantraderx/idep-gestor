import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Grid3X3,
  GraduationCap,
  BookOpen,
  Clock,
  Layers,
  Loader2,
  RefreshCw,
  Plus,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { Curso, Disciplina } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function MatrizCurricularPage() {
  const navigate = useNavigate();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [selectedCursoId, setSelectedCursoId] = useState("");
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDisc, setLoadingDisc] = useState(false);

  const fetchCursos = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("cursos")
        .select("*")
        .eq("ativo", true)
        .order("nome");

      if (data) {
        setCursos(data);
        if (data.length > 0 && !selectedCursoId) {
          setSelectedCursoId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar cursos:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedCursoId]);

  const fetchDisciplinas = useCallback(async (cursoId: string) => {
    if (!cursoId) return;
    setLoadingDisc(true);
    try {
      const { data } = await supabase
        .from("disciplinas")
        .select("*")
        .eq("curso_id", cursoId)
        .order("semestre", { ascending: true })
        .order("nome");

      if (data) setDisciplinas(data);
    } catch (err) {
      console.error("Erro ao carregar disciplinas:", err);
    } finally {
      setLoadingDisc(false);
    }
  }, []);

  useEffect(() => {
    fetchCursos();
  }, []);

  useEffect(() => {
    if (selectedCursoId) {
      fetchDisciplinas(selectedCursoId);
    }
  }, [selectedCursoId, fetchDisciplinas]);

  const selectedCurso = cursos.find((c) => c.id === selectedCursoId);
  const cursoOptions = cursos.map((c) => ({ value: c.id, label: c.nome }));

  // Group disciplines by semester
  const maxSemester = selectedCurso?.duracao_semestres || Math.max(...disciplinas.map((d) => d.semestre || 0), 0);
  const semestersMap: Record<number, Disciplina[]> = {};

  for (let i = 1; i <= maxSemester; i++) {
    semestersMap[i] = disciplinas.filter((d) => d.semestre === i);
  }

  // Also include any disciplines without a semester
  const noSemester = disciplinas.filter((d) => !d.semestre);

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
            <Grid3X3 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="page-title">Matriz Curricular</h2>
            <p className="page-subtitle mt-1">
              Visualize a estrutura curricular organizada por semestre
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => navigate("/cursos/disciplinas")}
        >
          <Plus className="h-4 w-4" />
          Gerenciar Disciplinas
        </Button>
      </div>

      {/* Course selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">Selecione o curso:</span>
            </div>
            <div className="flex-1 max-w-sm">
              <Select
                options={cursoOptions}
                placeholder="Carregando cursos..."
                value={selectedCursoId}
                onChange={(e) => setSelectedCursoId(e.target.value)}
              />
            </div>
            <Button variant="ghost" size="icon-sm" onClick={() => selectedCursoId && fetchDisciplinas(selectedCursoId)} title="Recarregar">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Course info */}
      {selectedCurso && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  {selectedCurso.nome}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {selectedCurso.descricao || `${selectedCurso.duracao_semestres || "?"} semestres · ${selectedCurso.carga_horaria || "?"}h · ${disciplinas.length} disciplinas`}
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px] gap-1">
                <Layers className="h-3 w-3" />
                {maxSemester} semestres
              </Badge>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Curriculum Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !selectedCursoId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <GraduationCap className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-foreground">Selecione um curso</p>
            <p className="text-xs text-muted-foreground mt-1">
              Escolha um curso acima para visualizar sua matriz curricular
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {loadingDisc ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : disciplinas.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <BookOpen className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm font-medium text-foreground">
                  Nenhuma disciplina cadastrada
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Adicione disciplinas ao curso para visualizar a matriz curricular
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 gap-2"
                  onClick={() => navigate("/cursos/disciplinas")}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar Disciplinas
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Object.entries(semestersMap).map(([semesterStr, discs]) => (
                <Card key={semesterStr} className="h-full">
                  <CardHeader className={cn(
                    "pb-3 border-b border-border",
                    parseInt(semesterStr) === 1 ? "bg-blue-50 dark:bg-blue-950/30" :
                    parseInt(semesterStr) === 2 ? "bg-emerald-50 dark:bg-emerald-950/30" :
                    parseInt(semesterStr) === 3 ? "bg-amber-50 dark:bg-amber-950/30" :
                    parseInt(semesterStr) === 4 ? "bg-violet-50 dark:bg-violet-950/30" :
                    "bg-muted/30"
                  )}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className={cn(
                          "h-4 w-4",
                          parseInt(semesterStr) === 1 ? "text-blue-600" :
                          parseInt(semesterStr) === 2 ? "text-emerald-600" :
                          parseInt(semesterStr) === 3 ? "text-amber-600" :
                          parseInt(semesterStr) === 4 ? "text-violet-600" :
                          "text-muted-foreground"
                        )} />
                        <CardTitle className="text-xs font-bold uppercase tracking-wider">
                          {parseInt(semesterStr)}º Semestre
                        </CardTitle>
                      </div>
                      <Badge variant="outline" className="text-[9px]">
                        {discs.length} {discs.length === 1 ? "disc." : "discs."}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 space-y-2">
                    {discs.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground text-center py-4">
                        Nenhuma disciplina
                      </p>
                    ) : (
                      discs.map((disc) => (
                        <div
                          key={disc.id}
                          className={cn(
                            "rounded-lg border border-border p-3 space-y-1.5 transition-colors hover:bg-accent/30",
                            !disc.ativo && "opacity-50"
                          )}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <p className="text-[11px] font-medium text-foreground leading-tight">
                              {disc.nome}
                            </p>
                            <Badge
                              variant={disc.ativo ? "success" : "destructive"}
                              className="text-[8px] px-1 py-0 h-3.5 shrink-0 mt-0.5"
                            >
                              {disc.ativo ? "A" : "I"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                            {disc.codigo && (
                              <span className="font-mono">#{disc.codigo}</span>
                            )}
                            {disc.carga_horaria && (
                              <span className="flex items-center gap-0.5">
                                <Clock className="h-2.5 w-2.5" />
                                {disc.carga_horaria}h
                              </span>
                            )}
                          </div>
                          {disc.ementa && (
                            <p className="text-[9px] text-muted-foreground leading-tight line-clamp-2">
                              {disc.ementa}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Disciplinas without semester */}
          {noSemester.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Sem semestre definido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {noSemester.map((disc) => (
                    <Badge key={disc.id} variant="outline" className="text-[10px] gap-1">
                      <BookOpen className="h-3 w-3" />
                      {disc.nome}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span><strong className="text-foreground">{disciplinas.length}</strong> disciplinas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    <strong className="text-foreground">
                      {disciplinas.reduce((sum, d) => sum + (d.carga_horaria || 0), 0)}
                    </strong> horas totais
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  <span><strong className="text-foreground">{maxSemester}</strong> semestres</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  <span>
                    Média de <strong className="text-foreground">
                      {maxSemester > 0 ? (disciplinas.length / maxSemester).toFixed(1) : "0"}
                    </strong> disciplinas/semestre
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </motion.div>
  );
}
