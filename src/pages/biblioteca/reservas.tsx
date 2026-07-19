import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Plus,
  Search,
  Loader2,
  Trash2,
  RefreshCw,
  User,
  Library,
  CalendarDays,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { Reserva, Aluno, Obra, Unidade } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatFullDate } from "@/lib/utils";

const STATUS_RES_OPTIONS = [
  { value: "ativa", label: "Ativa" },
  { value: "concluida", label: "Concluída" },
  { value: "cancelada", label: "Cancelada" },
  { value: "expirada", label: "Expirada" },
];

const statusVariant: Record<string, "success" | "warning" | "default" | "destructive" | "secondary"> = {
  ativa: "default",
  concluida: "success",
  cancelada: "destructive",
  expirada: "secondary",
};

export function ReservasPage() {
  const [reservas, setReservas] = useState<(Reserva & { obra_titulo?: string; aluno_nome?: string; unidade_nome?: string })[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todas");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Reserva | null>(null);
  const [formData, setFormData] = useState({
    obra_id: "", aluno_id: "", data_reserva: new Date().toISOString()!.split("T")[0]!,
    data_validade: "", status: "ativa" as Reserva["status"], observacoes: "", unidade_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resRes, alunosRes, obrasRes, unidRes] = await Promise.all([
        supabase.from("reservas").select("*, obras(titulo), alunos(nome), unidades(nome, sigla)").order("created_at", { ascending: false }),
        supabase.from("alunos").select("*").eq("ativo", true).order("nome"),
        supabase.from("obras").select("*").order("titulo"),
        supabase.from("unidades").select("*").eq("ativo", true).order("nome"),
      ]);
      if (resRes.data) setReservas((resRes.data as Record<string, unknown>[]).map((r: Record<string, unknown>) => ({ ...r, obra_titulo: (r.obras as Record<string, unknown> | undefined)?.titulo as string || "Obra não encontrada", aluno_nome: (r.alunos as Record<string, unknown> | undefined)?.nome as string || "Aluno não encontrado", unidade_nome: (r.unidades as Record<string, unknown> | undefined)?.nome as string || "Não definida" })));
      if (alunosRes.data) setAlunos(alunosRes.data);
      if (obrasRes.data) setObras(obrasRes.data);
      if (unidRes.data) setUnidades(unidRes.data);
    } catch (err) { console.error(err);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { let c = false; queueMicrotask(() => { if (!c) fetchData(); }); return () => { c = true; }; }, [fetchData]);

  const alunoOptions = alunos.map((a) => ({ value: a.id, label: a.nome }));
  const obraOptions = obras.map((o) => ({ value: o.id, label: `${o.titulo}${o.autor ? ` - ${o.autor}` : ""}` }));
  const unidadeOptions = unidades.map((u) => ({ value: u.id, label: `${u.nome} (${u.sigla})` }));

  const openCreate = () => {
    setEditing(null);
    const validade = new Date(); validade.setDate(validade.getDate() + 7);
    setFormData({ obra_id: "", aluno_id: "", data_reserva: new Date().toISOString()!.split("T")[0]!, data_validade: validade.toISOString()!.split("T")[0]!, status: "ativa", observacoes: "", unidade_id: "" });
    setFormError(""); setModalOpen(true);
  };

  const handleSave = async () => {
    setFormError("");
    if (!formData.obra_id || !formData.aluno_id || !formData.unidade_id || !formData.data_validade) {
      setFormError("Obra, aluno, unidade e data de validade são obrigatórios."); return;
    }
    setSaving(true);
    try {
      const payload = { obra_id: formData.obra_id, aluno_id: formData.aluno_id, unidade_id: formData.unidade_id, data_reserva: formData.data_reserva, data_validade: formData.data_validade, status: formData.status, observacoes: formData.observacoes || null };
      if (editing) { const { error } = await supabase.from("reservas").update(payload).eq("id", editing.id); if (error) { setFormError(error.message); return; } }
      else { const { error } = await supabase.from("reservas").insert(payload); if (error) { setFormError(error.message); return; } }
      setModalOpen(false); fetchData();
    } catch (err: unknown) { setFormError(err instanceof Error ? err.message : "Erro");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("reservas").delete().eq("id", id);
    if (!error) { setReservas((p) => p.filter((r) => r.id !== id)); setDeleteConfirm(null); }
  };

  const filtered = reservas.filter((r) => {
    const s = search.toLowerCase();
    const match = (r.aluno_nome || "").toLowerCase().includes(s) || (r.obra_titulo || "").toLowerCase().includes(s);
    if (statusFilter !== "todas" && r.status !== statusFilter) return false;
    return match;
  });

  const ativas = reservas.filter((r) => r.status === "ativa").length;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="rounded-xl p-3 bg-orange-50 dark:bg-orange-950/50 text-orange-600"><Calendar className="h-6 w-6" /></div>
          <div><h2 className="page-title">Reservas</h2><p className="page-subtitle mt-1">Gerenciamento de reservas de obras da biblioteca</p></div>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Nova Reserva</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="stats-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total de Reservas</p><p className="text-2xl font-bold">{reservas.length}</p></CardContent></Card>
        <Card className="stats-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Ativas</p><p className="text-2xl font-bold text-blue-600">{ativas}</p></CardContent></Card>
        <Card className="stats-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Concluídas</p><p className="text-2xl font-bold text-emerald-600">{reservas.filter((r) => r.status === "concluida").length}</p></CardContent></Card>
      </div>

      <Card><CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Buscar por aluno ou obra..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {[{ v: "todas", l: "Todas" }, { v: "ativa", l: "Ativas" }, { v: "concluida", l: "Concluídas" }].map((o) => (
              <button key={o.v} onClick={() => setStatusFilter(o.v)} className={cn("rounded-full px-3 py-1 text-[11px] font-medium transition-all", statusFilter === o.v ? "bg-idep-700 text-white" : "bg-muted text-muted-foreground hover:text-foreground border border-border")}>{o.l}</button>
            ))}
            <Button variant="ghost" size="icon-sm" onClick={fetchData}><RefreshCw className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        {loading ? <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        : filtered.length === 0 ? <div className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-foreground">{search ? "Nenhuma reserva encontrada" : "Nenhuma reserva registrada"}</p>
            <p className="text-xs text-muted-foreground mt-1">{search ? "Tente alterar os termos" : "Clique em 'Nova Reserva' para reservar uma obra"}</p>
          </div>
        : <div className="divide-y divide-border">
            {filtered.map((res, index) => (
              <motion.div key={res.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}
                className="group flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-4 hover:bg-accent/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Library className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <p className="text-sm font-medium text-foreground truncate">{res.obra_titulo}</p>
                    <Badge variant={statusVariant[res.status] || "default"} className="text-[9px] px-1.5 py-0 h-4">{STATUS_RES_OPTIONS.find((s) => s.value === res.status)?.label}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1">
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><User className="h-3 w-3" />{res.aluno_nome}</span>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><CalendarDays className="h-3 w-3" />Reservado: {formatFullDate(res.data_reserva)}</span>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">Validade: {new Date(res.data_validade).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setDeleteConfirm(res.id)} className="rounded p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </motion.div>
            ))}
          </div>}
      </CardContent></Card>

      {/* Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar Reserva" : "Nova Reserva"} size="lg">
        <div className="space-y-4">
          {formError && <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{formError}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Aluno *" options={alunoOptions} placeholder="Selecione o aluno" value={formData.aluno_id} onChange={(e) => setFormData({ ...formData, aluno_id: e.target.value })} disabled={saving || !!editing} />
            <Select label="Obra *" options={obraOptions} placeholder="Selecione a obra" value={formData.obra_id} onChange={(e) => setFormData({ ...formData, obra_id: e.target.value })} disabled={saving || !!editing} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Data da Reserva" type="date" value={formData.data_reserva} onChange={(e) => setFormData({ ...formData, data_reserva: e.target.value })} disabled={saving} />
            <Input label="Data de Validade *" type="date" value={formData.data_validade} onChange={(e) => setFormData({ ...formData, data_validade: e.target.value })} disabled={saving} />
            <Select label="Unidade *" options={unidadeOptions} placeholder="Selecione" value={formData.unidade_id} onChange={(e) => setFormData({ ...formData, unidade_id: e.target.value })} disabled={saving || !!editing} />
          </div>
          <Textarea label="Observações" value={formData.observacoes} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} rows={2} disabled={saving} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{editing ? "Salvar" : "Registrar Reserva"}</Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Delete */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmar exclusão" description="Tem certeza que deseja cancelar esta reserva?" size="sm">
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="gap-2"><Trash2 className="h-4 w-4" /> Cancelar Reserva</Button>
        </DialogFooter>
      </Dialog>
    </motion.div>
  );
}
