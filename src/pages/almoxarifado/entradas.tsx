import { useState, useEffect, useCallback } from "react";
import { PackagePlus, Plus, Search, Loader2, Trash2, RefreshCw, Package, CalendarDays, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { MovimentoEstoque, Item, Unidade } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatFullDate } from "@/lib/utils";

export function MovEntradasPage() {
  const [movimentos, setMovimentos] = useState<(MovimentoEstoque & { item_nome?: string; unidade_nome?: string })[]>([]);
  const [itens, setItens] = useState<Item[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MovimentoEstoque | null>(null);
  const [form, setForm] = useState({ item_id: "", quantidade: "1", documento: "", origem_destino: "", data_movimento: new Date().toISOString().split("T")[0], observacoes: "", unidade_id: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [movRes, itensRes, unidRes] = await Promise.all([
        supabase.from("movimentos_estoque").select("*, itens(nome, codigo), unidades(nome, sigla)").eq("tipo", "entrada").order("created_at", { ascending: false }),
        supabase.from("itens").select("*").order("nome"),
        supabase.from("unidades").select("*").eq("ativo", true).order("nome"),
      ]);
      if (movRes.data) setMovimentos((movRes.data as Record<string, unknown>[]).map((m: Record<string, unknown>) => ({ ...m, item_nome: (m.itens as Record<string, unknown> | undefined)?.nome as string || "Item não encontrado", unidade_nome: (m.unidades as Record<string, unknown> | undefined)?.nome as string || "Não definida" })));
      if (itensRes.data) setItens(itensRes.data);
      if (unidRes.data) setUnidades(unidRes.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);  useEffect(() => { let c = false; queueMicrotask(() => { if (!c) fetchData(); }); return () => { c = true; }; }, [fetchData]);

  const itemOptions = itens.map((i) => ({ value: i.id, label: `${i.nome}${i.codigo ? ` (${i.codigo})` : ""} - Estoque: ${i.quantidade_atual}` }));
  const unidadeOptions = unidades.map((u) => ({ value: u.id, label: `${u.nome} (${u.sigla})` }));

  const openCreate = () => { setEditing(null); setForm({ item_id: "", quantidade: "1", documento: "", origem_destino: "", data_movimento: new Date().toISOString().split("T")[0], observacoes: "", unidade_id: "" }); setFormError(""); setModalOpen(true); };
  const handleSave = async () => {
    setFormError(""); if (!form.item_id || !form.unidade_id) { setFormError("Item e unidade são obrigatórios."); return; }
    setSaving(true);
    try {
      const payload = { item_id: form.item_id, unidade_id: form.unidade_id, tipo: "entrada" as const, quantidade: parseInt(form.quantidade) || 0, documento: form.documento || null, origem_destino: form.origem_destino || null, data_movimento: form.data_movimento, observacoes: form.observacoes || null };
      if (editing) {
        const { error } = await supabase.from("movimentos_estoque").update(payload).eq("id", editing.id);
        if (error) { setFormError(error.message); return; }
      } else {
        const { error } = await supabase.from("movimentos_estoque").insert(payload);
        if (error) { setFormError(error.message); return; }
        // Update stock quantity
        const { data: itemAtual } = await supabase.from("itens").select("quantidade_atual").eq("id", form.item_id).single();
        if (itemAtual) { await supabase.from("itens").update({ quantidade_atual: itemAtual.quantidade_atual + (parseInt(form.quantidade) || 0) }).eq("id", form.item_id); }
      }
      setModalOpen(false); fetchData();
    } catch (err: unknown) { setFormError(err instanceof Error ? err.message : "Erro"); } finally { setSaving(false); }
  };
  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("movimentos_estoque").delete().eq("id", id);
    if (!error) { setMovimentos((p) => p.filter((m) => m.id !== id)); setDeleteConfirm(null); }
  };

  const filtered = movimentos.filter((m) => {
    const s = search.toLowerCase();
    return (m.item_nome || "").toLowerCase().includes(s) || (m.origem_destino || "").toLowerCase().includes(s) || (m.documento || "").toLowerCase().includes(s);
  });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="rounded-xl p-3 bg-yellow-50 dark:bg-yellow-950/50 text-yellow-600"><PackagePlus className="h-6 w-6" /></div>
          <div><h2 className="page-title">Entradas no Estoque</h2><p className="page-subtitle mt-1">Registro de entradas de materiais no almoxarifado</p></div>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Nova Entrada</Button>
      </div>
      <Card><CardContent className="p-4"><div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input type="text" placeholder="Buscar por item, origem ou documento..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-xs" /></div>
        <Button variant="ghost" size="icon-sm" onClick={fetchData}><RefreshCw className="h-3.5 w-3.5" /></Button>
      </div></CardContent></Card>
      <Card><CardContent className="p-0">
        {loading ? <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        : filtered.length === 0 ? <div className="flex flex-col items-center justify-center py-16 text-center"><PackagePlus className="h-10 w-10 text-muted-foreground/50 mb-3" /><p className="text-sm font-medium text-foreground">Nenhuma entrada registrada</p></div>
        : <div className="divide-y divide-border">{filtered.map((item, index) => (<motion.div key={item.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }} className="group flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-4 hover:bg-accent/30 transition-colors">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <p className="text-sm font-medium text-foreground truncate">{item.item_nome}</p>
              <Badge variant="success" className="text-[9px]">+{item.quantidade}</Badge>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
              {item.origem_destino && <span className="text-[11px] text-muted-foreground">Origem: {item.origem_destino}</span>}
              {item.documento && <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><FileText className="h-3 w-3" />{item.documento}</span>}
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><CalendarDays className="h-3 w-3" />{formatFullDate(item.data_movimento)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setDeleteConfirm(item.id)} className="rounded p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        </motion.div>))}</div>}
      </CardContent></Card>
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar Entrada" : "Nova Entrada"} size="lg"><div className="space-y-4">
        {formError && <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{formError}</div>}
        <Select label="Item *" options={itemOptions} placeholder="Selecione o item" value={form.item_id} onChange={(e) => setForm({ ...form, item_id: e.target.value })} disabled={saving || !!editing} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Quantidade *" type="number" value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: e.target.value })} disabled={saving} />
          <Select label="Unidade *" options={unidadeOptions} placeholder="Selecione" value={form.unidade_id} onChange={(e) => setForm({ ...form, unidade_id: e.target.value })} disabled={saving || !!editing} />
        </div>
        <Input label="Documento (NF/Nota)" value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} placeholder="Ex: NF 12345" disabled={saving} />
        <Input label="Origem / Fornecedor" value={form.origem_destino} onChange={(e) => setForm({ ...form, origem_destino: e.target.value })} placeholder="Nome do fornecedor" disabled={saving} />
        <Textarea label="Observações" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={2} disabled={saving} />
        <DialogFooter><Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button><Button onClick={handleSave} disabled={saving} className="gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{editing ? "Salvar" : "Registrar Entrada"}</Button></DialogFooter>
      </div></Dialog>
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmar exclusão" description="Tem certeza?" size="sm"><DialogFooter><Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button><Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="gap-2"><Trash2 className="h-4 w-4" /> Excluir</Button></DialogFooter></Dialog>
    </motion.div>
  );
}
