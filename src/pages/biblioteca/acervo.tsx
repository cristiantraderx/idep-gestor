import { useState, useEffect, useCallback } from "react";
import {
  Library,
  Plus,
  Search,
  Loader2,
  Edit3,
  Trash2,
  RefreshCw,
  BookOpen,
  User,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { Obra, Unidade } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";



const TIPO_OBRA_OPTIONS = [
  { value: "livro", label: "Livro" },
  { value: "revista", label: "Revista" },
  { value: "artigo", label: "Artigo" },
  { value: "tcc", label: "TCC" },
  { value: "dissertacao", label: "Dissertação" },
  { value: "tese", label: "Tese" },
  { value: "periodico", label: "Periódico" },
  { value: "dvd", label: "DVD" },
  { value: "outros", label: "Outros" },
];

const CATEGORIA_OBRA_OPTIONS = [
  { value: "didatico", label: "Didático" },
  { value: "literatura", label: "Literatura" },
  { value: "referencia", label: "Referência" },
  { value: "periodico", label: "Periódico" },
  { value: "multimidia", label: "Multimídia" },
  { value: "outros", label: "Outros" },
];

export function AcervoPage() {
  const [obras, setObras] = useState<(Obra & { unidade_nome?: string })[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("todos");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Obra | null>(null);
  const [formData, setFormData] = useState({
    titulo: "", autor: "", editora: "", ano: "", edicao: "", isbn: "", codigo: "",
    tipo: "livro" as Obra["tipo"], categoria: "didatico" as Obra["categoria"],
    assunto: "", localizacao: "", quantidade_total: "1", quantidade_disponivel: "1", unidade_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [detailObra, setDetailObra] = useState<(Obra & { unidade_nome?: string }) | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [obrasRes, unidRes] = await Promise.all([
        supabase.from("obras").select("*, unidades(nome, sigla)").order("created_at", { ascending: false }),
        supabase.from("unidades").select("*").eq("ativo", true).order("nome"),
      ]);
      if (obrasRes.data) setObras((obrasRes.data as Record<string, unknown>[]).map((o: Record<string, unknown>) => ({ ...o, unidade_nome: (o.unidades as Record<string, unknown> | undefined)?.nome as string || "Não definida" })));
      if (unidRes.data) setUnidades(unidRes.data);
    } catch (err) { console.error(err);
    } finally { setLoading(false); }
  }, []);  useEffect(() => { let c = false; queueMicrotask(() => { if (!c) fetchData(); }); return () => { c = true; }; }, [fetchData]);

  const unidadeOptions = unidades.map((u) => ({ value: u.id, label: `${u.nome} (${u.sigla})` }));

  const openCreate = () => {
    setEditing(null);
    setFormData({ titulo: "", autor: "", editora: "", ano: "", edicao: "", isbn: "", codigo: "", tipo: "livro", categoria: "didatico", assunto: "", localizacao: "", quantidade_total: "1", quantidade_disponivel: "1", unidade_id: "" });
    setFormError(""); setModalOpen(true);
  };

  const openEdit = (o: Obra) => {
    setEditing(o);
    setFormData({
      titulo: o.titulo, autor: o.autor || "", editora: o.editora || "", ano: o.ano?.toString() || "", edicao: o.edicao || "",
      isbn: o.isbn || "", codigo: o.codigo || "", tipo: o.tipo, categoria: o.categoria, assunto: o.assunto || "",
      localizacao: o.localizacao || "", quantidade_total: o.quantidade_total.toString(), quantidade_disponivel: o.quantidade_disponivel.toString(), unidade_id: o.unidade_id,
    });
    setFormError(""); setModalOpen(true);
  };

  const handleSave = async () => {
    setFormError("");
    if (!formData.titulo.trim() || !formData.unidade_id) { setFormError("Título e unidade são obrigatórios."); return; }
    setSaving(true);
    try {
      const payload = {
        titulo: formData.titulo, autor: formData.autor || null, editora: formData.editora || null,
        ano: formData.ano ? parseInt(formData.ano) : null, edicao: formData.edicao || null, isbn: formData.isbn || null,
        codigo: formData.codigo || null, tipo: formData.tipo, categoria: formData.categoria,
        assunto: formData.assunto || null, localizacao: formData.localizacao || null,
        quantidade_total: parseInt(formData.quantidade_total) || 0, quantidade_disponivel: parseInt(formData.quantidade_disponivel) || 0,
        unidade_id: formData.unidade_id,
      };
      if (editing) { const { error } = await supabase.from("obras").update(payload).eq("id", editing.id); if (error) { setFormError(error.message); return; } }
      else { const { error } = await supabase.from("obras").insert(payload); if (error) { setFormError(error.message); return; } }
      setModalOpen(false); fetchData();
    } catch (err: unknown) { setFormError(err instanceof Error ? err.message : "Erro");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("obras").delete().eq("id", id);
    if (!error) { setObras((p) => p.filter((o) => o.id !== id)); setDeleteConfirm(null); }
  };

  const filtered = obras.filter((o) => {
    const s = search.toLowerCase();
    const match = o.titulo.toLowerCase().includes(s) || (o.autor || "").toLowerCase().includes(s) || (o.isbn || "").includes(s) || (o.codigo || "").toLowerCase().includes(s);
    if (tipoFilter !== "todos" && o.tipo !== tipoFilter) return false;
    return match;
  });

  const totalExemplares = obras.reduce((acc, o) => acc + o.quantidade_total, 0);
  const disponiveis = obras.reduce((acc, o) => acc + o.quantidade_disponivel, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="rounded-xl p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-600"><Library className="h-6 w-6" /></div>
          <div><h2 className="page-title">Acervo Bibliográfico</h2><p className="page-subtitle mt-1">Cadastro e gerenciamento do acervo de obras da biblioteca</p></div>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Nova Obra</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="stats-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total de Obras</p><p className="text-2xl font-bold">{obras.length}</p></CardContent></Card>
        <Card className="stats-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Exemplares</p><p className="text-2xl font-bold">{totalExemplares}</p></CardContent></Card>
        <Card className="stats-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Disponíveis</p><p className="text-2xl font-bold text-emerald-600">{disponiveis}</p></CardContent></Card>
      </div>

      <Card><CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Buscar por título, autor, ISBN ou código..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div className="flex items-center gap-2">
            <select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)} className="h-7 rounded-lg border border-input bg-background px-2 text-[10px] font-medium text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="todos">Todos os tipos</option>
              {TIPO_OBRA_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <Button variant="ghost" size="icon-sm" onClick={fetchData}><RefreshCw className="h-3.5 w-3.5" /></Button>
            <span className="text-xs text-muted-foreground">{filtered.length} obra{filtered.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        {loading ? <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        : filtered.length === 0 ? <div className="flex flex-col items-center justify-center py-16 text-center">
            <Library className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-foreground">{search ? "Nenhuma obra encontrada" : "Nenhuma obra cadastrada"}</p>
            <p className="text-xs text-muted-foreground mt-1">{search ? "Tente alterar os termos" : "Clique em 'Nova Obra' para cadastrar"}</p>
          </div>
        : <div className="divide-y divide-border">
            {filtered.map((obra, index) => (
              <motion.div key={obra.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}
                className="group flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-4 hover:bg-accent/30 transition-colors cursor-pointer"
                onClick={() => setDetailObra(obra)}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="rounded-lg p-2 bg-rose-50 dark:bg-rose-950/50 shrink-0"><Library className="h-5 w-5 text-rose-600" /></div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{obra.titulo}</p>
                      {obra.codigo && <span className="text-[10px] font-mono text-muted-foreground shrink-0">#{obra.codigo}</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-0.5">
                      {obra.autor && <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><User className="h-3 w-3" />{obra.autor}</span>}
                      <span className="text-[11px] text-muted-foreground">{TIPO_OBRA_OPTIONS.find((o) => o.value === obra.tipo)?.label}</span>
                      {obra.ano && <span className="text-[11px] text-muted-foreground">{obra.ano}</span>}
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <BookOpen className="h-3 w-3" />{obra.quantidade_disponivel}/{obra.quantidade_total} disp.
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Badge variant={obra.quantidade_disponivel > 0 ? "success" : "destructive"} className="text-[9px] px-1.5 py-0 h-4">
                    {obra.quantidade_disponivel > 0 ? "Disponível" : "Indisponível"}
                  </Badge>
                  <button onClick={() => openEdit(obra)} className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><Edit3 className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDeleteConfirm(obra.id)} className="rounded p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </motion.div>
            ))}
          </div>}
      </CardContent></Card>

      {/* Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar Obra" : "Nova Obra"} size="xl">
        <div className="space-y-4">
          {formError && <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{formError}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Título *" value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} placeholder="Título da obra" disabled={saving} />
            <Input label="Autor" value={formData.autor} onChange={(e) => setFormData({ ...formData, autor: e.target.value })} placeholder="Nome do autor" disabled={saving} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select label="Tipo *" options={TIPO_OBRA_OPTIONS} value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value as Obra["tipo"] })} disabled={saving} />
            <Select label="Categoria *" options={CATEGORIA_OBRA_OPTIONS} value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: e.target.value as Obra["categoria"] })} disabled={saving} />
            <Select label="Unidade *" options={unidadeOptions} placeholder="Selecione" value={formData.unidade_id} onChange={(e) => setFormData({ ...formData, unidade_id: e.target.value })} disabled={saving} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Input label="Editora" value={formData.editora} onChange={(e) => setFormData({ ...formData, editora: e.target.value })} placeholder="Editora" disabled={saving} />
            <Input label="Ano" type="number" value={formData.ano} onChange={(e) => setFormData({ ...formData, ano: e.target.value })} placeholder="2024" disabled={saving} />
            <Input label="Edição" value={formData.edicao} onChange={(e) => setFormData({ ...formData, edicao: e.target.value })} placeholder="1ª ed." disabled={saving} />
            <Input label="ISBN" value={formData.isbn} onChange={(e) => setFormData({ ...formData, isbn: e.target.value })} placeholder="978-85-XXX" disabled={saving} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Código" value={formData.codigo} onChange={(e) => setFormData({ ...formData, codigo: e.target.value })} placeholder="Código interno" disabled={saving} />
            <Input label="Localização" value={formData.localizacao} onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })} placeholder="Ex: Estante 3, Prateleira B" disabled={saving} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Quantidade Total" type="number" value={formData.quantidade_total} onChange={(e) => setFormData({ ...formData, quantidade_total: e.target.value })} disabled={saving} />
            <Input label="Quantidade Disponível" type="number" value={formData.quantidade_disponivel} onChange={(e) => setFormData({ ...formData, quantidade_disponivel: e.target.value })} disabled={saving} />
          </div>
          <div className="grid grid-cols-1 gap-2">
            <label className="text-xs font-medium text-foreground">Assunto</label>
            <input value={formData.assunto} onChange={(e) => setFormData({ ...formData, assunto: e.target.value })} placeholder="Ex: Engenharia de Software, Literatura Brasileira..."
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input transition-all disabled:opacity-50" disabled={saving} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{editing ? "Salvar" : "Cadastrar"}</Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Detail */}
      <Dialog open={!!detailObra} onClose={() => setDetailObra(null)} title="Detalhes da Obra" size="lg">
        {detailObra && <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
            <div className="rounded-lg p-3 bg-rose-50 dark:bg-rose-950/50"><Library className="h-6 w-6 text-rose-600" /></div>
            <div className="space-y-1">
              <p className="text-lg font-semibold">{detailObra.titulo} {detailObra.codigo && <span className="text-xs font-mono text-muted-foreground">#{detailObra.codigo}</span>}</p>
              <p className="text-xs text-muted-foreground">{detailObra.autor && `Por ${detailObra.autor} · `}{TIPO_OBRA_OPTIONS.find((o) => o.value === detailObra.tipo)?.label}{detailObra.ano && ` · ${detailObra.ano}`}</p>
              <div className="flex gap-1 mt-1">
                <Badge variant={detailObra.quantidade_disponivel > 0 ? "success" : "destructive"}>{detailObra.quantidade_disponivel > 0 ? "Disponível" : "Indisponível"}</Badge>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {detailObra.editora && <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground uppercase tracking-wider">Editora</p><p className="text-sm font-medium">{detailObra.editora}</p></div>}
            {detailObra.isbn && <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground uppercase tracking-wider">ISBN</p><p className="text-sm font-medium">{detailObra.isbn}</p></div>}
            <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground uppercase tracking-wider">Exemplares</p><p className="text-sm font-medium">{detailObra.quantidade_disponivel} de {detailObra.quantidade_total} disponíveis</p></div>
            {detailObra.localizacao && <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground uppercase tracking-wider">Localização</p><p className="text-sm font-medium">{detailObra.localizacao}</p></div>}
          </div>
          {detailObra.assunto && <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Assunto</p><p className="text-sm">{detailObra.assunto}</p></div>}
        </div>}
      </Dialog>

      {/* Delete */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmar exclusão" description="Tem certeza que deseja excluir esta obra?" size="sm">
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="gap-2"><Trash2 className="h-4 w-4" /> Excluir</Button>
        </DialogFooter>
      </Dialog>
    </motion.div>
  );
}
