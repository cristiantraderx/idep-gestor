import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Plus,
  Search,
  Loader2,
  Edit3,
  Trash2,
  RefreshCw,
  CalendarDays,
  GraduationCap,
  Users,
  MapPin,
  Clock,
  Layers,
  Building2,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { Turma, Curso, Unidade } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn, formatFullDate } from "@/lib/utils";

const TURNO_OPTIONS = [
  { value: "matutino", label: "Matutino" },
  { value: "vespertino", label: "Vespertino" },
  { value: "noturno", label: "Noturno" },
  { value: "integral", label: "Integral" },
];

const turnoColors: Record<string, string> = {
  matutino: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  vespertino: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  noturno: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300",
  integral: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
};

const turnoLabels: Record<string, string> = {
  matutino: "Matutino",
  vespertino: "Vespertino",
  noturno: "Noturno",
  integral: "Integral",
};

export function TurmasListPage() {
  const navigate = useNavigate();
  const [turmas, setTurmas] = useState<
    (Turma & { curso_nome?: string; unidade_nome?: string; alunos_count?: number })[]
  >([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todas" | "ativas" | "inativas">("ativas");
  const [turnoFilter, setTurnoFilter] = useState<string>("todos");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTurma, setEditingTurma] = useState<Turma | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    codigo: "",
    curso_id: "",
    turno: "matutino" as Turma["turno"],
    sala: "",
    vagas: "",
    data_inicio: "",
    data_fim: "",
    semestre: "",
    ano: new Date().getFullYear().toString(),
    unidade_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Detail modal
  const [detailTurma, setDetailTurma] = useState<(Turma & { curso_nome?: string; unidade_nome?: string }) | null>(null);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [turmasRes, cursosRes, unidadesRes] = await Promise.all([
        supabase
          .from("turmas")
          .select("*, cursos(nome), unidades(nome, sigla)")
          .order("created_at", { ascending: false }),
        supabase.from("cursos").select("*").eq("ativo", true).order("nome"),
        supabase.from("unidades").select("*").eq("ativo", true).order("nome"),
      ]);

      if (turmasRes.data) {
        const turmasWithCounts = await Promise.all(
          (turmasRes.data as any[]).map(async (t) => {
            const { count } = await supabase
              .from("matriculas")
              .select("*", { count: "exact", head: true })
              .eq("turma_id", t.id)
              .eq("status", "ativo");
            return {
              ...t,
              curso_nome: t.cursos?.nome || "Curso não encontrado",
              unidade_nome: t.unidades?.nome || "Não definida",
              alunos_count: count || 0,
            };
          })
        );
        setTurmas(turmasWithCounts);
      }
      if (cursosRes.data) setCursos(cursosRes.data);
      if (unidadesRes.data) setUnidades(unidadesRes.data);
    } catch (err) {
      console.error("Erro ao carregar turmas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const cursoOptions = cursos.map((c) => ({ value: c.id, label: `${c.nome}${c.codigo ? ` (${c.codigo})` : ""}` }));
  const unidadeOptions = unidades.map((u) => ({ value: u.id, label: `${u.nome} (${u.sigla})` }));

  const openCreateModal = () => {
    setEditingTurma(null);
    setFormData({
      nome: "",
      codigo: "",
      curso_id: "",
      turno: "matutino",
      sala: "",
      vagas: "",
      data_inicio: "",
      data_fim: "",
      semestre: "",
      ano: new Date().getFullYear().toString(),
      unidade_id: "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (turma: Turma) => {
    setEditingTurma(turma);
    setFormData({
      nome: turma.nome,
      codigo: turma.codigo || "",
      curso_id: turma.curso_id,
      turno: turma.turno || "matutino",
      sala: turma.sala || "",
      vagas: turma.vagas.toString(),
      data_inicio: turma.data_inicio?.split("T")[0] || "",
      data_fim: turma.data_fim?.split("T")[0] || "",
      semestre: turma.semestre || "",
      ano: turma.ano?.toString() || new Date().getFullYear().toString(),
      unidade_id: turma.unidade_id,
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSave = async () => {
    setFormError("");
    if (!formData.nome.trim() || !formData.curso_id || !formData.unidade_id) {
      setFormError("Nome, curso e unidade são obrigatórios.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nome: formData.nome,
        codigo: formData.codigo || null,
        curso_id: formData.curso_id,
        turno: formData.turno,
        sala: formData.sala || null,
        vagas: parseInt(formData.vagas) || 0,
        data_inicio: formData.data_inicio || null,
        data_fim: formData.data_fim || null,
        semestre: formData.semestre || null,
        ano: formData.ano ? parseInt(formData.ano) : null,
        unidade_id: formData.unidade_id,
      };

      if (editingTurma) {
        const { error } = await supabase
          .from("turmas")
          .update(payload)
          .eq("id", editingTurma.id);

        if (error) {
          setFormError(error.message);
          return;
        }
      } else {
        const { error } = await supabase.from("turmas").insert(payload);
        if (error) {
          setFormError(error.message);
          return;
        }
      }

      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || "Erro ao salvar turma");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("turmas").delete().eq("id", id);
    if (!error) {
      setTurmas((prev) => prev.filter((t) => t.id !== id));
      setDeleteConfirm(null);
    }
  };

  // Filter
  const filtered = turmas.filter((t) => {
    const matchesSearch =
      t.nome.toLowerCase().includes(search.toLowerCase()) ||
      (t.codigo && t.codigo.toLowerCase().includes(search.toLowerCase())) ||
      (t.curso_nome || "").toLowerCase().includes(search.toLowerCase());
    if (statusFilter === "ativas") return matchesSearch && t.ativo;
    if (statusFilter === "inativas") return matchesSearch && !t.ativo;
    if (turnoFilter !== "todos") return matchesSearch && t.turno === turnoFilter;
    return matchesSearch;
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
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h2 className="page-title">Turmas</h2>
            <p className="page-subtitle mt-1">
              Gerencie as turmas, alocação de professores e calendário acadêmico
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => navigate("/turmas/calendario")}
          >
            <CalendarDays className="h-4 w-4" />
            Calendário
          </Button>
          <Button onClick={openCreateModal} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Turma
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nome, código ou curso..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {(["todas", "ativas", "inativas"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setStatusFilter(opt)}
                  className={cn(
                    "rounded-full px-3 py-1 text-[11px] font-medium transition-all",
                    statusFilter === opt
                      ? "bg-idep-700 text-white"
                      : "bg-muted text-muted-foreground hover:text-foreground border border-border"
                  )}
                >
                  {opt === "todas" ? "Todas" : opt === "ativas" ? "Ativas" : "Inativas"}
                </button>
              ))}
              <select
                value={turnoFilter}
                onChange={(e) => setTurnoFilter(e.target.value)}
                className="h-7 rounded-lg border border-input bg-background px-2 text-[10px] font-medium text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="todos">Todos os turnos</option>
                {TURNO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <Button variant="ghost" size="icon-sm" onClick={fetchData} title="Recarregar">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {filtered.length} turma{filtered.length !== 1 ? "s" : ""}
              </span>
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
              <BookOpen className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-foreground">
                {search ? "Nenhuma turma encontrada" : "Nenhuma turma cadastrada"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {search ? "Tente alterar os termos da busca" : "Clique em \"Nova Turma\" para cadastrar"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((turma, index) => (
                <motion.div
                  key={turma.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={cn(
                    "group flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-4 hover:bg-accent/30 transition-colors cursor-pointer",
                    !turma.ativo && "opacity-60"
                  )}
                  onClick={() => setDetailTurma(turma)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="rounded-lg p-2 bg-violet-50 dark:bg-violet-950/50 shrink-0">
                      <BookOpen className="h-5 w-5 text-violet-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">
                          {turma.nome}
                        </p>
                        {turma.codigo && (
                          <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                            #{turma.codigo}
                          </span>
                        )}
                        <Badge
                          variant={turma.ativo ? "success" : "destructive"}
                          className="text-[9px] px-1.5 py-0 h-4"
                        >
                          {turma.ativo ? "Ativa" : "Inativa"}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-0.5">
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <GraduationCap className="h-3 w-3" />
                          {turma.curso_nome}
                        </span>
                        {turma.turno && (
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${turnoColors[turma.turno]}`}>
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
                          {turma.alunos_count}/{turma.vagas} vagas
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => navigate("/cursos/disciplinas")}
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      Disciplinas
                    </Button>
                    <button
                      onClick={() => openEditModal(turma)}
                      className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      title="Editar"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(turma.id)}
                      className="rounded p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
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
        title={editingTurma ? "Editar Turma" : "Nova Turma"}
        description={editingTurma ? `Editando: ${editingTurma.nome}` : "Preencha os dados da turma"}
        size="xl"
      >
        <div className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nome da turma *"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Técnico em Enfermagem 2024.A"
              disabled={saving}
            />
            <Input
              label="Código"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              placeholder="Ex: TEC-ENF-24A"
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Curso *"
              options={cursoOptions}
              placeholder="Selecione o curso"
              value={formData.curso_id}
              onChange={(e) => setFormData({ ...formData, curso_id: e.target.value })}
              disabled={saving}
            />
            <Select
              label="Unidade *"
              options={unidadeOptions}
              placeholder="Selecione a unidade"
              value={formData.unidade_id}
              onChange={(e) => setFormData({ ...formData, unidade_id: e.target.value })}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Turno *"
              options={TURNO_OPTIONS}
              value={formData.turno || "matutino"}
              onChange={(e) => setFormData({ ...formData, turno: e.target.value as Turma["turno"] })}
              disabled={saving}
            />
            <Input
              label="Sala"
              value={formData.sala}
              onChange={(e) => setFormData({ ...formData, sala: e.target.value })}
              placeholder="Ex: Sala 101"
              disabled={saving}
            />
            <Input
              label="Vagas"
              type="number"
              value={formData.vagas}
              onChange={(e) => setFormData({ ...formData, vagas: e.target.value })}
              placeholder="Ex: 40"
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Data de início"
              type="date"
              value={formData.data_inicio}
              onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
              disabled={saving}
            />
            <Input
              label="Data de término"
              type="date"
              value={formData.data_fim}
              onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Semestre"
              value={formData.semestre}
              onChange={(e) => setFormData({ ...formData, semestre: e.target.value })}
              placeholder="Ex: 2024.1"
              disabled={saving}
            />
            <Input
              label="Ano"
              type="number"
              value={formData.ano}
              onChange={(e) => setFormData({ ...formData, ano: e.target.value })}
              placeholder={new Date().getFullYear().toString()}
              disabled={saving}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingTurma ? "Salvar alterações" : "Cadastrar turma"}
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Detail Modal */}
      <Dialog
        open={!!detailTurma}
        onClose={() => setDetailTurma(null)}
        title={detailTurma?.nome || "Detalhes da Turma"}
        size="lg"
      >
        {detailTurma && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="rounded-lg p-3 bg-violet-50 dark:bg-violet-950/50 shrink-0">
                <BookOpen className="h-6 w-6 text-violet-600" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-semibold text-foreground">{detailTurma.nome}</p>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <GraduationCap className="h-3.5 w-3.5 inline" /> {detailTurma.curso_nome}
                  {detailTurma.turno && <><Clock className="h-3.5 w-3.5 inline" /> {turnoLabels[detailTurma.turno]}</>}
                  {detailTurma.sala && <><MapPin className="h-3.5 w-3.5 inline" /> Sala {detailTurma.sala}</>}
                </div>
                <Badge variant={detailTurma.ativo ? "success" : "destructive"} className="mt-1">
                  {detailTurma.ativo ? "Ativa" : "Inativa"}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vagas</p>
                <p className="text-2xl font-bold text-foreground">
                  {detailTurma.vagas}
                </p>
              </div>
              <div className="rounded-lg border border-border p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Alunos Matriculados</p>
                <p className="text-2xl font-bold text-foreground">
                  {filtered.find((t) => t.id === detailTurma.id)?.alunos_count || 0}
                </p>
              </div>
            </div>

            {detailTurma.data_inicio && (
              <div className="rounded-lg border border-border p-3 space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Período</p>
                <p className="text-sm text-foreground">
                  {formatFullDate(detailTurma.data_inicio)}
                  {detailTurma.data_fim && ` — ${formatFullDate(detailTurma.data_fim)}`}
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => {
                  setDetailTurma(null);
                  navigate("/alunos/matriculas");
                }}
              >
                <Users className="h-3.5 w-3.5" />
                Ver Matrículas
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => {
                  setDetailTurma(null);
                  navigate("/cursos/disciplinas");
                }}
              >
                <BookOpen className="h-3.5 w-3.5" />
                Disciplinas
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirmar exclusão"
        description="Tem certeza que deseja excluir esta turma? Esta ação não pode ser desfeita."
        size="sm"
      >
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </Button>
        </DialogFooter>
      </Dialog>
    </motion.div>
  );
}
