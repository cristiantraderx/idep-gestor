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
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { LicencaSoftware, Unidade } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatFullDate } from "@/lib/utils";

const TIPO_LIC_OPTIONS = [
  { value: "proprietario", label: "Proprietário" },
  { value: "opensource", label: "Open Source" },
  { value: "saas", label: "SaaS / Assinatura" },
  { value: "educacional", label: "Educacional" },
];

const STATUS_LIC_OPTIONS = [
  { value: "ativa", label: "Ativa" },
  { value: "expirada", label: "Expirada" },
  { value: "cancelada", label: "Cancelada" },
];

const statusVariant: Record<string, "success" | "warning" | "default" | "destructive"> = {
  ativa: "success",
  expirada: "destructive",
  cancelada: "default",
};

export function LicencasPage() {
  const [licencas, setLicencas] = useState<(LicencaSoftware & { unidade_nome?: string })[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todas");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LicencaSoftware | null>(null);
  const [formData, setFormData] = useState({
    nome: "", fabricante: "", versao: "", tipo: "proprietario" as LicencaSoftware["tipo"],
    numero_licenca: "", chave_ativacao: "", quantidade: "1", quantidade_utilizada: "0",
    data_aquisicao: "", data_validade: "", valor_total: "", status: "ativa" as LicencaSoftware["status"],
    observacoes: "", unidade_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [licRes, unidRes] = await Promise.all([
        supabase.from("licencas_software").select("*, unidades(nome, sigla)").order("created_at", { ascending: false }),
        supabase.from("unidades").select("*").eq("ativo", true).order("nome"),
      ]);
      if (licRes.data) setLicencas((licRes.data as any[]).map((l) => ({ ...l, unidade_nome: l.unidades?.nome || "Não definida" })));
      if (unidRes.data) setUnidades(unidRes.data);
    } catch (err) { console.error(err);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const unidadeOptions = unidades.map((u) => ({ value: u.id, label: `${u.nome} (${u.sigla})` }));

  const openCreate = () => {
    setEditing(null);
    setFormData({ nome: "", fabricante: "", versao: "", tipo: "proprietario", numero_licenca: "", chave_ativacao: "", quantidade: "1", quantidade_utilizada: "0", data_aquisicao: "", data_validade: "", valor_total: "", status: "ativa", observacoes: "", unidade_id: "" });
    setFormError(""); setModalOpen(true);
  };

  const openEdit = (l: LicencaSoftware) => {
    setEditing(l);
    setFormData({
      nome: l.nome, fabricante: l.fabricante || "", versao: l.versao || "", tipo: l.tipo,
      numero_licenca: l.numero_licenca || "", chave_ativacao: l.chave_ativacao || "",
      quantidade: l.quantidade.toString(), quantidade_utilizada: l.quantidade_utilizada.toString(),
      data_aquisicao: l.data_aquisicao?.split("T")[0] || "", data_validade: l.data_validade?.split("T")[0] || "",
      valor_total: l.valor_total?.toString() || "", status: l.status, observacoes: l.observacoes || "", unidade_id: l.unidade_id,
    });
    setFormError(""); setModalOpen(true);
  };

  const handleSave = async () => {
    setFormError("");
    if (!formData.nome.trim() || !formData.unidade_id) { setFormError("Nome e unidade são obrigatórios."); return; }
    setSaving(true);
    try {
      const payload = {
        nome: formData.nome, fabricante: formData.fabricante || null, versao: formData.versao || null, tipo: formData.tipo,
        numero_licenca: formData.numero_licenca || null, chave_ativacao: formData.chave_ativacao || null,
        quantidade: parseInt(formData.quantidade) || 0, quantidade_utilizada: parseInt(formData.quantidade_utilizada) || 0,
        data_aquisicao: formData.data_aquisicao || null, data_validade: formData.data_validade || null,
        valor_total: formData.valor_total ? parseFloat(formData.valor_total) : null, status: formData.status,
        observacoes: formData.observacoes || null, unidade_id: formData.unidade_id,
      };
      if (editing) { const { error } = await supabase.from("licencas_software").update(payload).eq("id", editing.id); if (error) { setFormError(error.message); return; } }
      else { const { error } = await supabase.from("licencas_software").insert(payload); if (error) { setFormError(error.message); return; } }
      setModalOpen(false); fetchData();
    } catch (err: any) { setFormError(err.message || "Erro");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("licencas_software").delete().eq("id", id);
    if (!error) { setLicencas((p) => p.filter((l) => l.id !== id)); setDeleteConfirm(null); }
  };

  const filtered = licencas.filter((l) => {
    const s = search.toLowerCase();
    const match = l.nome.toLowerCase().includes(s) || (l.fabricante || "").toLowerCase().includes(s) || (l.numero_licenca || "").toLowerCase().includes(s);
    if (statusFilter !== "todas" && l.status !== statusFilter) return false;
    return match;
  });

  const ativas = licencas.filter((l) => l.status === "ativa").length;
  const expiradas = licencas.filter((l) => l.status === "expirada").length;
  const totalLicencas = licencas.reduce((acc, l) => acc + l.quantidade, 0);
  const utilizadas = licencas.reduce((acc, l) => acc + l.quantidade_utilizada, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="rounded-xl p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600"><FileText className="h-6 w-6" /></div>
          <div><h2 className="page-title">Licenças de Software</h2><p className="page-subtitle mt-1">Gestão de licenças de software, chaves de ativação e validades</p></div>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Nova Licença</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="stats-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total de Licenças</p><p className="text-2xl font-bold">{licencas.length}</p></CardContent></Card>
        <Card className="stats-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Ativas</p><p className="text-2xl font-bold text-emerald-600">{ativas}</p></CardContent></Card>
        <Card className="stats-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Expiradas</p><p className="text-2xl font-bold text-red-600">{expiradas}</p></CardContent></Card>
        <Card className="stats-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Utilização</p><p className="text-2xl font-bold">{utilizadas}/{totalLicencas}</p></CardContent></Card>
      </div>

      <Card><CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Buscar por nome, fabricante ou nº licença..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div className="flex items-center gap-2">
            {[{ v: "todas", l: "Todas" }, { v: "ativa", l: "Ativas" }, { v: "expirada", l: "Expiradas" }].map((o) => (
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
            <p className="text-sm font-medium text-foreground">{search ? "Nenhuma licença encontrada" : "Nenhuma licença cadastrada"}</p>
            <p className="text-xs text-muted-foreground mt-1">{search ? "Tente alterar os termos" : "Clique em 'Nova Licença' para cadastrar"}</p>
          </div>
        : <div className="divide-y divide-border">
            {filtered.map((lic, index) => (
              <motion.div key={lic.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}
                className="group flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-4 hover:bg-accent/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{lic.nome}</p>
                    {lic.versao && <span className="text-[10px] text-muted-foreground">v{lic.versao}</span>}
                    <Badge variant={statusVariant[lic.status] || "default"} className="text-[9px] px-1.5 py-0 h-4">{STATUS_LIC_OPTIONS.find((o) => o.value === lic.status)?.label}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-0.5">
                    {lic.fabricante && <span className="text-[11px] text-muted-foreground">{lic.fabricante}</span>}
                    <span className="text-[11px] text-muted-foreground">{TIPO_LIC_OPTIONS.find((o) => o.value === lic.tipo)?.label}</span>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Users className="h-3 w-3" />{lic.quantidade_utilizada}/{lic.quantidade}</span>
                    {lic.data_validade && <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><CalendarDays className="h-3 w-3" />Vence: {new Date(lic.data_validade).toLocaleDateString("pt-BR")}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(lic)} className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><Edit3 className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDeleteConfirm(lic.id)} className="rounded p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </motion.div>
            ))}
          </div>}
      </CardContent></Card>

      {/* Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar Licença" : "Nova Licença"} size="xl">
        <div className="space-y-4">
          {formError && <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{formError}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nome do software *" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} placeholder="Ex: Microsoft Office 365" disabled={saving} />
            <Select label="Tipo *" options={TIPO_LIC_OPTIONS} value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value as LicencaSoftware["tipo"] })} disabled={saving} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Fabricante" value={formData.fabricante} onChange={(e) => setFormData({ ...formData, fabricante: e.target.value })} placeholder="Ex: Microsoft" disabled={saving} />
            <Input label="Versão" value={formData.versao} onChange={(e) => setFormData({ ...formData, versao: e.target.value })} placeholder="Ex: 2024" disabled={saving} />
            <Select label="Unidade *" options={unidadeOptions} placeholder="Selecione" value={formData.unidade_id} onChange={(e) => setFormData({ ...formData, unidade_id: e.target.value })} disabled={saving} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nº da Licença" value={formData.numero_licenca} onChange={(e) => setFormData({ ...formData, numero_licenca: e.target.value })} placeholder="Número da licença" disabled={saving} />
            <Input label="Chave de Ativação" value={formData.chave_ativacao} onChange={(e) => setFormData({ ...formData, chave_ativacao: e.target.value })} placeholder="XXXXX-XXXXX-XXXXX" disabled={saving} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Quantidade" type="number" value={formData.quantidade} onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })} disabled={saving} />
            <Input label="Quantidade Utilizada" type="number" value={formData.quantidade_utilizada} onChange={(e) => setFormData({ ...formData, quantidade_utilizada: e.target.value })} disabled={saving} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Data de Aquisição" type="date" value={formData.data_aquisicao} onChange={(e) => setFormData({ ...formData, data_aquisicao: e.target.value })} disabled={saving} />
            <Input label="Data de Validade" type="date" value={formData.data_validade} onChange={(e) => setFormData({ ...formData, data_validade: e.target.value })} disabled={saving} />
            <Input label="Valor Total (R$)" type="number" value={formData.valor_total} onChange={(e) => setFormData({ ...formData, valor_total: e.target.value })} disabled={saving} />
          </div>
          {editing && <Select label="Status" options={STATUS_LIC_OPTIONS} value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as LicencaSoftware["status"] })} disabled={saving} />}
          <Textarea label="Observações" value={formData.observacoes} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} rows={2} disabled={saving} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{editing ? "Salvar" : "Cadastrar"}</Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Delete */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmar exclusão" description="Tem certeza que deseja excluir esta licença?" size="sm">
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="gap-2"><Trash2 className="h-4 w-4" /> Excluir</Button>
        </DialogFooter>
      </Dialog>
    </motion.div>
  );
}
