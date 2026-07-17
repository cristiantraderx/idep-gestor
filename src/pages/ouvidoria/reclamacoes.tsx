import { useState, useEffect, useCallback } from "react";
import {
  Mic,
  Plus,
  Search,
  Loader2,
  Edit3,
  Trash2,
  RefreshCw,
  CalendarDays,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
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
import { formatFullDate } from "@/lib/utils";

const TIPO_OPTIONS = [
  { value: "reclamacao", label: "Reclamação" },
  { value: "denuncia", label: "Denúncia" },
  { value: "elogio", label: "Elogio" },
  { value: "solicitacao", label: "Solicitação" },
  { value: "outros", label: "Outros" },
];

const PRIORIDADE_OPTIONS = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
];

const STATUS_OPTIONS = [
  { value: "recebida", label: "Recebida" },
  { value: "em_analise", label: "Em Análise" },
  { value: "em_andamento", label: "Em Andamento" },
  { value: "concluida", label: "Concluída" },
  { value: "cancelada", label: "Cancelada" },
];

const tipoColors: Record<string, string> = {
  reclamacao: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  denuncia: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
  elogio: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  solicitacao: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  outros: "bg-muted text-muted-foreground",
};

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive" | "success" | "warning"> = {
  recebida: "secondary",
  em_analise: "default",
  em_andamento: "default",
  concluida: "success",
  cancelada: "destructive",
};

const prioridadeIcon: Record<string, string> = {
  baixa: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  media: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  alta: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
};

