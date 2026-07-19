import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  Search,
  Loader2,
  Edit3,
  Trash2,
  RefreshCw,
  Mail,
  Phone,
  CalendarDays,
  FileText,
  BookMarked,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { Aluno, Unidade } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, formatFullDate } from "@/lib/utils";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const ESTADOS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
  "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
].map((uf) => ({ value: uf, label: uf }));

type SortField = "nome" | "created_at" | "cpf";

export function AlunosListPage() {
  const navigate = useNavigate();
  const [alunos, setAlunos] = useState<(Aluno & { unidade_nome?: string })[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativos" | "inativos">("ativos");
  const [sortField] = useState<SortField>("created_at");
  const [sortAsc] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    rg: "",
    data_nascimento: "",
    email: "",
    telefone: "",
    celular: "",
    endereco: "",
    cidade: "",
    estado: "RO",
    nacionalidade: "Brasileira",
    nome_mae: "",
    nome_pai: "",
    unidade_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Detail modal
  const [detailAluno, setDetailAluno] = useState<(Aluno & { unidade_nome?: string }) | null>(null);
  const [matriculasAluno, setMatriculasAluno] = useState<Record<string, unknown>[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [alunosRes, unidadesRes] = await Promise.all([
        supabase
          .from("alunos")
          .select("*, unidades(nome)")
          .order("created_at", { ascending: false }),
        supabase.from("unidades").select("*").eq("ativo", true).order("nome"),
      ]);

      if (alunosRes.data) {
        setAlunos(
          (alunosRes.data as Record<string, unknown>[]).map((a: Record<string, unknown>) => ({
            ...a,
            unidade_nome: (a.unidades as Record<string, unknown> | undefined)?.nome as string || "Não definida",
          }))
        );
      }
      if (unidadesRes.data) setUnidades(unidadesRes.data);
    } catch (err: unknown) {
      console.error("Erro ao carregar alunos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { let c = false; queueMicrotask(() => { if (!c) fetchData(); }); return () => { c = true; }; }, [fetchData]);

  const unidadeOptions = unidades.map((u) => ({ value: u.id, label: `${u.nome} (${u.sigla})` }));

  const openCreateModal = () => {
    setEditingAluno(null);
    setFormData({
      nome: "",
      cpf: "",
      rg: "",
      data_nascimento: "",
      email: "",
      telefone: "",
      celular: "",
      endereco: "",
      cidade: "",
      estado: "RO",
      nacionalidade: "Brasileira",
      nome_mae: "",
      nome_pai: "",
      unidade_id: "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (aluno: Aluno) => {
    setEditingAluno(aluno);
    setFormData({
      nome: aluno.nome,
      cpf: aluno.cpf || "",
      rg: aluno.rg || "",
      data_nascimento: aluno.data_nascimento?.split("T")[0] || "",
      email: aluno.email || "",
      telefone: aluno.telefone || "",
      celular: aluno.celular || "",
      endereco: aluno.endereco || "",
      cidade: aluno.cidade || "",
      estado: aluno.estado,
      nacionalidade: aluno.nacionalidade,
      nome_mae: aluno.nome_mae || "",
      nome_pai: aluno.nome_pai || "",
      unidade_id: aluno.unidade_id,
    });
    setFormError("");
    setModalOpen(true);
  };

  const openDetailModal = async (aluno: Aluno & { unidade_nome?: string }) => {
    setDetailAluno(aluno);
    setMatriculasAluno([]);

    const { data } = await supabase
      .from("matriculas")
      .select("*, cursos(nome), turmas(nome, codigo)")
      .eq("aluno_id", aluno.id)
      .order("created_at", { ascending: false });

    if (data) setMatriculasAluno(data as Record<string, unknown>[]);
  };

  const handleSave = async () => {
    setFormError("");
    if (!formData.nome.trim() || !formData.unidade_id) {
      setFormError("Nome e unidade são obrigatórios.");
      return;
    }

    setSaving(true);
    try {
      if (editingAluno) {
        const { error } = await supabase
          .from("alunos")
          .update({
            nome: formData.nome,
            cpf: formData.cpf || null,
            rg: formData.rg || null,
            data_nascimento: formData.data_nascimento || null,
            email: formData.email || null,
            telefone: formData.telefone || null,
            celular: formData.celular || null,
            endereco: formData.endereco || null,
            cidade: formData.cidade || null,
            estado: formData.estado,
            nacionalidade: formData.nacionalidade,
            nome_mae: formData.nome_mae || null,
            nome_pai: formData.nome_pai || null,
            unidade_id: formData.unidade_id,
          })
          .eq("id", editingAluno.id);

        if (error) {
          setFormError(error.message);
          return;
        }
      } else {
        const { error } = await supabase.from("alunos").insert({
          nome: formData.nome,
          cpf: formData.cpf || null,
          rg: formData.rg || null,
          data_nascimento: formData.data_nascimento || null,
          email: formData.email || null,
          telefone: formData.telefone || null,
          celular: formData.celular || null,
          endereco: formData.endereco || null,
          cidade: formData.cidade || null,
          estado: formData.estado,
          nacionalidade: formData.nacionalidade,
          nome_mae: formData.nome_mae || null,
          nome_pai: formData.nome_pai || null,
          unidade_id: formData.unidade_id,
        });

        if (error) {
          setFormError(error.message);
          return;
        }
      }

      setModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Erro ao salvar aluno");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("alunos").delete().eq("id", id);
    if (!error) {
      setAlunos((prev) => prev.filter((a) => a.id !== id));
      setDeleteConfirm(null);
    }
  };

  // Filter and sort
  const filtered = alunos
    .filter((a) => {
      const matchesSearch =
        a.nome.toLowerCase().includes(search.toLowerCase()) ||
        (a.cpf && a.cpf.includes(search)) ||
        (a.email && a.email.toLowerCase().includes(search.toLowerCase()));

      if (statusFilter === "ativos") return matchesSearch && a.ativo;
      if (statusFilter === "inativos") return matchesSearch && !a.ativo;
      return matchesSearch;
    })
    .sort((a, b) => {
      const aVal = a[sortField] || "";
      const bVal = b[sortField] || "";
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortAsc ? cmp : -cmp;
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
          <div className="rounded-xl p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h2 className="page-title">Alunos</h2>
            <p className="page-subtitle mt-1">
              Gerencie o cadastro de alunos, dados pessoais e matrículas
            </p>
          </div>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Aluno
        </Button>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nome, CPF ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex items-center gap-2">
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
              <Button variant="ghost" size="icon-sm" onClick={fetchData} title="Recarregar">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {filtered.length} aluno{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-foreground">
                {search ? "Nenhum aluno encontrado" : "Nenhum aluno cadastrado"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {search ? "Tente alterar os termos da busca" : "Clique em \"Novo Aluno\" para cadastrar"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((aluno, index) => (
                <motion.div
                  key={aluno.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={cn(
                    "group flex items-center gap-4 px-4 sm:px-6 py-4 hover:bg-accent/30 transition-colors cursor-pointer",
                    !aluno.ativo && "opacity-60"
                  )}
                  onClick={() => openDetailModal(aluno)}
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-indigo-700 text-white text-xs">
                      {getInitials(aluno.nome)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {aluno.nome}
                      </p>
                      <Badge
                        variant={aluno.ativo ? "success" : "destructive"}
                        className="text-[9px] px-1.5 py-0 h-4"
                      >
                        {aluno.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-0.5">
                      {aluno.email && (
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {aluno.email}
                        </span>
                      )}
                      {aluno.cpf && (
                        <span className="text-[11px] text-muted-foreground">
                          CPF: {aluno.cpf}
                        </span>
                      )}
                      <span className="text-[11px] text-muted-foreground">
                        {aluno.unidade_nome}
                      </span>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                    <CalendarDays className="h-3 w-3" />
                    {formatFullDate(aluno.created_at)}
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openEditModal(aluno)}
                      className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      title="Editar"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(aluno.id)}
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
        title={editingAluno ? "Editar Aluno" : "Novo Aluno"}
        description={editingAluno ? `Editando: ${editingAluno.nome}` : "Preencha os dados do aluno"}
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
              label="Nome completo *"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Nome do aluno"
              disabled={saving}
            />
            <Input
              label="Data de nascimento"
              type="date"
              value={formData.data_nascimento}
              onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="CPF"
              value={formData.cpf}
              onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
              placeholder="000.000.000-00"
              disabled={saving}
            />
            <Input
              label="RG"
              value={formData.rg}
              onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
              placeholder="RG"
              disabled={saving}
            />
            <Select
              label="Estado"
              options={ESTADOS}
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="E-mail"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
              disabled={saving}
            />
            <Input
              label="Celular"
              value={formData.celular}
              onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
              placeholder="(69) 99999-9999"
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Endereço"
              value={formData.endereco}
              onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
              placeholder="Rua, número, bairro"
              disabled={saving}
            />
            <Input
              label="Cidade"
              value={formData.cidade}
              onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
              placeholder="Cidade"
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Nome da mãe"
              value={formData.nome_mae}
              onChange={(e) => setFormData({ ...formData, nome_mae: e.target.value })}
              placeholder="Nome da mãe"
              disabled={saving}
            />
            <Input
              label="Nome do pai"
              value={formData.nome_pai}
              onChange={(e) => setFormData({ ...formData, nome_pai: e.target.value })}
              placeholder="Nome do pai"
              disabled={saving}
            />
            <Input
              label="Nacionalidade"
              value={formData.nacionalidade}
              onChange={(e) => setFormData({ ...formData, nacionalidade: e.target.value })}
              placeholder="Nacionalidade"
              disabled={saving}
            />
          </div>

          <div className="w-full sm:w-1/2">
            <Select
              label="Unidade *"
              options={unidadeOptions}
              placeholder="Selecione a unidade"
              value={formData.unidade_id}
              onChange={(e) => setFormData({ ...formData, unidade_id: e.target.value })}
              disabled={saving}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingAluno ? "Salvar alterações" : "Cadastrar aluno"}
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Detail Modal */}
      <Dialog
        open={!!detailAluno}
        onClose={() => setDetailAluno(null)}
        title={detailAluno?.nome || "Detalhes do Aluno"}
        size="lg"
      >
        {detailAluno && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="bg-indigo-700 text-white text-sm">
                  {getInitials(detailAluno.nome)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-lg font-semibold text-foreground">{detailAluno.nome}</p>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {detailAluno.email && (
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{detailAluno.email}</span>
                  )}
                  {detailAluno.celular && (
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{detailAluno.celular}</span>
                  )}
                  {detailAluno.cpf && <span>CPF: {detailAluno.cpf}</span>}
                </div>
                <Badge variant={detailAluno.ativo ? "success" : "destructive"} className="mt-1">
                  {detailAluno.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </div>

            {/* Matrículas */}
            <div>
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <BookMarked className="h-4 w-4 text-muted-foreground" />
                Matrículas
              </h4>
              {matriculasAluno.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Nenhuma matrícula encontrada
                </p>
              ) : (
                <div className="space-y-2">
                  {matriculasAluno.map((mat) => (
                    <div key={mat.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {mat.cursos?.nome || "Curso não informado"}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {mat.turmas?.nome} {mat.turmas?.codigo && `(${mat.turmas.codigo})`} · {mat.numero && `#${mat.numero}`}
                        </p>
                      </div>
                      <Badge
                        variant={
                          mat.status === "ativo" ? "success" :
                          mat.status === "concluido" ? "default" :
                          mat.status === "trancado" ? "warning" : "destructive"
                        }
                        className="text-[10px]"
                      >
                        {mat.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => {
                  setDetailAluno(null);
                  navigate("/alunos/matriculas");
                }}
              >
                <FileText className="h-3.5 w-3.5" />
                Nova Matrícula
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => {
                  setDetailAluno(null);
                  openEditModal(detailAluno);
                }}
              >
                <Edit3 className="h-3.5 w-3.5" />
                Editar Dados
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
        description="Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita."
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
