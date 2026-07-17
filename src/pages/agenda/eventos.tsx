import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Plus,
  Search,
  Loader2,
  Edit3,
  Trash2,
  RefreshCw,
  Building2,
  Clock,
  MapPin,
  User,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { Unidade } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatFullDate } from "@/lib/utils";

const TIPO_OPTIONS = [
  { value: "reuniao", label: "Reunião" },
  { value: "evento_institucional", label: "Evento Institucional" },
  { value: "aula_inaugural", label: "Aula Inaugural" },
  { value: "formatura", label: "Formatura" },
  { value: "palestra", label: "Palestra" },
  { value: "oficina", label: "Oficina" },
  { value: "outros", label: "Outros" },
];

const STATUS_OPTIONS = [
  { value: "agendado", label: "Agendado" },
  { value: "confirmado", label: "Confirmado" },
  { value: "realizado", label: "Realizado" },
  { value: "cancelado", label: "Cancelado" },
];

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive" | "success" | "warning"> = {
  agendado: "secondary",
  confirmado: "default",
  realizado: "success",
  cancelado: "destructive",
};

const tipoColors: Record<string, string> = {
  reuniao: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  evento_institucional: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  aula_inaugural: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  formatura: "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
  palestra: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
  oficina: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300",
  outros: "bg-muted text-muted-foreground",
};

const COR_OPTIONS = [
  { value: "#3b82f6", label: "Azul" },
  { value: "#10b981", label: "Verde" },
  { value: "#f59e0b", label: "Amarelo" },
  { value: "#ef4444", label: "Vermelho" },
  { value: "#8b5cf6", label: "Roxo" },
  { value: "#ec4899", label: "Rosa" },
  { value: "#06b6d4", label: "Ciano" },
  { value: "#84cc16", label: "Lima" },
];

