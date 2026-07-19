import { useState, useEffect, useCallback } from "react";
import {
  HeadphonesIcon,
  Plus,
  Search,
  Loader2,
  Edit3,
  Trash2,
  RefreshCw,
  User,
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
  ArrowUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { ChamadoTI, Unidade } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatFullDate } from "@/lib/utils";

const CATEGORIA_OPTIONS = [
  { value: "hardware", label: "Hardware" },
  { value: "software", label: "Software" },
  { value: "rede", label: "Rede" },
  { value: "acesso", label: "Acesso/Senha" },
  { value: "email", label: "E-mail" },
  { value: "telefonia", label: "Telefonia" },
  { value: "outros", label: "Outros" },
];

const PRIORIDADE_OPTIONS = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "critica", label: "Crítica" },
];

const STATUS_OPTIONS = [
  { value: "aberto", label: "Aberto" },
  { value: "em_andamento", label: "Em Andamento" },
  { value: "aguardando", label: "Aguardando" },
  { value: "resolvido", label: "Resolvido" },
  { value: "fechado", label: "Fechado" },
  { value: "cancelado", label: "Cancelado" },
];

const statusVariant: Record<string, "success" | "warning" | "default" | "destructive" | "secondary"> = {
  aberto: "default",
  em_andamento: "warning",
  aguardando: "secondary",
  resolvido: "success",
  fechado: "secondary",
  cancelado: "destructive",
};

const prioridadeColor: Record<string, string> = {
  baixa: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  media: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  alta: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  critica: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
};

