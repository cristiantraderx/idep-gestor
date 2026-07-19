import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  Plus,
  Search,
  Loader2,
  Edit3,
  Trash2,
  RefreshCw,
  CalendarDays,
  Building2,
  DollarSign,
  BarChart3,
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
import { formatCurrency, formatFullDate } from "@/lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CATEGORIA_OPTIONS = [
  { value: "mensalidade", label: "Mensalidade" },
  { value: "convenio", label: "Convênio" },
  { value: "subvencao", label: "Subvenção" },
  { value: "projeto", label: "Projeto" },
  { value: "outros", label: "Outros" },
];

const categoriaColors: Record<string, string> = {
  mensalidade: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  convenio: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  subvencao: "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
  projeto: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  outros: "bg-muted text-muted-foreground",
};

const DONUT_COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#84cc16"];

const CATEGORIA_LABELS: Record<string, string> = {
  mensalidade: "Mensalidade",
  convenio: "Convênio",
  subvencao: "Subvenção",
  projeto: "Projeto",
  outros: "Outros",
};

export function ReceitasPage() {
  const [receitas, setReceitas] = useState<Record<string, unknown>[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("todas");
  const [chartData, setChartData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [monthlyChart, setMonthlyChart] = useState<{ month: string; valor: number }[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingReceita, setEditingReceita] = useState<Record<string, unknown> | null>(null);
  const [formData, setFormData] = useState({
    descricao: "",
    valor: "",
    data_recebimento: new Date().toISOString().split("T")[0],
    categoria: "mensalidade",
    origem: "",
    documento: "",
    unidade_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [receitasRes, unidadesRes] = await Promise.all([
        supabase.from("receitas").select("*, unidades(nome, sigla)").order("data_recebimento", { ascending: false }),
        supabase.from("unidades").select("*").eq("ativo", true).order("nome"),
      ]);

      if (receitasRes.data) {
        const typedData = (receitasRes.data as Record<string, unknown>[]).map((r: Record<string, unknown>) => ({
          ...r,
          unidade_nome: (r.unidades as Record<string, unknown> | undefined)?.nome as string || "Não definida",
        }));
        setReceitas(typedData);

        // Build category chart
        const catMap: Record<string, number> = {};
        typedData.forEach((r: Record<string, unknown>) => {
          const cat = (r.categoria as string) || "outros";
          catMap[cat] = (catMap[cat] || 0) + ((r.valor as number) || 0);
        });
        setChartData(
          Object.entries(catMap)
            .sort(([, a], [, b]) => b - a)
            .map(([key, value], i) => ({
              name: CATEGORIA_LABELS[key] || key,
              value: Math.round(value),
              color: DONUT_COLORS[i % DONUT_COLORS.length]!,
            }))
        );

        // Build monthly chart (last 6 months)
        const months: { month: string; start: Date; end: Date }[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const start = new Date(d.getFullYear(), d.getMonth(), 1);
          const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
          months.push({
            month: d.toLocaleDateString("pt-BR", { month: "short" }),
            start,
            end,
          });
        }
        setMonthlyChart(
          months.map((m) => ({
            month: m.month,
            valor: Math.round(
              typedData
                .filter((r: Record<string, unknown>) => {
                  const d = new Date(r.data_recebimento as string);
                  return d >= m.start && d <= m.end;
                })
                .reduce((acc: number, r: Record<string, unknown>) => acc + ((r.valor as number) || 0), 0)
            ),
          }))
        );
      }
      if (unidadesRes.data) setUnidades(unidadesRes.data);
    } catch (err) {
      console.error("Erro ao carregar receitas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { let c = false; queueMicrotask(() => { if (!c) fetchData(); }); return () => { c = true; }; }, [fetchData]);

  const unidadeOptions = unidades.map((u) => ({ value: u.id, label: `${u.nome} (${u.sigla})` }));

  const openCreateModal = () => {
    setEditingReceita(null);
    setFormData({
      descricao: "",
      valor: "",
      data_recebimento: new Date().toISOString().split("T")[0],
      categoria: "mensalidade",
      origem: "",
      documento: "",
      unidade_id: "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (rec: Record<string, unknown>) => {
    setEditingReceita(rec);
    setFormData({
      descricao: rec.descricao as string,
      valor: (rec.valor as number)?.toString() || "",
      data_recebimento: (rec.data_recebimento as string)?.split("T")[0] || "",
      categoria: (rec.categoria as string) || "mensalidade",
      origem: (rec.origem as string) || "",
      documento: (rec.documento as string) || "",
      unidade_id: rec.unidade_id as string,
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSave = async () => {
    setFormError("");
    if (!formData.descricao.trim() || !formData.unidade_id || !formData.valor) {
      setFormError("Descrição, valor e unidade são obrigatórios.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        descricao: formData.descricao,
        valor: parseFloat(formData.valor),
        data_recebimento: formData.data_recebimento,
        categoria: formData.categoria || null,
        origem: formData.origem || null,
        documento: formData.documento || null,
        unidade_id: formData.unidade_id,
      };

      if (editingReceita) {
        const { error } = await supabase.from("receitas").update(payload).eq("id", editingReceita.id);
        if (error) { setFormError(error.message); return; }
      } else {
        const { error } = await supabase.from("receitas").insert(payload);
        if (error) { setFormError(error.message); return; }
      }
      setModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Erro ao salvar receita");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("receitas").delete().eq("id", id);
    if (!error) {
      setReceitas((prev) => prev.filter((r) => r.id !== id));
      setDeleteConfirm(null);
    }
  };

  const totalReceitas = receitas.reduce((acc, r) => acc + ((r.valor as number) || 0), 0);

  const filtered = receitas.filter((r) => {
    const descricao = r.descricao as string;
    const origem = r.origem as string | undefined;
    const documento = r.documento as string | undefined;
    const categoria = r.categoria as string;
    const matchesSearch =
      descricao.toLowerCase().includes(search.toLowerCase()) ||
      (origem && origem.toLowerCase().includes(search.toLowerCase())) ||
      (documento && documento.includes(search));
    if (categoriaFilter !== "todas") return matchesSearch && categoria === categoriaFilter;
    return matchesSearch;
  });

  const chartTotal = chartData.reduce((a, b) => a + b.value, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="rounded-xl p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <h2 className="page-title">Receitas</h2>
            <p className="page-subtitle mt-1">Gerencie todas as receitas da instituição</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground mr-2">
            Total: <strong className="text-emerald-600">{formatCurrency(totalReceitas)}</strong>
          </div>
          <Button onClick={openCreateModal} className="gap-2">
            <Plus className="h-4 w-4" /> Nova Receita
          </Button>
        </div>
      </div>

      {/* Charts Row */}
      {!loading && chartData.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Donut - Categorias */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Distribuição por Categoria</CardTitle>
                <PieChartIcon className="h-4 w-4 text-emerald-600" />
              </div>
              <CardDescription>Total de receitas por categoria</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <div className="h-44 w-44 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {chartData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) =>
                          active && payload?.length ? (
                            <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-sm">
                              <p className="font-medium text-foreground">{payload[0].name}</p>
                              <p className="font-medium text-emerald-600">{formatCurrency(payload[0].value)}</p>
                            </div>
                          ) : null
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 w-full space-y-1.5">
                  {chartData.map((cat, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="text-xs text-foreground truncate">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-medium text-foreground">{formatCurrency(cat.value)}</span>
                        <span className="text-[10px] text-muted-foreground w-10 text-right">
                          {chartTotal > 0 ? ((cat.value / chartTotal) * 100).toFixed(1) : "0"}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bar - Tendência Mensal */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Tendência Mensal</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardDescription>Total de receitas nos últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false}
                      tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val} />
                    <Tooltip
                      content={({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number }>; label?: string }) =>
                        active && payload?.length ? (
                          <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-sm">
                            <p className="font-medium text-foreground mb-1">{label}</p>
                            <p className="font-medium text-emerald-600">{formatCurrency(payload[0].value)}</p>
                          </div>
                        ) : null
                      }
                    />
                    <Bar dataKey="valor" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="Buscar por descrição, origem ou documento..." value={search}
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
              <TrendingUp className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-foreground">{search ? "Nenhuma receita encontrada" : "Nenhuma receita cadastrada"}</p>
              <p className="text-xs text-muted-foreground mt-1">{search ? "Tente alterar os termos da busca" : "Clique em \"Nova Receita\" para cadastrar"}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((rec, index) => (
                <motion.div key={rec.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="group flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-4 hover:bg-accent/30 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="rounded-lg p-2 bg-emerald-50 dark:bg-emerald-950/50 shrink-0">
                      <DollarSign className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{rec.descricao}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${categoriaColors[rec.categoria] || categoriaColors.outros}`}>
                          {CATEGORIA_OPTIONS.find((c) => c.value === rec.categoria)?.label || rec.categoria}
                        </span>
                        {rec.origem && <span className="text-[11px] text-muted-foreground">{rec.origem}</span>}
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <CalendarDays className="h-3 w-3" />
                          {formatFullDate(rec.data_recebimento)}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          {rec.unidade_nome}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold text-emerald-600">{formatCurrency(rec.valor)}</span>
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
        title={editingReceita ? "Editar Receita" : "Nova Receita"}
        description={editingReceita ? `Editando: ${editingReceita.descricao}` : "Registre uma nova receita"} size="lg">
        <div className="space-y-4">
          {formError && (<div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{formError}</div>)}
          <Textarea label="Descrição *" value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            placeholder="Ex: Mensalidade do curso de Enfermagem" rows={2} disabled={saving} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Valor *" type="number" step="0.01" value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
              placeholder="Ex: 1500.00" disabled={saving} />
            <Input label="Data de recebimento *" type="date" value={formData.data_recebimento}
              onChange={(e) => setFormData({ ...formData, data_recebimento: e.target.value })} disabled={saving} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Categoria" options={CATEGORIA_OPTIONS} value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })} disabled={saving} />
            <Input label="Origem" value={formData.origem}
              onChange={(e) => setFormData({ ...formData, origem: e.target.value })}
              placeholder="Ex: Aluno, Concedente, etc." disabled={saving} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Documento" value={formData.documento}
              onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
              placeholder="Ex: NF 00123" disabled={saving} />
            <Select label="Unidade *" options={unidadeOptions} placeholder="Selecione a unidade"
              value={formData.unidade_id} onChange={(e) => setFormData({ ...formData, unidade_id: e.target.value })} disabled={saving} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingReceita ? "Salvar alterações" : "Registrar receita"}
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmar exclusão"
        description="Tem certeza que deseja excluir esta receita?" size="sm">
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