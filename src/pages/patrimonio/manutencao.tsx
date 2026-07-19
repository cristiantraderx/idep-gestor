import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { ManutencaoBem } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const TIPO_MANUT_OPTIONS = [
  { value: "preventiva", label: "Preventiva" },
  { value: "corretiva", label: "Corretiva" },
  { value: "urgente", label: "Urgente" },
];

const STATUS_MANUT_OPTIONS = [
  { value: "solicitada", label: "Solicitada" },
  { value: "em_andamento", label: "Em Andamento" },
  { value: "concluida", label: "Concluída" },
  { value: "cancelada", label: "Cancelada" },
];

const tipoManutLabels: Record<string, string> = {
  preventiva: "Preventiva",
  corretiva: "Corretiva",
  urgente: "Urgente",
};

const statusManutLabels: Record<string, string> = {
  solicitada: "Solicitada",
  em_andamento: "Em Andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

const tipoManutColors: Record<string, string> = {
  preventiva: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  corretiva: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  urgente: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const statusManutColors: Record<string, string> = {
  solicitada: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400",
  em_andamento: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  concluida: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelada: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

interface ManutencaoWithBem extends ManutencaoBem {
  bens_patrimoniais?: { nome: string; numero_tombo: string | null } | null;
}

const formatCurrency = (value: number | null) => {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("pt-BR");
};

function ManutencaoBensPage() {
  const [manutencoes, setManutencoes] = useState<ManutencaoWithBem[]>([]);
  const [bens, setBens] = useState<{ id: string; nome: string; numero_tombo: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<ManutencaoWithBem | null>(null);
  const [formData, setFormData] = useState({
    bem_id: "",
    unidade_id: "",
    tipo: "preventiva" as ManutencaoBem["tipo"],
    descricao: "",
    data_solicitacao: new Date().toISOString().split("T")[0],
    data_inicio: "",
    data_conclusao: "",
    responsavel: "",
    custo: "",
    status: "solicitada" as ManutencaoBem["status"],
    observacoes: "",
  });
  const [formError, setFormError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [manutRes, bensRes] = await Promise.all([
        supabase.from("manutencoes_bens").select("*, bens_patrimoniais(nome, numero_tombo)").order("data_solicitacao", { ascending: false }),
        supabase.from("bens_patrimoniais").select("id, nome, numero_tombo").eq("status", "ativo"),
      ]);
      if (manutRes.data) setManutencoes(manutRes.data as ManutencaoWithBem[]);
      if (bensRes.data) setBens(bensRes.data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { let c = false; queueMicrotask(() => { if (!c) fetchData(); }); return () => { c = true; }; }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setFormData({
      bem_id: bens[0]?.id || "",
      unidade_id: "",
      tipo: "preventiva" as ManutencaoBem["tipo"],
      descricao: "",
      data_solicitacao: new Date().toISOString().split("T")[0],
      data_inicio: "",
      data_conclusao: "",
      responsavel: "",
      custo: "",
      status: "solicitada" as ManutencaoBem["status"],
      observacoes: "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (manut: ManutencaoWithBem) => {
    setEditing(manut);
    setFormData({
      bem_id: manut.bem_id,
      unidade_id: manut.unidade_id,
      tipo: manut.tipo,
      descricao: manut.descricao || "",
      data_solicitacao: manut.data_solicitacao.split("T")[0],
      data_inicio: manut.data_inicio?.split("T")[0] || "",
      data_conclusao: manut.data_conclusao?.split("T")[0] || "",
      responsavel: manut.responsavel || "",
      custo: manut.custo?.toString() || "",
      status: manut.status,
      observacoes: manut.observacoes || "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.bem_id || !formData.tipo) {
      setFormError("Bem e Tipo são obrigatórios.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        bem_id: formData.bem_id,
        unidade_id: formData.unidade_id || null,
        tipo: formData.tipo,
        descricao: formData.descricao || null,
        data_solicitacao: formData.data_solicitacao,
        data_inicio: formData.data_inicio || null,
        data_conclusao: formData.data_conclusao || null,
        responsavel: formData.responsavel || null,
        custo: formData.custo ? Number(formData.custo) : null,
        status: formData.status,
        observacoes: formData.observacoes || null,
      };

      if (editing) {
        const { error } = await supabase.from("manutencoes_bens").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("manutencoes_bens").insert(payload);
        if (error) throw error;
      }
      setModalOpen(false);
      fetchData();
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("manutencoes_bens").delete().eq("id", deleteConfirm);
      if (error) throw error;
      setDeleteConfirm(null);
      fetchData();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Erro ao excluir.");
    } finally {
      setSaving(false);
    }
  };

  const filtered = manutencoes.filter((manut) => {
    const bemNome = manut.bens_patrimoniais?.nome?.toLowerCase() || "";
    const matchSearch = bemNome.includes(search.toLowerCase()) || (manut.responsavel?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "todos" || manut.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manutenção de Bens</h1>
          <p className="text-muted-foreground mt-1">Gerencie solicitações de manutenção preventiva, corretiva e urgente</p>
        </div>
        <Button onClick={openCreate}>+ Nova Solicitação</Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input placeholder="Buscar por bem ou responsável..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="w-full sm:w-48">
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="todos">Todos os Status</option>
                {STATUS_MANUT_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">Nenhuma solicitação encontrada.</CardContent>
          </Card>
        ) : (
          filtered.map((manut, index) => (
            <motion.div key={manut.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-lg">{manut.bens_patrimoniais?.nome || "Bem não encontrado"}</h3>
                        <Badge className={cn("text-xs", tipoManutColors[manut.tipo])}>{tipoManutLabels[manut.tipo]}</Badge>
                        <Badge className={cn("text-xs", statusManutColors[manut.status])}>{statusManutLabels[manut.status]}</Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                        <span>Solicitação: <strong>{formatDate(manut.data_solicitacao)}</strong></span>
                        {manut.data_inicio && <span>Início: <strong>{formatDate(manut.data_inicio)}</strong></span>}
                        {manut.data_conclusao && <span>Conclusão: <strong>{formatDate(manut.data_conclusao)}</strong></span>}
                        {manut.responsavel && <span>Resp.: <strong>{manut.responsavel}</strong></span>}
                        {manut.custo !== null && <span>Custo: <strong>{formatCurrency(manut.custo)}</strong></span>}
                      </div>
                      {manut.descricao && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{manut.descricao}</p>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(manut)}>Editar</Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => setDeleteConfirm(manut.id)}>Excluir</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar Solicitação" : "Nova Solicitação de Manutenção"} size="xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
          <Select label="Bem *" options={bens.map((b) => ({ value: b.id, label: `${b.nome}${b.numero_tombo ? ` (${b.numero_tombo})` : ""}` }))} value={formData.bem_id} onChange={(e) => setFormData({ ...formData, bem_id: e.target.value })} />
          <Select label="Tipo *" options={TIPO_MANUT_OPTIONS} value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value as ManutencaoBem["tipo"] })} />
          <Select label="Status" options={STATUS_MANUT_OPTIONS} value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as ManutencaoBem["status"] })} />
          <Input label="Data de Solicitação" type="date" value={formData.data_solicitacao} onChange={(e) => setFormData({ ...formData, data_solicitacao: e.target.value })} />
          <Input label="Data de Início" type="date" value={formData.data_inicio} onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })} />
          <Input label="Data de Conclusão" type="date" value={formData.data_conclusao} onChange={(e) => setFormData({ ...formData, data_conclusao: e.target.value })} />
          <Input label="Responsável" value={formData.responsavel} onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })} placeholder="Nome do responsável" />
          <Input label="Custo (R$)" type="number" value={formData.custo} onChange={(e) => setFormData({ ...formData, custo: e.target.value })} placeholder="0,00" />
          <div className="sm:col-span-2">
            <Textarea label="Descrição" value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} placeholder="Descreva o serviço de manutenção necessário..." />
          </div>
          <div className="sm:col-span-2">
            <Textarea label="Observações" value={formData.observacoes} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} placeholder="Observações adicionais..." />
          </div>
        </div>
        {formError && <p className="text-sm text-red-500 mb-4">{formError}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : (editing ? "Atualizar" : "Cadastrar")}</Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmar Exclusão">
        <p className="text-muted-foreground py-4">Tem certeza que deseja excluir esta solicitação de manutenção?</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={saving}>{saving ? "Excluindo..." : "Excluir"}</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

export { ManutencaoBensPage };
export default ManutencaoBensPage;
