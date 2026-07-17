import { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Loader2,
  Edit3,
  Trash2,
  RefreshCw,
  Clock,
  Layers,
  GraduationCap,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { Disciplina, Curso } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function DisciplinasPage() {
  const [disciplinas, setDisciplinas] = useState<(Disciplina & { curso_nome?: string })[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cursoFilter, setCursoFilter] = useState<string>("todos");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDisc, setEditingDisc] = useState<Disciplina | null>(null);
  const [formData, setFormData] = useState({
    curso_id: "",
    nome: "",
    codigo: "",
    carga_horaria: "",
    ementa: "",
    semestre: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [discRes, cursosRes] = await Promise.all([
        supabase
          .from("disciplinas")
          .select("*, cursos(nome)")
          .order("curso_id")
          .order("semestre", { ascending: true })
          .order("nome"),
        supabase.from("cursos").select("*").eq("ativo", true).order("nome"),
      ]);

      if (discRes.data) {
        setDisciplinas(
          (discRes.data as any[]).map((d) => ({
            ...d,
            curso_nome: d.cursos?.nome || "Curso não encontrado",
          }))
        );
      }
      if (cursosRes.data) setCursos(cursosRes.data);
    } catch (err) {
      console.error("Erro ao carregar disciplinas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const cursoOptions = cursos.map((c) => ({ value: c.id, label: c.nome }));

  const openCreateModal = () => {
    setEditingDisc(null);
    setFormData({
      curso_id: cursos[0]?.id || "",
      nome: "",
      codigo: "",
      carga_horaria: "",
      ementa: "",
      semestre: "1",
    });
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (disc: Disciplina) => {
    setEditingDisc(disc);
    setFormData({
      curso_id: disc.curso_id,
      nome: disc.nome,
      codigo: disc.codigo || "",
      carga_horaria: disc.carga_horaria?.toString() || "",
      ementa: disc.ementa || "",
      semestre: disc.semestre?.toString() || "1",
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSave = async () => {
    setFormError("");
    if (!formData.nome.trim() || !formData.curso_id) {
      setFormError("Nome e curso são obrigatórios.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        curso_id: formData.curso_id,
        nome: formData.nome,
        codigo: formData.codigo || null,
        carga_horaria: formData.carga_horaria ? parseInt(formData.carga_horaria) : null,
        ementa: formData.ementa || null,
        semestre: formData.semestre ? parseInt(formData.semestre) : null,
      };

      if (editingDisc) {
        const { error } = await supabase
          .from("disciplinas")
          .update(payload)
          .eq("id", editingDisc.id);

        if (error) {
          setFormError(error.message);
          return;
        }
      } else {
        const { error } = await supabase.from("disciplinas").insert(payload);
        if (error) {
          setFormError(error.message);
          return;
        }
      }

      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || "Erro ao salvar disciplina");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("disciplinas").delete().eq("id", id);
    if (!error) {
      setDisciplinas((prev) => prev.filter((d) => d.id !== id));
      setDeleteConfirm(null);
    }
  };

  const filtered = disciplinas.filter((d) => {
    const matchesSearch =
      d.nome.toLowerCase().includes(search.toLowerCase()) ||
      (d.codigo && d.codigo.toLowerCase().includes(search.toLowerCase())) ||
      (d.curso_nome && d.curso_nome.toLowerCase().includes(search.toLowerCase()));
    if (cursoFilter !== "todos") return matchesSearch && d.curso_id === cursoFilter;
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
          <div className="rounded-xl p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h2 className="page-title">Disciplinas</h2>
            <p className="page-subtitle mt-1">
              Gerencie as disciplinas dos cursos
            </p>
          </div>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Disciplina
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
                placeholder="Buscar por nome, código ou curso..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={cursoFilter}
                onChange={(e) => setCursoFilter(e.target.value)}
                className="h-7 rounded-lg border border-input bg-background px-2 text-[10px] font-medium text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="todos">Todos os cursos</option>
                {cursoOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <Button variant="ghost" size="icon-sm" onClick={fetchData} title="Recarregar">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {filtered.length} disciplina{filtered.length !== 1 ? "s" : ""}
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
                {search ? "Nenhuma disciplina encontrada" : "Nenhuma disciplina cadastrada"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {search ? "Tente alterar os termos da busca" : "Clique em \"Nova Disciplina\" para cadastrar"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((disc, index) => (
                <motion.div
                  key={disc.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={cn(
                    "group flex items-center gap-3 px-4 sm:px-6 py-4 hover:bg-accent/30 transition-colors",
                    !disc.ativo && "opacity-60"
                  )}
                >
                  <div className="rounded-lg p-2 bg-emerald-50 dark:bg-emerald-950/50 shrink-0">
                    <BookOpen className="h-4 w-4 text-emerald-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {disc.nome}
                      </p>
                      {disc.codigo && (
                        <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                          #{disc.codigo}
                        </span>
                      )}
                      <Badge
                        variant={disc.ativo ? "success" : "destructive"}
                        className="text-[9px] px-1.5 py-0 h-4"
                      >
                        {disc.ativo ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <GraduationCap className="h-3 w-3" />
                        {disc.curso_nome}
                      </span>
                      {disc.semestre && (
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Layers className="h-3 w-3" />
                          {disc.semestre}º semestre
                        </span>
                      )}
                      {disc.carga_horaria && (
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {disc.carga_horaria}h
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditModal(disc)}
                      className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      title="Editar"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(disc.id)}
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
        title={editingDisc ? "Editar Disciplina" : "Nova Disciplina"}
        description={editingDisc ? `Editando: ${editingDisc.nome}` : "Cadastre uma nova disciplina"}
        size="lg"
      >
        <div className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {formError}
            </div>
          )}

          <Select
            label="Curso *"
            options={cursoOptions}
            placeholder="Selecione o curso"
            value={formData.curso_id}
            onChange={(e) => setFormData({ ...formData, curso_id: e.target.value })}
            disabled={saving || !!editingDisc}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nome da disciplina *"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Anatomia Humana"
              disabled={saving}
            />
            <Input
              label="Código"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              placeholder="Ex: ANAT-01"
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Carga horária (horas)"
              type="number"
              value={formData.carga_horaria}
              onChange={(e) => setFormData({ ...formData, carga_horaria: e.target.value })}
              placeholder="Ex: 80"
              disabled={saving}
            />
            <Input
              label="Semestre"
              type="number"
              min={1}
              max={12}
              value={formData.semestre}
              onChange={(e) => setFormData({ ...formData, semestre: e.target.value })}
              placeholder="Ex: 1"
              disabled={saving}
            />
          </div>

          <Textarea
            label="Ementa"
            value={formData.ementa}
            onChange={(e) => setFormData({ ...formData, ementa: e.target.value })}
            placeholder="Descreva o conteúdo programático da disciplina..."
            rows={4}
            disabled={saving}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingDisc ? "Salvar alterações" : "Cadastrar disciplina"}
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirmar exclusão"
        description="Tem certeza que deseja excluir esta disciplina? Esta ação não pode ser desfeita."
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
