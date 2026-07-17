import { useState, useEffect, useCallback } from "react";
import {
  Monitor,
  Plus,
  Search,
  Loader2,
  Edit3,
  Trash2,
  RefreshCw,
  Users,
  User,
  Wrench,
  HardDrive,
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

const TIPO_OPTIONS = [
  { value: "informatica", label: "Informática" },
  { value: "ciencias", label: "Ciências" },
  { value: "biologia", label: "Biologia" },
  { value: "quimica", label: "Química" },
  { value: "fisica", label: "Física" },
  { value: "idiomas", label: "Idiomas" },
  { value: "multimidia", label: "Multimídia" },
  { value: "outros", label: "Outros" },
];

const STATUS_OPTIONS = [
  { value: "disponivel", label: "Disponível" },
  { value: "ocupado", label: "Ocupado" },
  { value: "manutencao", label: "Em Manutenção" },
  { value: "reservado", label: "Reservado" },
];

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive" | "success" | "warning"> = {
  disponivel: "success",
  ocupado: "destructive",
  manutencao: "warning",
  reservado: "default",
};

const tipoColors: Record<string, string> = {
  informatica: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  ciencias: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  biologia: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300",
  quimica: "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
  fisica: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  idiomas: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
  multimidia: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300",
  outros: "bg-muted text-muted-foreground",
};

