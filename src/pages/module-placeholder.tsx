import { useParams, useNavigate } from "react-router-dom";
import { Construction, ArrowLeft, CheckCircle2, Clock, ListTodo } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getModuleInfo } from "@/constants/modules";
import { motion } from "framer-motion";

const statusConfig = {
  "em-breve": {
    label: "Em breve",
    variant: "warning" as const,
    icon: Clock,
  },
  desenvolvimento: {
    label: "Em desenvolvimento",
    variant: "success" as const,
    icon: ListTodo,
  },
  planejado: {
    label: "Planejado",
    variant: "secondary" as const,
    icon: Clock,
  },
};

export function ModulePlaceholder() {
  const { module: moduleSlug } = useParams<{ module: string }>();
  const navigate = useNavigate();

  // Get module info from the slug param (React Router's :module/* captures only the first segment)
  const moduleInfo = getModuleInfo(moduleSlug || "");

  // If no module info found, show generic message
  if (!moduleInfo) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-muted p-4">
                <Construction className="h-12 w-12 text-muted-foreground" />
              </div>
            </div>
            <h2 className="text-xl font-semibold">Módulo não encontrado</h2>
            <p className="text-sm text-muted-foreground">
              O módulo que você está procurando não existe ou ainda não foi registrado.
            </p>
            <Button onClick={() => navigate("/dashboard")} variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const Icon = moduleInfo.icon;
  const status = statusConfig[moduleInfo.status];
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className={`rounded-xl p-3 ${moduleInfo.color}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="page-title">{moduleInfo.name}</h2>
              <Badge variant={status.variant} className="gap-1.5">
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </Badge>
            </div>
            <p className="page-subtitle mt-1 max-w-2xl">
              {moduleInfo.description}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Features / What's planned */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-muted-foreground" />
              Funcionalidades Planejadas
            </CardTitle>
            <CardDescription>
              Este módulo está em desenvolvimento e em breve contará com as seguintes funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {moduleInfo.features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-2.5"
                >
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-foreground">{feature}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Status do Módulo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4 text-center space-y-2">
              <Construction className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium text-foreground">
                Módulo em {moduleInfo.status === "em-breve" ? "breve" : moduleInfo.status === "planejado" ? "planejamento" : "desenvolvimento"}
              </p>
              <p className="text-xs text-muted-foreground">
                Este módulo será disponibilizado em uma próxima atualização do sistema.
              </p>
            </div>

            {/* Sub-pages navigation */}
            {moduleInfo.subPages.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Páginas previstas
                </p>
                <div className="space-y-1">
                  {moduleInfo.subPages.map((page, index) => (
                    <button
                      key={index}
                      onClick={() => navigate(page.href)}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150"
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                      {page.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
