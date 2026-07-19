import { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Plus,
  Search,
  Loader2,
  Edit3,
  Trash2,
  RefreshCw,
  Users,
  Wifi,
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

const TIPO_OPTIONS = [
  { value: "sala_aula", label: "Sala de Aula" },
  { value: "sala_reuniao", label: "Sala de Reunião" },
  { value: "auditorio", label: "Auditório" },
  { value: "laboratorio", label: "Laboratório" },
  { value: "sala_multimidia", label: "Sala Multimídia" },
  { value: "outros", label: "Outros" },
];

const STATUS_OPTIONS = [
  { value: "disponivel", label: "Disponível" },
  { value: "ocupada", label: "Ocupada" },
  { value: "manutencao", label: "Em Manutenção" },
  { value: "reservada", label: "Reservada" },
];

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive" | "success" | "warning"> = {
  disponivel: "success",
  ocupada: "destructive",
  manutencao: "warning",
  reservada: "default",
};

const tipoIcons: Record<string, string> = {
  sala_aula: "bg-blue-100 text-blue-600 dark:bg-blue-950/50",
  sala_reuniao: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50",
  auditorio: "bg-violet-100 text-violet-600 dark:bg-violet-950/50",
  laboratorio: "bg-amber-100 text-amber-600 dark:bg-amber-950/50",
  sala_multimidia: "bg-rose-100 text-rose-600 dark:bg-rose-950/50",
  outros: "bg-muted text-muted-foreground",
};

