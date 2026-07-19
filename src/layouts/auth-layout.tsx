import { Outlet } from "react-router-dom";
import { useTheme } from "@/contexts/theme-context";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssistantBot } from "@/components/assistant/assistant-bot";

export function AuthLayout() {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <AssistantBot />
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-idep-50 via-white to-rondonia-50 dark:from-idep-950 dark:via-card dark:to-rondonia-950 p-4">
      {/* Theme toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        title={theme === "light" ? "Modo escuro" : "Modo claro"}
      >
        {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </Button>

      {/* Brand */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2.5 mb-2">
          <img
            src="/IDEP_2019-VERTICAL%20(1).png"
            alt="IDEP Logo"
            className="h-10 w-auto object-contain"
          />
          <div className="flex flex-col text-left">
            <span className="text-lg font-bold text-foreground leading-tight">
              IDEP-Gestor
            </span>
            <span className="text-xs text-muted-foreground leading-tight">
              Enterprise · Sistema de Gestão Institucional
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full max-w-md">
        <Outlet />
      </div>

      {/* Footer */}
      <p className="absolute bottom-4 text-[11px] text-muted-foreground">
        IDEP-Gestor © {new Date().getFullYear()} · Desenvolvido por Cristian Marques
      </p>
    </div>
    </>
  );
}