export function ReclamacoesPage() {
  const [reclamacoes, setReclamacoes] = useState<any[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todas");
  const [stats, setStats] = useState({ recebidas: 0, em_andamento: 0, concluidas: 0, alta_prioridade: 0 });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [formData, setFormData] = useState({
    tipo: "reclamacao",
    assunto: "",
    descricao: "",
    manifestante_nome: "",
    manifestante_email: "",
    manifestante_telefone: "",
    anonimo: false,
    prioridade: "media",
    status: "recebida",
    parecer: "",
    responsavel: "",
    unidade_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [recRes, unidRes] = await Promise.all([
        supabase.from("reclamacoes").select("*, unidades(nome, sigla)").order("data_abertura", { ascending: false }),
        supabase.from("unidades").select("*").eq("ativo", true).order("nome"),
      ]);

      if (recRes.data) {
        const data = (recRes.data as any[]).map((r) => ({
          ...r,
          unidade_nome: r.unidades?.nome || "Não definida",
        }));
        setReclamacoes(data);
        setStats({
          recebidas: data.filter((r: any) => r.status === "recebida").length,
          em_andamento: data.filter((r: any) => r.status === "em_andamento" || r.status === "em_analise").length,
          concluidas: data.filter((r: any) => r.status === "concluida").length,
          alta_prioridade: data.filter((r: any) => r.prioridade === "alta" && r.status !== "concluida" && r.status !== "cancelada").length,
        });
      }
      if (unidRes.data) setUnidades(unidRes.data);
    } catch (err) {
      console.error("Erro ao carregar reclamações:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const unidadeOptions = unidades.map((u) => ({ value: u.id, label: `${u.nome} (${u.sigla})` }));

  const openCreateModal = () => {
    setEditing(null);
    setFormData({
      tipo: "reclamacao",
      assunto: "",
      descricao: "",
      manifestante_nome: "",
      manifestante_email: "",
      manifestante_telefone: "",
      anonimo: false,
      prioridade: "media",
      status: "recebida",
      parecer: "",
      responsavel: "",
      unidade_id: "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (rec: any) => {
    setEditing(rec);
    setFormData({
      tipo: rec.tipo || "reclamacao",
      assunto: rec.assunto,
      descricao: rec.descricao || "",
      manifestante_nome: rec.manifestante_nome || "",
      manifestante_email: rec.manifestante_email || "",
      manifestante_telefone: rec.manifestante_telefone || "",
      anonimo: rec.anonimo || false,
      prioridade: rec.prioridade || "media",
      status: rec.status || "recebida",
      parecer: rec.parecer || "",
      responsavel: rec.responsavel || "",
      unidade_id: rec.unidade_id,
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSave = async () => {
    setFormError("");
    if (!formData.assunto.trim() || !formData.unidade_id) {
      setFormError("Assunto e unidade são obrigatórios.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        tipo: formData.tipo,
        assunto: formData.assunto,
        descricao: formData.descricao || null,
        manifestante_nome: formData.anonimo ? null : (formData.manifestante_nome || null),
        manifestante_email: formData.anonimo ? null : (formData.manifestante_email || null),
        manifestante_telefone: formData.anonimo ? null : (formData.manifestante_telefone || null),
        anonimo: formData.anonimo,
        prioridade: formData.prioridade,
        status: formData.status,
        parecer: formData.parecer || null,
        responsavel: formData.responsavel || null,
        unidade_id: formData.unidade_id,
        data_abertura: editing?.data_abertura || new Date().toISOString(),
        data_conclusao: formData.status === "concluida" ? new Date().toISOString() : (editing?.data_conclusao || null),
      };

      if (editing) {
        const { error } = await supabase.from("reclamacoes").update(payload).eq("id", editing.id);
        if (error) { setFormError(error.message); return; }
      } else {
        const { error } = await supabase.from("reclamacoes").insert(payload);
        if (error) { setFormError(error.message); return; }
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || "Erro ao salvar");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("reclamacoes").delete().eq("id", id);
    if (!error) {
      setReclamacoes((prev) => prev.filter((r) => r.id !== id));
      setDeleteConfirm(null);
    }
  };

  const filtered = reclamacoes.filter((r) => {
    const matchSearch = r.assunto.toLowerCase().includes(search.toLowerCase()) ||
      (r.descricao && r.descricao.toLowerCase().includes(search.toLowerCase())) ||
      (r.numero_protocolo && r.numero_protocolo.includes(search));
    if (statusFilter !== "todas") return matchSearch && r.status === statusFilter;
    return matchSearch;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="rounded-xl p-3 bg-purple-50 dark:bg-purple-950/50 text-purple-600">
            <Mic className="h-6 w-6" />
          </div>
          <div>
            <h2 className="page-title">Reclamações / Denúncias</h2>
            <p className="page-subtitle mt-1">Gestão de manifestações da ouvidoria</p>
          </div>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="h-4 w-4" /> Nova Manifestação
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg p-2 bg-slate-100 dark:bg-slate-800"><Clock className="h-4 w-4 text-slate-600" /></div>
          <div><p className="text-[10px] text-muted-foreground">Recebidas</p><p className="text-sm font-bold text-foreground">{stats.recebidas}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg p-2 bg-blue-100 dark:bg-blue-950/50"><AlertTriangle className="h-4 w-4 text-blue-600" /></div>
          <div><p className="text-[10px] text-muted-foreground">Em Andamento</p><p className="text-sm font-bold text-foreground">{stats.em_andamento}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg p-2 bg-emerald-100 dark:bg-emerald-950/50"><CheckCircle2 className="h-4 w-4 text-emerald-600" /></div>
          <div><p className="text-[10px] text-muted-foreground">Concluídas</p><p className="text-sm font-bold text-foreground">{stats.concluidas}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg p-2 bg-red-100 dark:bg-red-950/50"><Flag className="h-4 w-4 text-red-600" /></div>
          <div><p className="text-[10px] text-muted-foreground">Alta Prioridade</p><p className="text-sm font-bold text-foreground">{stats.alta_prioridade}</p></div>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="Buscar por assunto, descrição ou protocolo..." value={search}
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
              <span className="text-xs text-muted-foreground whitespace-nowrap">{filtered.length} registro{filtered.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Mic className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-foreground">{search ? "Nenhuma manifestação encontrada" : "Nenhuma manifestação registrada"}</p>
              <p className="text-xs text-muted-foreground mt-1">{search ? "Tente alterar os termos da busca" : "Clique em \"Nova Manifestação\" para registrar"}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((rec, index) => (
                <motion.div key={rec.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="group flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-4 hover:bg-accent/30 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`rounded-lg p-2 shrink-0 ${prioridadeIcon[rec.prioridade] || "bg-muted"}`}>
                      {rec.anonimo ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{rec.assunto}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${tipoColors[rec.tipo] || tipoColors.outros}`}>
                          {TIPO_OPTIONS.find((c) => c.value === rec.tipo)?.label || rec.tipo}
                        </span>
                        <Badge variant={statusVariant[rec.status] || "outline"} className="text-[9px]">
                          {STATUS_OPTIONS.find((s) => s.value === rec.status)?.label || rec.status}
                        </Badge>
                        {rec.anonimo && <span className="text-[10px] text-muted-foreground italic">Anônimo</span>}
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <CalendarDays className="h-3 w-3" />
                          {formatFullDate(rec.data_abertura)}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          {rec.unidade_nome}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {rec.numero_protocolo && (
                      <span className="text-[10px] font-mono text-muted-foreground">#{rec.numero_protocolo}</span>
                    )}
                    <button onClick={() => openEditModal(rec)}
                      className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleteConfirm(rec.id)}
                      className="rounded p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? "Editar Manifestação" : "Nova Manifestação"}
        description={editing ? `Editando: ${editing.assunto}` : "Registre uma nova manifestação na ouvidoria"} size="lg">
        <div className="space-y-4">
          {formError && (<div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{formError}</div>)}
          <Input label="Assunto *" value={formData.assunto}
            onChange={(e) => setFormData({ ...formData, assunto: e.target.value })}
            placeholder="Ex: Problema com iluminação no bloco B" disabled={saving} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Tipo" options={TIPO_OPTIONS} value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })} disabled={saving} />
            <Select label="Prioridade" options={PRIORIDADE_OPTIONS} value={formData.prioridade}
              onChange={(e) => setFormData({ ...formData, prioridade: e.target.value })} disabled={saving} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Status" options={STATUS_OPTIONS} value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })} disabled={saving} />
            <Select label="Unidade *" options={unidadeOptions} placeholder="Selecione a unidade"
              value={formData.unidade_id} onChange={(e) => setFormData({ ...formData, unidade_id: e.target.value })} disabled={saving} />
          </div>
          <Textarea label="Descrição" value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            placeholder="Descreva detalhadamente a manifestação..." rows={3} disabled={saving} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Nome do manifestante" value={formData.manifestante_nome}
              onChange={(e) => setFormData({ ...formData, manifestante_nome: e.target.value })}
              placeholder="Opcional" disabled={saving || formData.anonimo} />
            <Input label="Email" value={formData.manifestante_email}
              onChange={(e) => setFormData({ ...formData, manifestante_email: e.target.value })}
              placeholder="Opcional" disabled={saving || formData.anonimo} />
            <Input label="Telefone" value={formData.manifestante_telefone}
              onChange={(e) => setFormData({ ...formData, manifestante_telefone: e.target.value })}
              placeholder="Opcional" disabled={saving || formData.anonimo} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={formData.anonimo}
              onChange={(e) => setFormData({ ...formData, anonimo: e.target.checked })}
              className="rounded border-border" disabled={saving} />
            <span className="text-xs font-medium text-muted-foreground">Manifestação anônima (dados do manifestante não serão registrados)</span>
          </label>
          <Textarea label="Parecer / Resposta" value={formData.parecer}
            onChange={(e) => setFormData({ ...formData, parecer: e.target.value })}
            placeholder="Parecer da ouvidoria sobre a manifestação..." rows={2} disabled={saving} />
          <Input label="Responsável" value={formData.responsavel}
            onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
            placeholder="Nome do responsável pelo atendimento" disabled={saving} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Salvar alterações" : "Registrar manifestação"}
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmar exclusão"
        description="Tem certeza que deseja excluir esta manifestação?" size="sm">
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="gap-2">
            <Trash2 className="h-4 w-4" /> Excluir
          </Button>
        </DialogFooter>
      </Dialog>
    </motion.div>
  );
}