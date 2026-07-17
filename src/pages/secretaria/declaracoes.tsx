import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Plus,
  Search,
  Loader2,
  Edit3,
  Trash2,
  RefreshCw,
  User,
  CalendarDays,
  GraduationCap,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { Declaracao, Aluno, Unidade } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatFullDate } from "@/lib/utils";

const TIPO_OPTIONS = [
  { value: "matricula", label: "Declaração de Matrícula" },
  { value: "frequencia", label: "Declaração de Frequência" },
  { value: "historico", label: "Histórico Escolar" },
  { value: "estagio", label: "Declaração de Estágio" },
  { value: "conclusao", label: "Declaração de Conclusão" },
  { value: "outros", label: "Outros" },
];

const STATUS_OPTIONS = [
  { value: "gerada", label: "Gerada" },
  { value: "entregue", label: "Entregue" },
  { value: "cancelada", label: "Cancelada" },
];

const statusVariant: Record<string, "success" | "warning" | "default" | "destructive"> = {
  gerada: "default",
  entregue: "success",
  cancelada: "destructive",
};

const tipoLabels: Record<string, string> = {
  matricula: "Matrícula",
  frequencia: "Frequência",
  historico: "Histórico",
  estagio: "Estágio",
  conclusao: "Conclusão",
  outros: "Outros",
};