export function SalasPage() {
  const [salas, setSalas] = useState<Array<Record<string, unknown>>>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todas");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [formData, setFormData] = useState({
    nome: "", codigo: "", capacidade: "30", tipo: "sala_aula", recursos: "",
    localizacao: "", status: "disponivel", observacoes: "", unidade_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [salasRes, unidRes] = await Promise.all([
        supabase.from("salas").select("*, unidades(nome, sigla)").order("nome"),
        supabase.from("unidades").select("*").eq("ativo", true).order("nome"),
      ]);
      if (salasRes.data) {
        setSalas((salasRes.data as Array<Record<string, unknown>>).map((s) => ({ ...s, unidade_nome: (s.unidades as Record<string, unknown> | null)?.nome || "Não definida" })));
      }
      if (unidRes.data) setUnidades(unidRes.data);
    } catch (err) { console.error("Erro ao carregar salas:", err); }
    finally { setLoading(false); }
  }, []);  useEffect(() => { let c = false; queueMicrotask(() => { if (!c) fetchData(); }); return () => { c = true; }; }, [fetchData]);

  const unidadeOptions = unidades.map((u) => ({ value: u.id, label: `${u.nome} (${u.sigla})` }));

  const openCreateModal = () => {
    setEditing(null);
    setFormData({ nome: "", codigo: "", capacidade: "30", tipo: "sala_aula", recursos: "", localizacao: "", status: "disponivel", observacoes: "", unidade_id: "" });
    setFormError(""); setModalOpen(true);
  };

  const openEditModal = (sala: Record<string, unknown>) => {
    setEditing(sala);
    setFormData({
      nome: sala.nome, codigo: sala.codigo || "", capacidade: sala.capacidade?.toString() || "30",
      tipo: sala.tipo || "sala_aula", recursos: sala.recursos || "", localizacao: sala.localizacao || "",
      status: sala.status || "disponivel", observacoes: sala.observacoes || "", unidade_id: sala.unidade_id,
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
        nome: formData.nome, codigo: formData.codigo || null, capacidade: parseInt(formData.capacidade) || 30,
        tipo: formData.tipo, recursos: formData.recursos || null, localizacao: formData.localizacao || null,
        status: formData.status, observacoes: formData.observacoes || null, unidade_id: formData.unidade_id,
      };
      if (editing) {
        const { error } = await supabase.from("salas").update(payload).eq("id", editing.id);
        if (error) { setFormError(error.message); return; }
      } else {
        const { error } = await supabase.from("salas").insert(payload);
        if (error) { setFormError(error.message); return; }
      }
      setModalOpen(false); fetchData();
    } catch (err: unknown) { setFormError(err instanceof Error ? err.message : "Erro ao salvar"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("salas").delete().eq("id", id);
    if (!error) { setSalas((prev) => prev.filter((s) => s.id !== id)); setDeleteConfirm(null); }
  };

  const stats = {
    total: salas.length,
    disponiveis: salas.filter((s) => s.status === "disponivel").length,
    ocupadas: salas.filter((s) => s.status === "ocupada" || s.status === "reservada").length,
    manutencao: salas.filter((s) => s.status === "manutencao").length,
  };

  const filtered = salas.filter((s) => {
    const matchSearch = s.nome.toLowerCase().includes(search.toLowerCase()) ||
      (s.codigo && s.codigo.toLowerCase().includes(search.toLowerCase())) ||
      (s.localizacao && s.localizacao.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter !== "todas") return matchSearch && s.status === statusFilter;
    return matchSearch;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="rounded-xl p-3 bg-pink-50 dark:bg-pink-950/50 text-pink-600">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="page-title">Salas</h2>
            <p className="page-subtitle mt-1">Gerencie salas de aula, reuniões e auditórios</p>
          </div>
        </div>
        <Button onClick={openCreateModal} className="gap-2"><Plus className="h-4 w-4" /> Nova Sala</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg p-2 bg-blue-100 dark:bg-blue-950/50"><Building2 className="h-4 w-4 text-blue-600" /></div>
          <div><p className="text-[10px] text-muted-foreground">Total</p><p className="text-sm font-bold text-foreground">{stats.total}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg p-2 bg-emerald-100 dark:bg-emerald-950/50"><Building2 className="h-4 w-4 text-emerald-600" /></div>
          <div><p className="text-[10px] text-muted-foreground">Disponíveis</p><p className="text-sm font-bold text-emerald-600">{stats.disponiveis}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg p-2 bg-red-100 dark:bg-red-950/50"><Building2 className="h-4 w-4 text-red-600" /></div>
          <div><p className="text-[10px] text-muted-foreground">Ocupadas</p><p className="text-sm font-bold text-red-600">{stats.ocupadas}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg p-2 bg-amber-100 dark:bg-amber-950/50"><Building2 className="h-4 w-4 text-amber-600" /></div>
          <div><p className="text-[10px] text-muted-foreground">Manutenção</p><p className="text-sm font-bold text-amber-600">{stats.manutencao}</p></div>
        </CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="Buscar por nome, código ou localização..." value={search}
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
              <span className="text-xs text-muted-foreground whitespace-nowrap">{filtered.length} sala{filtered.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Building2 className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-foreground">{search ? "Nenhuma sala encontrada" : "Nenhuma sala cadastrada"}</p>
              <p className="text-xs text-muted-foreground mt-1">{search ? "Tente alterar os termos da busca" : "Clique em \"Nova Sala\" para cadastrar"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 sm:gap-0">
              {filtered.map((sala, index) => (
                <motion.div key={sala.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="group relative border-r border-b border-border p-4 hover:bg-accent/30 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`rounded-lg p-2 ${tipoIcons[sala.tipo] || tipoIcons.outros}`}>
                      <Building2 className="h-4 w-4" />
                    </div>
                    <Badge variant={statusVariant[sala.status] || "outline"} className="text-[9px]">
                      {STATUS_OPTIONS.find((s) => s.value === sala.status)?.label || sala.status}
                    </Badge>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground truncate">{sala.nome}</h3>
                  {sala.codigo && <p className="text-[11px] text-muted-foreground font-mono">{sala.codigo}</p>}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Users className="h-3 w-3" /> {sala.capacidade} vagas
                    </span>
                    {sala.localizacao && <span className="text-[10px] text-muted-foreground">{sala.localizacao}</span>}
                  </div>
                  {sala.recursos && (
                    <p className="text-[10px] text-muted-foreground mt-1.5 truncate">
                      <Wifi className="h-3 w-3 inline mr-0.5" /> {sala.recursos}
                    </p>
                  )}
                  <div className="absolute top-4 right-12 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                    <button onClick={() => openEditModal(sala)}
                      className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                      <Edit3 className="h-3 w-3" />
                    </button>
                  </div>
                  <button onClick={() => setDeleteConfirm(sala.id)}
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? "Editar Sala" : "Nova Sala"}
        description={editing ? `Editando: ${editing.nome}` : "Cadastre uma nova sala ou auditório"} size="lg">
        <div className="space-y-4">
          {formError && (<div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{formError}</div>)}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nome *" value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Sala 101" disabled={saving} />
            <Input label="Código" value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              placeholder="Ex: SAL-101" disabled={saving} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Capacidade" type="number" value={formData.capacidade}
              onChange={(e) => setFormData({ ...formData, capacidade: e.target.value })} disabled={saving} />
            <Select label="Tipo" options={TIPO_OPTIONS} value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })} disabled={saving} />
            <Select label="Status" options={STATUS_OPTIONS} value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })} disabled={saving} />
          </div>
          <Input label="Localização" value={formData.localizacao}
            onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
            placeholder="Ex: Bloco A, 2º andar" disabled={saving} />
          <Textarea label="Recursos disponíveis" value={formData.recursos}
            onChange={(e) => setFormData({ ...formData, recursos: e.target.value })}
            placeholder="Ex: Projetor, quadro, ar-condicionado, computadores..." rows={2} disabled={saving} />
          <Select label="Unidade *" options={unidadeOptions} placeholder="Selecione a unidade"
            value={formData.unidade_id} onChange={(e) => setFormData({ ...formData, unidade_id: e.target.value })} disabled={saving} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Salvar alterações" : "Cadastrar sala"}
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmar exclusão"
        description="Tem certeza que deseja excluir esta sala?" size="sm">
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