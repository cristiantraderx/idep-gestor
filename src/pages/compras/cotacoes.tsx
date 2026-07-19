import { useState, useEffect, useCallback } from "react";
import { ShoppingCart, Plus, Search, Loader2, Edit3, Trash2, RefreshCw, CalendarDays, DollarSign, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { Cotacao, Unidade } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatFullDate, formatCurrency } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "solicitada", label: "Solicitada" }, { value: "recebida", label: "Recebida" },
  { value: "aprovada", label: "Aprovada" }, { value: "rejeitada", label: "Rejeitada" }, { value: "cancelada", label: "Cancelada" },
];
const statusVariant: Record<string, "success" | "warning" | "default" | "destructive" | "secondary"> = {
  solicitada: "default", recebida: "warning", aprovada: "success", rejeitada: "destructive", cancelada: "destructive",
};

export function CotacoesPage() {
  const [data, setData] = useState<(Cotacao & { unidade_nome?: string })[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todas");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Cotacao | null>(null);
  const [form, setForm] = useState({ fornecedor_nome: "", fornecedor_cnpj: "", descricao_itens: "", valor_total: "", data_cotacao: new Date().toISOString().split("T")[0], data_validade: "", prazo_entrega: "", status: "solicitada" as Cotacao["status"], observacoes: "", unidade_id: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [res, unidRes] = await Promise.all([
        supabase.from("cotacoes").select("*, unidades(nome, sigla)").order("created_at", { ascending: false }),
        supabase.from("unidades").select("*").eq("ativo", true).order("nome"),
      ]);
      if (res.data) setData((res.data as Record<string, unknown>[]).map((i: Record<string, unknown>) => ({ ...i, unidade_nome: (i.unidades as Record<string, unknown> | undefined)?.nome as string || "Não definida" })));
      if (unidRes.data) setUnidades(unidRes.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);  useEffect(() => { let c = false; queueMicrotask(() => { if (!c) fetchData(); }); return () => { c = true; }; }, [fetchData]);
  const unidadeOptions = unidades.map((u) => ({ value: u.id, label: `${u.nome} (${u.sigla})` }));

  const openCreate = () => { setEditing(null); setForm({ fornecedor_nome: "", fornecedor_cnpj: "", descricao_itens: "", valor_total: "", data_cotacao: new Date().toISOString().split("T")[0], data_validade: "", prazo_entrega: "", status: "solicitada", observacoes: "", unidade_id: "" }); setFormError(""); setModalOpen(true); };
  const openEdit = (i: Cotacao) => { setEditing(i); setForm({ fornecedor_nome: i.fornecedor_nome, fornecedor_cnpj: i.fornecedor_cnpj || "", descricao_itens: i.descricao_itens || "", valor_total: i.valor_total?.toString() || "", data_cotacao: i.data_cotacao.split("T")[0], data_validade: i.data_validade?.split("T")[0] || "", prazo_entrega: i.prazo_entrega || "", status: i.status, observacoes: i.observacoes || "", unidade_id: i.unidade_id }); setFormError(""); setModalOpen(true); };

  const handleSave = async () => {
    setFormError(""); if (!form.fornecedor_nome.trim() || !form.unidade_id) { setFormError("Fornecedor e unidade são obrigatórios."); return; }
    setSaving(true);
    try {
      const payload = { fornecedor_nome: form.fornecedor_nome, fornecedor_cnpj: form.fornecedor_cnpj || null, descricao_itens: form.descricao_itens || null, valor_total: form.valor_total ? parseFloat(form.valor_total) : null, data_cotacao: form.data_cotacao, data_validade: form.data_validade || null, prazo_entrega: form.prazo_entrega || null, status: form.status, observacoes: form.observacoes || null, unidade_id: form.unidade_id };
      if (editing) { const { error } = await supabase.from("cotacoes").update(payload).eq("id", editing.id); if (error) { setFormError(error.message); return; } }
      else { const { error } = await supabase.from("cotacoes").insert(payload); if (error) { setFormError(error.message); return; } }
      setModalOpen(false); fetchData();
    } catch (err: unknown) { setFormError(err instanceof Error ? err.message : "Erro"); } finally { setSaving(false); }
  };
  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("cotacoes").delete().eq("id", id);
    if (!error) { setData((p) => p.filter((i) => i.id !== id)); setDeleteConfirm(null); }
  };

  const filtered = data.filter((i) => {
    const m = search.toLowerCase();
    const match = i.fornecedor_nome.toLowerCase().includes(m) || (i.descricao_itens || "").toLowerCase().includes(m);
    if (statusFilter !== "todas") return match && i.status === statusFilter;
    return match;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="rounded-xl p-3 bg-orange-50 dark:bg-orange-950/50 text-orange-600"><ShoppingCart className="h-6 w-6" /></div>
          <div><h2 className="page-title">Cotações</h2><p className="page-subtitle mt-1">Registro de cotações e orçamentos de fornecedores</p></div>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Nova Cotação</Button>
      </div>
      <Card><CardContent className="p-4"><div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input type="text" placeholder="Buscar por fornecedor..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-xs" /></div>
        <div className="flex items-center gap-2 flex-wrap">
          {[{ v: "todas", l: "Todas" }, { v: "solicitada", l: "Solicitadas" }, { v: "recebida", l: "Recebidas" }, { v: "aprovada", l: "Aprovadas" }].map((o) => (
            <button key={o.v} onClick={() => setStatusFilter(o.v)} className={cn("rounded-full px-3 py-1 text-[11px] font-medium transition-all", statusFilter === o.v ? "bg-idep-700 text-white" : "bg-muted text-muted-foreground hover:text-foreground border border-border")}>{o.l}</button>
          ))}
          <Button variant="ghost" size="icon-sm" onClick={fetchData}><RefreshCw className="h-3.5 w-3.5" /></Button>
        </div>
      </div></CardContent></Card>
      <Card><CardContent className="p-0">
        {loading ? <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        : filtered.length === 0 ? <div className="flex flex-col items-center justify-center py-16 text-center"><ShoppingCart className="h-10 w-10 text-muted-foreground/50 mb-3" /><p className="text-sm font-medium text-foreground">Nenhuma cotação encontrada</p></div>
        : <div className="divide-y divide-border">{filtered.map((item, index) => (<motion.div key={item.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }} className="group flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-4 hover:bg-accent/30 transition-colors">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground truncate">{item.fornecedor_nome}</p>
              <Badge variant={statusVariant[item.status]} className="text-[9px] px-1.5 py-0 h-4">{STATUS_OPTIONS.find((s) => s.value === item.status)?.label}</Badge>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
              {item.descricao_itens && <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><FileText className="h-3 w-3" />{item.descricao_itens.substring(0, 60)}</span>}
              {item.valor_total && <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><DollarSign className="h-3 w-3" />{formatCurrency(item.valor_total)}</span>}
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><CalendarDays className="h-3 w-3" />{formatFullDate(item.data_cotacao)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => openEdit(item)} className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><Edit3 className="h-3.5 w-3.5" /></button>
            <button onClick={() => setDeleteConfirm(item.id)} className="rounded p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        </motion.div>))}</div>}
      </CardContent></Card>
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar Cotação" : "Nova Cotação"} size="xl"><div className="space-y-4">
        {formError && <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{formError}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Fornecedor *" value={form.fornecedor_nome} onChange={(e) => setForm({ ...form, fornecedor_nome: e.target.value })} placeholder="Nome do fornecedor" disabled={saving} />
          <Input label="CNPJ" value={form.fornecedor_cnpj} onChange={(e) => setForm({ ...form, fornecedor_cnpj: e.target.value })} placeholder="00.000.000/0000-00" disabled={saving} />
        </div>
        <Textarea label="Itens / Descrição" value={form.descricao_itens} onChange={(e) => setForm({ ...form, descricao_itens: e.target.value })} rows={3} disabled={saving} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="Valor Total (R$)" type="number" value={form.valor_total} onChange={(e) => setForm({ ...form, valor_total: e.target.value })} disabled={saving} />
          <Input label="Prazo de Entrega" value={form.prazo_entrega} onChange={(e) => setForm({ ...form, prazo_entrega: e.target.value })} placeholder="Ex: 30 dias" disabled={saving} />
          <Select label="Unidade *" options={unidadeOptions} placeholder="Selecione" value={form.unidade_id} onChange={(e) => setForm({ ...form, unidade_id: e.target.value })} disabled={saving} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Data da Cotação" type="date" value={form.data_cotacao} onChange={(e) => setForm({ ...form, data_cotacao: e.target.value })} disabled={saving} />
          <Input label="Data de Validade" type="date" value={form.data_validade} onChange={(e) => setForm({ ...form, data_validade: e.target.value })} disabled={saving} />
        </div>
        {editing && <Select label="Status" options={STATUS_OPTIONS} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Cotacao["status"] })} disabled={saving} />}
        <Textarea label="Observações" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={2} disabled={saving} />
        <DialogFooter><Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button><Button onClick={handleSave} disabled={saving} className="gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{editing ? "Salvar" : "Criar"}</Button></DialogFooter>
      </div></Dialog>
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmar exclusão" description="Tem certeza?" size="sm"><DialogFooter><Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button><Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="gap-2"><Trash2 className="h-4 w-4" /> Excluir</Button></DialogFooter></Dialog>
    </motion.div>
  );
}
