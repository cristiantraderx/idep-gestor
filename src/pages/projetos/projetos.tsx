import { useState, useEffect, useCallback } from "react";
import {
  Projector,
  Plus,
  Search,
  Loader2,
  Trash2,
  RefreshCw,
  CalendarDays,
  Users,
  DollarSign,
  Flag,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { Unidade } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatFullDate, formatCurrency } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "planejado", label: "Planejado" },
  { value: "em_andamento", label: "Em Andamento" },
  { value: "pausado", label: "Pausado" },
  { value: "concluido", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" },
];

const PRIORIDADE_OPTIONS = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
];

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive" | "success" | "warning"> = {
  planejado: "secondary",
  em_andamento: "default",
  pausado: "warning",
  concluido: "success",
  cancelado: "destructive",
};

export function ProjetosPage() {
  const [projetos, setProjetos] = useState<Record<string, unknown>[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todas");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [formData, setFormData] = useState({
    nome: "", codigo: "", descricao: "", objetivo: "", escopo: "", orcamento: "",
    data_inicio: "", data_fim: "", coordenador: "", equipe: "", prioridade: "media",
    status: "planejado", observacoes: "", unidade_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [projRes, unidRes] = await Promise.all([
        supabase.from("projetos").select("*, unidades(nome, sigla)").order("created_at", { ascending: false }),
        supabase.from("unidades").select("*").eq("ativo", true).order("nome"),
      ]);
      if (projRes.data) setProjetos((projRes.data as Record<string, unknown>[]).map((p: Record<string, unknown>) => ({ ...p, unidade_nome: (p.unidades as Record<string, unknown> | undefined)?.nome as string || "Não definida" })));
      if (unidRes.data) setUnidades(unidRes.data);
    } catch (err) { console.error("Erro ao carregar projetos:", err); }
    finally { setLoading(false); }
  }, []);  useEffect(() => { let c = false; queueMicrotask(() => { if (!c) fetchData(); }); return () => { c = true; }; }, [fetchData]);

  const unidadeOptions = unidades.map((u) => ({ value: u.id, label: `${u.nome} (${u.sigla})` }));

  const openCreateModal = () => {
    setEditing(null);
    setFormData({ nome: "", codigo: "", descricao: "", objetivo: "", escopo: "", orcamento: "", data_inicio: "", data_fim: "", coordenador: "", equipe: "", prioridade: "media", status: "planejado", observacoes: "", unidade_id: "" });
    setFormError(""); setModalOpen(true);
  };

  const openEditModal = (p: Record<string, unknown>) => {
    setEditing(p);
    setFormData({
      nome: p.nome, codigo: p.codigo || "", descricao: p.descricao || "", objetivo: p.objetivo || "", escopo: p.escopo || "",
      orcamento: p.orcamento?.toString() || "", data_inicio: p.data_inicio?.split("T")[0] || "", data_fim: p.data_fim?.split("T")[0] || "",
      coordenador: p.coordenador || "", equipe: p.equipe || "", prioridade: p.prioridade || "media",
      status: p.status || "planejado", observacoes: p.observacoes || "", unidade_id: p.unidade_id,
    });
    setFormError(""); setModalOpen(true);
  };

  const handleSave = async () => {
    setFormError("");
    if (!formData.nome.trim() || !formData.unidade_id) {
      setFormError("Nome e unidade são obrigatórios."); return;
    }
    setSaving(true);
    try {
      const payload = {
        nome: formData.nome, codigo: formData.codigo || null, descricao: formData.descricao || null,
        objetivo: formData.objetivo || null, escopo: formData.escopo || null, orcamento: formData.orcamento ? parseFloat(formData.orcamento) : null,
        data_inicio: formData.data_inicio || null, data_fim: formData.data_fim || null, coordenador: formData.coordenador || null,
        equipe: formData.equipe || null, prioridade: formData.prioridade, status: formData.status,
        observacoes: formData.observacoes || null, unidade_id: formData.unidade_id,
      };
      if (editing) {
        const { error } = await supabase.from("projetos").update(payload).eq("id", editing.id);
        if (error) { setFormError(error.message); return; }
      } else {
        const { error } = await supabase.from("projetos").insert(payload);
        if (error) { setFormError(error.message); return; }
      }
      setModalOpen(false); fetchData();
    } catch (err: unknown) { setFormError(err instanceof Error ? err.message : "Erro ao salvar"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("projetos").delete().eq("id", id);
    if (!error) { setProjetos((prev) => prev.filter((p) => p.id !== id)); setDeleteConfirm(null); }
  };

  const stats = {
    total: projetos.length,
    andamento: projetos.filter((p) => p.status === "em_andamento").length,
    concluidos: projetos.filter((p) => p.status === "concluido").length,
    orcamentoTotal: projetos.reduce((acc, p) => acc + (p.orcamento || 0), 0),
  };

  const filtered = projetos.filter((p) => {
    const matchSearch = p.nome.toLowerCase().includes(search.toLowerCase()) ||
      (p.coordenador && p.coordenador.toLowerCase().includes(search.toLowerCase())) ||
      (p.codigo && p.codigo.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter !== "todas") return matchSearch && p.status === statusFilter;
    return matchSearch;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="rounded-xl p-3 bg-fuchsia-50 dark:bg-fuchsia-950/50 text-fuchsia-600">
            <Projector className="h-6 w-6" />
          </div>
          <div>
            <h2 className="page-title">Projetos</h2>
            <p className="page-subtitle mt-1">Gerencie projetos institucionais</p>
          </div>
        </div>
        <Button onClick={openCreateModal} className="gap-2"><Plus className="h-4 w-4" /> Novo Projeto</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg p-2 bg-fuchsia-100 dark:bg-fuchsia-950/50"><Projector className="h-4 w-4 text-fuchsia-600" /></div>
          <div><p className="text-[10px] text-muted-foreground">Total</p><p className="text-sm font-bold text-foreground">{stats.total}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg p-2 bg-blue-100 dark:bg-blue-950/50"><Flag className="h-4 w-4 text-blue-600" /></div>
          <div><p className="text-[10px] text-muted-foreground">Em Andamento</p><p className="text-sm font-bold text-blue-600">{stats.andamento}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg p-2 bg-emerald-100 dark:bg-emerald-950/50"><Projector className="h-4 w-4 text-emerald-600" /></div>
          <div><p className="text-[10px] text-muted-foreground">Concluídos</p><p className="text-sm font-bold text-emerald-600">{stats.concluidos}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg p-2 bg-amber-100 dark:bg-amber-950/50"><DollarSign className="h-4 w-4 text-amber-600" /></div>
          <div><p className="text-[10px] text-muted-foreground">Orçamento Total</p><p className="text-sm font-bold text-amber-600">{formatCurrency(stats.orcamentoTotal)}</p></div>
        </CardContent></Card>
      </div>

      <Card><CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Buscar por nome, coordenador ou código..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div className="flex items-center gap-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="h-7 rounded-lg border border-input bg-background px-2 text-[10px] font-medium text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="todas">Todos os status</option>
              {STATUS_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
            </select>
            <Button variant="ghost" size="icon-sm" onClick={fetchData}><RefreshCw className="h-3.5 w-3.5" /></Button>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{filtered.length} projeto{filtered.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Projector className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-foreground">{search ? "Nenhum projeto encontrado" : "Nenhum projeto cadastrado"}</p>
            <p className="text-xs text-muted-foreground mt-1">{search ? "Tente alterar os termos da busca" : "Clique em \"Novo Projeto\" para cadastrar"}</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((proj, index) => (
              <motion.div key={proj.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="group flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-4 hover:bg-accent/30 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="rounded-lg p-2 bg-fuchsia-50 dark:bg-fuchsia-950/50 shrink-0">
                    <Projector className="h-5 w-5 text-fuchsia-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{proj.nome}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                      <Badge variant={statusVariant[proj.status] || "outline"} className="text-[9px]">
                        {STATUS_OPTIONS.find((s) => s.value === proj.status)?.label || proj.status}
                      </Badge>
                      {proj.coordenador && <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Users className="h-3 w-3" />{proj.coordenador}</span>}
                      {proj.data_inicio && <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><CalendarDays className="h-3 w-3" />{formatFullDate(proj.data_inicio)}</span>}
                      {proj.orcamento && <span className="text-[11px] font-medium text-amber-600">{formatCurrency(proj.orcamento)}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => openEditModal(proj)}
                    className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><Edit3 className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDeleteConfirm(proj.id)}
                    className="rounded p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent></Card>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? "Editar Projeto" : "Novo Projeto"}
        description={editing ? `Editando: ${editing.nome}` : "Cadastre um novo projeto"} size="lg">
        <div className="space-y-4">
          {formError && (<div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{formError}</div>)}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nome *" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} placeholder="Ex: Ampliação do Campus" disabled={saving} />
            <Input label="Código" value={formData.codigo} onChange={(e) => setFormData({ ...formData, codigo: e.target.value })} placeholder="Ex: PROJ-001" disabled={saving} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select label="Status" options={STATUS_OPTIONS} value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} disabled={saving} />
            <Select label="Prioridade" options={PRIORIDADE_OPTIONS} value={formData.prioridade} onChange={(e) => setFormData({ ...formData, prioridade: e.target.value })} disabled={saving} />
            <Input label="Orçamento" type="number" step="0.01" value={formData.orcamento} onChange={(e) => setFormData({ ...formData, orcamento: e.target.value })} placeholder="Ex: 50000" disabled={saving} />
          </div>
          <Textarea label="Descrição" value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} placeholder="Descrição do projeto..." rows={2} disabled={saving} />
          <Textarea label="Objetivo" value={formData.objetivo} onChange={(e) => setFormData({ ...formData, objetivo: e.target.value })} placeholder="Qual o objetivo principal?" rows={2} disabled={saving} />
          <Textarea label="Escopo" value={formData.escopo} onChange={(e) => setFormData({ ...formData, escopo: e.target.value })} placeholder="Defina o escopo do projeto..." rows={2} disabled={saving} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Data de início" type="date" value={formData.data_inicio} onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })} disabled={saving} />
            <Input label="Data de fim" type="date" value={formData.data_fim} onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })} disabled={saving} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Coordenador" value={formData.coordenador} onChange={(e) => setFormData({ ...formData, coordenador: e.target.value })} placeholder="Nome do coordenador" disabled={saving} />
            <Input label="Equipe" value={formData.equipe} onChange={(e) => setFormData({ ...formData, equipe: e.target.value })} placeholder="Membros da equipe" disabled={saving} />
          </div>
          <Select label="Unidade *" options={unidadeOptions} placeholder="Selecione a unidade" value={formData.unidade_id} onChange={(e) => setFormData({ ...formData, unidade_id: e.target.value })} disabled={saving} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Salvar alterações" : "Cadastrar projeto"}
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmar exclusão"
        description="Tem certeza que deseja excluir este projeto?" size="sm">
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="gap-2"><Trash2 className="h-4 w-4" /> Excluir</Button>
        </DialogFooter>
      </Dialog>
    </motion.div>
  );
}