import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { BemPatrimonial, Unidade } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const CATEGORIA_OPTIONS = [
  { value: "moveis", label: "Móveis" },
  { value: "equipamentos", label: "Equipamentos" },
  { value: "veiculos", label: "Veículos" },
  { value: "imoveis", label: "Imóveis" },
  { value: "informatica", label: "Informática" },
  { value: "outros", label: "Outros" },
];

const ESTADO_OPTIONS = [
  { value: "novo", label: "Novo" },
  { value: "bom", label: "Bom" },
  { value: "regular", label: "Regular" },
  { value: "ruim", label: "Ruim" },
  { value: "inservivel", label: "Inservível" },
];

const STATUS_OPTIONS = [
  { value: "ativo", label: "Ativo" },
  { value: "manutencao", label: "Em Manutenção" },
  { value: "baixado", label: "Baixado" },
  { value: "transferido", label: "Transferido" },
];

const _estadoColors: Record<string, string> = {
  novo: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  bom: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  regular: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  ruim: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  inservivel: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const statusColors: Record<string, string> = {
  ativo: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  manutencao: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  baixado: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  transferido: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

const categoriaLabels: Record<string, string> = {
  moveis: "Móveis",
  equipamentos: "Equipamentos",
  veiculos: "Veículos",
  imoveis: "Imóveis",
  informatica: "Informática",
  outros: "Outros",
};

const estadoLabels: Record<string, string> = {
  novo: "Novo",
  bom: "Bom",
  regular: "Regular",
  ruim: "Ruim",
  inservivel: "Inservível",
};

const statusLabels: Record<string, string> = {
  ativo: "Ativo",
  manutencao: "Manutenção",
  baixado: "Baixado",
  transferido: "Transferido",
};

interface BemWithUnidade extends BemPatrimonial {
  unidade_nome?: string;
}

const formatCurrency = (value: number | null) => {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

const formatDate = (date: string | null) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("pt-BR");
};

function BensPage() {
  const [bens, setBens] = useState<BemWithUnidade[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<BemWithUnidade | null>(null);
  const [formData, setFormData] = useState({
    numero_tombo: "",
    nome: "",
    descricao: "",
    categoria: "outros",
    localizacao: "",
    responsavel_id: "",
    valor_aquisicao: "",
    data_aquisicao: "",
    data_garantia: "",
    vida_util_anos: "",
    estado: "bom",
    status: "ativo",
    unidade_id: "",
  });
  const [formError, setFormError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [bensRes, unidadesRes] = await Promise.all([
        supabase.from("bens_patrimoniais").select("*").order("nome"),
        supabase.from("unidades").select("*"),
      ]);
      if (bensRes.data) setBens(bensRes.data as BemWithUnidade[]);
      if (unidadesRes.data) setUnidades(unidadesRes.data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { let c = false; queueMicrotask(() => { if (!c) fetchData(); }); return () => { c = true; }; }, [fetchData]);

  const resetForm = () => {
    setFormData({
      numero_tombo: "",
      nome: "",
      descricao: "",
      categoria: "outros",
      localizacao: "",
      responsavel_id: "",
      valor_aquisicao: "",
      data_aquisicao: "",
      data_garantia: "",
      vida_util_anos: "",
      estado: "bom",
      status: "ativo",
      unidade_id: unidades[0]?.id || "",
    });
    setFormError("");
  };

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (bem: BemWithUnidade) => {
    setEditing(bem);
    setFormData({
      numero_tombo: bem.numero_tombo || "",
      nome: bem.nome,
      descricao: bem.descricao || "",
      categoria: bem.categoria || "outros",
      localizacao: bem.localizacao || "",
      responsavel_id: bem.responsavel_id || "",
      valor_aquisicao: bem.valor_aquisicao?.toString() || "",
      data_aquisicao: bem.data_aquisicao?.split("T")[0] || "",
      data_garantia: bem.data_garantia?.split("T")[0] || "",
      vida_util_anos: bem.vida_util_anos?.toString() || "",
      estado: bem.estado,
      status: bem.status,
      unidade_id: bem.unidade_id,
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.unidade_id) {
      setFormError("Nome e Unidade são obrigatórios.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nome: formData.nome,
        unidade_id: formData.unidade_id,
        numero_tombo: formData.numero_tombo || null,
        descricao: formData.descricao || null,
        categoria: formData.categoria || null,
        localizacao: formData.localizacao || null,
        responsavel_id: formData.responsavel_id || null,
        valor_aquisicao: formData.valor_aquisicao ? Number(formData.valor_aquisicao) : null,
        data_aquisicao: formData.data_aquisicao || null,
        data_garantia: formData.data_garantia || null,
        vida_util_anos: formData.vida_util_anos ? Number(formData.vida_util_anos) : null,
        estado: formData.estado as BemPatrimonial["estado"],
        status: formData.status as BemPatrimonial["status"],
      };

      if (editing) {
        const { error } = await supabase.from("bens_patrimoniais").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("bens_patrimoniais").insert(payload);
        if (error) throw error;
      }
      setModalOpen(false);
      fetchData();
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("bens_patrimoniais").delete().eq("id", deleteConfirm);
      if (error) throw error;
      setDeleteConfirm(null);
      fetchData();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Erro ao excluir.");
    } finally {
      setSaving(false);
    }
  };

  const filtered = bens.filter((bem) => {
    const matchSearch =
      bem.nome.toLowerCase().includes(search.toLowerCase()) ||
      (bem.numero_tombo?.toLowerCase().includes(search.toLowerCase())) ||
      (bem.localizacao?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "todos" || bem.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bens Patrimoniais</h1>
          <p className="text-muted-foreground mt-1">Gerencie todos os bens patrimoniais da instituição</p>
        </div>
        <Button onClick={openCreate}>+ Novo Bem</Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome, tombo ou localização..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="todos">Todos os Status</option>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Nenhum bem patrimonial encontrado.
            </CardContent>
          </Card>
        ) : (
          filtered.map((bem, index) => (
            <motion.div
              key={bem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-lg truncate">{bem.nome}</h3>
                        <Badge className={cn("text-xs", statusColors[bem.status])}>
                          {statusLabels[bem.status]}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {estadoLabels[bem.estado]}
                        </Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                        {bem.numero_tombo && <span>Tombo: <strong>{bem.numero_tombo}</strong></span>}
                        {bem.categoria && <span>Categoria: <strong>{categoriaLabels[bem.categoria]}</strong></span>}
                        {bem.localizacao && <span>Local: <strong>{bem.localizacao}</strong></span>}
                        {bem.valor_aquisicao !== null && <span>Valor: <strong>{formatCurrency(bem.valor_aquisicao)}</strong></span>}
                        {bem.data_aquisicao && <span>Aquisição: <strong>{formatDate(bem.data_aquisicao)}</strong></span>}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(bem)}>Editar</Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => setDeleteConfirm(bem.id)}>Excluir</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar Bem" : "Novo Bem Patrimonial"}
        size="xl"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
          <div className="sm:col-span-2">
            <Input label="Nome do Bem *" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} placeholder="Ex: Cadeira Ergonômica" />
          </div>
          <Input label="Nº Tombo" value={formData.numero_tombo} onChange={(e) => setFormData({ ...formData, numero_tombo: e.target.value })} placeholder="Ex: 2024/001" />
          <Select label="Unidade *" options={unidades.map((u) => ({ value: u.id, label: u.nome || u.sigla || u.id }))} value={formData.unidade_id} onChange={(e) => setFormData({ ...formData, unidade_id: e.target.value })} />
          <Select label="Categoria" options={CATEGORIA_OPTIONS} value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: e.target.value })} />
          <Select label="Estado de Conservação" options={ESTADO_OPTIONS} value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value })} />
          <Select label="Status" options={STATUS_OPTIONS} value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} />
          <Input label="Localização" value={formData.localizacao} onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })} placeholder="Ex: Bloco A, Sala 101" />
          <Input label="Responsável (ID)" value={formData.responsavel_id} onChange={(e) => setFormData({ ...formData, responsavel_id: e.target.value })} />
          <Input label="Valor de Aquisição (R$)" type="number" value={formData.valor_aquisicao} onChange={(e) => setFormData({ ...formData, valor_aquisicao: e.target.value })} placeholder="0,00" />
          <Input label="Data de Aquisição" type="date" value={formData.data_aquisicao} onChange={(e) => setFormData({ ...formData, data_aquisicao: e.target.value })} />
          <Input label="Data de Garantia" type="date" value={formData.data_garantia} onChange={(e) => setFormData({ ...formData, data_garantia: e.target.value })} />
          <Input label="Vida Útil (anos)" type="number" value={formData.vida_util_anos} onChange={(e) => setFormData({ ...formData, vida_util_anos: e.target.value })} placeholder="Ex: 5" />
          <div className="sm:col-span-2">
            <Textarea label="Descrição" value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} placeholder="Descrição detalhada do bem..." />
          </div>
        </div>
        {formError && <p className="text-sm text-red-500 mb-4">{formError}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : (editing ? "Atualizar" : "Cadastrar")}
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirmar Exclusão"
      >
        <p className="text-muted-foreground py-4">Tem certeza que deseja excluir este bem? Esta ação não pode ser desfeita.</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={saving}>
            {saving ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

export { BensPage };
export default BensPage;