export function DeclaracoesPage() {
  const [declaracoes, setDeclaracoes] = useState<(Declaracao & { aluno_nome?: string; unidade_nome?: string })[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todas");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDeclaracao, setEditingDeclaracao] = useState<Declaracao | null>(null);
  const [formData, setFormData] = useState({
    aluno_id: "",
    tipo: "matricula" as Declaracao["tipo"],
    data_emissao: new Date().toISOString().split("T")[0],
    texto: "",
    status: "gerada" as Declaracao["status"],
    observacoes: "",
    unidade_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [declaracoesRes, alunosRes, unidadesRes] = await Promise.all([
        supabase
          .from("declaracoes")
          .select("*, alunos(nome), unidades(nome, sigla)")
          .order("created_at", { ascending: false }),
        supabase.from("alunos").select("*").eq("ativo", true).order("nome"),
        supabase.from("unidades").select("*").eq("ativo", true).order("nome"),
      ]);

      if (declaracoesRes.data) {
        setDeclaracoes(
          (declaracoesRes.data as any[]).map((d) => ({
            ...d,
            aluno_nome: d.alunos?.nome || "Aluno não encontrado",
            unidade_nome: d.unidades?.nome || "Não definida",
          }))
        );
      }
      if (alunosRes.data) setAlunos(alunosRes.data);
      if (unidadesRes.data) setUnidades(unidadesRes.data);
    } catch (err) {
      console.error("Erro ao carregar declarações:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const alunoOptions = alunos.map((a) => ({ value: a.id, label: a.nome }));
  const unidadeOptions = unidades.map((u) => ({ value: u.id, label: `${u.nome} (${u.sigla})` }));

  const openCreateModal = () => {
    setEditingDeclaracao(null);
    setFormData({
      aluno_id: "",
      tipo: "matricula",
      data_emissao: new Date().toISOString().split("T")[0],
      texto: "",
      status: "gerada",
      observacoes: "",
      unidade_id: "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSave = async () => {
    setFormError("");
    if (!formData.aluno_id || !formData.unidade_id) {
      setFormError("Aluno e unidade são obrigatórios.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        aluno_id: formData.aluno_id,
        tipo: formData.tipo,
        data_emissao: formData.data_emissao,
        texto: formData.texto || null,
        status: formData.status,
        observacoes: formData.observacoes || null,
        unidade_id: formData.unidade_id,
      };

      if (editingDeclaracao) {
        const { error } = await supabase
          .from("declaracoes")
          .update(payload)
          .eq("id", editingDeclaracao.id);
        if (error) {
          setFormError(error.message);
          return;
        }
      } else {
        const { error } = await supabase.from("declaracoes").insert({
          ...payload,
          numero: `DECL-${Date.now().toString(36).toUpperCase()}`,
        });
        if (error) {
          setFormError(error.message);
          return;
        }
      }

      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || "Erro ao salvar declaração");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("declaracoes").delete().eq("id", id);
    if (!error) {
      setDeclaracoes((prev) => prev.filter((d) => d.id !== id));
      setDeleteConfirm(null);
    }
  };

  const filtered = declaracoes.filter((d) => {
    const matchesSearch =
      (d.aluno_nome || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.numero || "").toLowerCase().includes(search.toLowerCase()) ||
      (tipoLabels[d.tipo] || "").toLowerCase().includes(search.toLowerCase());
    if (statusFilter === "todas") return matchesSearch;
    return matchesSearch && d.status === statusFilter;
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
          <div className="rounded-xl p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h2 className="page-title">Declarações</h2>
            <p className="page-subtitle mt-1">
              Emita e gerencie declarações acadêmicas e documentos oficiais
            </p>
          </div>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Declaração
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
                placeholder="Buscar por aluno, número ou tipo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { value: "todas", label: "Todas" },
                { value: "gerada", label: "Geradas" },
                { value: "entregue", label: "Entregues" },
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
              <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-foreground">
                {search ? "Nenhuma declaração encontrada" : "Nenhuma declaração emitida"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {search ? "Tente alterar os termos da busca" : "Clique em \"Nova Declaração\" para emitir"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((declaracao, index) => (
                <motion.div
                  key={declaracao.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="group flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-4 hover:bg-accent/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <p className="text-sm font-medium text-foreground truncate">
                        {tipoLabels[declaracao.tipo] || declaracao.tipo}
                      </p>
                      {declaracao.numero && (
                        <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                          {declaracao.numero}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1">
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <User className="h-3 w-3" />
                        {declaracao.aluno_nome}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        {formatFullDate(declaracao.data_emissao)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={statusVariant[declaracao.status] || "default"}
                      className="text-[10px]"
                    >
                      {STATUS_OPTIONS.find((s) => s.value === declaracao.status)?.label || declaracao.status}
                    </Badge>
                    <button
                      onClick={() => setDeleteConfirm(declaracao.id)}
                      className="rounded p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
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
        title={editingDeclaracao ? "Editar Declaração" : "Nova Declaração"}
        description={editingDeclaracao ? `Editando declaração #${editingDeclaracao.numero || ""}` : "Preencha os dados para emitir uma declaração"}
        size="xl"
      >
        <div className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Aluno *"
              options={alunoOptions}
              placeholder="Selecione o aluno"
              value={formData.aluno_id}
              onChange={(e) => setFormData({ ...formData, aluno_id: e.target.value })}
              disabled={saving}
            />
            <Select
              label="Tipo de declaração *"
              options={TIPO_OPTIONS}
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value as Declaracao["tipo"] })}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Data de emissão *"
              type="date"
              value={formData.data_emissao}
              onChange={(e) => setFormData({ ...formData, data_emissao: e.target.value })}
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

          {editingDeclaracao && (
            <Select
              label="Status"
              options={STATUS_OPTIONS}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Declaracao["status"] })}
              disabled={saving}
            />
          )}

          <Textarea
            label="Texto da declaração"
            value={formData.texto}
            onChange={(e) => setFormData({ ...formData, texto: e.target.value })}
            placeholder="Texto oficial da declaração..."
            rows={5}
            disabled={saving}
          />

          <Textarea
            label="Observações"
            value={formData.observacoes}
            onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            placeholder="Observações internas..."
            rows={2}
            disabled={saving}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingDeclaracao ? "Salvar alterações" : "Emitir declaração"}
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirmar exclusão"
        description="Tem certeza que deseja excluir esta declaração? Esta ação não pode ser desfeita."
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