export function LaboratoriosPage() {
  const [labs, setLabs] = useState<any[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("todos");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [formData, setFormData] = useState({
    nome: "", codigo: "", capacidade: "20", tipo: "informatica",
    equipamentos: "", softwares: "", localizacao: "", responsavel: "",
    status: "disponivel", observacoes: "", unidade_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [labRes, unidRes] = await Promise.all([
        supabase.from("laboratorios").select("*, unidades(nome, sigla)").order("nome"),
        supabase.from("unidades").select("*").eq("ativo", true).order("nome"),
      ]);
      if (labRes.data) {
        setLabs((labRes.data as any[]).map((l) => ({ ...l, unidade_nome: l.unidades?.nome || "Não definida" })));
      }
      if (unidRes.data) setUnidades(unidRes.data);
    } catch (err) { console.error("Erro ao carregar laboratórios:", err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const unidadeOptions = unidades.map((u) => ({ value: u.id, label: `${u.nome} (${u.sigla})` }));

  const openCreateModal = () => {
    setEditing(null);
    setFormData({
      nome: "", codigo: "", capacidade: "20", tipo: "informatica", equipamentos: "", softwares: "",
      localizacao: "", responsavel: "", status: "disponivel", observacoes: "", unidade_id: "",
    });
    setFormError(""); setModalOpen(true);
  };

  const openEditModal = (lab: any) => {
    setEditing(lab);
    setFormData({
      nome: lab.nome, codigo: lab.codigo || "", capacidade: lab.capacidade?.toString() || "20",
      tipo: lab.tipo || "informatica", equipamentos: lab.equipamentos || "", softwares: lab.softwares || "",
      localizacao: lab.localizacao || "", responsavel: lab.responsavel || "",
      status: lab.status || "disponivel", observacoes: lab.observacoes || "", unidade_id: lab.unidade_id,
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
        nome: formData.nome, codigo: formData.codigo || null, capacidade: parseInt(formData.capacidade) || 20,
        tipo: formData.tipo, equipamentos: formData.equipamentos || null, softwares: formData.softwares || null,
        localizacao: formData.localizacao || null, responsavel: formData.responsavel || null,
        status: formData.status, observacoes: formData.observacoes || null, unidade_id: formData.unidade_id,
      };
      if (editing) {
        const { error } = await supabase.from("laboratorios").update(payload).eq("id", editing.id);
        if (error) { setFormError(error.message); return; }
      } else {
        const { error } = await supabase.from("laboratorios").insert(payload);
        if (error) { setFormError(error.message); return; }
      }
      setModalOpen(false); fetchData();
    } catch (err: any) { setFormError(err.message || "Erro ao salvar"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("laboratorios").delete().eq("id", id);
    if (!error) { setLabs((prev) => prev.filter((l) => l.id !== id)); setDeleteConfirm(null); }
  };

  const filtered = labs.filter((l) => {
    const matchSearch = l.nome.toLowerCase().includes(search.toLowerCase()) ||
      (l.codigo && l.codigo.toLowerCase().includes(search.toLowerCase())) ||
      (l.responsavel && l.responsavel.toLowerCase().includes(search.toLowerCase()));
    if (tipoFilter !== "todos") return matchSearch && l.tipo === tipoFilter;
    return matchSearch;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="rounded-xl p-3 bg-pink-50 dark:bg-pink-950/50 text-pink-600">
            <Monitor className="h-6 w-6" />
          </div>
          <div>
            <h2 className="page-title">Laboratórios</h2>
            <p className="page-subtitle mt-1">Gerencie laboratórios e seus equipamentos</p>
          </div>
        </div>
        <Button onClick={openCreateModal} className="gap-2"><Plus className="h-4 w-4" /> Novo Laboratório</Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="Buscar por nome, código ou responsável..." value={search}
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
              <span className="text-xs text-muted-foreground whitespace-nowrap">{filtered.length} laboratório{filtered.length !== 1 ? "s" : ""}</span>
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
              <Monitor className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-foreground">{search ? "Nenhum laboratório encontrado" : "Nenhum laboratório cadastrado"}</p>
              <p className="text-xs text-muted-foreground mt-1">{search ? "Tente alterar os termos da busca" : "Clique em \"Novo Laboratório\" para cadastrar"}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((lab, index) => (
                <motion.div key={lab.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="group flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-4 hover:bg-accent/30 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="rounded-lg p-2 bg-pink-50 dark:bg-pink-950/50 shrink-0">
                      <Monitor className="h-5 w-5 text-pink-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{lab.nome}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${tipoColors[lab.tipo] || tipoColors.outros}`}>
                          {TIPO_OPTIONS.find((c) => c.value === lab.tipo)?.label || lab.tipo}
                        </span>
                        <Badge variant={statusVariant[lab.status] || "outline"} className="text-[9px]">
                          {STATUS_OPTIONS.find((s) => s.value === lab.status)?.label || lab.status}
                        </Badge>
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Users className="h-3 w-3" /> {lab.capacidade} vagas
                        </span>
                        {lab.responsavel && (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <User className="h-3 w-3" /> {lab.responsavel}
                          </span>
                        )}
                        {lab.localizacao && <span className="text-[11px] text-muted-foreground">{lab.localizacao}</span>}
                      </div>
                      {(lab.equipamentos || lab.softwares) && (
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                          {lab.equipamentos && (
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <HardDrive className="h-3 w-3" /> {lab.equipamentos}
                            </span>
                          )}
                          {lab.softwares && (
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Wrench className="h-3 w-3" /> {lab.softwares}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {lab.codigo && <span className="text-[10px] font-mono text-muted-foreground">{lab.codigo}</span>}
                    <button onClick={() => openEditModal(lab)}
                      className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleteConfirm(lab.id)}
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
        title={editing ? "Editar Laboratório" : "Novo Laboratório"}
        description={editing ? `Editando: ${editing.nome}` : "Cadastre um novo laboratório"} size="lg">
        <div className="space-y-4">
          {formError && (<div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{formError}</div>)}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nome *" value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Lab de Informática I" disabled={saving} />
            <Input label="Código" value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              placeholder="Ex: LAB-INF-01" disabled={saving} />
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
            placeholder="Ex: Bloco C, 1º andar" disabled={saving} />
          <Input label="Responsável" value={formData.responsavel}
            onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
            placeholder="Nome do responsável técnico" disabled={saving} />
          <Textarea label="Equipamentos" value={formData.equipamentos}
            onChange={(e) => setFormData({ ...formData, equipamentos: e.target.value })}
            placeholder="Ex: 20 computadores, 1 projetor, 1 impressora..." rows={2} disabled={saving} />
          <Textarea label="Softwares" value={formData.softwares}
            onChange={(e) => setFormData({ ...formData, softwares: e.target.value })}
            placeholder="Ex: Windows 11, Office 365, AutoCAD, Photoshop..." rows={2} disabled={saving} />
          <Select label="Unidade *" options={unidadeOptions} placeholder="Selecione a unidade"
            value={formData.unidade_id} onChange={(e) => setFormData({ ...formData, unidade_id: e.target.value })} disabled={saving} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Salvar alterações" : "Cadastrar laboratório"}
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmar exclusão"
        description="Tem certeza que deseja excluir este laboratório?" size="sm">
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