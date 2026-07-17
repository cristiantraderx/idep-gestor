import { useState, useEffect, useCallback } from "react";
import {
  Monitor,
  Plus,
  Search,
  Loader2,
  Edit3,
  Trash2,
  RefreshCw,
  CalendarDays,
  Building2,
  Wrench,
  Package,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { EquipamentoTI, Unidade } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatFullDate } from "@/lib/utils";

const TIPO_OPTIONS = [
  { value: "desktop", label: "Desktop" },
  { value: "notebook", label: "Notebook" },
  { value: "servidor", label: "Servidor" },
  { value: "impressora", label: "Impressora" },
  { value: "monitor", label: "Monitor" },
  { value: "rede", label: "Equipamento de Rede" },
  { value: "periferico", label: "Periférico" },
  { value: "outros", label: "Outros" },
];

const STATUS_EQUIP_OPTIONS = [
  { value: "ativo", label: "Ativo" },
  { value: "manutencao", label: "Em Manutenção" },
  { value: "emprestado", label: "Emprestado" },
  { value: "baixado", label: "Baixado" },
];

const statusVariant: Record<string, "success" | "warning" | "default" | "destructive" | "secondary"> = {
  ativo: "success",
  manutencao: "warning",
  emprestado: "default",
  baixado: "destructive",
};

const tipoIcons: Record<string, typeof Monitor> = {
  desktop: Monitor, notebook: Monitor, servidor: Monitor,
  impressora: Wrench, monitor: Monitor, rede: Package,
  periferico: Package, outros: Package,
};