export function ChamadosPage() {
  const [chamados, setChamados] = useState<(ChamadoTI & { unidade_nome?: string })[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todas");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingChamado, setEditingChamado] = useState<ChamadoTI | null>(null);
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    solicitante_nome: "",
    solicitante_email: "",
    categoria: "software" as ChamadoTI["categoria"],
    prioridade: "media" as ChamadoTI["prioridade"],
    status: "aberto" as ChamadoTI["status"],
    tecnico_responsavel: "",
    data_abertura: new Date().toISOString().split("T")[0],
    solucao: "",
    unidade_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [detailChamado, setDetailChamado] = useState<(ChamadoTI & { unidade_nome?: string }) | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [chamadosRes, unidadesRes] = await Promise.all([
        supabase
          .from("chamados_ti")
          .select("*, unidades(nome, sigla)")
          .order("created_at", { ascending: false }),
        supabase.from("unidades").select("*").eq("ativo", true).order("nome"),
      ]);

      if (chamadosRes.data) {
        setChamados(
          (chamadosRes.data as Record<string, unknown>[]).map((c: Record<string, unknown>) => ({
            ...c,
            unidade_nome: (c.unidades as Record<string, unknown> | undefined)?.nome as string || "Não definida",
          }))
        );
      }
      if (unidadesRes.data) setUnidades(unidadesRes.data);
    } catch (err) {
      console.error("Erro ao carregar chamados:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { let c = false; queueMicrotask(() => { if (!c) fetchData(); }); return () => { c = true; }; }, [fetchData]);

  const unidadeOptions = unidades.map((u) => ({ value: u.id, label: `${u.nome} (${u.sigla})` }));

  const openCreateModal = () => {
    setEditingChamado(null);
    setFormData({
      titulo: "", descricao: "", solicitante_nome: "", solicitante_email: "",
      categoria: "software", prioridade: "media", status: "aberto",
      tecnico_responsavel: "", data_abertura: new Date().toISOString().split("T")[0],
      solucao: "", unidade_id: "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (c: ChamadoTI) => {
    setEditingChamado(c);
    setFormData({
      titulo: c.titulo, descricao: c.descricao || "",
      solicitante_nome: c.solicitante_nome, solicitante_email: c.solicitante_email || "",
      categoria: c.categoria, prioridade: c.prioridade, status: c.status,
      tecnico_responsavel: c.tecnico_responsavel || "",
      data_abertura: c.data_abertura.split("T")[0], solucao: c.solucao || "",
      unidade_id: c.unidade_id,
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSave = async () => {
    setFormError("");
    if (!formData.titulo.trim() || !formData.solicitante_nome.trim() || !formData.unidade_id) {
      setFormError("Título, solicitante e unidade são obrigatórios.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        titulo: formData.titulo, descricao: formData.descricao || null,
        solicitante_nome: formData.solicitante_nome, solicitante_email: formData.solicitante_email || null,
        categoria: formData.categoria, prioridade: formData.prioridade,
        status: formData.status, tecnico_responsavel: formData.tecnico_responsavel || null,
        data_abertura: formData.data_abertura, solucao: formData.solucao || null,
        unidade_id: formData.unidade_id,
      };
      if (editingChamado) {
        const { error } = await supabase.from("chamados_ti").update(payload).eq("id", editingChamado.id);
        if (error) { setFormError(error.message); return; }
      } else {
        const { error } = await supabase.from("chamados_ti").insert(payload);
        if (error) { setFormError(error.message); return; }
      }
      setModalOpen(false);
      fetchData();
    } catch (err: unknown) { setFormError(err instanceof Error ? err.message : "Erro ao salvar chamado");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("chamados_ti").delete().eq("id", id);
    if (!error) { setChamados((p) => p.filter((c) => c.id !== id)); setDeleteConfirm(null); }
  };

  const filtered = chamados.filter((c) => {
    const s = search.toLowerCase();
    const match = c.titulo.toLowerCase().includes(s) || c.solicitante_nome.toLowerCase().includes(s) || (c.tecnico_responsavel || "").toLowerCase().includes(s);
    if (statusFilter === "todas") return match;
    return match && c.status === statusFilter;
  });

  const stats = {
    abertos: chamados.filter((c) => c.status === "aberto" || c.status === "em_andamento" || c.status === "aguardando").length,
    resolvidos: chamados.filter((c) => c.status === "resolvido" || c.status === "fechado").length,
    criticos: chamados.filter((c) => c.prioridade === "critica" && c.status !== "resolvido" && c.status !== "fechado" && c.status !== "cancelado").length,
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="rounded-xl p-3 bg-gray-50 dark:bg-gray-950/50 text-gray-600">
            <HeadphonesIcon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="page-title">Chamados Técnicos</h2>
            <p className="page-subtitle mt-1">Abertura e acompanhamento de chamados de suporte de TI</p>
          </div>
        </div>
        <Button onClick={openCreateModal} className="gap-2"><Plus className="h-4 w-4" /> Novo Chamado</Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="stats-card"><CardContent className="p-4 flex items-center justify-between">
          <div><p className="text-xs text-muted-foreground">Abertos / Em Andamento</p><p className="text-2xl font-bold">{stats.abertos}</p></div>
          <div className="rounded-lg p-2.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600"><AlertTriangle className="h-5 w-5" /></div>
        </CardContent></Card>
        <Card className="stats-card"><CardContent className="p-4 flex items-center justify-between">
          <div><p className="text-xs text-muted-foreground">Resolvidos / Fechados</p><p className="text-2xl font-bold">{stats.resolvidos}</p></div>
          <div className="rounded-lg p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></div>
        </CardContent></Card>
        <Card className="stats-card"><CardContent className="p-4 flex items-center justify-between">
          <div><p className="text-xs text-muted-foreground">Críticos Pendentes</p><p className="text-2xl font-bold text-red-600">{stats.criticos}</p></div>
          <div className="rounded-lg p-2.5 bg-red-50 dark:bg-red-950/50 text-red-600"><ArrowUp className="h-5 w-5" /></div>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <Card><CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Buscar por título, solicitante ou técnico..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {[{ v: "todas", l: "Todas" }, { v: "aberto", l: "Abertos" }, { v: "em_andamento", l: "Em Andamento" }, { v: "resolvido", l: "Resolvidos" }].map((opt) => (
              <button key={opt.v} onClick={() => setStatusFilter(opt.v)}
                className={cn("rounded-full px-3 py-1 text-[11px] font-medium transition-all",
                  statusFilter === opt.v ? "bg-idep-700 text-white" : "bg-muted text-muted-foreground hover:text-foreground border border-border")}>{opt.l}</button>
            ))}
            <Button variant="ghost" size="icon-sm" onClick={fetchData}><RefreshCw className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      </CardContent></Card>

      {/* List */}
      <Card><CardContent className="p-0">
        {loading ? <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        : filtered.length === 0 ? <div className="flex flex-col items-center justify-center py-16 text-center">
            <HeadphonesIcon className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-foreground">{search ? "Nenhum chamado encontrado" : "Nenhum chamado cadastrado"}</p>
            <p className="text-xs text-muted-foreground mt-1">{search ? "Tente alterar os termos" : "Clique em 'Novo Chamado' para abrir"}</p>
          </div>
        : <div className="divide-y divide-border">
            {filtered.map((chamado, index) => (
              <motion.div key={chamado.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}
                className="group flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-4 hover:bg-accent/30 transition-colors cursor-pointer"
                onClick={() => setDetailChamado(chamado)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{chamado.titulo}</p>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${prioridadeColor[chamado.prioridade]}`}>{PRIORIDADE_OPTIONS.find((o) => o.value === chamado.prioridade)?.label}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1">
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><User className="h-3 w-3" />{chamado.solicitante_nome}</span>
                    <span className="text-[11px] text-muted-foreground">{CATEGORIA_OPTIONS.find((o) => o.value === chamado.categoria)?.label}</span>
                    {chamado.tecnico_responsavel && <span className="text-[11px] text-muted-foreground">Técnico: {chamado.tecnico_responsavel}</span>}
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><CalendarDays className="h-3 w-3" />{formatFullDate(chamado.data_abertura)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Badge variant={statusVariant[chamado.status] || "default"} className="text-[10px]">{STATUS_OPTIONS.find((s) => s.value === chamado.status)?.label}</Badge>
                  <button onClick={() => openEditModal(chamado)} className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors opacity-0 group-hover:opacity-100"><Edit3 className="h-3.5 w-3.5" /></button>
                </div>
              </motion.div>
            ))}
          </div>}
      </CardContent></Card>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} title={editingChamado ? "Editar Chamado" : "Novo Chamado"}
        description={editingChamado ? `Editando: ${editingChamado.titulo}` : "Abra um chamado técnico"} size="xl">
        <div className="space-y-4">
          {formError && <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{formError}</div>}
          <Input label="Título *" value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} placeholder="Ex: Computador não liga" disabled={saving} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Solicitante *" value={formData.solicitante_nome} onChange={(e) => setFormData({ ...formData, solicitante_nome: e.target.value })} placeholder="Nome do solicitante" disabled={saving} />
            <Input label="E-mail do solicitante" type="email" value={formData.solicitante_email} onChange={(e) => setFormData({ ...formData, solicitante_email: e.target.value })} placeholder="email@idep.ro.gov.br" disabled={saving} />
          </div>
          <Textarea label="Descrição" value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} placeholder="Descreva o problema detalhadamente..." rows={3} disabled={saving} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select label="Categoria *" options={CATEGORIA_OPTIONS} value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: e.target.value as ChamadoTI["categoria"] })} disabled={saving} />
            <Select label="Prioridade *" options={PRIORIDADE_OPTIONS} value={formData.prioridade} onChange={(e) => setFormData({ ...formData, prioridade: e.target.value as ChamadoTI["prioridade"] })} disabled={saving} />
            <Select label="Unidade *" options={unidadeOptions} placeholder="Selecione" value={formData.unidade_id} onChange={(e) => setFormData({ ...formData, unidade_id: e.target.value })} disabled={saving} />
          </div>
          {editingChamado && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Status" options={STATUS_OPTIONS} value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as ChamadoTI["status"] })} disabled={saving} />
            <Input label="Técnico responsável" value={formData.tecnico_responsavel} onChange={(e) => setFormData({ ...formData, tecnico_responsavel: e.target.value })} placeholder="Nome do técnico" disabled={saving} />
          </div>}
          {editingChamado && <Textarea label="Solução" value={formData.solucao} onChange={(e) => setFormData({ ...formData, solucao: e.target.value })} placeholder="Descreva a solução aplicada..." rows={2} disabled={saving} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{editingChamado ? "Salvar" : "Abrir Chamado"}</Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={!!detailChamado} onClose={() => setDetailChamado(null)} title="Detalhes do Chamado" size="lg">
        {detailChamado && <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
            <div className="rounded-lg p-3 bg-gray-50 dark:bg-gray-950/50 shrink-0"><HeadphonesIcon className="h-6 w-6 text-gray-600" /></div>
            <div className="space-y-1 flex-1">
              <p className="text-lg font-semibold text-foreground">{detailChamado.titulo}</p>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span><User className="h-3 w-3 inline mr-1" />{detailChamado.solicitante_nome}</span>
                <span>{CATEGORIA_OPTIONS.find((o) => o.value === detailChamado.categoria)?.label}</span>
                <span className={prioridadeColor[detailChamado.prioridade] + " px-1.5 rounded"}>{PRIORIDADE_OPTIONS.find((o) => o.value === detailChamado.prioridade)?.label}</span>
              </div>
              <Badge variant={statusVariant[detailChamado.status]}>{STATUS_OPTIONS.find((s) => s.value === detailChamado.status)?.label}</Badge>
            </div>
          </div>
          {detailChamado.descricao && <div className="rounded-lg border border-border p-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Descrição</p>
            <p className="text-sm text-foreground whitespace-pre-wrap">{detailChamado.descricao}</p>
          </div>}
          {detailChamado.solucao && <div className="rounded-lg border border-border p-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Solução</p>
            <p className="text-sm text-foreground whitespace-pre-wrap">{detailChamado.solucao}</p>
          </div>}
          {detailChamado.tecnico_responsavel && <div className="rounded-lg border border-border p-3 flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Técnico: <strong>{detailChamado.tecnico_responsavel}</strong></span>
          </div>}
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => { setDetailChamado(null); openEditModal(detailChamado); }}><Edit3 className="h-3.5 w-3.5" /> Editar</Button>
          </div>
        </div>}
      </Dialog>

      {/* Delete */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmar exclusão" description="Tem certeza que deseja excluir este chamado?" size="sm">
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="gap-2"><Trash2 className="h-4 w-4" /> Excluir</Button>
        </DialogFooter>
      </Dialog>
    </motion.div>
  );
}
