import { useState, useEffect, useCallback } from "react";
import {
  FileStack,
  Plus,
  Search,
  Loader2,
  Edit3,
  Trash2,
  RefreshCw,
  User,
  CalendarDays,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { Protocolo, Unidade } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatFullDate } from "@/lib/utils";

const REQUERENTE_TIPO_OPTIONS = [
  { value: "aluno", label: "Aluno" },
  { value: "professor", label: "Professor" },
  { value: "servidor", label: "Servidor" },
  { value: "externo", label: "Externo" },
];

const STATUS_OPTIONS = [
  { value: "aberto", label: "Aberto" },
  { value: "em_andamento", label: "Em Andamento" },
  { value: "concluido", label: "Concluído" },
  { value: "arquivado", label: "Arquivado" },
  { value: "cancelado", label: "Cancelado" },
];

const statusVariant: Record<string, "success" | "warning" | "default" | "destructive" | "secondary"> = {
  aberto: "default",
  em_andamento: "warning",
  concluido: "success",
  arquivado: "secondary",
  cancelado: "destructive",
};

const statusIcon: Record<string, typeof Clock> = {
  aberto: Clock,
  em_andamento: AlertTriangle,
  concluido: CheckCircle2,
  arquivado: FileText,
  cancelado: AlertTriangle,
};

