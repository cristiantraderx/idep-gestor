import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Plus,
  Search,
  Loader2,
  Edit3,
  Trash2,
  RefreshCw,
  CalendarDays,
  Lightbulb,
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

const CATEGORIA_OPTIONS = [
  { value: "academica", label: "Acadêmica" },
  { value: "administrativa", label: "Administrativa" },
  { value: "infraestrutura", label: "Infraestrutura" },
  { value: "tecnologia", label: "Tecnologia" },
  { value: "outros", label: "Outros" },
];

const STATUS_OPTIONS = [
  { value: "recebida", label: "Recebida" },
  { value: "em_analise", label: "Em Análise" },
  { value: "aprovada", label: "Aprovada" },
  { value: "implementada", label: "Implementada" },
  { value: "recusada", label: "Recusada" },
];

const categoriaColors: Record<string, string> = {
  academica: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  administrativa: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  infraestrutura: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  tecnologia: "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
  outros: "bg-muted text-muted-foreground",
};

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive" | "success" | "warning"> = {
  recebida: "secondary",
  em_analise: "default",
  aprovada: "success",
  implementada: "success",
  recusada: "destructive",
};

export function SugestoesPage() {
  const [sugestoes, setSugestoes] = useState<Record<string, unknown>[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("todas");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    autor_nome: "",
    autor_email: "",
    categoria: "academica",
    status: "recebida",
    resposta: "",
    unidade_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sugRes, unidRes] = await Promise.all([
        supabase.from("sugestoes").select("*, unidades(nome, sigla)").order("data_envio", { ascending: false }),
        supabase.from("unidades").select("*").eq("ativo", true).order("nome"),
      ]);
      if (sugRes.data) {
        setSugestoes((sugRes.data as Record<string, unknown>[]).map((s) => ({ ...s, unidade_nome: (s.unidades as Record<string, unknown> | undefined)?.nome as string || "Não definida" })));
      }
      if (unidRes.data) setUnidades(unidRes.data);
    } catch (err) {
      console.error("Erro ao carregar sugestões:", err);
    } finally {
      setLoading(false);
    }
  }, []);  useEffect(() => { let c = false; queueMicrotask(() => { if (!c) fetchData(); }); return () => { c = true; }; }, [fetchData]);

  const unidadeOptions = unidades.map((u) => ({ value: u.id, label: `${u.nome} (${u.sigla})` }));

  const openCreateModal = () => {
    setEditing(null);
    setFormData({ titulo: "", descricao: "", autor_nome: "", autor_email: "", categoria: "academica", status: "recebida", resposta: "", unidade_id: "" });
    setFormError(""); setModalOpen(true);
  };

  const openEditModal = (s: Record<string, unknown>) => {
    setEditing(s);
    setFormData({
      titulo: s.titulo, descricao: s.descricao || "", autor_nome: s.autor_nome || "", autor_email: s.autor_email || "",
      categoria: s.categoria || "academica", status: s.status || "recebida", resposta: s.resposta || "", unidade_id: s.unidade_id,
    });
    setFormError(""); setModalOpen(true);
  };

  const handleSave = async () => {
    setFormError("");
    if (!formData.titulo.trim() || !formData.unidade_id) {
      setFormError("Título e unidade são obrigatórios."); return;
    }
    setSaving(true);
    try {
      const payload = {
        titulo: formData.titulo, descricao: formData.descricao || null, autor_nome: formData.autor_nome || null,
        autor_email: formData.autor_email || null, categoria: formData.categoria, status: formData.status,
        resposta: formData.resposta || null, unidade_id: formData.unidade_id, data_envio: editing?.data_envio || new Date().toISOString(),
      };
      if (editing) {
        const { error } = await supabase.from("sugestoes").update(payload).eq("id", editing.id);
        if (error) { setFormError(error.message); return; }
      } else {
        const { error } = await supabase.from("sugestoes").insert(payload);
        if (error) { setFormError(error.message); return; }
      }
      setModalOpen(false); fetchData();
    } catch (err: unknown) { setFormError(err instanceof Error ? err.message : "Erro ao salvar"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("sugestoes").delete().eq("id", id);
    if (!error) { setSugestoes((prev) => prev.filter((s) => s.id !== id)); setDeleteConfirm(null); }
  };

  const totalSugestoes = sugestoes.length;
  const implementadas = sugestoes.filter((s) => s.status === "implementada").length;

  const filtered = sugestoes.filter((s) => {
    const matchSearch = s.titulo.toLowerCase().includes(search.toLowerCase()) ||
      (s.descricao && s.descricao.toLowerCase().includes(search.toLowerCase()));
    if (categoriaFilter !== "todas") return matchSearch && s.categoria === categoriaFilter;
    return matchSearch;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="rounded-xl p-3 bg-purple-50 dark:bg-purple-950/50 text-purple-600">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <h2 className="page-title">Sugestões</h2>
            <p className="page-subtitle mt-1">Gerencie sugestões recebidas pela ouvidoria</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground mr-2">
            <strong className="text-purple-600">{implementadas}</strong> de <strong>{totalSugestoes}</strong> implementadas
          </span>
          <Button onClick={openCreateModal} className="gap-2"><Plus className="h-4 w-4" /> Nova Sugestão</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="Buscar por título ou descrição..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div className="flex items-center gap-2">
              <select value={categoriaFilter} onChange={(e) => setCategoriaFilter(e.target.value)}
                className="h-7 rounded-lg border border-input bg-background px-2 text-[10px] font-medium text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="todas">Todas categorias</option>
                {CATEGORIA_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
              <Button variant="ghost" size="icon-sm" onClick={fetchData}><RefreshCw className="h-3.5 w-3.5" /></Button>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{filtered.length} registro{filtered.length !== 1 ? "s" : ""}</span>
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
              <Lightbulb className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-foreground">{search ? "Nenhuma sugestão encontrada" : "Nenhuma sugestão cadastrada"}</p>
              <p className="text-xs text-muted-foreground mt-1">{search ? "Tente alterar os termos da busca" : "Clique em \"Nova Sugestão\" para cadastrar"}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((s, index) => (
                <motion.div key={s.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="group flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-4 hover:bg-accent/30 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="rounded-lg p-2 bg-purple-50 dark:bg-purple-950/50 shrink-0">
                      <MessageSquare className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{s.titulo}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${categoriaColors[s.categoria] || categoriaColors.outros}`}>
                          {CATEGORIA_OPTIONS.find((c) => c.value === s.categoria)?.label || s.categoria}
                        </span>
                        <Badge variant={statusVariant[s.status] || "outline"} className="text-[9px]">
                          {STATUS_OPTIONS.find((st) => st.value === s.status)?.label || s.status}
                        </Badge>
                        {s.autor_nome && <span className="text-[11px] text-muted-foreground">{s.autor_nome}</span>}
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <CalendarDays className="h-3 w-3" />
                          {formatFullDate(s.data_envio)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {s.status === "implementada" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    <button onClick={() => openEditModal(s)}
                      className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleteConfirm(s.id)}
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
        title={editing ? "Editar Sugestão" : "Nova Sugestão"}
        description={editing ? `Editando: ${editing.titulo}` : "Registre uma nova sugestão"} size="lg">
        <div className="space-y-4">
          {formError && (<div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{formError}</div>)}
          <Input label="Título *" value={formData.titulo}
            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
            placeholder="Ex: Melhoria no sistema de matrículas" disabled={saving} />
          <Textarea label="Descrição" value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            placeholder="Descreva a sugestão detalhadamente..." rows={3} disabled={saving} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Categoria" options={CATEGORIA_OPTIONS} value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })} disabled={saving} />
            <Select label="Unidade *" options={unidadeOptions} placeholder="Selecione a unidade"
              value={formData.unidade_id} onChange={(e) => setFormData({ ...formData, unidade_id: e.target.value })} disabled={saving} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nome do autor" value={formData.autor_nome}
              onChange={(e) => setFormData({ ...formData, autor_nome: e.target.value })} placeholder="Opcional" disabled={saving} />
            <Input label="Email do autor" value={formData.autor_email}
              onChange={(e) => setFormData({ ...formData, autor_email: e.target.value })} placeholder="Opcional" disabled={saving} />
          </div>
          <Textarea label="Resposta" value={formData.resposta}
            onChange={(e) => setFormData({ ...formData, resposta: e.target.value })}
            placeholder="Resposta da ouvidoria para a sugestão..." rows={2} disabled={saving} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Salvar alterações" : "Registrar sugestão"}
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmar exclusão"
        description="Tem certeza que deseja excluir esta sugestão?" size="sm">
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