export function EventosPage() {
  const [eventos, setEventos] = useState<any[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("todos");
  const [viewMode, setViewMode] = useState<"lista" | "mes">("lista");
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [formData, setFormData] = useState({
    titulo: "", descricao: "", tipo: "reuniao", data_inicio: new Date().toISOString().split("T")[0],
    data_fim: "", hora_inicio: "", hora_fim: "", local: "", responsavel: "",
    publico_alvo: "", cor: "#3b82f6", status: "agendado", unidade_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [evRes, unidRes] = await Promise.all([
        supabase.from("eventos").select("*, unidades(nome, sigla)").order("data_inicio", { ascending: false }),
        supabase.from("unidades").select("*").eq("ativo", true).order("nome"),
      ]);
      if (evRes.data) {
        setEventos((evRes.data as any[]).map((e) => ({ ...e, unidade_nome: e.unidades?.nome || "Não definida" })));
      }
      if (unidRes.data) setUnidades(unidRes.data);
    } catch (err) { console.error("Erro ao carregar eventos:", err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const unidadeOptions = unidades.map((u) => ({ value: u.id, label: `${u.nome} (${u.sigla})` }));

  const openCreateModal = () => {
    setEditing(null);
    setFormData({
      titulo: "", descricao: "", tipo: "reuniao", data_inicio: new Date().toISOString().split("T")[0],
      data_fim: "", hora_inicio: "", hora_fim: "", local: "", responsavel: "",
      publico_alvo: "", cor: "#3b82f6", status: "agendado", unidade_id: "",
    });
    setFormError(""); setModalOpen(true);
  };

  const openEditModal = (ev: any) => {
    setEditing(ev);
    setFormData({
      titulo: ev.titulo, descricao: ev.descricao || "", tipo: ev.tipo || "reuniao",
      data_inicio: ev.data_inicio?.split("T")[0] || "", data_fim: ev.data_fim?.split("T")[0] || "",
      hora_inicio: ev.hora_inicio || "", hora_fim: ev.hora_fim || "", local: ev.local || "",
      responsavel: ev.responsavel || "", publico_alvo: ev.publico_alvo || "", cor: ev.cor || "#3b82f6",
      status: ev.status || "agendado", unidade_id: ev.unidade_id,
    });
    setFormError(""); setModalOpen(true);
  };

  const handleSave = async () => {
    setFormError("");
    if (!formData.titulo.trim() || !formData.unidade_id || !formData.data_inicio) {
      setFormError("Título, unidade e data de início são obrigatórios."); return;
    }
    setSaving(true);
    try {
      const payload = {
        titulo: formData.titulo, descricao: formData.descricao || null, tipo: formData.tipo,
        data_inicio: formData.data_inicio, data_fim: formData.data_fim || null,
        hora_inicio: formData.hora_inicio || null, hora_fim: formData.hora_fim || null,
        local: formData.local || null, responsavel: formData.responsavel || null,
        publico_alvo: formData.publico_alvo || null, cor: formData.cor || null,
        status: formData.status, unidade_id: formData.unidade_id,
      };
      if (editing) {
        const { error } = await supabase.from("eventos").update(payload).eq("id", editing.id);
        if (error) { setFormError(error.message); return; }
      } else {
        const { error } = await supabase.from("eventos").insert(payload);
        if (error) { setFormError(error.message); return; }
      }
      setModalOpen(false); fetchData();
    } catch (err: any) { setFormError(err.message || "Erro ao salvar"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("eventos").delete().eq("id", id);
    if (!error) { setEventos((prev) => prev.filter((e) => e.id !== id)); setDeleteConfirm(null); }
  };

  const filtered = eventos.filter((e) => {
    const matchSearch = e.titulo.toLowerCase().includes(search.toLowerCase()) ||
      (e.local && e.local.toLowerCase().includes(search.toLowerCase())) ||
      (e.responsavel && e.responsavel.toLowerCase().includes(search.toLowerCase()));
    if (tipoFilter !== "todos") return matchSearch && e.tipo === tipoFilter;
    return matchSearch;
  });

  // Calendar helpers
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const monthEvents = filtered.filter((e) => {
    const d = new Date(e.data_inicio);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const eventsByDay: Record<number, any[]> = {};
  monthEvents.forEach((e) => {
    const day = new Date(e.data_inicio).getDate();
    if (!eventsByDay[day]) eventsByDay[day] = [];
    eventsByDay[day].push(e);
  });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="rounded-xl p-3 bg-pink-50 dark:bg-pink-950/50 text-pink-600">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <h2 className="page-title">Eventos</h2>
            <p className="page-subtitle mt-1">Gerencie eventos e reuniões institucionais</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button onClick={() => setViewMode("lista")}
              className={`px-3 py-1.5 text-[11px] font-medium transition-colors ${viewMode === "lista" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              Lista
            </button>
            <button onClick={() => setViewMode("mes")}
              className={`px-3 py-1.5 text-[11px] font-medium transition-colors ${viewMode === "mes" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              Mês
            </button>
          </div>
          <Button onClick={openCreateModal} className="gap-2"><Plus className="h-4 w-4" /> Novo Evento</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="Buscar por título, local ou responsável..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div className="flex items-center gap-2">
              <select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)}
                className="h-7 rounded-lg border border-input bg-background px-2 text-[10px] font-medium text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="todos">Todos os tipos</option>
                {TIPO_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
              <Button variant="ghost" size="icon-sm" onClick={fetchData}><RefreshCw className="h-3.5 w-3.5" /></Button>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{filtered.length} evento{filtered.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {viewMode === "mes" ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <button onClick={() => { setCurrentMonth((prev) => (prev === 0 ? 11 : prev - 1)); if (currentMonth === 0) setCurrentYear((y) => y - 1); }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors">‹ Anterior</button>
              <CardTitle className="text-sm font-semibold">{monthNames[currentMonth]} {currentYear}</CardTitle>
              <button onClick={() => { setCurrentMonth((prev) => (prev === 11 ? 0 : prev + 1)); if (currentMonth === 11) setCurrentYear((y) => y + 1); }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors">Próximo ›</button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-b border-border">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
                <div key={d} className="px-2 py-2 text-[10px] font-medium text-muted-foreground text-center">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: firstDay }).map((_, i) => (<div key={`empty-${i}`} className="min-h-[80px] border-r border-b border-border bg-muted/20" />))}
              {Array.from({ length: daysInMonth }).map((_, day) => {
                const dayEvts = eventsByDay[day + 1] || [];
                const today = new Date();
                const isToday = day + 1 === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
                return (
                  <div key={day} className={`min-h-[80px] border-r border-b border-border p-1.5 ${isToday ? "bg-pink-50/50 dark:bg-pink-950/20" : ""}`}>
                    <span className={`text-[10px] font-medium ${isToday ? "text-pink-600" : "text-muted-foreground"}`}>{day + 1}</span>
                    <div className="mt-1 space-y-0.5">
                      {dayEvts.slice(0, 2).map((ev: any, i: number) => (
                        <div key={i} className="text-[7px] leading-tight px-1 py-0.5 rounded truncate text-white font-medium"
                          style={{ backgroundColor: ev.cor || "#3b82f6" }}>
                          {ev.titulo}
                        </div>
                      ))}
                      {dayEvts.length > 2 && <span className="text-[7px] text-muted-foreground">+{dayEvts.length - 2} mais</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Calendar className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm font-medium text-foreground">{search ? "Nenhum evento encontrado" : "Nenhum evento cadastrado"}</p>
                <p className="text-xs text-muted-foreground mt-1">{search ? "Tente alterar os termos da busca" : "Clique em \"Novo Evento\" para cadastrar"}</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map((ev, index) => (
                  <motion.div key={ev.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="group flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-4 hover:bg-accent/30 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="rounded-lg p-2 shrink-0" style={{ backgroundColor: `${ev.cor || "#3b82f6"}20` }}>
                        <Calendar className="h-5 w-5" style={{ color: ev.cor || "#3b82f6" }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{ev.titulo}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${tipoColors[ev.tipo] || tipoColors.outros}`}>
                            {TIPO_OPTIONS.find((c) => c.value === ev.tipo)?.label || ev.tipo}
                          </span>
                          <Badge variant={statusVariant[ev.status] || "outline"} className="text-[9px]">
                            {STATUS_OPTIONS.find((s) => s.value === ev.status)?.label || ev.status}
                          </Badge>
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Calendar className="h-3 w-3" />{formatFullDate(ev.data_inicio)}</span>
                          {ev.local && <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><MapPin className="h-3 w-3" />{ev.local}</span>}
                          {ev.responsavel && <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><User className="h-3 w-3" />{ev.responsavel}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => openEditModal(ev)}
                        className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><Edit3 className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setDeleteConfirm(ev.id)}
                        className="rounded p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? "Editar Evento" : "Novo Evento"}
        description={editing ? `Editando: ${editing.titulo}` : "Cadastre um novo evento ou reunião"} size="lg">
        <div className="space-y-4">
          {formError && (<div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{formError}</div>)}
          <Input label="Título *" value={formData.titulo}
            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
            placeholder="Ex: Reunião de Planejamento Estratégico" disabled={saving} />
          <Textarea label="Descrição" value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            placeholder="Descreva o evento..." rows={2} disabled={saving} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Tipo" options={TIPO_OPTIONS} value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })} disabled={saving} />
            <Select label="Status" options={STATUS_OPTIONS} value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })} disabled={saving} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Data de início *" type="date" value={formData.data_inicio}
              onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })} disabled={saving} />
            <Input label="Data de fim" type="date" value={formData.data_fim}
              onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })} disabled={saving} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Hora de início" type="time" value={formData.hora_inicio}
              onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })} disabled={saving} />
            <Input label="Hora de fim" type="time" value={formData.hora_fim}
              onChange={(e) => setFormData({ ...formData, hora_fim: e.target.value })} disabled={saving} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Local" value={formData.local}
              onChange={(e) => setFormData({ ...formData, local: e.target.value })}
              placeholder="Ex: Auditório Principal" disabled={saving} />
            <Input label="Responsável" value={formData.responsavel}
              onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
              placeholder="Nome do responsável" disabled={saving} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Público-alvo" value={formData.publico_alvo}
              onChange={(e) => setFormData({ ...formData, publico_alvo: e.target.value })}
              placeholder="Ex: Professores e servidores" disabled={saving} />
            <Select label="Cor do evento" options={COR_OPTIONS.map((c) => ({ value: c.value, label: c.label }))} value={formData.cor}
              onChange={(e) => setFormData({ ...formData, cor: e.target.value })} disabled={saving} />
          </div>
          <Select label="Unidade *" options={unidadeOptions} placeholder="Selecione a unidade"
            value={formData.unidade_id} onChange={(e) => setFormData({ ...formData, unidade_id: e.target.value })} disabled={saving} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Salvar alterações" : "Cadastrar evento"}
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmar exclusão"
        description="Tem certeza que deseja excluir este evento?" size="sm">
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