export function ProtocolosPage() {
  const [protocolos, setProtocolos] = useState<(Protocolo & { unidade_nome?: string })[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todas");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProtocolo, setEditingProtocolo] = useState<Protocolo | null>(null);
  const [formData, setFormData] = useState({
    assunto: "",
    requerente_nome: "",
    requerente_tipo: "externo" as Protocolo["requerente_tipo"],
    requerente_documento: "",
    descricao: "",
    data_abertura: new Date().toISOString().split("T")[0],
    status: "aberto" as Protocolo["status"],
    observacoes: "",
    unidade_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Detail modal
  const [detailProtocolo, setDetailProtocolo] = useState<(Protocolo & { unidade_nome?: string }) | null>(null);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [protocolosRes, unidadesRes] = await Promise.all([
        supabase
          .from("protocolos")
          .select("*, unidades(nome, sigla)")
          .order("created_at", { ascending: false }),
        supabase.from("unidades").select("*").eq("ativo", true).order("nome"),
      ]);

      if (protocolosRes.data) {
        setProtocolos(
          (protocolosRes.data as any[]).map((p) => ({
            ...p,
            unidade_nome: p.unidades?.nome || "Não definida",
          }))
        );
      }
      if (unidadesRes.data) setUnidades(unidadesRes.data);
    } catch (err) {
      console.error("Erro ao carregar protocolos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const unidadeOptions = unidades.map((u) => ({ value: u.id, label: `${u.nome} (${u.sigla})` }));

  const openCreateModal = () => {
    setEditingProtocolo(null);
    setFormData({
      assunto: "",
      requerente_nome: "",
      requerente_tipo: "externo",
      requerente_documento: "",
      descricao: "",
      data_abertura: new Date().toISOString().split("T")[0],
      status: "aberto",
      observacoes: "",
      unidade_id: "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (protocolo: Protocolo) => {
    setEditingProtocolo(protocolo);
    setFormData({
      assunto: protocolo.assunto,
      requerente_nome: protocolo.requerente_nome,
      requerente_tipo: protocolo.requerente_tipo,
      requerente_documento: protocolo.requerente_documento || "",
      descricao: protocolo.descricao || "",
      data_abertura: protocolo.data_abertura.split("T")[0],
      status: protocolo.status,
      observacoes: protocolo.observacoes || "",
      unidade_id: protocolo.unidade_id,
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSave = async () => {
    setFormError("");
    if (!formData.assunto.trim() || !formData.requerente_nome.trim() || !formData.unidade_id) {
      setFormError("Assunto, requerente e unidade são obrigatórios.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        assunto: formData.assunto,
        requerente_nome: formData.requerente_nome,
        requerente_tipo: formData.requerente_tipo,
        requerente_documento: formData.requerente_documento || null,
        descricao: formData.descricao || null,
        data_abertura: formData.data_abertura,
        status: formData.status,
        observacoes: formData.observacoes || null,
        unidade_id: formData.unidade_id,
      };

      if (editingProtocolo) {
        const { error } = await supabase
          .from("protocolos")
          .update(payload)
          .eq("id", editingProtocolo.id);

        if (error) {
          setFormError(error.message);
          return;
        }
      } else {
        const { error } = await supabase.from("protocolos").insert({
          ...payload,
          numero: `PROT-${Date.now().toString(36).toUpperCase()}`,
        });
        if (error) {
          setFormError(error.message);
          return;
        }
      }

      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || "Erro ao salvar protocolo");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("protocolos").delete().eq("id", id);
    if (!error) {
      setProtocolos((prev) => prev.filter((p) => p.id !== id));
      setDeleteConfirm(null);
    }
  };

  const filtered = protocolos.filter((p) => {
    const matchesSearch =
      p.assunto.toLowerCase().includes(search.toLowerCase()) ||
      p.requerente_nome.toLowerCase().includes(search.toLowerCase()) ||
      (p.numero && p.numero.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter === "todas") return matchesSearch;
    return matchesSearch && p.status === statusFilter;
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
          <div className="rounded-xl p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-600">
            <FileStack className="h-6 w-6" />
          </div>
          <div>
            <h2 className="page-title">Protocolos</h2>
            <p className="page-subtitle mt-1">
              Gerencie os protocolos, solicitações e documentos da secretaria
            </p>
          </div>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Protocolo
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
                placeholder="Buscar por assunto, requerente ou número..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { value: "todas", label: "Todas" },
                { value: "aberto", label: "Abertos" },
                { value: "em_andamento", label: "Em Andamento" },
                { value: "concluido", label: "Concluídos" },
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
              <FileStack className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-foreground">
                {search ? "Nenhum protocolo encontrado" : "Nenhum protocolo cadastrado"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {search ? "Tente alterar os termos da busca" : "Clique em \"Novo Protocolo\" para cadastrar"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((protocolo, index) => {
                const StatusIcon = statusIcon[protocolo.status] || Clock;
                return (
                  <motion.div
                    key={protocolo.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="group flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-4 hover:bg-accent/30 transition-colors cursor-pointer"
                    onClick={() => setDetailProtocolo(protocolo)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <StatusIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <p className="text-sm font-medium text-foreground truncate">
                          {protocolo.assunto}
                        </p>
                        {protocolo.numero && (
                          <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                            {protocolo.numero}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1">
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <User className="h-3 w-3" />
                          {protocolo.requerente_nome}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {REQUERENTE_TIPO_OPTIONS.find((o) => o.value === protocolo.requerente_tipo)?.label}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <CalendarDays className="h-3 w-3" />
                          {formatFullDate(protocolo.data_abertura)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Badge
                        variant={statusVariant[protocolo.status] || "default"}
                        className="text-[10px]"
                      >
                        {STATUS_OPTIONS.find((s) => s.value === protocolo.status)?.label || protocolo.status}
                      </Badge>
                      <button
                        onClick={() => openEditModal(protocolo)}
                        className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors opacity-0 group-hover:opacity-100"
                        title="Editar"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProtocolo ? "Editar Protocolo" : "Novo Protocolo"}
        description={editingProtocolo ? `Editando: ${editingProtocolo.assunto}` : "Registre um novo protocolo"}
        size="xl"
      >
        <div className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {formError}
            </div>
          )}

          <Input
            label="Assunto *"
            value={formData.assunto}
            onChange={(e) => setFormData({ ...formData, assunto: e.target.value })}
            placeholder="Ex: Solicitação de declaração de matrícula"
            disabled={saving}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nome do requerente *"
              value={formData.requerente_nome}
              onChange={(e) => setFormData({ ...formData, requerente_nome: e.target.value })}
              placeholder="Nome completo"
              disabled={saving}
            />
            <Select
              label="Tipo de requerente *"
              options={REQUERENTE_TIPO_OPTIONS}
              value={formData.requerente_tipo}
              onChange={(e) => setFormData({ ...formData, requerente_tipo: e.target.value as Protocolo["requerente_tipo"] })}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Documento do requerente"
              value={formData.requerente_documento}
              onChange={(e) => setFormData({ ...formData, requerente_documento: e.target.value })}
              placeholder="CPF ou RG"
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

          <Textarea
            label="Descrição"
            value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            placeholder="Descreva o assunto do protocolo..."
            rows={3}
            disabled={saving}
          />

          {editingProtocolo && (
            <>
              <Input
                label="Data de abertura"
                type="date"
                value={formData.data_abertura}
                onChange={(e) => setFormData({ ...formData, data_abertura: e.target.value })}
                disabled={saving}
              />
              <Select
                label="Status"
                options={STATUS_OPTIONS}
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Protocolo["status"] })}
                disabled={saving}
              />
            </>
          )}

          <Textarea
            label="Observações"
            value={formData.observacoes}
            onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            placeholder="Observações adicionais..."
            rows={2}
            disabled={saving}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingProtocolo ? "Salvar alterações" : "Criar protocolo"}
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Detail Modal */}
      <Dialog
        open={!!detailProtocolo}
        onClose={() => setDetailProtocolo(null)}
        title="Detalhes do Protocolo"
        size="lg"
      >
        {detailProtocolo && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="rounded-lg p-3 bg-amber-50 dark:bg-amber-950/50 shrink-0">
                <FileStack className="h-6 w-6 text-amber-600" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold text-foreground">{detailProtocolo.assunto}</p>
                  {detailProtocolo.numero && (
                    <span className="text-xs font-mono text-muted-foreground">{detailProtocolo.numero}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><User className="h-3 w-3" />{detailProtocolo.requerente_nome}</span>
                  <span>{REQUERENTE_TIPO_OPTIONS.find((o) => o.value === detailProtocolo.requerente_tipo)?.label}</span>
                  <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{formatFullDate(detailProtocolo.data_abertura)}</span>
                </div>
                <Badge variant={statusVariant[detailProtocolo.status] || "default"}>
                  {STATUS_OPTIONS.find((s) => s.value === detailProtocolo.status)?.label || detailProtocolo.status}
                </Badge>
              </div>
            </div>

            {detailProtocolo.descricao && (
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Descrição</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{detailProtocolo.descricao}</p>
              </div>
            )}

            {detailProtocolo.observacoes && (
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Observações</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{detailProtocolo.observacoes}</p>
              </div>
            )}

            {detailProtocolo.data_conclusao && (
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Data de Conclusão</p>
                <p className="text-sm text-foreground">{formatFullDate(detailProtocolo.data_conclusao)}</p>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => {
                  setDetailProtocolo(null);
                  openEditModal(detailProtocolo);
                }}
              >
                <Edit3 className="h-3.5 w-3.5" />
                Editar Protocolo
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
        description="Tem certeza que deseja excluir este protocolo? Esta ação não pode ser desfeita."
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
