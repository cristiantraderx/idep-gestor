import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  Save,
  Search,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { Perfil, Permissao } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const MODULOS = [
  "dashboard", "alunos", "cursos", "turmas", "secretaria",
  "rh", "financeiro", "compras", "almoxarifado", "patrimonio",
  "biblioteca", "agenda", "ti", "ouvidoria", "relatorios",
  "bi", "projetos", "auditoria", "configuracoes", "notificacoes",
];

const MODULO_LABELS: Record<string, string> = {
  dashboard: "Dashboard", alunos: "Alunos", cursos: "Cursos",
  turmas: "Turmas", secretaria: "Secretaria", rh: "Recursos Humanos",
  financeiro: "Financeiro", compras: "Compras", almoxarifado: "Almoxarifado",
  patrimonio: "Patrimônio", biblioteca: "Biblioteca", agenda: "Agenda",
  ti: "T.I.", ouvidoria: "Ouvidoria", relatorios: "Relatórios",
  bi: "B.I.", projetos: "Projetos", auditoria: "Auditoria",
  configuracoes: "Configurações", notificacoes: "Notificações",
};

const ACOES = ["listar", "criar", "editar", "excluir"] as const;
const ACAO_LABELS: Record<string, string> = {
  listar: "Listar", criar: "Criar", editar: "Editar", excluir: "Excluir",
};

export function AdminPermissoesPage() {
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPerfilId, setSelectedPerfilId] = useState("");
  const [searchModule, setSearchModule] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [localPerms, setLocalPerms] = useState<Record<string, { ativo: boolean; escopo: string }>>({});
  const [changed, setChanged] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: perfisData } = await supabase
        .from("perfis")
        .select("*")
        .order("nivel", { ascending: false });

      if (perfisData) {
        setPerfis(perfisData);
        if (!selectedPerfilId && perfisData.length > 0) {
          setSelectedPerfilId(perfisData[0].id);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar perfis:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedPerfilId]);

  const fetchPermissoes = useCallback(async (perfilId: string) => {
    if (!perfilId) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from("permissoes")
        .select("*")
        .eq("perfil_id", perfilId);

      const permsMap: Record<string, { ativo: boolean; escopo: string }> = {};
      if (data) {
        data.forEach((p: Permissao) => {
          permsMap[`${p.modulo}_${p.acao}`] = { ativo: true, escopo: p.escopo };
        });
      }
      setLocalPerms(permsMap);
      setChanged(false);
    } catch (err) {
      console.error("Erro ao carregar permissões:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedPerfilId) {
      fetchPermissoes(selectedPerfilId);
    }
  }, [selectedPerfilId, fetchPermissoes]);

  const togglePerm = (modulo: string, acao: string) => {
    const key = `${modulo}_${acao}`;
    setLocalPerms((prev) => ({
      ...prev,
      [key]: prev[key]
        ? { ...prev[key], ativo: !prev[key].ativo }
        : { ativo: true, escopo: "unidade" },
    }));
    setChanged(true);
    setSuccessMessage("");
  };

  const handleSave = async () => {
    if (!selectedPerfilId) return;
    setSaving(true);
    setSuccessMessage("");

    try {
      await supabase.from("permissoes").delete().eq("perfil_id", selectedPerfilId);

      const newPerms = Object.entries(localPerms)
        .filter(([, v]) => v.ativo)
        .map(([key, v]) => {
          const [modulo, acao] = key.split("_");
          return { perfil_id: selectedPerfilId, modulo, acao, escopo: v.escopo || "unidade" };
        });

      if (newPerms.length > 0) {
        const { error } = await supabase.from("permissoes").insert(newPerms);
        if (error) {
          setSuccessMessage("Erro ao salvar: " + error.message);
          return;
        }
      }

      setSuccessMessage("Permissões salvas com sucesso!");
      setChanged(false);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      setSuccessMessage("Erro ao salvar permissões");
    } finally {
      setSaving(false);
    }
  };

  const filteredModulos = MODULOS.filter((m) =>
    MODULO_LABELS[m].toLowerCase().includes(searchModule.toLowerCase())
  );

  const selectedPerfil = perfis.find((p) => p.id === selectedPerfilId);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="rounded-xl p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-600">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h2 className="page-title">Permissões</h2>
            <p className="page-subtitle mt-1">Gerencie as permissões de cada perfil de acesso por módulo</p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="w-full sm:w-64">
              <Select
                options={perfis.map((p) => ({ value: p.id, label: `${p.nome} (Nível ${p.nivel})` }))}
                placeholder="Selecione um perfil..."
                value={selectedPerfilId}
                onChange={(e) => setSelectedPerfilId(e.target.value)}
              />
            </div>
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="Buscar módulo..." value={searchModule}
                onChange={(e) => setSearchModule(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => selectedPerfilId && fetchPermissoes(selectedPerfilId)} title="Recarregar">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button onClick={handleSave} disabled={!changed || saving || !selectedPerfilId} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar Permissões
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {successMessage && (
        <div className={cn("rounded-lg border px-4 py-3 text-sm flex items-center gap-2",
          successMessage.includes("sucesso")
            ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300"
            : "bg-destructive/10 border-destructive/20 text-destructive"
        )}>
          {successMessage.includes("sucesso") ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {successMessage}
        </div>
      )}

      {selectedPerfil ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                Matriz de Permissões — {selectedPerfil.nome}
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">Nível {selectedPerfil.nivel}</Badge>
            </div>
            <CardDescription>Marque as ações permitidas para cada módulo do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-1/3">Módulo</th>
                      {ACOES.map((acao) => (
                        <th key={acao} className="text-center px-2 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {ACAO_LABELS[acao]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredModulos.map((modulo) => {
                      const someActive = ACOES.some((a) => localPerms[`${modulo}_${a}`]?.ativo);
                      return (
                        <tr key={modulo} className={cn("transition-colors hover:bg-accent/30", !someActive && "opacity-50")}>
                          <td className="px-3 py-2.5">
                            <span className="text-sm font-medium text-foreground">{MODULO_LABELS[modulo] || modulo}</span>
                          </td>
                          {ACOES.map((acao) => {
                            const key = `${modulo}_${acao}`;
                            const isActive = localPerms[key]?.ativo ?? false;
                            return (
                              <td key={acao} className="px-2 py-2.5 text-center">
                                <button onClick={() => togglePerm(modulo, acao)}
                                  className={cn("inline-flex items-center justify-center rounded-lg p-2 transition-all duration-150",
                                    isActive
                                      ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400"
                                      : "bg-muted text-muted-foreground/40 hover:text-muted-foreground hover:bg-accent"
                                  )}
                                  title={`${isActive ? "Remover" : "Adicionar"} permissão de ${ACAO_LABELS[acao]} em ${MODULO_LABELS[modulo]}`}>
                                  {isActive ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Shield className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-foreground">Selecione um perfil</p>
            <p className="text-xs text-muted-foreground mt-1">Escolha um perfil de acesso acima para gerenciar suas permissões</p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
