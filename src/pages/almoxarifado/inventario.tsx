import { useState, useEffect, useCallback } from "react";
import { Package, Plus, Search, Loader2, Edit3, Trash2, RefreshCw, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { Item, Unidade } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatFullDate } from "@/lib/utils";

export function InventarioPage() {
  const [data, setData] = useState<(Item & { unidade_nome?: string })[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [estoqueFilter, setEstoqueFilter] = useState<string>("todos");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState({ nome: "", codigo: "", descricao: "", unidade_medida: "", quantidade_minima: "5", quantidade_atual: "0", valor_unitario: "", localizacao: "", unidade_id: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [res, unidRes] = await Promise.all([
        supabase.from("itens").select("*, unidades(nome, sigla)").order("nome"),
        supabase.from("unidades").select("*").eq("ativo", true).order("nome"),
      ]);
      if (res.data) setData((res.data as any[]).map((i) => ({ ...i, unidade_nome: i.unidades?.nome || "Não definida" })));
      if (unidRes.data) setUnidades(unidRes.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);
  const unidadeOptions = unidades.map((u) => ({ value: u.id, label: `${u.nome} (${u.sigla})` }));

  const openCreate = () => { setEditing(null); setForm({ nome: "", codigo: "", descricao: "", unidade_medida: "un", quantidade_minima: "5", quantidade_atual: "0", valor_unitario: "", localizacao: "", unidade_id: "" }); setFormError(""); setModalOpen(true); };
  const openEdit = (i: Item) => { setEditing(i); setForm({ nome: i.nome, codigo: i.codigo || "", descricao: i.descricao || "", unidade_medida: i.unidade_medida || "un", quantidade_minima: i.quantidade_minima.toString(), quantidade_atual: i.quantidade_atual.toString(), valor_unitario: i.valor_unitario?.toString() || "", localizacao: i.localizacao || "", unidade_id: i.unidade_id }); setFormError(""); setModalOpen(true); };

  const handleSave = async () => {
    setFormError(""); if (!form.nome.trim() || !form.unidade_id) { setFormError("Nome e unidade são obrigatórios."); return; }
    setSaving(true);
    try {
      const payload = { nome: form.nome, codigo: form.codigo || null, descricao: form.descricao || null, unidade_medida: form.unidade_medida || null, quantidade_minima: parseInt(form.quantidade_minima) || 0, quantidade_atual: parseInt(form.quantidade_atual) || 0, valor_unitario: form.valor_unitario ? parseFloat(form.valor_unitario) : null, localizacao: form.localizacao || null, unidade_id: form.unidade_id };
      if (editing) { const { error } = await supabase.from("itens").update(payload).eq("id", editing.id); if (error) { setFormError(error.message); return; } }
      else { const { error } = await supabase.from("itens").insert(payload); if (error) { setFormError(error.message); return; } }
      setModalOpen(false); fetchData();
    } catch (err: any) { setFormError(err.message || "Erro"); } finally { setSaving(false); }
  };
  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("itens").delete().eq("id", id);
    if (!error) { setData((p) => p.filter((i) => i.id !== id)); setDeleteConfirm(null); }
  };

  const filtered = data.filter((i) => {
    const m = search.toLowerCase();
    const match = i.nome.toLowerCase().includes(m) || (i.codigo || "").toLowerCase().includes(m) || (i.descricao || "").toLowerCase().includes(m);
    if (estoqueFilter === "baixo") return match && i.quantidade_atual <= i.quantidade_minima;
    if (estoqueFilter === "normal") return match && i.quantidade_atual > i.quantidade_minima;
    if (estoqueFilter === "zerado") return match && i.quantidade_atual === 0;
    return match;
  });

  const totalItens = data.length;
  const totalEstoque = data.reduce((acc, i) => acc + i.quantidade_atual, 0);
  const itensBaixo = data.filter((i) => i.quantidade_atual <= i.quantidade_minima).length;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="rounded-xl p-3 bg-yellow-50 dark:bg-yellow-950/50 text-yellow-600"><Package className="h-6 w-6" /></div>
          <div><h2 className="page-title">Inventário</h2><p className="page-subtitle mt-1">Controle de estoque, itens cadastrados e níveis de reposição</p></div>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Novo Item</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="stats-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total de Itens</p><p className="text-2xl font-bold">{totalItens}</p></CardContent></Card>
        <Card className="stats-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total em Estoque</p><p className="text-2xl font-bold">{totalEstoque}</p></CardContent></Card>
        <Card className="stats-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Estoque Baixo</p><p className={cn("text-2xl font-bold", itensBaixo > 0 ? "text-red-600" : "text-emerald-600")}>{itensBaixo}</p></CardContent></Card>
      </div>

      <Card><CardContent className="p-4"><div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input type="text" placeholder="Buscar por nome, código ou descrição..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-xs" /></div>
        <div className="flex items-center gap-2 flex-wrap">
          {[{ v: "todos", l: "Todos" }, { v: "normal", l: "Normal" }, { v: "baixo", l: "Estoque Baixo" }, { v: "zerado", l: "Zerados" }].map((o) => (
            <button key={o.v} onClick={() => setEstoqueFilter(o.v)} className={cn("rounded-full px-3 py-1 text-[11px] font-medium transition-all", estoqueFilter === o.v ? "bg-idep-700 text-white" : "bg-muted text-muted-foreground hover:text-foreground border border-border")}>{o.l}</button>
          ))}
          <Button variant="ghost" size="icon-sm" onClick={fetchData}><RefreshCw className="h-3.5 w-3.5" /></Button>
          <span className="text-xs text-muted-foreground">{filtered.length} item(ns)</span>
        </div>
      </div></CardContent></Card>

      <Card><CardContent className="p-0">
        {loading ? <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        : filtered.length === 0 ? <div className="flex flex-col items-center justify-center py-16 text-center"><Package className="h-10 w-10 text-muted-foreground/50 mb-3" /><p className="text-sm font-medium text-foreground">Nenhum item encontrado</p></div>
        : <div className="divide-y divide-border">{filtered.map((item, index) => {
          const isLow = item.quantidade_atual <= item.quantidade_minima;
          return (<motion.div key={item.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }} className="group flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-4 hover:bg-accent/30 transition-colors">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={cn("rounded-lg p-2 shrink-0", isLow ? "bg-red-50 dark:bg-red-950/50" : "bg-yellow-50 dark:bg-yellow-950/50")}>
                <Package className={cn("h-5 w-5", isLow ? "text-red-600" : "text-yellow-600")} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{item.nome}</p>
                  {item.codigo && <span className="text-[10px] font-mono text-muted-foreground shrink-0">#{item.codigo}</span>}
                  {isLow && <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-4"><AlertTriangle className="h-3 w-3 mr-0.5" />Baixo</Badge>}
                  {item.quantidade_atual === 0 && <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-4">Zerado</Badge>}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5">
                  <span className="text-[11px] text-muted-foreground">Estoque: <strong>{item.quantidade_atual}</strong> {item.unidade_medida || "un"}</span>
                  <span className="text-[11px] text-muted-foreground">Mín: {item.quantidade_minima}</span>
                  {item.localizacao && <span className="text-[11px] text-muted-foreground">{item.localizacao}</span>}
                  {item.valor_unitario && <span className="text-[11px] text-muted-foreground">R$ {item.valor_unitario.toFixed(2)}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => openEdit(item)} className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><Edit3 className="h-3.5 w-3.5" /></button>
              <button onClick={() => setDeleteConfirm(item.id)} className="rounded p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </motion.div>);
        })}</div>}
      </CardContent></Card>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar Item" : "Novo Item"} size="xl"><div className="space-y-4">
        {formError && <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{formError}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nome do item *" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Resma de Papel A4" disabled={saving} />
          <Input label="Código" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="Ex: MAT-001" disabled={saving} />
        </div>
        <Textarea label="Descrição" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={2} disabled={saving} />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Input label="Und. Medida" value={form.unidade_medida} onChange={(e) => setForm({ ...form, unidade_medida: e.target.value })} placeholder="un, kg, cx" disabled={saving} />
          <Input label="Qtd. Atual" type="number" value={form.quantidade_atual} onChange={(e) => setForm({ ...form, quantidade_atual: e.target.value })} disabled={saving} />
          <Input label="Qtd. Mínima" type="number" value={form.quantidade_minima} onChange={(e) => setForm({ ...form, quantidade_minima: e.target.value })} disabled={saving} />
          <Input label="Valor Unit. (R$)" type="number" value={form.valor_unitario} onChange={(e) => setForm({ ...form, valor_unitario: e.target.value })} disabled={saving} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Localização" value={form.localizacao} onChange={(e) => setForm({ ...form, localizacao: e.target.value })} placeholder="Ex: Prateleira A3" disabled={saving} />
          <Select label="Unidade *" options={unidadeOptions} placeholder="Selecione" value={form.unidade_id} onChange={(e) => setForm({ ...form, unidade_id: e.target.value })} disabled={saving} />
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button><Button onClick={handleSave} disabled={saving} className="gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{editing ? "Salvar" : "Cadastrar"}</Button></DialogFooter>
      </div></Dialog>
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmar exclusão" description="Tem certeza?" size="sm"><DialogFooter><Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button><Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="gap-2"><Trash2 className="h-4 w-4" /> Excluir</Button></DialogFooter></Dialog>
    </motion.div>
  );
}
