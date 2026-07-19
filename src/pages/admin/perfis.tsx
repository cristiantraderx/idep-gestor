import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Plus,
  Search,
  Loader2,
  Edit3,
  Trash2,
  RefreshCw,
  Lock,
  Hash,
  Star,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { Perfil } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const nivelLabels: Record<number, string> = {
  0: "Básico",
  1: "Operacional",
  2: "Supervisor",
  3: "Gerencial",
  4: "Estratégico",
  5: "Administrador",
};

export function AdminPerfisPage() {
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPerfil, setEditingPerfil] = useState<Perfil | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    codigo: "",
    descricao: "",
    nivel: 0,
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("perfis")
        .select("*")
        .order("nivel", { ascending: false });
      if (data) setPerfis(data);
    } catch (err) {
      console.error("Erro ao carregar perfis:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let c = false;
    queueMicrotask(() => { if (!c) fetchData(); });
    return () => { c = true; };
  }, [fetchData]);

  const openCreateModal = () => {
    setEditingPerfil(null);
    setFormData({ nome: "", codigo: "", descricao: "", nivel: 0 });
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (perfil: Perfil) => {
    setEditingPerfil(perfil);
    setFormData({
      nome: perfil.nome,
      codigo: perfil.codigo,
      descricao: perfil.descricao || "",
      nivel: perfil.nivel,
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSave = async () => {
    setFormError("");
    if (!formData.nome.trim() || !formData.codigo.trim()) {
      setFormError("Nome e código são obrigatórios.");
      return;
    }

    setSaving(true);
    try {
      if (editingPerfil) {
        const { error } = await supabase
          .from("perfis")
          .update({
            nome: formData.nome,
            descricao: formData.descricao || null,
            nivel: formData.nivel,
          })
          .eq("id", editingPerfil.id);

        if (error) {
          setFormError(error.message);
          return;
        }
      } else {
        const { error } = await supabase.from("perfis").insert({
          nome: formData.nome,
          codigo: formData.codigo,
          descricao: formData.descricao || null,
          nivel: formData.nivel,
          sistema: false,
        });

        if (error) {
          setFormError(error.message);
          return;
        }
      }

      setModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("perfis").delete().eq("id", id);
    if (!error) {
      setPerfis((prev) => prev.filter((p) => p.id !== id));
      setDeleteConfirm(null);
    }
  };

  const filtered = perfis.filter(
    (p) =>
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      p.codigo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="rounded-xl p-3 bg-purple-50 dark:bg-purple-950/50 text-purple-600">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h2 className="page-title">Perfis de Acesso</h2>
            <p className="page-subtitle mt-1">
              Gerencie os perfis e níveis de acesso do sistema
            </p>
          </div>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Perfil
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar perfis..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <Button variant="ghost" size="icon-sm" onClick={fetchData} title="Recarregar">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {filtered.length} perfil{filtered.length !== 1 ? "is" : ""}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Profile Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Shield className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm font-medium text-foreground">
              {search ? "Nenhum perfil encontrado" : "Nenhum perfil cadastrado"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((perfil, index) => (
            <motion.div
              key={perfil.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card className="h-full hover:shadow-md transition-all duration-200">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 dark:bg-purple-950/50">
                        <Shield className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {perfil.nome}
                        </p>
                        <Badge variant="secondary" className="text-[9px] mt-0.5">
                          <Hash className="h-2.5 w-2.5 mr-0.5" />
                          {perfil.codigo}
                        </Badge>
                      </div>
                    </div>
                    {perfil.sistema && (
                      <Lock className="h-3.5 w-3.5 text-muted-foreground/40"  />
                    )}
                  </div>

                  {perfil.descricao && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {perfil.descricao}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-1.5">
                      <Star className="h-3 w-3 text-amber-500" />
                      <span className="text-[10px] font-medium text-muted-foreground">
                        Nível {perfil.nivel} - {nivelLabels[perfil.nivel] || "Personalizado"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(perfil)}
                        className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        title="Editar"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      {!perfil.sistema && (
                        <button
                          onClick={() => setDeleteConfirm(perfil.id)}
                          className="rounded p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPerfil ? "Editar Perfil" : "Novo Perfil"}
        description={editingPerfil ? `Editando: ${editingPerfil.nome}` : "Crie um novo perfil de acesso"}
        size="md"
      >
        <div className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {formError}
            </div>
          )}

          <Input
            label="Nome do perfil *"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            placeholder="Ex: Coordenador Pedagógico"
            disabled={saving}
          />

          <Input
            label="Código *"
            value={formData.codigo}
            onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
            placeholder="Ex: coordenador"
            disabled={saving || !!editingPerfil}
            helperText={editingPerfil ? "Código não pode ser alterado" : "Usado internamente para controle de acesso"}
          />

          <Textarea
            label="Descrição"
            value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            placeholder="Descreva as responsabilidades deste perfil"
            disabled={saving}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Nível de acesso</label>
            <div className="flex flex-wrap gap-2">
              {[0, 1, 2, 3, 4, 5].map((nivel) => (
                <button
                  key={nivel}
                  onClick={() => setFormData({ ...formData, nivel })}
                  className={cn(
                    "flex-1 min-w-[60px] rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150",
                    formData.nivel === nivel
                      ? "bg-idep-700 text-white shadow-sm"
                      : "bg-muted text-muted-foreground hover:text-foreground border border-border"
                  )}
                >
                  <div className="text-center">
                    <div className="font-bold">{nivel}</div>
                    <div className="text-[8px] mt-0.5 opacity-70">{nivelLabels[nivel]}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingPerfil ? "Salvar alterações" : "Criar perfil"}
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirmar exclusão"
        description="Tem certeza que deseja excluir este perfil? Usuários associados perderão este perfil."
        size="sm"
      >
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </Button>
        </DialogFooter>
      </Dialog>
    </motion.div>
  );
}
