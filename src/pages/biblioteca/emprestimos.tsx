import { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Loader2,
  Edit3,
  Trash2,
  RefreshCw,
  User,
  CalendarDays,
  Library,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { Emprestimo, Aluno, Obra, Unidade } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatFullDate } from "@/lib/utils";

const STATUS_EMPR_OPTIONS = [
  { value: "ativo", label: "Ativo" },
  { value: "renovado", label: "Renovado" },
  { value: "devolvido", label: "Devolvido" },
  { value: "atrasado", label: "Atrasado" },
  { value: "perdido", label: "Perdido" },
];

const statusVariant: Record<string, "success" | "warning" | "default" | "destructive" | "secondary"> = {
  ativo: "default",
  renovado: "warning",
  devolvido: "success",
  atrasado: "destructive",
  perdido: "destructive",
};

export function EmprestimosPage() {
  const [emprestimos, setEmprestimos] = useState<(Emprestimo & { obra_titulo?: string; aluno_nome?: string; unidade_nome?: string })[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todas");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<(Emprestimo & { obra_titulo?: string; aluno_nome?: string }) | null>(null);
  const [formData, setFormData] = useState({
    obra_id: "", aluno_id: "", data_emprestimo: new Date().toISOString().split("T")[0],
    data_devolucao_prevista: "", status: "ativo" as Emprestimo["status"],
    observacoes: "", unidade_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, alunosRes, obrasRes, unidRes] = await Promise.all([
        supabase.from("emprestimos").select("*, obras(titulo), alunos(nome), unidades(nome, sigla)").order("created_at", { ascending: false }),
        supabase.from("alunos").select("*").eq("ativo", true).order("nome"),
        supabase.from("obras").select("*").order("titulo"),
        supabase.from("unidades").select("*").eq("ativo", true).order("nome"),
      ]);
      if (empRes.data) setEmprestimos((empRes.data as any[]).map((e) => ({ ...e, obra_titulo: e.obras?.titulo || "Obra não encontrada", aluno_nome: e.alunos?.nome || "Aluno não encontrado", unidade_nome: e.unidades?.nome || "Não definida" })));
      if (alunosRes.data) setAlunos(alunosRes.data);
      if (obrasRes.data) setObras(obrasRes.data.filter((o) => o.quantidade_disponivel > 0));
      if (unidRes.data) setUnidades(unidRes.data);
    } catch (err) { console.error(err);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const alunoOptions = alunos.map((a) => ({ value: a.id, label: a.nome }));
  const obraOptions = obras.map((o) => ({ value: o.id, label: `${o.titulo}${o.autor ? ` - ${o.autor}` : ""} (${o.quantidade_disponivel} disp.)` }));
  const unidadeOptions = unidades.map((u) => ({ value: u.id, label: `${u.nome} (${u.sigla})` }));

  const openCreate = () => {
    setEditing(null);
    const prev = new Date(); prev.setDate(prev.getDate() + 14);
    setFormData({ obra_id: "", aluno_id: "", data_emprestimo: new Date().toISOString().split("T")[0], data_devolucao_prevista: prev.toISOString().split("T")[0], status: "ativo", observacoes: "", unidade_id: "" });
    setFormError(""); setModalOpen(true);
  };

  const handleSave = async () => {
    setFormError("");
    if (!formData.obra_id || !formData.aluno_id || !formData.unidade_id || !formData.data_devolucao_prevista) {
      setFormError("Obra, aluno, unidade e data de devolução são obrigatórios."); return;
    }
    setSaving(true);
    try {
      const payload = {
        obra_id: formData.obra_id, aluno_id: formData.aluno_id, unidade_id: formData.unidade_id,
        data_emprestimo: formData.data_emprestimo, data_devolucao_prevista: formData.data_devolucao_prevista,
        status: formData.status === "devolvido" ? "devolvido" : formData.status, renovacoes: editing?.renovacoes || 0, observacoes: formData.observacoes || null,
      };

      if (editing) {
        const { error } = await supabase.from("emprestimos").update({ ...payload, data_devolucao_real: formData.status === "devolvido" ? new Date().toISOString() : null }).eq("id", editing.id);
        if (error) { setFormError(error.message); return; }
      } else {
        const { error } = await supabase.from("emprestimos").insert(payload);
        if (error) { setFormError(error.message); return; }
        // Decrement available quantity
        const { data: obraAtual } = await supabase.from("obras").select("quantidade_disponivel").eq("id", formData.obra_id).single();
        if (obraAtual && obraAtual.quantidade_disponivel > 0) {
          await supabase.from("obras").update({ quantidade_disponivel: obraAtual.quantidade_disponivel - 1 }).eq("id", formData.obra_id);
        }
      }
      setModalOpen(false); fetchData();
    } catch (err: any) { setFormError(err.message || "Erro");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("emprestimos").delete().eq("id", id);
    if (!error) { setEmprestimos((p) => p.filter((e) => e.id !== id)); setDeleteConfirm(null); }
  };

  const handleDevolver = async (emp: Emprestimo) => {
    const { error } = await supabase.from("emprestimos").update({ status: "devolvido", data_devolucao_real: new Date().toISOString() }).eq("id", emp.id);
    if (!error) {
      // Increment available quantity back
      const { data: obraAtual } = await supabase.from("obras").select("quantidade_disponivel").eq("id", emp.obra_id).single();
      if (obraAtual) {
        await supabase.from("obras").update({ quantidade_disponivel: obraAtual.quantidade_disponivel + 1 }).eq("id", emp.obra_id);
      }
      fetchData();
    }
  };

  const filtered = emprestimos.filter((e) => {
    const s = search.toLowerCase();
    const match = (e.aluno_nome || "").toLowerCase().includes(s) || (e.obra_titulo || "").toLowerCase().includes(s);
    if (statusFilter !== "todas" && e.status !== statusFilter) return false;
    return match;
  });

  const ativos = emprestimos.filter((e) => e.status === "ativo" || e.status === "renovado" || e.status === "atrasado").length;
  const atrasados = emprestimos.filter((e) => e.status === "atrasado").length;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="rounded-xl p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600"><BookOpen className="h-6 w-6" /></div>
          <div><h2 className="page-title">Empréstimos</h2><p className="page-subtitle mt-1">Controle de empréstimos, renovações e devoluções do acervo</p></div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={fetchData}><RefreshCw className="h-4 w-4" /> Atualizar</Button>
          <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Novo Empréstimo</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="stats-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold">{emprestimos.length}</p></CardContent></Card>
        <Card className="stats-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Ativos/Renovados</p><p className="text-2xl font-bold">{ativos}</p></CardContent></Card>
        <Card className="stats-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Atrasados</p><p className="text-2xl font-bold text-red-600">{atrasados}</p></CardContent></Card>
        <Card className="stats-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Devolvidos</p><p className="text-2xl font-bold">{emprestimos.filter((e) => e.status === "devolvido").length}</p></CardContent></Card>
      </div>

      <Card><CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Buscar por aluno ou obra..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {[{ v: "todas", l: "Todas" }, { v: "ativo", l: "Ativos" }, { v: "atrasado", l: "Atrasados" }, { v: "devolvido", l: "Devolvidos" }].map((o) => (
              <button key={o.v} onClick={() => setStatusFilter(o.v)} className={cn("rounded-full px-3 py-1 text-[11px] font-medium transition-all", statusFilter === o.v ? "bg-idep-700 text-white" : "bg-muted text-muted-foreground hover:text-foreground border border-border")}>{o.l}</button>
            ))}
          </div>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        {loading ? <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        : filtered.length === 0 ? <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-foreground">{search ? "Nenhum empréstimo encontrado" : "Nenhum empréstimo registrado"}</p>
            <p className="text-xs text-muted-foreground mt-1">{search ? "Tente alterar os termos" : "Clique em 'Novo Empréstimo' para registrar"}</p>
          </div>
        : <div className="divide-y divide-border">
            {filtered.map((emp, index) => (
              <motion.div key={emp.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}
                className="group flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-4 hover:bg-accent/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Library className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <p className="text-sm font-medium text-foreground truncate">{emp.obra_titulo}</p>
                    <Badge variant={statusVariant[emp.status] || "default"} className="text-[9px] px-1.5 py-0 h-4">{STATUS_EMPR_OPTIONS.find((s) => s.value === emp.status)?.label}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1">
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><User className="h-3 w-3" />{emp.aluno_nome}</span>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><CalendarDays className="h-3 w-3" />Empréstimo: {formatFullDate(emp.data_emprestimo)}</span>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">Devolução prevista: {new Date(emp.data_devolucao_prevista).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(emp.status === "ativo" || emp.status === "atrasado") && (
                    <button onClick={() => handleDevolver(emp)} className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors" title="Registrar devolução">
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button onClick={() => { setEditing(emp); setFormData({ obra_id: emp.obra_id, aluno_id: emp.aluno_id, data_emprestimo: emp.data_emprestimo.split("T")[0], data_devolucao_prevista: emp.data_devolucao_prevista.split("T")[0], status: emp.status, observacoes: emp.observacoes || "", unidade_id: emp.unidade_id }); setFormError(""); setModalOpen(true); }}
                    className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><Edit3 className="h-3.5 w-3.5" /></button>
                </div>
              </motion.div>
            ))}
          </div>}
      </CardContent></Card>

      {/* Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar Empréstimo" : "Novo Empréstimo"} size="lg">
        <div className="space-y-4">
          {formError && <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{formError}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Aluno *" options={alunoOptions} placeholder="Selecione o aluno" value={formData.aluno_id} onChange={(e) => setFormData({ ...formData, aluno_id: e.target.value })} disabled={saving || !!editing} />
            <Select label="Obra *" options={obraOptions} placeholder="Selecione a obra" value={formData.obra_id} onChange={(e) => setFormData({ ...formData, obra_id: e.target.value })} disabled={saving || !!editing} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Data do Empréstimo *" type="date" value={formData.data_emprestimo} onChange={(e) => setFormData({ ...formData, data_emprestimo: e.target.value })} disabled={saving} />
            <Input label="Devolução Prevista *" type="date" value={formData.data_devolucao_prevista} onChange={(e) => setFormData({ ...formData, data_devolucao_prevista: e.target.value })} disabled={saving} />
            <Select label="Unidade *" options={unidadeOptions} placeholder="Selecione" value={formData.unidade_id} onChange={(e) => setFormData({ ...formData, unidade_id: e.target.value })} disabled={saving || !!editing} />
          </div>
          <Textarea label="Observações" value={formData.observacoes} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} rows={2} disabled={saving} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{editing ? "Salvar" : "Registrar Empréstimo"}</Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Delete */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmar exclusão" description="Tem certeza que deseja excluir este empréstimo?" size="sm">
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="gap-2"><Trash2 className="h-4 w-4" /> Excluir</Button>
        </DialogFooter>
      </Dialog>
    </motion.div>
  );
}
