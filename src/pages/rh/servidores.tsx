import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Plus,
  Search,
  Loader2,
  Edit3,
  Trash2,
  RefreshCw,
  Mail,
  Phone,
  CalendarDays,
  Building2,
  Briefcase,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { Servidor, Unidade } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, formatFullDate } from "@/lib/utils";

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

const REGIME_OPTIONS = [
  { value: "clt", label: "CLT" },
  { value: "estatutario", label: "Estatutário" },
  { value: "comissionado", label: "Comissionado" },
  { value: "temporario", label: "Temporário" },
  { value: "terceirizado", label: "Terceirizado" },
];

const regimeLabels: Record<string, string> = {
  clt: "CLT", estatutario: "Estatutário", comissionado: "Comissionado",
  temporario: "Temporário", terceirizado: "Terceirizado",
};

export function ServidoresPage() {
  const [servidores, setServidores] = useState<(Servidor & { unidade_nome?: string })[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativos" | "inativos">("ativos");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Servidor | null>(null);
  const [formData, setFormData] = useState({
    nome: "", cpf: "", cargo: "", setor: "", email: "", telefone: "",
    data_admissao: "", regime: "clt" as Servidor["regime"], carga_horaria: "",
    unidade_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [detailServ, setDetailServ] = useState<(Servidor & { unidade_nome?: string }) | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [servRes, unidRes] = await Promise.all([
        supabase.from("servidores").select("*, unidades(nome, sigla)").order("created_at", { ascending: false }),
        supabase.from("unidades").select("*").eq("ativo", true).order("nome"),
      ]);
      if (servRes.data) setServidores((servRes.data as any[]).map((s) => ({ ...s, unidade_nome: s.unidades?.nome || "Não definida" })));
      if (unidRes.data) setUnidades(unidRes.data);
    } catch (err) { console.error(err);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const unidadeOptions = unidades.map((u) => ({ value: u.id, label: `${u.nome} (${u.sigla})` }));

  const openCreate = () => {
    setEditing(null);
    setFormData({ nome: "", cpf: "", cargo: "", setor: "", email: "", telefone: "", data_admissao: "", regime: "clt", carga_horaria: "", unidade_id: "" });
    setFormError(""); setModalOpen(true);
  };

  const openEdit = (s: Servidor) => {
    setEditing(s);
    setFormData({
      nome: s.nome, cpf: s.cpf || "", cargo: s.cargo, setor: s.setor || "", email: s.email || "",
      telefone: s.telefone || "", data_admissao: s.data_admissao?.split("T")[0] || "",
      regime: s.regime || "clt", carga_horaria: s.carga_horaria?.toString() || "", unidade_id: s.unidade_id,
    });
    setFormError(""); setModalOpen(true);
  };

  const handleSave = async () => {
    setFormError("");
    if (!formData.nome.trim() || !formData.cargo.trim() || !formData.unidade_id) {
      setFormError("Nome, cargo e unidade são obrigatórios."); return;
    }
    setSaving(true);
    try {
      const payload = {
        nome: formData.nome, cpf: formData.cpf || null, cargo: formData.cargo, setor: formData.setor || null,
        email: formData.email || null, telefone: formData.telefone || null,
        data_admissao: formData.data_admissao || null, regime: formData.regime,
        carga_horaria: formData.carga_horaria ? parseInt(formData.carga_horaria) : null, unidade_id: formData.unidade_id,
      };
      if (editing) { const { error } = await supabase.from("servidores").update(payload).eq("id", editing.id); if (error) { setFormError(error.message); return; } }
      else { const { error } = await supabase.from("servidores").insert(payload); if (error) { setFormError(error.message); return; } }
      setModalOpen(false); fetchData();
    } catch (err: any) { setFormError(err.message || "Erro");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("servidores").delete().eq("id", id);
    if (!error) { setServidores((p) => p.filter((s) => s.id !== id)); setDeleteConfirm(null); }
  };

  const filtered = servidores.filter((s) => {
    const m = search.toLowerCase();
    const match = s.nome.toLowerCase().includes(m) || s.cargo.toLowerCase().includes(m) || (s.setor || "").toLowerCase().includes(m) || (s.email || "").toLowerCase().includes(m);
    if (statusFilter === "ativos") return match && s.ativo;
    if (statusFilter === "inativos") return match && !s.ativo;
    return match;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="rounded-xl p-3 bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600"><Users className="h-6 w-6" /></div>
          <div><h2 className="page-title">Servidores</h2><p className="page-subtitle mt-1">Gestão de servidores públicos e colaboradores da instituição</p></div>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Novo Servidor</Button>
      </div>

      <Card><CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Buscar por nome, cargo, setor ou email..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div className="flex items-center gap-2">
            {(["todos", "ativos", "inativos"] as const).map((opt) => (
              <button key={opt} onClick={() => setStatusFilter(opt)} className={cn("rounded-full px-3 py-1 text-[11px] font-medium transition-all", statusFilter === opt ? "bg-idep-700 text-white" : "bg-muted text-muted-foreground hover:text-foreground border border-border")}>
                {opt === "todos" ? "Todos" : opt === "ativos" ? "Ativos" : "Inativos"}
              </button>
            ))}
            <Button variant="ghost" size="icon-sm" onClick={fetchData}><RefreshCw className="h-3.5 w-3.5" /></Button>
            <span className="text-xs text-muted-foreground">{filtered.length} servidor(es)</span>
          </div>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        {loading ? <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        : filtered.length === 0 ? <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-foreground">{search ? "Nenhum servidor encontrado" : "Nenhum servidor cadastrado"}</p>
            <p className="text-xs text-muted-foreground mt-1">{search ? "Tente alterar os termos" : "Clique em 'Novo Servidor' para cadastrar"}</p>
          </div>
        : <div className="divide-y divide-border">
            {filtered.map((serv, index) => (
              <motion.div key={serv.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}
                className={cn("group flex items-center gap-4 px-4 sm:px-6 py-4 hover:bg-accent/30 transition-colors cursor-pointer", !serv.ativo && "opacity-60")}
                onClick={() => setDetailServ(serv)}>
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="bg-cyan-700 text-white text-xs">{getInitials(serv.nome)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{serv.nome}</p>
                    <Badge variant={serv.ativo ? "success" : "destructive"} className="text-[9px] px-1.5 py-0 h-4">{serv.ativo ? "Ativo" : "Inativo"}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-0.5">
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Briefcase className="h-3 w-3" />{serv.cargo}</span>
                    {serv.setor && <span className="text-[11px] text-muted-foreground">{serv.setor}</span>}
                    {serv.email && <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Mail className="h-3 w-3" />{serv.email}</span>}
                    <span className="text-[11px] text-muted-foreground">{serv.unidade_nome}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => openEdit(serv)} className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><Edit3 className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDeleteConfirm(serv.id)} className="rounded p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </motion.div>
            ))}
          </div>}
      </CardContent></Card>

      {/* Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar Servidor" : "Novo Servidor"} size="xl">
        <div className="space-y-4">
          {formError && <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{formError}</div>}
          <Input label="Nome completo *" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} placeholder="Nome do servidor" disabled={saving} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="CPF" value={formData.cpf} onChange={(e) => setFormData({ ...formData, cpf: e.target.value })} placeholder="000.000.000-00" disabled={saving} />
            <Input label="Cargo *" value={formData.cargo} onChange={(e) => setFormData({ ...formData, cargo: e.target.value })} placeholder="Ex: Analista Administrativo" disabled={saving} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Setor" value={formData.setor} onChange={(e) => setFormData({ ...formData, setor: e.target.value })} placeholder="Ex: Secretaria Acadêmica" disabled={saving} />
            <Select label="Unidade *" options={unidadeOptions} placeholder="Selecione" value={formData.unidade_id} onChange={(e) => setFormData({ ...formData, unidade_id: e.target.value })} disabled={saving} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="E-mail" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@idep.ro.gov.br" disabled={saving} />
            <Input label="Telefone" value={formData.telefone} onChange={(e) => setFormData({ ...formData, telefone: e.target.value })} placeholder="(69) 3333-3333" disabled={saving} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select label="Regime *" options={REGIME_OPTIONS} value={formData.regime} onChange={(e) => setFormData({ ...formData, regime: e.target.value as Servidor["regime"] })} disabled={saving} />
            <Input label="Data de Admissão" type="date" value={formData.data_admissao} onChange={(e) => setFormData({ ...formData, data_admissao: e.target.value })} disabled={saving} />
            <Input label="Carga Horária (h/semana)" type="number" value={formData.carga_horaria} onChange={(e) => setFormData({ ...formData, carga_horaria: e.target.value })} placeholder="Ex: 40" disabled={saving} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{editing ? "Salvar" : "Cadastrar"}</Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Detail */}
      <Dialog open={!!detailServ} onClose={() => setDetailServ(null)} title="Detalhes do Servidor" size="lg">
        {detailServ && <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
            <Avatar className="h-14 w-14"><AvatarFallback className="bg-cyan-700 text-white">{getInitials(detailServ.nome)}</AvatarFallback></Avatar>
            <div className="space-y-1">
              <p className="text-lg font-semibold">{detailServ.nome}</p>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5 inline" /> {detailServ.cargo}
                {detailServ.setor && <> · {detailServ.setor}</>}
                {detailServ.email && <><Mail className="h-3.5 w-3.5 inline" /> {detailServ.email}</>}
              </div>
              <Badge variant={detailServ.ativo ? "success" : "destructive"}>{detailServ.ativo ? "Ativo" : "Inativo"}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Regime</p><p className="text-sm font-medium">{regimeLabels[detailServ.regime || ""] || "Não informado"}</p></div>
            <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Unidade</p><p className="text-sm font-medium">{detailServ.unidade_nome}</p></div>
            {detailServ.data_admissao && <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Admissão</p><p className="text-sm font-medium">{formatFullDate(detailServ.data_admissao)}</p></div>}
            {detailServ.carga_horaria && <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Carga Horária</p><p className="text-sm font-medium">{detailServ.carga_horaria}h/semana</p></div>}
          </div>
        </div>}
      </Dialog>

      {/* Delete */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmar exclusão" description="Tem certeza que deseja excluir este servidor?" size="sm"><DialogFooter>
        <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
        <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="gap-2"><Trash2 className="h-4 w-4" /> Excluir</Button>
      </DialogFooter></Dialog>
    </motion.div>
  );
}
