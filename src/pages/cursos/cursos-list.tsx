import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Plus,
  Search,
  Loader2,
  Edit3,
  Trash2,
  RefreshCw,
  BookOpen,
  Clock,
  Layers,
  Building2,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { Curso, Unidade } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const TIPO_OPTIONS = [
  { value: "tecnico", label: "Técnico" },
  { value: "graduacao", label: "Graduação" },
  { value: "pos_graduacao", label: "Pós-Graduação" },
  { value: "extensao", label: "Extensão" },
  { value: "qualificacao", label: "Qualificação" },
];

const MODALIDADE_OPTIONS = [
  { value: "presencial", label: "Presencial" },
  { value: "ead", label: "EAD" },
  { value: "hibrido", label: "Híbrido" },
];

const tipoColors: Record<string, string> = {
  tecnico: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  graduacao: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  pos_graduacao: "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
  extensao: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  qualificacao: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
};

const tipoLabels: Record<string, string> = {
  tecnico: "Técnico",
  graduacao: "Graduação",
  pos_graduacao: "Pós-Graduação",
  extensao: "Extensão",
  qualificacao: "Qualificação",
};

const modalidadeLabels: Record<string, string> = {
  presencial: "Presencial",
  ead: "EAD",
  hibrido: "Híbrido",
};

