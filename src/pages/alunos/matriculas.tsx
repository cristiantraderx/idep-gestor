import { useState, useEffect, useCallback } from "react";
import {
  BookMarked,
  Plus,
  Search,
  Loader2,
  RefreshCw,
  FileText,
  User,
  GraduationCap,
  CalendarDays,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { Matricula, Aluno, Curso, Turma } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn, formatFullDate } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "ativo", label: "Ativo" },
  { value: "trancado", label: "Trancado" },
  { value: "concluido", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" },
  { value: "transferido", label: "Transferido" },
];

const FORMA_INGRESSO_OPTIONS = [
  { value: "vestibular", label: "Vestibular" },
  { value: "enem", label: "ENEM" },
  { value: "transferencia", label: "Transferência" },
  { value: "portador_diploma", label: "Portador de Diploma" },
  { value: "reingresso", label: "Reingresso" },
];

const statusVariant: Record<string, "success" | "warning" | "default" | "destructive" | "secondary"> = {
  ativo: "success",
  trancado: "warning",
  concluido: "default",
  cancelado: "destructive",
  transferido: "secondary",
};

export function MatriculasPage() {
  const [matriculas, setMatriculas] = useState<(Matricula & { aluno_nome?: string; curso_nome?: string; turma_nome?: string })[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todas");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMatricula, setEditingMatricula] = useState<(Matricula & { aluno_nome?: string; curso_nome?: string; turma_nome?: string }) | null>(null);
  const [formData, setFormData] = useState({
    aluno_id: "",
    curso_id: "",
    turma_id: "",
    data_matricula: new Date().toISOString().split("T")[0],
    status: "ativo" as string,
    forma_ingresso: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [matriculasRes, alunosRes, cursosRes, turmasRes] = await Promise.all([
        supabase
          .from("matriculas")
          .select("*, alunos(nome), cursos(nome), turmas(nome, codigo)")
          .order("created_at", { ascending: false }),
        supabase.from("alunos").select("*").eq("ativo", true).order("nome"),
        supabase.from("cursos").select("*").eq("ativo", true).order("nome"),
        supabase.from("turmas").select("*").eq("ativo", true).order("nome"),
      ]);

      if (matriculasRes.data) {
        setMatriculas(
          (matriculasRes.data as any[]).map((m) => ({
            ...m,
            aluno_nome: m.alunos?.nome || "Aluno não encontrado",
            curso_nome: m.cursos?.nome || "Curso não encontrado",
            turma_nome: m.turmas ? `${m.turmas.nome}${m.turmas.codigo ? ` (${m.turmas.codigo})` : ""}` : "Turma não encontrada",
          }))
        );
      }
      if (alunosRes.data) setAlunos(alunosRes.data);
      if (cursosRes.data) setCursos(cursosRes.data);
      if (turmasRes.data) setTurmas(turmasRes.data);
    } catch (err) {
      console.error("Erro ao carregar matrículas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const alunoOptions = alunos.map((a) => ({ value: a.id, label: a.nome }));
  const cursoOptions = cursos.map((c) => ({ value: c.id, label: c.nome }));
  const turmaOptions = turmas.map((t) => ({
    value: t.id,
    label: `${t.nome}${t.codigo ? ` (${t.codigo})` : ""}`,
  }));

  const openCreateModal = () => {
    setEditingMatricula(null);
    setFormData({
      aluno_id: "",
      curso_id: "",
      turma_id: "",
      data_matricula: new Date().toISOString().split("T")[0],
      status: "ativo",
      forma_ingresso: "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSave = async () => {
    setFormError("");
    if (!formData.aluno_id || !formData.curso_id || !formData.turma_id) {
      setFormError("Preencha todos os campos obrigatórios.");
      return;
    }

    setSaving(true);
    try {
      if (editingMatricula) {
        const { error } = await supabase
          .from("matriculas")
          .update({
            status: formData.status,
            forma_ingresso: formData.forma_ingresso || null,
            data_matricula: formData.data_matricula,
          })
          .eq("id", editingMatricula.id);

        if (error) {
          setFormError(error.message);
          return;
        }
      } else {
        const { data: aluno } = await supabase
          .from("alunos")
          .select("unidade_id")
          .eq("id", formData.aluno_id)
          .single();

        const { error } = await supabase.from("matriculas").insert({
          aluno_id: formData.aluno_id,
          curso_id: formData.curso_id,
          turma_id: formData.turma_id,
          unidade_id: aluno?.unidade_id || "",
          data_matricula: formData.data_matricula,
          status: formData.status as Matricula["status"],
          forma_ingresso: formData.forma_ingresso || null,
          numero: `MAT-${Date.now().toString(36).toUpperCase()}`,
        });

        if (error) {
          setFormError(error.message);
          return;
        }
      }

      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || "Erro ao salvar matrícula");
    } finally {
      setSaving(false);
    }
  };

  const filtered = matriculas.filter((m) => {
    const matchesSearch =
      (m.aluno_nome || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.curso_nome || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.numero || "").toLowerCase().includes(search.toLowerCase());
    if (statusFilter === "todas") return matchesSearch;
    return matchesSearch && m.status === statusFilter;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="rounded-xl p-3 bg-violet-50 dark:bg-violet-950/50 text-violet-600">
            <BookMarked className="h-6 w-6" />
          </div>
          <div>
            <h2 className="page-title">Matrículas</h2>
            <p className="page-subtitle mt-1">
              Gerencie as matrículas dos alunos nos cursos e turmas
            </p>
          </div>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Matrícula
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por aluno, curso ou número..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { value: "todas", label: "Todas" },
                { value: "ativo", label: "Ativas" },
                { value: "concluido", label: "Concluídas" },
                { value: "trancado", label: "Trancadas" },
                { value: "cancelado", label: "Canceladas" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  className={cn(
                    "rounded-full px-3 py-1 text-[11px] font-medium transition-all",
                    statusFilter === opt.value
                      ? "bg-idep-700 text-white"
                      : "bg-muted text-muted-foreground hover:text-foreground border border-border"
                  )}
                >
                  {opt.label}
                </button>
              ))}
              <Button variant="ghost" size="icon-sm" onClick={fetchData} title="Recarregar">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BookMarked className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-foreground">
                Nenhuma matrícula encontrada
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Clique em "Nova Matrícula" para matricular um aluno
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((matricula, index) => (
                <motion.div
                  key={matricula.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="group flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-4 hover:bg-accent/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <p className="text-sm font-medium text-foreground">
                        {matricula.aluno_nome}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1">
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <GraduationCap className="h-3 w-3" />
                        {matricula.curso_nome}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Turma: {matricula.turma_nome}
                      </span>
                      {matricula.numero && (
                        <span className="text-[11px] text-muted-foreground font-mono">
                          #{matricula.numero}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        {formatFullDate(matricula.data_matricula)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={statusVariant[matricula.status] || "default"}
                      className="text-[10px]"
                    >
                      {STATUS_OPTIONS.find((s) => s.value === matricula.status)?.label || matricula.status}
                    </Badge>
                    <button
                      onClick={() => {
                        setEditingMatricula(matricula);
                        setFormData({
                          aluno_id: matricula.aluno_id,
                          curso_id: matricula.curso_id,
                          turma_id: matricula.turma_id,
                          data_matricula: matricula.data_matricula.split("T")[0],
                          status: matricula.status,
                          forma_ingresso: matricula.forma_ingresso || "",
                        });
                        setFormError("");
                        setModalOpen(true);
                      }}
                      className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors opacity-0 group-hover:opacity-100"
                      title="Alterar status"
                    >
                      <FileText className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingMatricula ? "Alterar Matrícula" : "Nova Matrícula"}
        description={editingMatricula ? `Alterando status de: ${editingMatricula.aluno_nome || ""}` : "Matricule um aluno em um curso e turma"}
        size="lg"
      >
        <div className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {formError}
            </div>
          )}

          {editingMatricula ? (
            <>
              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <p className="text-sm text-foreground"><strong>Aluno:</strong> {editingMatricula.aluno_nome}</p>
                <p className="text-sm text-foreground"><strong>Curso:</strong> {editingMatricula.curso_nome}</p>
                <p className="text-sm text-foreground"><strong>Turma:</strong> {editingMatricula.turma_nome}</p>
              </div>
              <Select
                label="Status *"
                options={STATUS_OPTIONS}
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                disabled={saving}
              />
              <Input
                label="Data da matrícula"
                type="date"
                value={formData.data_matricula}
                onChange={(e) => setFormData({ ...formData, data_matricula: e.target.value })}
                disabled={saving}
              />
            </>
          ) : (
            <>
              <Select
                label="Aluno *"
                options={alunoOptions}
                placeholder="Selecione um aluno"
                value={formData.aluno_id}
                onChange={(e) => setFormData({ ...formData, aluno_id: e.target.value })}
                disabled={saving}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Curso *"
                  options={cursoOptions}
                  placeholder="Selecione um curso"
                  value={formData.curso_id}
                  onChange={(e) => setFormData({ ...formData, curso_id: e.target.value })}
                  disabled={saving}
                />
                <Select
                  label="Turma *"
                  options={turmaOptions}
                  placeholder="Selecione uma turma"
                  value={formData.turma_id}
                  onChange={(e) => setFormData({ ...formData, turma_id: e.target.value })}
                  disabled={saving}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Data da matrícula *"
                  type="date"
                  value={formData.data_matricula}
                  onChange={(e) => setFormData({ ...formData, data_matricula: e.target.value })}
                  disabled={saving}
                />
                <Select
                  label="Forma de ingresso"
                  options={FORMA_INGRESSO_OPTIONS}
                  placeholder="Selecione..."
                  value={formData.forma_ingresso}
                  onChange={(e) => setFormData({ ...formData, forma_ingresso: e.target.value })}
                  disabled={saving}
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingMatricula ? "Salvar alterações" : "Realizar matrícula"}
            </Button>
          </DialogFooter>
        </div>
      </Dialog>
    </motion.div>
  );
}
