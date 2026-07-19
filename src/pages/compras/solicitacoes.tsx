import { useState, useEffect, useCallback } from "react";
import { ShoppingCart, Plus, Search, Loader2, Edit3, Trash2, RefreshCw, User, CalendarDays } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { SolicitacaoCompra, Unidade } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatFullDate } from "@/lib/utils";

const PRIORIDADE_OPTIONS = [
  { value: "baixa", label: "Baixa" }, { value: "media", label: "Média" },
  { value: "alta", label: "Alta" }, { value: "urgente", label: "Urgente" },
];
const STATUS_OPTIONS = [
  { value: "rascunho", label: "Rascunho" }, { value: "enviada", label: "Enviada" },
  { value: "em_analise", label: "Em Análise" }, { value: "aprovada", label: "Aprovada" },
  { value: "rejeitada", label: "Rejeitada" }, { value: "cancelada", label: "Cancelada" },
];
const statusVariant: Record<string, "success" | "warning" | "default" | "destructive" | "secondary"> = {
  rascunho: "secondary", enviada: "default", em_analise: "warning",
  aprovada: "success", rejeitada: "destructive", cancelada: "destructive",
};
const prioridadeColor: Record<string, string> = {
  baixa: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  media: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  alta: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  urgente: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
};

export function SolicitacoesCompraPage() {
  const [data, setData] = useState<(SolicitacaoCompra & { unidade_nome?: string })[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todas");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SolicitacaoCompra | null>(null);
  const [form, setForm] = useState({ solicitante_nome: "", descricao: "", justificativa: "", prioridade: "media" as SolicitacaoCompra["prioridade"], status: "rascunho" as SolicitacaoCompra["status"], data_solicitacao: new Date().toISOString().split("T")[0], observacoes: "", unidade_id: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [res, unidRes] = await Promise.all([
        supabase.from("solicitacoes_compra").select("*, unidades(nome, sigla)").order("created_at", { ascending: false }),
        supabase.from("unidades").select("*").eq("ativo", true).order("nome"),
      ]);
      if (res.data) setData((res.data as Record<string, unknown>[]).map((i: Record<string, unknown>) => ({ ...i, unidade_nome: (i.unidades as Record<string, unknown> | undefined)?.nome as string || "Não definida" })));
      if (unidRes.data) setUnidades(unidRes.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);  useEffect(() => { let c = false; queueMicrotask(() => { if (!c) fetchData(); }); return () => { c = true; }; }, [fetchData]);
  const unidadeOptions = unidades.map((u) => ({ value: u.id, label: `${u.nome} (${u.sigla})` }));

  const openCreate = () => { setEditing(null); setForm({ solicitante_nome: "", descricao: "", justificativa: "", prioridade: "media", status: "rascunho", data_solicitacao: new Date().toISOString().split("T")[0], observacoes: "", unidade_id: "" }); setFormError(""); setModalOpen(true); };
  const openEdit = (i: SolicitacaoCompra) => { setEditing(i); setForm({ solicitante_nome: i.solicitante_nome, descricao: i.descricao || "", justificativa: i.justificativa || "", prioridade: i.prioridade, status: i.status, data_solicitacao: i.data_solicitacao.split("T")[0], observacoes: i.observacoes || "", unidade_id: i.unidade_id }); setFormError(""); setModalOpen(true); };

  const handleSave = async () => {
    setFormError("");
    if (!form.solicitante_nome.trim() || !form.unidade_id) { setFormError("Solicitante e unidade são obrigatórios."); return; }
    setSaving(true);
    try {
      const payload = { solicitante_nome: form.solicitante_nome, descricao: form.descricao || null, justificativa: form.justificativa || null, prioridade: form.prioridade, status: form.status, data_solicitacao: form.data_solicitacao, observacoes: form.observacoes || null, unidade_id: form.unidade_id };
      if (editing) { const { error } = await supabase.from("solicitacoes_compra").update(payload).eq("id", editing.id); if (error) { setFormError(error.message); return; } }
      else { const { error } = await supabase.from("solicitacoes_compra").insert(payload); if (error) { setFormError(error.message); return; } }
      setModalOpen(false); fetchData();
    } catch (err: unknown) { setFormError(err instanceof Error ? err.message : "Erro"); } finally { setSaving(false); }
  };
  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("solicitacoes_compra").delete().eq("id", id);
    if (!error) { setData((p) => p.filter((i) => i.id !== id)); setDeleteConfirm(null); }
  };

  const filtered = data.filter((i) => {
    const m = search.toLowerCase();
    const match = i.solicitante_nome.toLowerCase().includes(m) || (i.descricao || "").toLowerCase().includes(m);
    if (statusFilter !== "todas") return match && i.status === statusFilter;
    return match;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="rounded-xl p-3 bg-orange-50 dark:bg-orange-950/50 text-orange-600"><ShoppingCart className="h-6 w-6" /></div>
          <div><h2 className="page-title">Solicitações de Compra</h2><p className="page-subtitle mt-1">Solicitações de compra de materiais e serviços</p></div>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Nova Solicitação</Button>
      </div>
      <Card><CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Buscar por solicitante ou descrição..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-xs" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {[{ v: "todas", l: "Todas" }, { v: "rascunho", l: "Rascunhos" }, { v: "enviada", l: "Enviadas" }, { v: "aprovada", l: "Aprovadas" }].map((o) => (
              <button key={o.v} onClick={() => setStatusFilter(o.v)} className={cn("rounded-full px-3 py-1 text-[11px] font-medium transition-all", statusFilter === o.v ? "bg-idep-700 text-white" : "bg-muted text-muted-foreground hover:text-foreground border border-border")}>{o.l}</button>
            ))}
            <Button variant="ghost" size="icon-sm" onClick={fetchData}><RefreshCw className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      </CardContent></Card>
      <Card><CardContent className="p-0">
        {loading ? <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        : filtered.length === 0 ? <div className="flex flex-col items-center justify-center py-16 text-center"><ShoppingCart className="h-10 w-10 text-muted-foreground/50 mb-3" /><p className="text-sm font-medium text-foreground">{search ? "Nenhuma solicitação encontrada" : "Nenhuma solicitação cadastrada"}</p><p className="text-xs text-muted-foreground mt-1">Clique em 'Nova Solicitação' para cadastrar</p></div>
        : <div className="divide-y divide-border">{filtered.map((item, index) => (<motion.div key={item.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }} className="group flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-4 hover:bg-accent/30 transition-colors">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground truncate">{(item.descricao || item.solicitante_nome)}</p>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${prioridadeColor[item.prioridade]}`}>{PRIORIDADE_OPTIONS.find((o) => o.value === item.prioridade)?.label}</span>
              <Badge variant={statusVariant[item.status]} className="text-[9px] px-1.5 py-0 h-4">{STATUS_OPTIONS.find((s) => s.value === item.status)?.label}</Badge>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><User className="h-3 w-3" />{item.solicitante_nome}</span>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><CalendarDays className="h-3 w-3" />{formatFullDate(item.data_solicitacao)}</span>
              <span className="text-[11px] text-muted-foreground">{item.unidade_nome}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => openEdit(item)} className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><Edit3 className="h-3.5 w-3.5" /></button>
            <button onClick={() => setDeleteConfirm(item.id)} className="rounded p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        </motion.div>))}</div>}
      </CardContent></Card>
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar Solicitação" : "Nova Solicitação"} size="xl"><div className="space-y-4">
        {formError && <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{formError}</div>}
        <Input label="Solicitante *" value={form.solicitante_nome} onChange={(e) => setForm({ ...form, solicitante_nome: e.target.value })} placeholder="Nome do solicitante" disabled={saving} />
        <Textarea label="Descrição dos itens" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descreva os itens ou serviços solicitados..." rows={3} disabled={saving} />
        <Textarea label="Justificativa" value={form.justificativa} onChange={(e) => setForm({ ...form, justificativa: e.target.value })} placeholder="Justificativa da solicitação..." rows={2} disabled={saving} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Prioridade *" options={PRIORIDADE_OPTIONS} value={form.prioridade} onChange={(e) => setForm({ ...form, prioridade: e.target.value as SolicitacaoCompra["prioridade"] })} disabled={saving} />
          <Select label="Unidade *" options={unidadeOptions} placeholder="Selecione" value={form.unidade_id} onChange={(e) => setForm({ ...form, unidade_id: e.target.value })} disabled={saving} />
        </div>
        {editing && <Select label="Status" options={STATUS_OPTIONS} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as SolicitacaoCompra["status"] })} disabled={saving} />}
        <Textarea label="Observações" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={2} disabled={saving} />
        <DialogFooter><Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button><Button onClick={handleSave} disabled={saving} className="gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{editing ? "Salvar" : "Criar Solicitação"}</Button></DialogFooter>
      </div></Dialog>
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmar exclusão" description="Tem certeza?" size="sm"><DialogFooter><Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button><Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="gap-2"><Trash2 className="h-4 w-4" /> Excluir</Button></DialogFooter></Dialog>
    </motion.div>
  );
}
