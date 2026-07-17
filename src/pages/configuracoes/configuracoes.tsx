import { useState } from "react";
import {
  Settings,
  Save,
  Loader2,
  Building2,
  Bell,
  Shield,
  Globe,
  Database,
  Moon,
  Sun,
  Mail,
  Monitor,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export function ConfiguracoesPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [theme, setTheme] = useState("system");

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="rounded-xl p-3 bg-neutral-50 dark:bg-neutral-950/50 text-neutral-600">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h2 className="page-title">Configurações</h2>
            <p className="page-subtitle mt-1">Configure as preferências e parametrizações do sistema</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Salvando..." : saved ? "Salvo ✓" : "Salvar configurações"}
        </Button>
      </div>

      {/* Instituição */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">Instituição</CardTitle>
          </div>
          <CardDescription>Dados principais da instituição de ensino</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Nome da Instituição" defaultValue="IDEP - Instituto de Desenvolvimento" placeholder="Nome completo" />
            <Input label="Sigla" defaultValue="IDEP" placeholder="Sigla" />
            <Input label="CNPJ" defaultValue="00.000.000/0001-00" placeholder="CNPJ" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Cidade" defaultValue="São Paulo" placeholder="Cidade" />
            <Select label="Estado" value="SP" options={[{ value: "SP", label: "São Paulo" }, { value: "RJ", label: "Rio de Janeiro" }, { value: "MG", label: "Minas Gerais" }]} onChange={() => {}} />
            <Input label="Site institucional" defaultValue="https://idep.edu.br" placeholder="URL do site" />
          </div>
        </CardContent>
      </Card>

      {/* Aparência */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            {theme === "dark" ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-muted-foreground" />}
            <CardTitle className="text-sm font-semibold">Aparência</CardTitle>
          </div>
          <CardDescription>Personalize a aparência do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {[
              { value: "light", label: "Claro", icon: Sun },
              { value: "dark", label: "Escuro", icon: Moon },
              { value: "system", label: "Sistema", icon: Monitor },
            ].map((opt) => (
              <button key={opt.value} onClick={() => setTheme(opt.value)}
                className={`flex-1 rounded-lg border p-4 text-center transition-all ${
                  theme === opt.value
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-muted-foreground/30"
                }`}>
                <opt.icon className="h-5 w-5 mx-auto mb-2" />
                <span className="text-xs font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">Notificações</CardTitle>
          </div>
          <CardDescription>Configure as notificações do sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Notificações por email", desc: "Receber alertas e avisos por email", enabled: true },
            { label: "Notificações push", desc: "Receber notificações no navegador", enabled: true },
            { label: "Resumo semanal", desc: "Receber um resumo semanal das atividades", enabled: false },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div>
                <p className="text-xs font-medium text-foreground">{item.label}</p>
                <p className="text-[10px] text-muted-foreground">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked={item.enabled} className="sr-only peer" />
                <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
              </label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Segurança */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">Segurança</CardTitle>
          </div>
          <CardDescription>Configurações de segurança e acesso</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Tempo de sessão (minutos)" type="number" defaultValue="120" disabled />
            <Select label="Política de senha" value="forte"
              options={[{ value: "basica", label: "Básica" }, { value: "media", label: "Média" }, { value: "forte", label: "Forte" }]}
              onChange={() => {}} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div><p className="text-xs font-medium text-foreground">Autenticação em dois fatores</p><p className="text-[10px] text-muted-foreground">Adiciona uma camada extra de segurança</p></div>
              <Badge variant="secondary" className="text-[9px]">Em breve</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div><p className="text-xs font-medium text-foreground">Logs de acesso</p><p className="text-[10px] text-muted-foreground">Registrar todas as tentativas de login</p></div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integrações */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">Integrações</CardTitle>
          </div>
          <CardDescription>Serviços integrados ao sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { name: "Supabase", status: "conectado", icon: Database, desc: "Banco de dados e autenticação" },
            { name: "SMTP", status: "configurado", icon: Mail, desc: "Envio de emails transacionais" },
            { name: "Recharts", status: "ativo", icon: Database, desc: "Biblioteca de gráficos" },
          ].map((integ, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg p-1.5 bg-muted"><integ.icon className="h-4 w-4 text-muted-foreground" /></div>
                <div>
                  <p className="text-xs font-medium text-foreground">{integ.name}</p>
                  <p className="text-[10px] text-muted-foreground">{integ.desc}</p>
                </div>
              </div>
              <Badge variant={integ.status === "conectado" ? "success" : "secondary"} className="text-[9px]">{integ.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}