export function EquipamentosPage() {
  const [equipamentos, setEquipamentos] = useState<(EquipamentoTI & { unidade_nome?: string })[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todas");
  const [tipoFilter, setTipoFilter] = useState<string>("todos");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EquipamentoTI | null>(null);
  const [formData, setFormData] = useState({
    tipo: "desktop" as EquipamentoTI["tipo"], nome: "", patrimonio: "",
    fabricante: "", modelo: "", numero_serie: "", especificacoes: "",
    localizacao: "", responsavel: "", status: "ativo" as EquipamentoTI["status"],
    data_aquisicao: "", data_garantia: "", valor: "", observacoes: "", unidade_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [detailEquip, setDetailEquip] = useState<(EquipamentoTI & { unidade_nome?: string }) | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [equipRes, unidRes] = await Promise.all([
        supabase.from("equipamentos_ti").select("*, unidades(nome, sigla)").order("created_at", { ascending: false }),
        supabase.from("unidades").select("*").eq("ativo", true).order("nome"),
      ]);
      if (equipRes.data) setEquipamentos((equipRes.data as any[]).map((e) => ({ ...e, unidade_nome: e.unidades?.nome || "Não definida" })));
      if (unidRes.data) setUnidades(unidRes.data);
    } catch (err) { console.error(err);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const unidadeOptions = unidades.map((u) => ({ value: u.id, label: `${u.nome} (${u.sigla})` }));

  const openCreate = () => {
    setEditing(null);
    setFormData({ tipo: "desktop", nome: "", patrimonio: "", fabricante: "", modelo: "", numero_serie: "", especificacoes: "", localizacao: "", responsavel: "", status: "ativo", data_aquisicao: "", data_garantia: "", valor: "", observacoes: "", unidade_id: "" });
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (e: EquipamentoTI) => {
    setEditing(e);
    setFormData({
      tipo: e.tipo, nome: e.nome, patrimonio: e.patrimonio || "", fabricante: e.fabricante || "",
      modelo: e.modelo || "", numero_serie: e.numero_serie || "", especificacoes: e.especificacoes || "",
      localizacao: e.localizacao || "", responsavel: e.responsavel || "", status: e.status,
      data_aquisicao: e.data_aquisicao?.split("T")[0] || "", data_garantia: e.data_garantia?.split("T")[0] || "",
      valor: e.valor?.toString() || "", observacoes: e.observacoes || "", unidade_id: e.unidade_id,
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSave = async () => {
    setFormError("");
    if (!formData.nome.trim() || !formData.unidade_id) { setFormError("Nome e unidade são obrigatórios."); return; }
    setSaving(true);
    try {
      const payload = { tipo: formData.tipo, nome: formData.nome, patrimonio: formData.patrimonio || null, fabricante: formData.fabricante || null, modelo: formData.modelo || null, numero_serie: formData.numero_serie || null, especificacoes: formData.especificacoes || null, localizacao: formData.localizacao || null, responsavel: formData.responsavel || null, status: formData.status, data_aquisicao: formData.data_aquisicao || null, data_garantia: formData.data_garantia || null, valor: formData.valor ? parseFloat(formData.valor) : null, observacoes: formData.observacoes || null, unidade_id: formData.unidade_id };
      if (editing) { const { error } = await supabase.from("equipamentos_ti").update(payload).eq("id", editing.id); if (error) { setFormError(error.message); return; } }
      else { const { error } = await supabase.from("equipamentos_ti").insert(payload); if (error) { setFormError(error.message); return; } }
      setModalOpen(false); fetchData();
    } catch (err: any) { setFormError(err.message || "Erro");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("equipamentos_ti").delete().eq("id", id);
    if (!error) { setEquipamentos((p) => p.filter((e) => e.id !== id)); setDeleteConfirm(null); }
  };

  const filtered = equipamentos.filter((e) => {
    const s = search.toLowerCase();
    const match = e.nome.toLowerCase().includes(s) || (e.patrimonio || "").toLowerCase().includes(s) || (e.fabricante || "").toLowerCase().includes(s) || (e.modelo || "").toLowerCase().includes(s);
    if (statusFilter !== "todas" && e.status !== statusFilter) return false;
    if (tipoFilter !== "todos" && e.tipo !== tipoFilter) return false;
    return match;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="rounded-xl p-3 bg-slate-50 dark:bg-slate-950/50 text-slate-600"><Monitor className="h-6 w-6" /></div>
          <div><h2 className="page-title">Equipamentos de TI</h2><p className="page-subtitle mt-1">Inventário de equipamentos de tecnologia da informação</p></div>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Novo Equipamento</Button>
      </div>

      <Card><CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Buscar por nome, patrimônio, fabricante..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {[{ v: "todas", l: "Todas" }, { v: "ativo", l: "Ativos" }, { v: "manutencao", l: "Manutenção" }, { v: "baixado", l: "Baixados" }].map((o) => (
              <button key={o.v} onClick={() => setStatusFilter(o.v)} className={cn("rounded-full px-3 py-1 text-[11px] font-medium transition-all", statusFilter === o.v ? "bg-idep-700 text-white" : "bg-muted text-muted-foreground hover:text-foreground border border-border")}>{o.l}</button>
            ))}
            <select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)} className="h-7 rounded-lg border border-input bg-background px-2 text-[10px] font-medium text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="todos">Todos os tipos</option>
              {TIPO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <Button variant="ghost" size="icon-sm" onClick={fetchData}><RefreshCw className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        {loading ? <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        : filtered.length === 0 ? <div className="flex flex-col items-center justify-center py-16 text-center">
            <Monitor className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-foreground">{search ? "Nenhum equipamento encontrado" : "Nenhum equipamento cadastrado"}</p>
            <p className="text-xs text-muted-foreground mt-1">{search ? "Tente alterar os termos" : "Clique em 'Novo Equipamento' para cadastrar"}</p>
          </div>
        : <div className="divide-y divide-border">
            {filtered.map((eq, index) => (
              <motion.div key={eq.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}
                className="group flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-4 hover:bg-accent/30 transition-colors cursor-pointer"
                onClick={() => setDetailEquip(eq)}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="rounded-lg p-2 bg-slate-50 dark:bg-slate-950/50 shrink-0"><Monitor className="h-5 w-5 text-slate-600" /></div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{eq.nome}</p>
                      {eq.patrimonio && <span className="text-[10px] font-mono text-muted-foreground shrink-0">#{eq.patrimonio}</span>}
                      <Badge variant={statusVariant[eq.status] || "default"} className="text-[9px] px-1.5 py-0 h-4">{STATUS_EQUIP_OPTIONS.find((o) => o.value === eq.status)?.label}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-0.5">
                      <span className="text-[11px] text-muted-foreground">{TIPO_OPTIONS.find((o) => o.value === eq.tipo)?.label}</span>
                      {eq.fabricante && <span className="text-[11px] text-muted-foreground">{eq.fabricante}</span>}
                      {eq.modelo && <span className="text-[11px] text-muted-foreground">{eq.modelo}</span>}
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><CalendarDays className="h-3 w-3" />{formatFullDate(eq.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => openEdit(eq)} className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><Edit3 className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDeleteConfirm(eq.id)} className="rounded p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </motion.div>
            ))}
          </div>}
      </CardContent></Card>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar Equipamento" : "Novo Equipamento"} size="xl">
        <div className="space-y-4">
          {formError && <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{formError}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nome *" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} placeholder="Ex: Notebook Dell Inspiron" disabled={saving} />
            <Select label="Tipo *" options={TIPO_OPTIONS} value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value as EquipamentoTI["tipo"] })} disabled={saving} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Nº Patrimônio" value={formData.patrimonio} onChange={(e) => setFormData({ ...formData, patrimonio: e.target.value })} placeholder="Ex: PAT-00123" disabled={saving} />
            <Input label="Fabricante" value={formData.fabricante} onChange={(e) => setFormData({ ...formData, fabricante: e.target.value })} placeholder="Ex: Dell" disabled={saving} />
            <Input label="Modelo" value={formData.modelo} onChange={(e) => setFormData({ ...formData, modelo: e.target.value })} placeholder="Ex: Latitude 3420" disabled={saving} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nº de Série" value={formData.numero_serie} onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })} placeholder="Número de série" disabled={saving} />
            <Select label="Unidade *" options={unidadeOptions} placeholder="Selecione" value={formData.unidade_id} onChange={(e) => setFormData({ ...formData, unidade_id: e.target.value })} disabled={saving} />
          </div>
          <Textarea label="Especificações" value={formData.especificacoes} onChange={(e) => setFormData({ ...formData, especificacoes: e.target.value })} placeholder="Ex: i7, 16GB RAM, SSD 512GB" rows={2} disabled={saving} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Localização" value={formData.localizacao} onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })} placeholder="Ex: Sala 201 - Bloco A" disabled={saving} />
            <Input label="Responsável" value={formData.responsavel} onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })} placeholder="Nome do responsável" disabled={saving} />
          </div>
          {editing && <Select label="Status" options={STATUS_EQUIP_OPTIONS} value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as EquipamentoTI["status"] })} disabled={saving} />}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Data de Aquisição" type="date" value={formData.data_aquisicao} onChange={(e) => setFormData({ ...formData, data_aquisicao: e.target.value })} disabled={saving} />
            <Input label="Data de Garantia" type="date" value={formData.data_garantia} onChange={(e) => setFormData({ ...formData, data_garantia: e.target.value })} disabled={saving} />
            <Input label="Valor (R$)" type="number" value={formData.valor} onChange={(e) => setFormData({ ...formData, valor: e.target.value })} placeholder="0,00" disabled={saving} />
          </div>
          <Textarea label="Observações" value={formData.observacoes} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} placeholder="Observações adicionais..." rows={2} disabled={saving} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{editing ? "Salvar" : "Cadastrar"}</Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Detail */}
      <Dialog open={!!detailEquip} onClose={() => setDetailEquip(null)} title="Detalhes do Equipamento" size="lg">
        {detailEquip && <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
            <div className="rounded-lg p-3 bg-slate-50 dark:bg-slate-950/50"><Monitor className="h-6 w-6 text-slate-600" /></div>
            <div className="space-y-1">
              <p className="text-lg font-semibold">{detailEquip.nome} {detailEquip.patrimonio && <span className="text-xs font-mono text-muted-foreground">#{detailEquip.patrimonio}</span>}</p>
              <p className="text-xs text-muted-foreground">{TIPO_OPTIONS.find((o) => o.value === detailEquip.tipo)?.label} · {detailEquip.fabricante} {detailEquip.modelo}</p>
              <Badge variant={statusVariant[detailEquip.status]}>{STATUS_EQUIP_OPTIONS.find((o) => o.value === detailEquip.status)?.label}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {detailEquip.numero_serie && <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground uppercase tracking-wider">Nº Série</p><p className="text-sm font-medium">{detailEquip.numero_serie}</p></div>}
            {detailEquip.localizacao && <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground uppercase tracking-wider">Localização</p><p className="text-sm font-medium">{detailEquip.localizacao}</p></div>}
            {detailEquip.responsavel && <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground uppercase tracking-wider">Responsável</p><p className="text-sm font-medium">{detailEquip.responsavel}</p></div>}
            {detailEquip.especificacoes && <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground uppercase tracking-wider">Especificações</p><p className="text-sm">{detailEquip.especificacoes}</p></div>}
          </div>
        </div>}
      </Dialog>

      {/* Delete */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmar exclusão" description="Tem certeza que deseja excluir este equipamento?" size="sm">
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="gap-2"><Trash2 className="h-4 w-4" /> Excluir</Button>
        </DialogFooter>
      </Dialog>
    </motion.div>
  );
}
