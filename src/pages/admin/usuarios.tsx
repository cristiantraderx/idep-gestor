import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Plus,
  Search,
  Loader2,
  Edit3,
  Trash2,
  Ban,
  CheckCircle2,
  Mail,
  Shield,
  ArrowUpDown,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { Usuario, Perfil, Unidade } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, formatFullDate } from "@/lib/utils";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type SortField = "nome" | "email" | "created_at" | "ultimo_acesso";

export function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<(Usuario & { perfil_nome?: string; unidade_nome?: string })[]>([]);
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortAsc, setSortAsc] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    cpf: "",
    telefone: "",
    perfil_id: "",
    unidade_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usuariosRes, perfisRes, unidadesRes] = await Promise.all([
        supabase.from("usuarios").select("*, perfis(nome), unidades(nome)").order("created_at", { ascending: false }),
        supabase.from("perfis").select("*").order("nivel", { ascending: false }),
        supabase.from("unidades").select("*").eq("ativo", true).order("nome"),
      ]);

      if (usuariosRes.data) {
        setUsuarios(
          (usuariosRes.data as Record<string, unknown>[]).map((u: Record<string, unknown>) => ({
            ...u,
            perfil_nome: (u.perfis as Record<string, unknown> | undefined)?.nome as string || "Sem perfil",
            unidade_nome: (u.unidades as Record<string, unknown> | undefined)?.nome as string || "Não definida",
          }))
        );
      }
      if (perfisRes.data) setPerfis(perfisRes.data);
      if (unidadesRes.data) setUnidades(unidadesRes.data);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { let c = false; queueMicrotask(() => { if (!c) fetchData(); }); return () => { c = true; }; }, [fetchData]);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ nome: "", email: "", cpf: "", telefone: "", perfil_id: "", unidade_id: "" });
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (user: Usuario) => {
    setEditingUser(user);
    setFormData({
      nome: user.nome,
      email: user.email,
      cpf: user.cpf || "",
      telefone: user.telefone || "",
      perfil_id: user.perfil_id,
      unidade_id: user.unidade_id || "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSave = async () => {
    setFormError("");

    if (!formData.nome.trim() || !formData.email.trim() || !formData.perfil_id) {
      setFormError("Preencha todos os campos obrigatórios.");
      return;
    }

    setSaving(true);
    try {
      if (editingUser) {
        // Update existing user
        const { error } = await supabase
          .from("usuarios")
          .update({
            nome: formData.nome,
            cpf: formData.cpf || null,
            telefone: formData.telefone || null,
            perfil_id: formData.perfil_id,
            unidade_id: formData.unidade_id || null,
          })
          .eq("id", editingUser.id);

        if (error) {
          setFormError(error.message);
          return;
        }
      } else {
        // Create new user via signUp (works with anon key)
        const tempPassword = crypto.randomUUID().slice(0, 12) + "Aa1!";
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: tempPassword,
          options: {
            data: { nome: formData.nome },
          },
        });

        if (authError) {
          setFormError(authError.message);
          return;
        }

        if (authData.user) {
          // Create profile - the trigger or RLS will handle auth_user_id sync
          const { error: profileError } = await supabase.from("usuarios").insert({
            auth_user_id: authData.user.id,
            nome: formData.nome,
            email: formData.email,
            cpf: formData.cpf || null,
            telefone: formData.telefone || null,
            perfil_id: formData.perfil_id,
            unidade_id: formData.unidade_id || null,
          });

          if (profileError) {
            setFormError("Erro ao criar perfil: " + profileError.message);
            return;
          }
        }
      }

      setModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Erro ao salvar usuário");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (user: Usuario) => {
    const { error } = await supabase
      .from("usuarios")
      .update({ ativo: !user.ativo })
      .eq("id", user.id);

    if (!error) {
      setUsuarios((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, ativo: !u.ativo } : u))
      );
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("usuarios").delete().eq("id", id);
    if (!error) {
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
      setDeleteConfirm(null);
    }
  };

  // Filter and sort
  const filtered = usuarios
    .filter(
      (u) =>
        u.nome.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortField] || "";
      const bVal = b[sortField] || "";
      const cmp = typeof aVal === "string" ? aVal.localeCompare(bVal as string) : String(aVal).localeCompare(String(bVal));
      return sortAsc ? cmp : -cmp;
    });

  const perfilOptions = perfis.map((p) => ({ value: p.id, label: p.nome }));
  const unidadeOptions = unidades.map((u) => ({ value: u.id, label: `${u.nome} (${u.sigla})` }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="rounded-xl p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h2 className="page-title">Usuários do Sistema</h2>
            <p className="page-subtitle mt-1">
              Gerencie todos os usuários, perfis de acesso e unidades
            </p>
          </div>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon-sm" onClick={() => fetchData()} title="Recarregar">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {filtered.length} usuário{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm font-medium text-foreground">
                {search ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {search ? "Tente alterar os termos da busca" : "Clique em \"Novo Usuário\" para adicionar"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <button
                        onClick={() => { setSortField("nome"); setSortAsc(!sortAsc); }}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        Usuário
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">
                      Contato
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">
                      <button
                        onClick={() => { setSortField("ultimo_acesso"); setSortAsc(!sortAsc); }}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        Último Acesso
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">
                      Perfil
                    </th>
                    <th className="text-center px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-20">
                      Status
                    </th>
                    <th className="text-right px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-20">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={cn(
                        "group transition-colors hover:bg-accent/30",
                        !user.ativo && "opacity-60"
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-[9px] bg-idep-700 text-white">
                              {getInitials(user.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {user.nome}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {user.unidade_nome}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          </div>
                          {user.telefone && (
                            <span className="text-[10px] text-muted-foreground/60">{user.telefone}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {user.ultimo_acesso ? formatFullDate(user.ultimo_acesso) : "Nunca acessou"}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Badge variant="secondary" className="text-[10px] gap-1">
                          <Shield className="h-2.5 w-2.5" />
                          {user.perfil_nome}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={user.ativo ? "success" : "destructive"}
                          className="text-[10px]"
                        >
                          {user.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(user)}
                            className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                            title="Editar"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(user)}
                            className={cn(
                              "rounded p-1.5 transition-colors",
                              user.ativo
                                ? "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                : "text-muted-foreground hover:text-success hover:bg-success/10"
                            )}
                            title={user.ativo ? "Desativar" : "Ativar"}
                          >
                            {user.ativo ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(user.id)}
                            className="rounded p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? "Editar Usuário" : "Novo Usuário"}
        description={editingUser ? `Editando: ${editingUser.nome}` : "Preencha os dados para criar um novo usuário"}
        size="lg"
      >
        <div className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nome completo *"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Nome do usuário"
              disabled={saving}
            />
            <Input
              label="E-mail *"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
              disabled={saving || !!editingUser}
              helperText={editingUser ? "E-mail não pode ser alterado" : undefined}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="CPF"
              value={formData.cpf}
              onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
              placeholder="000.000.000-00"
              disabled={saving}
            />
            <Input
              label="Telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              placeholder="(69) 99999-9999"
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Perfil de acesso *"
              options={perfilOptions}
              placeholder="Selecione um perfil"
              value={formData.perfil_id}
              onChange={(e) => setFormData({ ...formData, perfil_id: e.target.value })}
              disabled={saving}
            />
            <Select
              label="Unidade"
              options={unidadeOptions}
              placeholder="Selecione uma unidade"
              value={formData.unidade_id}
              onChange={(e) => setFormData({ ...formData, unidade_id: e.target.value })}
              disabled={saving}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingUser ? "Salvar alterações" : "Criar usuário"}
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirmar exclusão"
        description="Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita."
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
