import { useState, useEffect, useCallback } from "react";
import {
  TrendingDown,
  Plus,
  Search,
  Loader2,
  Edit3,
  Trash2,
  RefreshCw,
  CalendarDays,
  Building2,
  DollarSign,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { Unidade } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatFullDate } from "@/lib/utils";

const CATEGORIA_OPTIONS = [
  { value: "pessoal", label: "Pessoal" },
  { value: "material", label: "Material" },
  { value: "servico", label: "Serviço" },
  { value: "utilidade", label: "Utilidade" },
  { value: "investimento", label: "Investimento" },
  { value: "outros", label: "Outros" },
];

const categoriaColors: Record<string, string> = {
  pessoal: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
  material: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  servico: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  utilidade: "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
  investimento: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  outros: "bg-muted text-muted-foreground",
};

export function DespesasPage() {
  const [despesas, setDespesas] = useState<any[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("todas");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDespesa, setEditingDespesa] = useState<any>(null);
  const [formData, setFormData] = useState({
    descricao: "",
    valor: "",
    data_pagamento: new Date().toISOString().split("T")[0],
    categoria: "servico",
    empenho_id: "",
    documento: "",
    unidade_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [despesasRes, unidadesRes] = await Promise.all([
        supabase.from("despesas").select("*, unidades(nome, sigla)").order("data_pagamento", { ascending: false }),
        supabase.from("unidades").select("*").eq("ativo", true).order("nome"),
      ]);

      if (despesasRes.data) {
        setDespesas(
          (despesasRes.data as any[]).map((d) => ({
            ...d,
            unidade_nome: d.unidades?.nome || "Não definida",
          }))
        );
      }
      if (unidadesRes.data) setUnidades(unidadesRes.data);
    } catch (err) {
      console.error("Erro ao carregar despesas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const unidadeOptions = unidades.map((u) => ({ value: u.id, label: `${u.nome} (${u.sigla})` }));

  const openCreateModal = () => {
    setEditingDespesa(null);
    setFormData({
      descricao: "",
      valor: "",
      data_pagamento: new Date().toISOString().split("T")[0],
      categoria: "servico",
      empenho_id: "",
      documento: "",
      unidade_id: "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (desp: any) => {
    setEditingDespesa(desp);
    setFormData({
      descricao: desp.descricao,
      valor: desp.valor?.toString() || "",
      data_pagamento: desp.data_pagamento?.split("T")[0] || "",
      categoria: desp.categoria || "servico",
      empenho_id: desp.empenho_id || "",
      documento: desp.documento || "",
      unidade_id: desp.unidade_id,
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSave = async () => {
    setFormError("");
    if (!formData.descricao.trim() || !formData.unidade_id || !formData.valor) {
      setFormError("Descrição, valor e unidade são obrigatórios.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        descricao: formData.descricao,
        valor: parseFloat(formData.valor),
        data_pagamento: formData.data_pagamento,
        categoria: formData.categoria || null,
        empenho_id: formData.empenho_id || null,
        documento: formData.documento || null,
        unidade_id: formData.unidade_id,
      };

      if (editingDespesa) {
        const { error } = await supabase.from("despesas").update(payload).eq("id", editingDespesa.id);
        if (error) { setFormError(error.message); return; }
      } else {
        const { error } = await supabase.from("despesas").insert(payload);
        if (error) { setFormError(error.message); return; }
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || "Erro ao salvar despesa");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("despesas").delete().eq("id", id);
    if (!error) {
      setDespesas((prev) => prev.filter((d) => d.id !== id));
      setDeleteConfirm(null);
    }
  };

  const totalDespesas = despesas.reduce((acc, d) => acc + (d.valor || 0), 0);

  const filtered = despesas.filter((d) => {
    const matchesSearch =
      d.descricao.toLowerCase().includes(search.toLowerCase()) ||
      (d.empenho_id && d.empenho_id.toLowerCase().includes(search.toLowerCase())) ||
      (d.documento && d.documento.includes(search));
    if (categoriaFilter !== "todas") return matchesSearch && d.categoria === categoriaFilter;
    return matchesSearch;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="rounded-xl p-3 bg-red-50 dark:bg-red-950/50 text-red-600">
            <TrendingDown className="h-6 w-6" />
          </div>
          <div>
            <h2 className="page-title">Despesas</h2>
            <p className="page-subtitle mt-1">Controle todas as despesas da instituição</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground mr-2">
            Total: <strong className="text-red-600">{formatCurrency(totalDespesas)}</strong>
          </div>
          <Button onClick={openCreateModal} className="gap-2">
            <Plus className="h-4 w-4" /> Nova Despesa
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="Buscar por descrição, empenho ou documento..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div className="flex items-center gap-2">
              <select value={categoriaFilter} onChange={(e) => setCategoriaFilter(e.target.value)}
                className="h-7 rounded-lg border border-input bg-background px-2 text-[10px] font-medium text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="todas">Todas categorias</option>
                {CATEGORIA_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
              <Button variant="ghost" size="icon-sm" onClick={fetchData}><RefreshCw className="h-3.5 w-3.5" /></Button>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{filtered.length} registro{filtered.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <TrendingDown className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-foreground">{search ? "Nenhuma despesa encontrada" : "Nenhuma despesa cadastrada"}</p>
              <p className="text-xs text-muted-foreground mt-1">{search ? "Tente alterar os termos da busca" : "Clique em \"Nova Despesa\" para cadastrar"}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((desp, index) => (
                <motion.div key={desp.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="group flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-4 hover:bg-accent/30 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="rounded-lg p-2 bg-red-50 dark:bg-red-950/50 shrink-0">
                      <DollarSign className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{desp.descricao}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${categoriaColors[desp.categoria] || categoriaColors.outros}`}>
                          {CATEGORIA_OPTIONS.find((c) => c.value === desp.categoria)?.label || desp.categoria}
                        </span>
                        {desp.empenho_id && <span className="text-[11px] text-muted-foreground font-mono">Empenho: {desp.empenho_id}</span>}
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <CalendarDays className="h-3 w-3" />
                          {formatFullDate(desp.data_pagamento)}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          {desp.unidade_nome}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold text-red-600">{formatCurrency(desp.valor)}</span>
                    <button onClick={() => openEditModal(desp)}
                      className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleteConfirm(desp.id)}
                      className="rounded p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)}
        title={editingDespesa ? "Editar Despesa" : "Nova Despesa"}
        description={editingDespesa ? `Editando: ${editingDespesa.descricao}` : "Registre uma nova despesa"} size="lg">
        <div className="space-y-4">
          {formError && (<div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{formError}</div>)}
          <Textarea label="Descrição *" value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            placeholder="Ex: Manutenção de equipamentos" rows={2} disabled={saving} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Valor *" type="number" step="0.01" value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
              placeholder="Ex: 2500.00" disabled={saving} />
            <Input label="Data de pagamento *" type="date" value={formData.data_pagamento}
              onChange={(e) => setFormData({ ...formData, data_pagamento: e.target.value })} disabled={saving} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Categoria" options={CATEGORIA_OPTIONS} value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })} disabled={saving} />
            <Input label="Empenho" value={formData.empenho_id}
              onChange={(e) => setFormData({ ...formData, empenho_id: e.target.value })}
              placeholder="Ex: EMP-2024-00123" disabled={saving} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Documento" value={formData.documento}
              onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
              placeholder="Ex: NF 00456" disabled={saving} />
            <Select label="Unidade *" options={unidadeOptions} placeholder="Selecione a unidade"
              value={formData.unidade_id} onChange={(e) => setFormData({ ...formData, unidade_id: e.target.value })} disabled={saving} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingDespesa ? "Salvar alterações" : "Registrar despesa"}
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmar exclusão"
        description="Tem certeza que deseja excluir esta despesa?" size="sm">
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="gap-2">
            <Trash2 className="h-4 w-4" /> Excluir
          </Button>
        </DialogFooter>
      </Dialog>
    </motion.div>
  );
}
