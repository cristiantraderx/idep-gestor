import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { MovimentacaoBem, Unidade } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const TIPO_MOV_OPTIONS = [
  { value: "transferencia", label: "Transferência" },
  { value: "emprestimo", label: "Empréstimo" },
  { value: "devolucao", label: "Devolução" },
  { value: "baixa", label: "Baixa" },
];

const tipoMovLabels: Record<string, string> = {
  transferencia: "Transferência",
  emprestimo: "Empréstimo",
  devolucao: "Devolução",
  baixa: "Baixa",
};

const tipoMovColors: Record<string, string> = {
  transferencia: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  emprestimo: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  devolucao: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  baixa: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

interface MovimentacaoWithBem extends MovimentacaoBem {
  bens_patrimoniais?: { nome: string; numero_tombo: string | null } | null;
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("pt-BR");
};

function MovimentacoesBensPage() {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoWithBem[]>([]);
  const [bens, setBens] = useState<{ id: string; nome: string; numero_tombo: string | null }[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("todos");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<MovimentacaoWithBem | null>(null);
  const [formData, setFormData] = useState({
    bem_id: "",
    unidade_id: "",
    tipo: "transferencia" as MovimentacaoBem["tipo"],
    data_movimentacao: new Date().toISOString().split("T")[0],
    origem: "",
    destino: "",
    responsavel: "",
    observacoes: "",
  });
  const [formError, setFormError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [movRes, bensRes, unidRes] = await Promise.all([
        supabase.from("movimentacoes_bens").select("*, bens_patrimoniais(nome, numero_tombo)").order("data_movimentacao", { ascending: false }),
        supabase.from("bens_patrimoniais").select("id, nome, numero_tombo").eq("status", "ativo"),
        supabase.from("unidades").select("*"),
      ]);
      if (movRes.data) setMovimentacoes(movRes.data as MovimentacaoWithBem[]);
      if (bensRes.data) setBens(bensRes.data);
      if (unidRes.data) setUnidades(unidRes.data);
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
      unidade_id: unidades[0]?.id || "",
      tipo: "transferencia" as MovimentacaoBem["tipo"],
      data_movimentacao: new Date().toISOString().split("T")[0],
      origem: "",
      destino: "",
      responsavel: "",
      observacoes: "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (mov: MovimentacaoWithBem) => {
    setEditing(mov);
    setFormData({
      bem_id: mov.bem_id,
      unidade_id: mov.unidade_id,
      tipo: mov.tipo,
      data_movimentacao: mov.data_movimentacao.split("T")[0],
      origem: mov.origem || "",
      destino: mov.destino || "",
      responsavel: mov.responsavel || "",
      observacoes: mov.observacoes || "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.bem_id || !formData.unidade_id || !formData.tipo) {
      setFormError("Bem, Unidade e Tipo são obrigatórios.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        bem_id: formData.bem_id,
        unidade_id: formData.unidade_id,
        tipo: formData.tipo,
        data_movimentacao: formData.data_movimentacao,
        origem: formData.origem || null,
        destino: formData.destino || null,
        responsavel: formData.responsavel || null,
        observacoes: formData.observacoes || null,
      };

      if (editing) {
        const { error } = await supabase.from("movimentacoes_bens").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("movimentacoes_bens").insert(payload);
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
      const { error } = await supabase.from("movimentacoes_bens").delete().eq("id", deleteConfirm);
      if (error) throw error;
      setDeleteConfirm(null);
      fetchData();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Erro ao excluir.");
    } finally {
      setSaving(false);
    }
  };

  const filtered = movimentacoes.filter((mov) => {
    const bemNome = mov.bens_patrimoniais?.nome?.toLowerCase() || "";
    const matchSearch = bemNome.includes(search.toLowerCase());
    const matchTipo = tipoFilter === "todos" || mov.tipo === tipoFilter;
    return matchSearch && matchTipo;
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
          <h1 className="text-3xl font-bold tracking-tight">Movimentações de Bens</h1>
          <p className="text-muted-foreground mt-1">Registre transferências, empréstimos, devoluções e baixas</p>
        </div>
        <Button onClick={openCreate}>+ Nova Movimentação</Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input placeholder="Buscar por nome do bem..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="w-full sm:w-48">
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)}>
                <option value="todos">Todos os Tipos</option>
                {TIPO_MOV_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">Nenhuma movimentação encontrada.</CardContent>
          </Card>
        ) : (
          filtered.map((mov, index) => (
            <motion.div key={mov.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-lg">{mov.bens_patrimoniais?.nome || "Bem não encontrado"}</h3>
                        <Badge className={cn("text-xs", tipoMovColors[mov.tipo])}>{tipoMovLabels[mov.tipo]}</Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                        <span>Data: <strong>{formatDate(mov.data_movimentacao)}</strong></span>
                        {mov.origem && <span>Origem: <strong>{mov.origem}</strong></span>}
                        {mov.destino && <span>Destino: <strong>{mov.destino}</strong></span>}
                        {mov.responsavel && <span>Resp.: <strong>{mov.responsavel}</strong></span>}
                      </div>
                      {mov.observacoes && <p className="mt-1 text-sm text-muted-foreground italic">"{mov.observacoes}"</p>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(mov)}>Editar</Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => setDeleteConfirm(mov.id)}>Excluir</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar Movimentação" : "Nova Movimentação"} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
          <Select label="Bem *" options={bens.map((b) => ({ value: b.id, label: `${b.nome}${b.numero_tombo ? ` (${b.numero_tombo})` : ""}` }))} value={formData.bem_id} onChange={(e) => setFormData({ ...formData, bem_id: e.target.value })} />
          <Select label="Unidade *" options={unidades.map((u) => ({ value: u.id, label: u.nome || u.sigla || u.id }))} value={formData.unidade_id} onChange={(e) => setFormData({ ...formData, unidade_id: e.target.value })} />
          <Select label="Tipo *" options={TIPO_MOV_OPTIONS} value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value as MovimentacaoBem["tipo"] })} />
          <Input label="Data da Movimentação" type="date" value={formData.data_movimentacao} onChange={(e) => setFormData({ ...formData, data_movimentacao: e.target.value })} />
          <Input label="Origem" value={formData.origem} onChange={(e) => setFormData({ ...formData, origem: e.target.value })} placeholder="Ex: Bloco A, Sala 101" />
          <Input label="Destino" value={formData.destino} onChange={(e) => setFormData({ ...formData, destino: e.target.value })} placeholder="Ex: Bloco B, Sala 205" />
          <div className="sm:col-span-2">
            <Input label="Responsável" value={formData.responsavel} onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })} placeholder="Nome do responsável pela movimentação" />
          </div>
          <div className="sm:col-span-2">
            <Textarea label="Observações" value={formData.observacoes} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} placeholder="Observações sobre a movimentação..." />
          </div>
        </div>
        {formError && <p className="text-sm text-red-500 mb-4">{formError}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : (editing ? "Atualizar" : "Cadastrar")}</Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmar Exclusão">
        <p className="text-muted-foreground py-4">Tem certeza que deseja excluir esta movimentação?</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={saving}>{saving ? "Excluindo..." : "Excluir"}</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

export { MovimentacoesBensPage };
export default MovimentacoesBensPage;
