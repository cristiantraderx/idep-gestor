import { useState, useEffect, useCallback, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  KeyRound,
  Camera,
  Shield,
  CalendarDays,
  LogOut,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Check,
  Smartphone,
  Globe,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import type { Usuario } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatFullDate } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface UserFullProfile extends Usuario {
  perfil_nome?: string;
  perfil_codigo?: string;
  unidade_nome?: string;
  unidade_sigla?: string;
}

export function PerfilPage() {
  const navigate = useNavigate();
  const { user, profile, logout, updatePassword } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile data
  const [fullProfile, setFullProfile] = useState<UserFullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Edit mode state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({
    nome: "",
    cpf: "",
    telefone: "",
  });
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState(false);

  // Password state
  const [passwordSection, setPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Session info
  const [lastSignIn, setLastSignIn] = useState<string>("");
  const [copiedEmail, setCopiedEmail] = useState(false);

  const fetchFullProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("usuarios")
        .select("*, perfis(nome, codigo), unidades(nome, sigla)")
        .eq("auth_user_id", user.id)
        .single();

      if (error) {
        console.error("Erro ao buscar perfil completo:", error);
        return;
      }

      if (data) {
        const profileData = data as any;
        setFullProfile({
          ...profileData,
          perfil_nome: profileData.perfis?.nome,
          perfil_codigo: profileData.perfis?.codigo,
          unidade_nome: profileData.unidades?.nome,
          unidade_sigla: profileData.unidades?.sigla,
        });
        setAvatarUrl(profileData.avatar_url);
        setEditData({
          nome: profileData.nome || "",
          cpf: profileData.cpf || "",
          telefone: profileData.telefone || "",
        });
      }

      // Get last sign in from auth metadata
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user?.last_sign_in_at) {
        setLastSignIn(sessionData.session.user.last_sign_in_at);
      } else if (user?.last_sign_in_at) {
        setLastSignIn(user.last_sign_in_at);
      }
    } catch (err) {
      console.error("Erro ao carregar perfil:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFullProfile();
  }, [fetchFullProfile]);

  // Handle avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fullProfile) return;

    if (file.size > 2 * 1024 * 1024) {
      setEditError("A imagem deve ter no máximo 2MB");
      return;
    }

    setAvatarUploading(true);
    setEditError("");

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const filePath = `avatars/${user?.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) {
        // If bucket doesn't exist, just update the profile without storage
        console.warn("Storage upload failed, updating profile without avatar:", uploadError.message);
        // Still try to update the profile
        const { error: updateError } = await supabase
          .from("usuarios")
          .update({ avatar_url: null })
          .eq("id", fullProfile.id);

        if (updateError) {
          setEditError("Erro ao atualizar avatar: " + updateError.message);
        }
        setAvatarUploading(false);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const publicUrl = urlData?.publicUrl || null;

      if (publicUrl) {
        // Update user profile with avatar URL
        const { error: updateError } = await supabase
          .from("usuarios")
          .update({ avatar_url: publicUrl })
          .eq("id", fullProfile.id);

        if (updateError) {
          setEditError("Erro ao salvar avatar: " + updateError.message);
        } else {
          setAvatarUrl(publicUrl);
        }
      }
    } catch (err: any) {
      setEditError("Erro ao fazer upload: " + (err.message || "Erro desconhecido"));
    } finally {
      setAvatarUploading(false);
    }
  };

  // Save personal data
  const handleSaveProfile = async () => {
    if (!fullProfile) return;
    if (!editData.nome.trim()) {
      setEditError("O nome é obrigatório.");
      return;
    }

    setSaving(true);
    setEditError("");
    setEditSuccess(false);

    try {
      const { error } = await supabase
        .from("usuarios")
        .update({
          nome: editData.nome,
          cpf: editData.cpf || null,
          telefone: editData.telefone || null,
        })
        .eq("id", fullProfile.id);

      if (error) {
        setEditError(error.message);
        return;
      }

      setEditSuccess(true);
      setEditing(false);
      // Refresh data
      fetchFullProfile();

      setTimeout(() => setEditSuccess(false), 3000);
    } catch (err: any) {
      setEditError(err.message || "Erro ao salvar dados");
    } finally {
      setSaving(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      setPasswordError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("As senhas não conferem.");
      return;
    }

    setPasswordSaving(true);
    setPasswordError("");
    setPasswordSuccess(false);

    try {
      const error = await updatePassword(newPassword);
      if (error) {
        setPasswordError(error.message);
        return;
      }

      setPasswordSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSection(false);

      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      setPasswordError(err.message || "Erro ao alterar senha");
    } finally {
      setPasswordSaving(false);
    }
  };

  const copyEmail = () => {
    if (fullProfile?.email) {
      navigator.clipboard.writeText(fullProfile.email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/auth/login", { replace: true });
  };

  const userName = fullProfile?.nome || profile?.nome || user?.email?.split("@")[0] || "Usuário";
  const userEmail = fullProfile?.email || user?.email || "";
  const userRole = fullProfile?.perfil_nome || profile?.perfil || "Usuário";
  const userInitials = getInitials(userName);
  const createdDate = fullProfile?.created_at
    ? formatFullDate(fullProfile.created_at)
    : "—";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="space-y-4 w-full max-w-md">
          <div className="skeleton h-12 w-48" />
          <div className="skeleton h-48 w-full" />
          <div className="skeleton h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Page header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="rounded-xl p-3 bg-idep-700/10 text-idep-700 dark:text-idep-300">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h2 className="page-title">Meu Perfil</h2>
            <p className="page-subtitle mt-1">
              Gerencie suas informações pessoais e preferências da conta
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - Avatar & Overview */}
        <div className="space-y-6">
          {/* Avatar card */}
          <Card>
            <CardContent className="flex flex-col items-center p-6">
              <div className="relative mb-4 group">
                <Avatar className="h-24 w-24 ring-4 ring-background shadow-xl">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={userName}
                      className="h-full w-full object-cover rounded-full"
                    />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-idep-700 to-idep-500 text-white text-2xl font-bold">
                      {userInitials}
                    </AvatarFallback>
                  )}
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute bottom-0 right-0 rounded-full bg-idep-700 text-white p-2 shadow-lg hover:bg-idep-600 transition-colors disabled:opacity-50"
                  title="Alterar foto"
                >
                  {avatarUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <h3 className="text-lg font-bold text-foreground text-center">
                {userName}
              </h3>
              <Badge variant="outline" className="mt-1 gap-1 text-xs font-medium">
                <Shield className="h-3 w-3" />
                {userRole}
              </Badge>
              <div className="flex items-center gap-1 mt-3 text-[11px] text-muted-foreground">
                <CalendarDays className="h-3 w-3" />
                Membro desde {createdDate}
              </div>
              <div className="w-full mt-4 pt-4 border-t border-border space-y-2">
                <Button
                  variant={editing ? "default" : "outline"}
                  size="sm"
                  className="w-full gap-2 text-xs"
                  onClick={() => {
                    setEditing(!editing);
                    setEditError("");
                    setEditSuccess(false);
                  }}
                >
                  <User className="h-3.5 w-3.5" />
                  {editing ? "Cancelar edição" : "Editar dados"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 text-xs"
                  onClick={() => setPasswordSection(!passwordSection)}
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  Alterar senha
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full gap-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleLogout}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sair do sistema
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account info card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold">Informações da Conta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Email</span>
                <div className="flex items-center gap-1">
                  <span className="text-foreground font-medium truncate max-w-[140px]">
                    {userEmail}
                  </span>
                  <button
                    onClick={copyEmail}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Copiar email"
                  >
                    {copiedEmail ? (
                      <Check className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>
              {fullProfile?.unidade_nome && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Unidade</span>
                  <span className="text-foreground font-medium">
                    {fullProfile.unidade_nome}
                    {fullProfile.unidade_sigla && ` (${fullProfile.unidade_sigla})`}
                  </span>
                </div>
              )}
              {fullProfile?.perfil_codigo && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Código</span>
                  <span className="text-foreground font-medium font-mono text-[10px]">
                    {fullProfile.perfil_codigo}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Cadastro</span>
                <span className="text-foreground font-medium">
                  {createdDate}
                </span>
              </div>
              {lastSignIn && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Último acesso</span>
                  <span className="text-foreground font-medium">
                    {formatFullDate(lastSignIn)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column - Personal Data & Password */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Data Card */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">Dados Pessoais</CardTitle>
                  <CardDescription>
                    {editing
                      ? "Edite suas informações abaixo"
                      : "Visualize os dados cadastrados da sua conta"}
                  </CardDescription>
                </div>
                {!editing && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-xs"
                    onClick={() => setEditing(true)}
                  >
                    <User className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Success/Error messages */}
              {editSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Dados atualizados com sucesso!
                </motion.div>
              )}
              {editError && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {editError}
                </div>
              )}

              {editing ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Nome completo *"
                      value={editData.nome}
                      onChange={(e) => setEditData({ ...editData, nome: e.target.value })}
                      placeholder="Seu nome completo"
                      disabled={saving}
                    />
                    <Input
                      label="CPF"
                      value={editData.cpf}
                      onChange={(e) => setEditData({ ...editData, cpf: e.target.value })}
                      placeholder="000.000.000-00"
                      disabled={saving}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Telefone"
                      value={editData.telefone}
                      onChange={(e) => setEditData({ ...editData, telefone: e.target.value })}
                      placeholder="(69) 99999-9999"
                      disabled={saving}
                    />
                    <Input
                      label="Email"
                      value={userEmail}
                      disabled
                      helperText="O email não pode ser alterado. Entre em contato com o suporte se precisar trocá-lo."
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="gap-2"
                    >
                      {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                      <Save className="h-4 w-4" />
                      Salvar alterações
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditing(false);
                        setEditError("");
                        setEditData({
                          nome: fullProfile?.nome || "",
                          cpf: fullProfile?.cpf || "",
                          telefone: fullProfile?.telefone || "",
                        });
                      }}
                      disabled={saving}
                    >
                      Cancelar
                    </Button>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  {[
                    { label: "Nome", value: fullProfile?.nome || userName, icon: User },
                    { label: "Email", value: userEmail, icon: Mail },
                    { label: "CPF", value: fullProfile?.cpf || "Não informado", icon: Globe },
                    { label: "Telefone", value: fullProfile?.telefone || "Não informado", icon: Phone },
                  ].map((field, i) => (
                    <div key={i} className="space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <field.icon className="h-3 w-3" />
                        {field.label}
                      </span>
                      <span className="text-sm font-medium text-foreground block">
                        {field.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Password Card */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">Segurança</CardTitle>
                  <CardDescription>
                    Gerencie a senha da sua conta
                  </CardDescription>
                </div>
                {!passwordSection && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-xs"
                    onClick={() => setPasswordSection(true)}
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    Alterar senha
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {passwordSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300 mb-4"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Senha alterada com sucesso!
                </motion.div>
              )}
              {passwordError && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive mb-4">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {passwordError}
                </div>
              )}

              {passwordSection ? (
                <div className="space-y-4 max-w-md">
                  <div className="relative">
                    <Input
                      label="Nova senha"
                      type={showPasswords ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo de 6 caracteres"
                      disabled={passwordSaving}
                    />
                  </div>
                  <div className="relative">
                    <Input
                      label="Confirmar nova senha"
                      type={showPasswords ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                      disabled={passwordSaving}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPasswords ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5" />
                          Ocultar senhas
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5" />
                          Mostrar senhas
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleChangePassword}
                      disabled={passwordSaving || !newPassword || !confirmPassword}
                      className="gap-2"
                    >
                      {passwordSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                      <KeyRound className="h-4 w-4" />
                      Alterar senha
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPasswordSection(false);
                        setPasswordError("");
                        setNewPassword("");
                        setConfirmPassword("");
                      }}
                      disabled={passwordSaving}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
                  <div className="rounded-full bg-idep-700/10 p-2 text-idep-700 dark:text-idep-300">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">Senha protegida</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Sua senha é armazenada de forma segura com criptografia. Recomendamos alterá-la periodicamente.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Dispositivos e Sessões
              </CardTitle>
              <CardDescription>
                Informações sobre seu acesso atual
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/50 p-2 text-emerald-600">
                  <Smartphone className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-foreground">
                    Sessão atual
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {lastSignIn
                      ? `Iniciada em ${formatFullDate(lastSignIn)}`
                      : "Sessão ativa"}
                  </p>
                </div>
                <Badge variant="success" className="text-[9px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse mr-1" />
                  Online
                </Badge>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                  <Globe className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-foreground">
                    Navegador
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {navigator.userAgent.includes("Chrome") ? "Google Chrome" :
                     navigator.userAgent.includes("Firefox") ? "Mozilla Firefox" :
                     navigator.userAgent.includes("Safari") ? "Safari" :
                     "Navegador moderno"}
                    {navigator.userAgent.includes("Windows") ? " · Windows" :
                     navigator.userAgent.includes("Mac") ? " · macOS" :
                     navigator.userAgent.includes("Linux") ? " · Linux" : ""}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
