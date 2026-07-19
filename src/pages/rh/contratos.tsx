import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Plus,
  Search,
  Loader2,
  Edit3,
  Trash2,
  RefreshCw,
  CalendarDays,
  DollarSign,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { Contrato, Unidade } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatFullDate, formatCurrency } from "@/lib/utils";

const TIPO_OPTIONS = [
  { value: "professor", label: "Professor" },
  { value: "servidor", label: "Servidor" },
  { value: "prestador_servico", label: "Prestador de Serviço" },
  { value: "fornecedor", label: "Fornecedor" },
];

const STATUS_OPTIONS = [
  { value: "ativo", label: "Ativo" },
  { value: "vigente", label: "Vigente" },
  { value: "expirado", label: "Expirado" },
  { value: "rescindido", label: "Rescindido" },
];

const statusVariant: Record<string, "success" | "warning" | "default" | "destructive"> = {
  ativo: "success",
  vigente: "default",
  expirado: "destructive",
  rescindido: "warning",
};

export function ContratosPage() {
  const [contratos, setContratos] = useState<(Contrato & { unidade_nome?: string })[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todas");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Contrato | null>(null);
  const [formData, setFormData] = useState({
    tipo: "prestador_servico" as Contrato["tipo"], contratado_nome: "", objeto: "",
    valor: "", data_inicio: new Date().toISOString().split("T")[0], data_fim: "",
    status: "vigente" as Contrato["status"], unidade_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [detailCont, setDetailCont] = useState<(Contrato & { unidade_nome?: string }) | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [contRes, unidRes] = await Promise.all([
        supabase.from("contratos").select("*, unidades(nome, sigla)").order("created_at", { ascending: false }),
        supabase.from("unidades").select("*").eq("ativo", true).order("nome"),
      ]);
      if (contRes.data) setContratos((contRes.data as Record<string, unknown>[]).map((c: Record<string, unknown>) => ({ ...c, unidade_nome: (c.unidades as Record<string, unknown> | undefined)?.nome as string || "Não definida" })));
      if (unidRes.data) setUnidades(unidRes.data);
    } catch (err) { console.error(err);
    } finally { setLoading(false); }
  }, []);  useEffect(() => { let c = false; queueMicrotask(() => { if (!c) fetchData(); }); return () => { c = true; }; }, [fetchData]);

  const unidadeOptions = unidades.map((u) => ({ value: u.id, label: `${u.nome} (${u.sigla})` }));

  const openCreate = () => {
    setEditing(null);
    setFormData({ tipo: "prestador_servico", contratado_nome: "", objeto: "", valor: "", data_inicio: new Date().toISOString().split("T")[0], data_fim: "", status: "vigente", unidade_id: "" });
    setFormError(""); setModalOpen(true);
  };

  const openEdit = (c: Contrato) => {
    setEditing(c);
    setFormData({
      tipo: c.tipo, contratado_nome: c.contratado_nome, objeto: c.objeto || "",
      valor: c.valor?.toString() || "", data_inicio: c.data_inicio.split("T")[0],
      data_fim: c.data_fim?.split("T")[0] || "", status: c.status, unidade_id: c.unidade_id,
    });
    setFormError(""); setModalOpen(true);
  };

  const handleSave = async () => {
    setFormError("");
    if (!formData.contratado_nome.trim() || !formData.unidade_id) { setFormError("Contratado e unidade são obrigatórios."); return; }
    setSaving(true);
    try {
      const payload = {
        tipo: formData.tipo, contratado_nome: formData.contratado_nome, objeto: formData.objeto || null,
        valor: formData.valor ? parseFloat(formData.valor) : null, data_inicio: formData.data_inicio,
        data_fim: formData.data_fim || null, status: formData.status, unidade_id: formData.unidade_id,
      };
      if (editing) { const { error } = await supabase.from("contratos").update(payload).eq("id", editing.id); if (error) { setFormError(error.message); return; } }
      else { const { error } = await supabase.from("contratos").insert(payload); if (error) { setFormError(error.message); return; } }
      setModalOpen(false); fetchData();
    } catch (err: unknown) { setFormError(err instanceof Error ? err.message : "Erro");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("contratos").delete().eq("id", id);
    if (!error) { setContratos((p) => p.filter((c) => c.id !== id)); setDeleteConfirm(null); }
  };

  const filtered = contratos.filter((c) => {
    const m = search.toLowerCase();
    const match = c.contratado_nome.toLowerCase().includes(m) || (c.objeto || "").toLowerCase().includes(m);
    if (statusFilter !== "todas") return match && c.status === statusFilter;
    return match;
  });

  const ativos = contratos.filter((c) => c.status === "ativo" || c.status === "vigente").length;
  const valorTotal = contratos.reduce((acc, c) => acc + (c.valor || 0), 0);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="rounded-xl p-3 bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600"><FileText className="h-6 w-6" /></div>
          <div><h2 className="page-title">Contratos</h2><p className="page-subtitle mt-1">Gestão de contratos de professores, servidores, prestadores e fornecedores</p></div>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Novo Contrato</Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="stats-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total de Contratos</p><p className="text-2xl font-bold">{contratos.length}</p></CardContent></Card>
        <Card className="stats-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Ativos / Vigentes</p><p className="text-2xl font-bold text-emerald-600">{ativos}</p></CardContent></Card>
        <Card className="stats-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Valor Total</p><p className="text-2xl font-bold">{formatCurrency(valorTotal)}</p></CardContent></Card>
      </div>

      <Card><CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Buscar por contratado ou objeto..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {[{ v: "todas", l: "Todas" }, { v: "ativo", l: "Ativos" }, { v: "vigente", l: "Vigentes" }, { v: "expirado", l: "Expirados" }].map((o) => (
              <button key={o.v} onClick={() => setStatusFilter(o.v)} className={cn("rounded-full px-3 py-1 text-[11px] font-medium transition-all", statusFilter === o.v ? "bg-idep-700 text-white" : "bg-muted text-muted-foreground hover:text-foreground border border-border")}>{o.l}</button>
            ))}
            <Button variant="ghost" size="icon-sm" onClick={fetchData}><RefreshCw className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        {loading ? <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        : filtered.length === 0 ? <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-foreground">{search ? "Nenhum contrato encontrado" : "Nenhum contrato cadastrado"}</p>
            <p className="text-xs text-muted-foreground mt-1">{search ? "Tente alterar os termos" : "Clique em 'Novo Contrato' para cadastrar"}</p>
          </div>
        : <div className="divide-y divide-border">
            {filtered.map((cont, index) => (
              <motion.div key={cont.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}
                className="group flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-4 hover:bg-accent/30 transition-colors cursor-pointer"
                onClick={() => setDetailCont(cont)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{cont.contratado_nome}</p>
                    <Badge variant={statusVariant[cont.status] || "default"} className="text-[9px] px-1.5 py-0 h-4">{STATUS_OPTIONS.find((s) => s.value === cont.status)?.label}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1">
                    <span className="text-[11px] text-muted-foreground">{TIPO_OPTIONS.find((o) => o.value === cont.tipo)?.label}</span>
                    {cont.objeto && <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">{cont.objeto}</span>}
                    {cont.valor && <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><DollarSign className="h-3 w-3" />{formatCurrency(cont.valor)}</span>}
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><CalendarDays className="h-3 w-3" />{formatFullDate(cont.data_inicio)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => openEdit(cont)} className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><Edit3 className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDeleteConfirm(cont.id)} className="rounded p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </motion.div>
            ))}
          </div>}
      </CardContent></Card>

      {/* Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar Contrato" : "Novo Contrato"} size="xl">
        <div className="space-y-4">
          {formError && <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{formError}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Contratado *" value={formData.contratado_nome} onChange={(e) => setFormData({ ...formData, contratado_nome: e.target.value })} placeholder="Nome do contratado" disabled={saving} />
            <Select label="Tipo *" options={TIPO_OPTIONS} value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value as Contrato["tipo"] })} disabled={saving} />
          </div>
          <Textarea label="Objeto" value={formData.objeto} onChange={(e) => setFormData({ ...formData, objeto: e.target.value })} placeholder="Descrição do objeto do contrato..." rows={2} disabled={saving} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Valor (R$)" type="number" value={formData.valor} onChange={(e) => setFormData({ ...formData, valor: e.target.value })} placeholder="0,00" disabled={saving} />
            <Select label="Unidade *" options={unidadeOptions} placeholder="Selecione" value={formData.unidade_id} onChange={(e) => setFormData({ ...formData, unidade_id: e.target.value })} disabled={saving} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Data de Início *" type="date" value={formData.data_inicio} onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })} disabled={saving} />
            <Input label="Data de Término" type="date" value={formData.data_fim} onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })} disabled={saving} />
          </div>
          {editing && <Select label="Status" options={STATUS_OPTIONS} value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as Contrato["status"] })} disabled={saving} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{editing ? "Salvar" : "Cadastrar"}</Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Detail */}
      <Dialog open={!!detailCont} onClose={() => setDetailCont(null)} title="Detalhes do Contrato" size="lg">
        {detailCont && <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
            <div className="rounded-lg p-3 bg-cyan-50 dark:bg-cyan-950/50"><FileText className="h-6 w-6 text-cyan-600" /></div>
            <div className="space-y-1">
              <p className="text-lg font-semibold">{detailCont.contratado_nome}</p>
              <p className="text-xs text-muted-foreground">{TIPO_OPTIONS.find((o) => o.value === detailCont.tipo)?.label}</p>
              <Badge variant={statusVariant[detailCont.status]}>{STATUS_OPTIONS.find((s) => s.value === detailCont.status)?.label}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {detailCont.objeto && <div className="rounded-lg border p-3 col-span-2"><p className="text-xs text-muted-foreground">Objeto</p><p className="text-sm">{detailCont.objeto}</p></div>}
            {detailCont.valor && <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Valor</p><p className="text-sm font-medium">{formatCurrency(detailCont.valor)}</p></div>}
            <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Vigência</p><p className="text-sm font-medium">{formatFullDate(detailCont.data_inicio)}{detailCont.data_fim && ` — ${formatFullDate(detailCont.data_fim)}`}</p></div>
            <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Unidade</p><p className="text-sm font-medium">{detailCont.unidade_nome}</p></div>
          </div>
        </div>}
      </Dialog>

      {/* Delete */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmar exclusão" description="Tem certeza que deseja excluir este contrato?" size="sm"><DialogFooter>
        <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
        <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="gap-2"><Trash2 className="h-4 w-4" /> Excluir</Button>
      </DialogFooter></Dialog>
    </motion.div>
  );
}