export function CursosListPage() {
  const navigate = useNavigate();
  const [cursos, setCursos] = useState<(Curso & { unidade_nome?: string; disciplinas_count?: number })[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativos" | "inativos">("ativos");
  const [tipoFilter, setTipoFilter] = useState<string>("todos");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    codigo: "",
    descricao: "",
    tipo: "tecnico" as Curso["tipo"],
    modalidade: "presencial" as Curso["modalidade"],
    carga_horaria: "",
    duracao_semestres: "",
    unidade_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Detail modal
  const [detailCurso, setDetailCurso] = useState<(Curso & { unidade_nome?: string }) | null>(null);
  const [disciplinasCurso, setDisciplinasCurso] = useState<any[]>([]);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cursosRes, unidadesRes] = await Promise.all([
        supabase
          .from("cursos")
          .select("*, unidades(nome, sigla)")
          .order("nome"),
        supabase.from("unidades").select("*").eq("ativo", true).order("nome"),
      ]);

      if (cursosRes.data) {
        // Get discipline count for each course
        const coursesWithCounts = await Promise.all(
          (cursosRes.data as any[]).map(async (c) => {
            const { count } = await supabase
              .from("disciplinas")
              .select("*", { count: "exact", head: true })
              .eq("curso_id", c.id);
            return {
              ...c,
              unidade_nome: c.unidades?.nome || "Não definida",
              disciplinas_count: count || 0,
            };
          })
        );
        setCursos(coursesWithCounts);
      }
      if (unidadesRes.data) setUnidades(unidadesRes.data);
    } catch (err) {
      console.error("Erro ao carregar cursos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const unidadeOptions = unidades.map((u) => ({ value: u.id, label: `${u.nome} (${u.sigla})` }));

  const openCreateModal = () => {
    setEditingCurso(null);
    setFormData({
      nome: "",
      codigo: "",
      descricao: "",
      tipo: "tecnico",
      modalidade: "presencial",
      carga_horaria: "",
      duracao_semestres: "",
      unidade_id: "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (curso: Curso) => {
    setEditingCurso(curso);
    setFormData({
      nome: curso.nome,
      codigo: curso.codigo || "",
      descricao: curso.descricao || "",
      tipo: curso.tipo,
      modalidade: curso.modalidade,
      carga_horaria: curso.carga_horaria?.toString() || "",
      duracao_semestres: curso.duracao_semestres?.toString() || "",
      unidade_id: curso.unidade_id,
    });
    setFormError("");
    setModalOpen(true);
  };

  const openDetailModal = async (curso: Curso & { unidade_nome?: string }) => {
    setDetailCurso(curso);
    setDisciplinasCurso([]);

    const { data } = await supabase
      .from("disciplinas")
      .select("*")
      .eq("curso_id", curso.id)
      .order("semestre", { ascending: true })
      .order("nome");

    if (data) setDisciplinasCurso(data);
  };

  const handleSave = async () => {
    setFormError("");
    if (!formData.nome.trim() || !formData.unidade_id) {
      setFormError("Nome e unidade são obrigatórios.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nome: formData.nome,
        codigo: formData.codigo || null,
        descricao: formData.descricao || null,
        tipo: formData.tipo,
        modalidade: formData.modalidade,
        carga_horaria: formData.carga_horaria ? parseInt(formData.carga_horaria) : null,
        duracao_semestres: formData.duracao_semestres ? parseInt(formData.duracao_semestres) : null,
        unidade_id: formData.unidade_id,
      };

      if (editingCurso) {
        const { error } = await supabase
          .from("cursos")
          .update(payload)
          .eq("id", editingCurso.id);

        if (error) {
          setFormError(error.message);
          return;
        }
      } else {
        const { error } = await supabase.from("cursos").insert(payload);
        if (error) {
          setFormError(error.message);
          return;
        }
      }

      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || "Erro ao salvar curso");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("cursos").delete().eq("id", id);
    if (!error) {
      setCursos((prev) => prev.filter((c) => c.id !== id));
      setDeleteConfirm(null);
    }
  };

  const filtered = cursos.filter((c) => {
    const matchesSearch =
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      (c.codigo && c.codigo.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter === "ativos") return matchesSearch && c.ativo;
    if (statusFilter === "inativos") return matchesSearch && !c.ativo;
    if (tipoFilter !== "todos") return matchesSearch && c.tipo === tipoFilter;
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
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h2 className="page-title">Cursos</h2>
            <p className="page-subtitle mt-1">
              Gerencie os cursos oferecidos pela instituição
            </p>
          </div>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Curso
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
                placeholder="Buscar por nome ou código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Status filters */}
              {(["todos", "ativos", "inativos"] as const).map((opt) => (
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
                  {opt === "todos" ? "Todos" : opt === "ativos" ? "Ativos" : "Inativos"}
                </button>
              ))}
              {/* Tipo filter */}
              <select
                value={tipoFilter}
                onChange={(e) => setTipoFilter(e.target.value)}
                className="h-7 rounded-lg border border-input bg-background px-2 text-[10px] font-medium text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="todos">Todos os tipos</option>
                {TIPO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <Button variant="ghost" size="icon-sm" onClick={fetchData} title="Recarregar">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {filtered.length} curso{filtered.length !== 1 ? "s" : ""}
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
              <GraduationCap className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-foreground">
                {search ? "Nenhum curso encontrado" : "Nenhum curso cadastrado"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {search ? "Tente alterar os termos da busca" : "Clique em \"Novo Curso\" para cadastrar"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((curso, index) => (
                <motion.div
                  key={curso.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={cn(
                    "group flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-4 hover:bg-accent/30 transition-colors cursor-pointer",
                    !curso.ativo && "opacity-60"
                  )}
                  onClick={() => openDetailModal(curso)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="rounded-lg p-2 bg-violet-50 dark:bg-violet-950/50 shrink-0">
                      <GraduationCap className="h-5 w-5 text-violet-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">
                          {curso.nome}
                        </p>
                        {curso.codigo && (
                          <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                            #{curso.codigo}
                          </span>
                        )}
                        <Badge
                          variant={curso.ativo ? "success" : "destructive"}
                          className="text-[9px] px-1.5 py-0 h-4"
                        >
                          {curso.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${tipoColors[curso.tipo]}`}>
                          {tipoLabels[curso.tipo]}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {modalidadeLabels[curso.modalidade]}
                        </span>
                        {curso.carga_horaria && (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {curso.carga_horaria}h
                          </span>
                        )}
                        {curso.duracao_semestres && (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Layers className="h-3 w-3" />
                            {curso.duracao_semestres} semestres
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <BookOpen className="h-3 w-3" />
                          {curso.disciplinas_count} disciplinas
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
                      onClick={() => openEditModal(curso)}
                      className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      title="Editar"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(curso.id)}
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
        title={editingCurso ? "Editar Curso" : "Novo Curso"}
        description={editingCurso ? `Editando: ${editingCurso.nome}` : "Preencha os dados do curso"}
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
              label="Nome do curso *"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Técnico em Enfermagem"
              disabled={saving}
            />
            <Input
              label="Código"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              placeholder="Ex: TEC-ENF-01"
              disabled={saving}
            />
          </div>

          <Textarea
            label="Descrição"
            value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            placeholder="Descrição do curso..."
            rows={3}
            disabled={saving}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Tipo *"
              options={TIPO_OPTIONS}
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value as Curso["tipo"] })}
              disabled={saving}
            />
            <Select
              label="Modalidade *"
              options={MODALIDADE_OPTIONS}
              value={formData.modalidade}
              onChange={(e) => setFormData({ ...formData, modalidade: e.target.value as Curso["modalidade"] })}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Carga horária total (horas)"
              type="number"
              value={formData.carga_horaria}
              onChange={(e) => setFormData({ ...formData, carga_horaria: e.target.value })}
              placeholder="Ex: 1200"
              disabled={saving}
            />
            <Input
              label="Duração (semestres)"
              type="number"
              value={formData.duracao_semestres}
              onChange={(e) => setFormData({ ...formData, duracao_semestres: e.target.value })}
              placeholder="Ex: 4"
              disabled={saving}
            />
          </div>

          <Select
            label="Unidade *"
            options={unidadeOptions}
            placeholder="Selecione a unidade"
            value={formData.unidade_id}
            onChange={(e) => setFormData({ ...formData, unidade_id: e.target.value })}
            disabled={saving}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingCurso ? "Salvar alterações" : "Cadastrar curso"}
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Detail Modal */}
      <Dialog
        open={!!detailCurso}
        onClose={() => setDetailCurso(null)}
        title={detailCurso?.nome || "Detalhes do Curso"}
        size="lg"
      >
        {detailCurso && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="rounded-xl p-3 bg-violet-50 dark:bg-violet-950/50 shrink-0">
                <GraduationCap className="h-6 w-6 text-violet-600" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-semibold text-foreground">{detailCurso.nome}</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${tipoColors[detailCurso.tipo]}`}>
                    {tipoLabels[detailCurso.tipo]}
                  </span>
                  <Badge variant="outline" className="text-[10px]">{modalidadeLabels[detailCurso.modalidade]}</Badge>
                  <Badge variant={detailCurso.ativo ? "success" : "destructive"} className="text-[10px]">
                    {detailCurso.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                {detailCurso.descricao && (
                  <p className="text-xs text-muted-foreground mt-2">{detailCurso.descricao}</p>
                )}
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: BookOpen, label: "Disciplinas", value: `${disciplinasCurso.length}` },
                { icon: Clock, label: "Carga Horária", value: detailCurso.carga_horaria ? `${detailCurso.carga_horaria}h` : "—" },
                { icon: Layers, label: "Duração", value: detailCurso.duracao_semestres ? `${detailCurso.duracao_semestres} semestres` : "—" },
                { icon: Building2, label: "Unidade", value: detailCurso.unidade_nome || "—" },
              ].map((info, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-3 text-center">
                  <info.icon className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                  <p className="text-[10px] text-muted-foreground">{info.label}</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">{info.value}</p>
                </div>
              ))}
            </div>

            {/* Disciplinas */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-foreground">Disciplinas do Curso</h4>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => {
                    setDetailCurso(null);
                    navigate("/cursos/disciplinas");
                  }}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Gerenciar
                </Button>
              </div>
              {disciplinasCurso.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6 bg-muted/30 rounded-lg">
                  Nenhuma disciplina cadastrada para este curso
                </p>
              ) : (
                <div className="space-y-2">
                  {disciplinasCurso.map((disc) => (
                    <div key={disc.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {disc.nome}
                          {disc.codigo && <span className="text-[10px] font-mono text-muted-foreground ml-2">#{disc.codigo}</span>}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {disc.semestre && `${disc.semestre}º semestre`}
                          {disc.semestre && disc.carga_horaria && " · "}
                          {disc.carga_horaria && `${disc.carga_horaria}h`}
                          {disc.ementa && " · " + disc.ementa.substring(0, 60)}
                          {disc.ementa && disc.ementa.length > 60 ? "..." : ""}
                        </p>
                      </div>
                      <Badge variant={disc.ativo ? "success" : "destructive"} className="text-[9px]">
                        {disc.ativo ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirmar exclusão"
        description="Tem certeza que deseja excluir este curso? As disciplinas vinculadas também serão removidas."
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
