import { useState, useEffect, useCallback } from "react";
import {
  CalendarDays,
  Plus,
  Search,
  Loader2,
  Edit3,
  Trash2,
  RefreshCw,
  User,
  Calendar,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { Ferias, Servidor, Unidade } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatFullDate } from "@/lib/utils";

const STATUS_FERIAS_OPTIONS = [
  { value: "agendadas", label: "Agendadas" },
  { value: "aprovadas", label: "Aprovadas" },
  { value: "em_andamento", label: "Em Andamento" },
  { value: "concluidas", label: "Concluídas" },
  { value: "canceladas", label: "Canceladas" },
];

const statusVariant: Record<string, "success" | "warning" | "default" | "destructive" | "secondary"> = {
  agendadas: "default",
  aprovadas: "success",
  em_andamento: "warning",
  concluidas: "secondary",
  canceladas: "destructive",
};

export function FeriasPage() {
  const [ferias, setFerias] = useState<(Ferias & { servidor_nome?: string; unidade_nome?: string })[]>([]);
  const [servidores, setServidores] = useState<Servidor[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todas");
  const [anoFilter, setAnoFilter] = useState<string>(new Date().getFullYear().toString());

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Ferias | null>(null);
  const [formData, setFormData] = useState({
    servidor_id: "", data_inicio: "", data_fim: "", dias: "30",
    periodo: "", ano_referencia: new Date().getFullYear().toString(),
    status: "agendadas" as Ferias["status"], observacoes: "", aprovado_por: "", unidade_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [feriasRes, servRes, unidRes] = await Promise.all([
        supabase.from("ferias").select("*, servidores(nome), unidades(nome, sigla)").order("created_at", { ascending: false }),
        supabase.from("servidores").select("*").eq("ativo", true).order("nome"),
        supabase.from("unidades").select("*").eq("ativo", true).order("nome"),
      ]);
      if (feriasRes.data) setFerias((feriasRes.data as Record<string, unknown>[]).map((f: Record<string, unknown>) => ({ ...f, servidor_nome: (f.servidores as Record<string, unknown> | undefined)?.nome as string || "Servidor não encontrado", unidade_nome: (f.unidades as Record<string, unknown> | undefined)?.nome as string || "Não definida" })));
      if (servRes.data) setServidores(servRes.data);
      if (unidRes.data) setUnidades(unidRes.data);
    } catch (err) { console.error(err);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { let c = false; queueMicrotask(() => { if (!c) fetchData(); }); return () => { c = true; }; }, [fetchData]);

  const servidorOptions = servidores.map((s) => ({ value: s.id, label: s.nome }));
  const unidadeOptions = unidades.map((u) => ({ value: u.id, label: `${u.nome} (${u.sigla})` }));

  const openCreate = () => {
    setEditing(null);
    setFormData({ servidor_id: "", data_inicio: "", data_fim: "", dias: "30", periodo: "", ano_referencia: new Date().getFullYear().toString(), status: "agendadas", observacoes: "", aprovado_por: "", unidade_id: "" });
    setFormError(""); setModalOpen(true);
  };

  const openEdit = (f: Ferias) => {
    setEditing(f);
    setFormData({
      servidor_id: f.servidor_id, data_inicio: f.data_inicio!.split("T")[0]!,
      data_fim: f.data_fim!.split("T")[0]!, dias: f.dias.toString(), periodo: f.periodo,
      ano_referencia: f.ano_referencia.toString(), status: f.status,
      observacoes: f.observacoes || "", aprovado_por: f.aprovado_por || "", unidade_id: f.unidade_id,
    });
    setFormError(""); setModalOpen(true);
  };

  const handleSave = async () => {
    setFormError("");
    if (!formData.servidor_id || !formData.data_inicio || !formData.data_fim || !formData.unidade_id) {
      setFormError("Servidor, datas e unidade são obrigatórios."); return;
    }
    setSaving(true);
    try {
      const payload = {
        servidor_id: formData.servidor_id, data_inicio: formData.data_inicio, data_fim: formData.data_fim,
        dias: parseInt(formData.dias) || 0, periodo: formData.periodo || `${formData.data_inicio} a ${formData.data_fim}`,
        ano_referencia: parseInt(formData.ano_referencia) || new Date().getFullYear(),
        status: formData.status, observacoes: formData.observacoes || null,
        aprovado_por: formData.aprovado_por || null, unidade_id: formData.unidade_id,
      };
      if (editing) { const { error } = await supabase.from("ferias").update(payload).eq("id", editing.id); if (error) { setFormError(error.message); return; } }
      else { const { error } = await supabase.from("ferias").insert(payload); if (error) { setFormError(error.message); return; } }
      setModalOpen(false); fetchData();
    } catch (err: unknown) { setFormError(err instanceof Error ? err.message : "Erro");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("ferias").delete().eq("id", id);
    if (!error) { setFerias((p) => p.filter((f) => f.id !== id)); setDeleteConfirm(null); }
  };

  const filtered = ferias.filter((f) => {
    const m = search.toLowerCase();
    const match = (f.servidor_nome || "").toLowerCase().includes(m);
    if (statusFilter !== "todas" && f.status !== statusFilter) return false;
    if (anoFilter !== "todos" && f.ano_referencia.toString() !== anoFilter) return false;
    return match;
  });

  const anos = [...new Set(ferias.map((f) => f.ano_referencia))].sort((a, b) => b - a);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="rounded-xl p-3 bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600"><CalendarDays className="h-6 w-6" /></div>
          <div><h2 className="page-title">Férias</h2><p className="page-subtitle mt-1">Planejamento e controle de férias dos servidores e professores</p></div>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Agendar Férias</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="stats-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold">{ferias.length}</p></CardContent></Card>
        <Card className="stats-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Agendadas/Aprovadas</p><p className="text-2xl font-bold text-blue-600">{ferias.filter((f) => f.status === "agendadas" || f.status === "aprovadas").length}</p></CardContent></Card>
        <Card className="stats-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Em Andamento</p><p className="text-2xl font-bold text-amber-600">{ferias.filter((f) => f.status === "em_andamento").length}</p></CardContent></Card>
        <Card className="stats-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Concluídas</p><p className="text-2xl font-bold text-emerald-600">{ferias.filter((f) => f.status === "concluidas").length}</p></CardContent></Card>
      </div>

      <Card><CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Buscar por servidor..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {[{ v: "todas", l: "Todas" }, { v: "agendadas", l: "Agendadas" }, { v: "aprovadas", l: "Aprovadas" }, { v: "em_andamento", l: "Em Andamento" }, { v: "concluidas", l: "Concluídas" }].map((o) => (
              <button key={o.v} onClick={() => setStatusFilter(o.v)} className={cn("rounded-full px-3 py-1 text-[11px] font-medium transition-all", statusFilter === o.v ? "bg-idep-700 text-white" : "bg-muted text-muted-foreground hover:text-foreground border border-border")}>{o.l}</button>
            ))}
            <select value={anoFilter} onChange={(e) => setAnoFilter(e.target.value)} className="h-7 rounded-lg border border-input bg-background px-2 text-[10px] font-medium text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="todos">Todos os anos</option>
              {anos.map((a) => <option key={a} value={a.toString()}>{a}</option>)}
            </select>
            <Button variant="ghost" size="icon-sm" onClick={fetchData}><RefreshCw className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        {loading ? <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        : filtered.length === 0 ? <div className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarDays className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-foreground">{search ? "Nenhum registro encontrado" : "Nenhum período de férias registrado"}</p>
            <p className="text-xs text-muted-foreground mt-1">{search ? "Tente alterar os termos" : "Clique em 'Agendar Férias' para registrar"}</p>
          </div>
        : <div className="divide-y divide-border">
            {filtered.map((f, index) => (
              <motion.div key={f.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}
                className="group flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-4 hover:bg-accent/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <p className="text-sm font-medium text-foreground truncate">{f.servidor_nome}</p>
                    <Badge variant={statusVariant[f.status] || "default"} className="text-[9px] px-1.5 py-0 h-4">{STATUS_FERIAS_OPTIONS.find((s) => s.value === f.status)?.label}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1">
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Calendar className="h-3 w-3" />{formatFullDate(f.data_inicio)} — {formatFullDate(f.data_fim)}</span>
                    <span className="text-[11px] text-muted-foreground">{f.dias} dias</span>
                    <span className="text-[11px] text-muted-foreground">Ano: {f.ano_referencia}</span>
                    <span className="text-[11px] text-muted-foreground">{f.unidade_nome}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(f)} className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><Edit3 className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDeleteConfirm(f.id)} className="rounded p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </motion.div>
            ))}
          </div>}
      </CardContent></Card>

      {/* Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar Férias" : "Agendar Férias"} size="xl">
        <div className="space-y-4">
          {formError && <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{formError}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Servidor *" options={servidorOptions} placeholder="Selecione" value={formData.servidor_id} onChange={(e) => setFormData({ ...formData, servidor_id: e.target.value })} disabled={saving || !!editing} />
            <Select label="Unidade *" options={unidadeOptions} placeholder="Selecione" value={formData.unidade_id} onChange={(e) => setFormData({ ...formData, unidade_id: e.target.value })} disabled={saving || !!editing} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Data de Início *" type="date" value={formData.data_inicio} onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })} disabled={saving} />
            <Input label="Data de Fim *" type="date" value={formData.data_fim} onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })} disabled={saving} />
            <Input label="Dias" type="number" value={formData.dias} onChange={(e) => setFormData({ ...formData, dias: e.target.value })} disabled={saving} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Período" value={formData.periodo} onChange={(e) => setFormData({ ...formData, periodo: e.target.value })} placeholder="Ex: 1º Período" disabled={saving} />
            <Input label="Ano de Referência" type="number" value={formData.ano_referencia} onChange={(e) => setFormData({ ...formData, ano_referencia: e.target.value })} disabled={saving} />
          </div>
          {editing && <Select label="Status" options={STATUS_FERIAS_OPTIONS} value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as Ferias["status"] })} disabled={saving} />}
          {editing && <Input label="Aprovado por" value={formData.aprovado_por} onChange={(e) => setFormData({ ...formData, aprovado_por: e.target.value })} placeholder="Nome do aprovador" disabled={saving} />}
          <Textarea label="Observações" value={formData.observacoes} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} rows={2} disabled={saving} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{editing ? "Salvar" : "Agendar"}</Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Delete */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmar exclusão" description="Tem certeza que deseja cancelar este período de férias?" size="sm"><DialogFooter>
        <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
        <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="gap-2"><Trash2 className="h-4 w-4" /> Excluir</Button>
      </DialogFooter></Dialog>
    </motion.div>
  );
}
