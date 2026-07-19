import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Loader2, Edit3, Trash2, RefreshCw, CalendarDays, DollarSign, Gavel } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { Licitacao, Unidade } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatFullDate, formatCurrency } from "@/lib/utils";

const MODALIDADE_OPTIONS = [
  { value: "convite", label: "Convite" }, { value: "tomada_precos", label: "Tomada de Preços" },
  { value: "concorrencia", label: "Concorrência" }, { value: "pregao", label: "Pregão" },
  { value: "dispensa", label: "Dispensa" }, { value: "inexigibilidade", label: "Inexigibilidade" },
];
const STATUS_OPTIONS = [
  { value: "planejada", label: "Planejada" }, { value: "publicada", label: "Publicada" },
  { value: "em_andamento", label: "Em Andamento" }, { value: "adjudicada", label: "Adjudicada" },
  { value: "homologada", label: "Homologada" }, { value: "cancelada", label: "Cancelada" },
];
const statusVariant: Record<string, "success" | "warning" | "default" | "destructive" | "secondary"> = {
  planejada: "secondary", publicada: "default", em_andamento: "warning",
  adjudicada: "success", homologada: "success", cancelada: "destructive",
};

export function LicitacoesPage() {
  const [data, setData] = useState<(Licitacao & { unidade_nome?: string })[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todas");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Licitacao | null>(null);
  const [form, setForm] = useState({ numero: "", modalidade: "pregao" as Licitacao["modalidade"], objeto: "", data_publicacao: "", data_abertura: "", valor_estimado: "", status: "planejada" as Licitacao["status"], observacoes: "", unidade_id: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [res, unidRes] = await Promise.all([
        supabase.from("licitacoes").select("*, unidades(nome, sigla)").order("created_at", { ascending: false }),
        supabase.from("unidades").select("*").eq("ativo", true).order("nome"),
      ]);
      if (res.data) setData((res.data as Record<string, unknown>[]).map((i: Record<string, unknown>) => ({ ...i, unidade_nome: (i.unidades as Record<string, unknown> | undefined)?.nome as string || "Não definida" })));
      if (unidRes.data) setUnidades(unidRes.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);  useEffect(() => { let c = false; queueMicrotask(() => { if (!c) fetchData(); }); return () => { c = true; }; }, [fetchData]);
  const unidadeOptions = unidades.map((u) => ({ value: u.id, label: `${u.nome} (${u.sigla})` }));

  const openCreate = () => { setEditing(null); setForm({ numero: "", modalidade: "pregao", objeto: "", data_publicacao: "", data_abertura: "", valor_estimado: "", status: "planejada", observacoes: "", unidade_id: "" }); setFormError(""); setModalOpen(true); };
  const openEdit = (i: Licitacao) => { setEditing(i); setForm({ numero: i.numero || "", modalidade: i.modalidade, objeto: i.objeto || "", data_publicacao: i.data_publicacao?.split("T")[0] || "", data_abertura: i.data_abertura?.split("T")[0] || "", valor_estimado: i.valor_estimado?.toString() || "", status: i.status, observacoes: i.observacoes || "", unidade_id: i.unidade_id }); setFormError(""); setModalOpen(true); };

  const handleSave = async () => {
    setFormError(""); if (!form.unidade_id) { setFormError("Unidade é obrigatória."); return; }
    setSaving(true);
    try {
      const payload = { numero: form.numero || null, modalidade: form.modalidade, objeto: form.objeto || null, data_publicacao: form.data_publicacao || null, data_abertura: form.data_abertura || null, valor_estimado: form.valor_estimado ? parseFloat(form.valor_estimado) : null, status: form.status, observacoes: form.observacoes || null, unidade_id: form.unidade_id };
      if (editing) { const { error } = await supabase.from("licitacoes").update(payload).eq("id", editing.id); if (error) { setFormError(error.message); return; } }
      else { const { error } = await supabase.from("licitacoes").insert(payload); if (error) { setFormError(error.message); return; } }
      setModalOpen(false); fetchData();
    } catch (err: unknown) { setFormError(err instanceof Error ? err.message : "Erro"); } finally { setSaving(false); }
  };
  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("licitacoes").delete().eq("id", id);
    if (!error) { setData((p) => p.filter((i) => i.id !== id)); setDeleteConfirm(null); }
  };

  const filtered = data.filter((i) => {
    const m = search.toLowerCase();
    const match = (i.objeto || "").toLowerCase().includes(m) || (i.numero || "").toLowerCase().includes(m);
    if (statusFilter !== "todas") return match && i.status === statusFilter;
    return match;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="rounded-xl p-3 bg-orange-50 dark:bg-orange-950/50 text-orange-600"><Gavel className="h-6 w-6" /></div>
          <div><h2 className="page-title">Licitações</h2><p className="page-subtitle mt-1">Gestão de processos licitatórios</p></div>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Nova Licitação</Button>
      </div>
      <Card><CardContent className="p-4"><div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input type="text" placeholder="Buscar por objeto ou nº..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-xs" /></div>
        <div className="flex items-center gap-2">
          {[{ v: "todas", l: "Todas" }, { v: "planejada", l: "Planejadas" }, { v: "publicada", l: "Publicadas" }, { v: "em_andamento", l: "Em Andamento" }, { v: "homologada", l: "Homologadas" }].map((o) => (
            <button key={o.v} onClick={() => setStatusFilter(o.v)} className={cn("rounded-full px-3 py-1 text-[11px] font-medium transition-all", statusFilter === o.v ? "bg-idep-700 text-white" : "bg-muted text-muted-foreground hover:text-foreground border border-border")}>{o.l}</button>
          ))}
          <Button variant="ghost" size="icon-sm" onClick={fetchData}><RefreshCw className="h-3.5 w-3.5" /></Button>
        </div>
      </div></CardContent></Card>
      <Card><CardContent className="p-0">
        {loading ? <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        : filtered.length === 0 ? <div className="flex flex-col items-center justify-center py-16 text-center"><Gavel className="h-10 w-10 text-muted-foreground/50 mb-3" /><p className="text-sm font-medium text-foreground">Nenhuma licitação encontrada</p></div>
        : <div className="divide-y divide-border">{filtered.map((item, index) => (<motion.div key={item.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }} className="group flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-4 hover:bg-accent/30 transition-colors">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground truncate">{item.objeto || "Sem objeto"}</p>
              {item.numero && <span className="text-[10px] font-mono text-muted-foreground">#{item.numero}</span>}
              <Badge variant={statusVariant[item.status]} className="text-[9px] px-1.5 py-0 h-4">{STATUS_OPTIONS.find((s) => s.value === item.status)?.label}</Badge>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
              <span className="text-[11px] text-muted-foreground">{MODALIDADE_OPTIONS.find((o) => o.value === item.modalidade)?.label}</span>
              {item.valor_estimado && <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><DollarSign className="h-3 w-3" />{formatCurrency(item.valor_estimado)}</span>}
              {item.data_abertura && <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><CalendarDays className="h-3 w-3" />Abertura: {formatFullDate(item.data_abertura)}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => openEdit(item)} className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><Edit3 className="h-3.5 w-3.5" /></button>
            <button onClick={() => setDeleteConfirm(item.id)} className="rounded p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        </motion.div>))}</div>}
      </CardContent></Card>
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar Licitação" : "Nova Licitação"} size="xl"><div className="space-y-4">
        {formError && <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{formError}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nº do Processo" value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} placeholder="Ex: 001/2024" disabled={saving} />
          <Select label="Modalidade *" options={MODALIDADE_OPTIONS} value={form.modalidade} onChange={(e) => setForm({ ...form, modalidade: e.target.value as Licitacao["modalidade"] })} disabled={saving} />
        </div>
        <Textarea label="Objeto" value={form.objeto} onChange={(e) => setForm({ ...form, objeto: e.target.value })} rows={3} placeholder="Descrição do objeto da licitação..." disabled={saving} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="Data de Publicação" type="date" value={form.data_publicacao} onChange={(e) => setForm({ ...form, data_publicacao: e.target.value })} disabled={saving} />
          <Input label="Data de Abertura" type="date" value={form.data_abertura} onChange={(e) => setForm({ ...form, data_abertura: e.target.value })} disabled={saving} />
          <Input label="Valor Estimado (R$)" type="number" value={form.valor_estimado} onChange={(e) => setForm({ ...form, valor_estimado: e.target.value })} disabled={saving} />
        </div>
        <Select label="Unidade *" options={unidadeOptions} placeholder="Selecione" value={form.unidade_id} onChange={(e) => setForm({ ...form, unidade_id: e.target.value })} disabled={saving} />
        {editing && <Select label="Status" options={STATUS_OPTIONS} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Licitacao["status"] })} disabled={saving} />}
        <Textarea label="Observações" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={2} disabled={saving} />
        <DialogFooter><Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button><Button onClick={handleSave} disabled={saving} className="gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{editing ? "Salvar" : "Criar"}</Button></DialogFooter>
      </div></Dialog>
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmar exclusão" description="Tem certeza?" size="sm"><DialogFooter><Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button><Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="gap-2"><Trash2 className="h-4 w-4" /> Excluir</Button></DialogFooter></Dialog>
    </motion.div>
  );
}
