import { useState, useEffect, useCallback } from "react";
import {
  UserCheck,
  Plus,
  Search,
  Loader2,
  Edit3,
  Trash2,
  RefreshCw,
  Mail,
  Award,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { Professor, Unidade } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

const TITULACAO_OPTIONS = [
  { value: "graduacao", label: "Graduação" },
  { value: "especializacao", label: "Especialização" },
  { value: "mestrado", label: "Mestrado" },
  { value: "doutorado", label: "Doutorado" },
];

const REGIME_OPTIONS = [
  { value: "clt", label: "CLT" },
  { value: "estatutario", label: "Estatutário" },
  { value: "temporario", label: "Temporário" },
  { value: "terceirizado", label: "Terceirizado" },
];

const titulacaoColors: Record<string, string> = {
  graduacao: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  especializacao: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  mestrado: "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300",
  doutorado: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
};

const titulacaoLabels: Record<string, string> = {
  graduacao: "Grad.", especializacao: "Esp.", mestrado: "M.Sc.", doutorado: "Dr.",
};

export function ProfessoresPage() {
  const [professores, setProfessores] = useState<(Professor & { unidade_nome?: string })[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativos" | "inativos">("ativos");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Professor | null>(null);
  const [formData, setFormData] = useState({
    nome: "", cpf: "", email: "", telefone: "",
    formacao: "", especializacao: "", titulacao: "graduacao" as Professor["titulacao"],
    data_contrato: "", regime_trabalho: "clt" as Professor["regime_trabalho"], carga_horaria: "", unidade_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [detailProf, setDetailProf] = useState<(Professor & { unidade_nome?: string }) | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [profRes, unidRes] = await Promise.all([
        supabase.from("professores").select("*, unidades(nome, sigla)").order("created_at", { ascending: false }),
        supabase.from("unidades").select("*").eq("ativo", true).order("nome"),
      ]);
      if (profRes.data) setProfessores((profRes.data as Record<string, unknown>[]).map((p: Record<string, unknown>) => ({ ...p, unidade_nome: (p.unidades as Record<string, unknown> | undefined)?.nome as string || "Não definida" })));
      if (unidRes.data) setUnidades(unidRes.data);
    } catch (err) { console.error(err);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { let c = false; queueMicrotask(() => { if (!c) fetchData(); }); return () => { c = true; }; }, [fetchData]);

  const unidadeOptions = unidades.map((u) => ({ value: u.id, label: `${u.nome} (${u.sigla})` }));

  const openCreate = () => {
    setEditing(null);
    setFormData({ nome: "", cpf: "", email: "", telefone: "", formacao: "", especializacao: "", titulacao: "graduacao", data_contrato: "", regime_trabalho: "clt", carga_horaria: "", unidade_id: "" });
    setFormError(""); setModalOpen(true);
  };

  const openEdit = (p: Professor) => {
    setEditing(p);
    setFormData({
      nome: p.nome, cpf: p.cpf || "", email: p.email || "", telefone: p.telefone || "",
      formacao: p.formacao || "", especializacao: p.especializacao || "", titulacao: p.titulacao || "graduacao",
      data_contrato: p.data_contrato?.split("T")[0] || "", regime_trabalho: p.regime_trabalho || "clt",
      carga_horaria: p.carga_horaria?.toString() || "", unidade_id: p.unidade_id,
    });
    setFormError(""); setModalOpen(true);
  };

  const handleSave = async () => {
    setFormError("");
    if (!formData.nome.trim() || !formData.unidade_id) { setFormError("Nome e unidade são obrigatórios."); return; }
    setSaving(true);
    try {
      const payload = {
        nome: formData.nome, cpf: formData.cpf || null, email: formData.email || null, telefone: formData.telefone || null,
        formacao: formData.formacao || null, especializacao: formData.especializacao || null,
        titulacao: formData.titulacao, data_contrato: formData.data_contrato || null,
        regime_trabalho: formData.regime_trabalho, carga_horaria: formData.carga_horaria ? parseInt(formData.carga_horaria) : null,
        unidade_id: formData.unidade_id,
      };
      if (editing) { const { error } = await supabase.from("professores").update(payload).eq("id", editing.id); if (error) { setFormError(error.message); return; } }
      else { const { error } = await supabase.from("professores").insert(payload); if (error) { setFormError(error.message); return; } }
      setModalOpen(false); fetchData();
    } catch (err: unknown) { setFormError(err instanceof Error ? err.message : "Erro");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("professores").delete().eq("id", id);
    if (!error) { setProfessores((p) => p.filter((t) => t.id !== id)); setDeleteConfirm(null); }
  };

  const filtered = professores.filter((p) => {
    const m = search.toLowerCase();
    const match = p.nome.toLowerCase().includes(m) || (p.email || "").toLowerCase().includes(m) || (p.formacao || "").toLowerCase().includes(m);
    if (statusFilter === "ativos") return match && p.ativo;
    if (statusFilter === "inativos") return match && !p.ativo;
    return match;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="rounded-xl p-3 bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600"><UserCheck className="h-6 w-6" /></div>
          <div><h2 className="page-title">Professores</h2><p className="page-subtitle mt-1">Gestão do corpo docente, titulações e contratos</p></div>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Novo Professor</Button>
      </div>

      <Card><CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Buscar por nome, email ou formação..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div className="flex items-center gap-2">
            {(["todos", "ativos", "inativos"] as const).map((opt) => (
              <button key={opt} onClick={() => setStatusFilter(opt)} className={cn("rounded-full px-3 py-1 text-[11px] font-medium transition-all", statusFilter === opt ? "bg-idep-700 text-white" : "bg-muted text-muted-foreground hover:text-foreground border border-border")}>
                {opt === "todos" ? "Todos" : opt === "ativos" ? "Ativos" : "Inativos"}
              </button>
            ))}
            <Button variant="ghost" size="icon-sm" onClick={fetchData}><RefreshCw className="h-3.5 w-3.5" /></Button>
            <span className="text-xs text-muted-foreground">{filtered.length} professor(es)</span>
          </div>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        {loading ? <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        : filtered.length === 0 ? <div className="flex flex-col items-center justify-center py-16 text-center">
            <UserCheck className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-foreground">{search ? "Nenhum professor encontrado" : "Nenhum professor cadastrado"}</p>
            <p className="text-xs text-muted-foreground mt-1">{search ? "Tente alterar os termos" : "Clique em 'Novo Professor' para cadastrar"}</p>
          </div>
        : <div className="divide-y divide-border">
            {filtered.map((prof, index) => (
              <motion.div key={prof.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}
                className={cn("group flex items-center gap-4 px-4 sm:px-6 py-4 hover:bg-accent/30 transition-colors cursor-pointer", !prof.ativo && "opacity-60")}
                onClick={() => setDetailProf(prof)}>
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="bg-cyan-700 text-white text-xs">{getInitials(prof.nome)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{prof.nome}</p>
                    {prof.titulacao && <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${titulacaoColors[prof.titulacao]}`}>{titulacaoLabels[prof.titulacao]}</span>}
                    <Badge variant={prof.ativo ? "success" : "destructive"} className="text-[9px] px-1.5 py-0 h-4">{prof.ativo ? "Ativo" : "Inativo"}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-0.5">
                    {prof.email && <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Mail className="h-3 w-3" />{prof.email}</span>}
                    {prof.formacao && <span className="text-[11px] text-muted-foreground">{prof.formacao}</span>}
                    {prof.carga_horaria && <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Clock className="h-3 w-3" />{prof.carga_horaria}h</span>}
                    <span className="text-[11px] text-muted-foreground">{prof.unidade_nome}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => openEdit(prof)} className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><Edit3 className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDeleteConfirm(prof.id)} className="rounded p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </motion.div>
            ))}
          </div>}
      </CardContent></Card>

      {/* Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar Professor" : "Novo Professor"} size="xl">
        <div className="space-y-4">
          {formError && <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{formError}</div>}
          <Input label="Nome completo *" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} placeholder="Nome do professor" disabled={saving} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="CPF" value={formData.cpf} onChange={(e) => setFormData({ ...formData, cpf: e.target.value })} placeholder="000.000.000-00" disabled={saving} />
            <Select label="Unidade *" options={unidadeOptions} placeholder="Selecione" value={formData.unidade_id} onChange={(e) => setFormData({ ...formData, unidade_id: e.target.value })} disabled={saving} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="E-mail" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@idep.ro.gov.br" disabled={saving} />
            <Input label="Telefone" value={formData.telefone} onChange={(e) => setFormData({ ...formData, telefone: e.target.value })} placeholder="(69) 99999-9999" disabled={saving} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Formação" value={formData.formacao} onChange={(e) => setFormData({ ...formData, formacao: e.target.value })} placeholder="Ex: Pedagogia" disabled={saving} />
            <Input label="Especialização" value={formData.especializacao} onChange={(e) => setFormData({ ...formData, especializacao: e.target.value })} placeholder="Ex: Educação Especial" disabled={saving} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select label="Titulação *" options={TITULACAO_OPTIONS} value={formData.titulacao ?? ""} onChange={(e) => setFormData({ ...formData, titulacao: (e.target.value || "") as Professor["titulacao"] })} disabled={saving} />
            <Select label="Regime *" options={REGIME_OPTIONS} value={formData.regime_trabalho ?? ""} onChange={(e) => setFormData({ ...formData, regime_trabalho: (e.target.value || "") as Professor["regime_trabalho"] })} disabled={saving} />
            <Input label="Carga Horária (h/semana)" type="number" value={formData.carga_horaria} onChange={(e) => setFormData({ ...formData, carga_horaria: e.target.value })} placeholder="Ex: 20" disabled={saving} />
          </div>
          <Input label="Data do Contrato" type="date" value={formData.data_contrato} onChange={(e) => setFormData({ ...formData, data_contrato: e.target.value })} disabled={saving} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{editing ? "Salvar" : "Cadastrar"}</Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Detail */}
      <Dialog open={!!detailProf} onClose={() => setDetailProf(null)} title="Detalhes do Professor" size="lg">
        {detailProf && <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
            <Avatar className="h-14 w-14"><AvatarFallback className="bg-cyan-700 text-white">{getInitials(detailProf.nome)}</AvatarFallback></Avatar>
            <div className="space-y-1">
              <p className="text-lg font-semibold">{detailProf.nome}</p>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {detailProf.email && <><Mail className="h-3.5 w-3.5 inline" /> {detailProf.email}</>}
                {detailProf.titulacao && <><Award className="h-3.5 w-3.5 inline" /> {TITULACAO_OPTIONS.find((o) => o.value === detailProf.titulacao)?.label}</>}
              </div>
              <Badge variant={detailProf.ativo ? "success" : "destructive"}>{detailProf.ativo ? "Ativo" : "Inativo"}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {detailProf.formacao && <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Formação</p><p className="text-sm font-medium">{detailProf.formacao}</p></div>}
            {detailProf.especializacao && <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Especialização</p><p className="text-sm font-medium">{detailProf.especializacao}</p></div>}
            {detailProf.carga_horaria && <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Carga Horária</p><p className="text-sm font-medium">{detailProf.carga_horaria}h/semana</p></div>}
            <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Unidade</p><p className="text-sm font-medium">{detailProf.unidade_nome}</p></div>
          </div>
        </div>}
      </Dialog>

      {/* Delete */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmar exclusão" description="Tem certeza que deseja excluir este professor?" size="sm"><DialogFooter>
        <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
        <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="gap-2"><Trash2 className="h-4 w-4" /> Excluir</Button>
      </DialogFooter></Dialog>
    </motion.div>
  );
}
