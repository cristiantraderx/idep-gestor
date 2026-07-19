import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { AssistantBot } from "@/components/assistant/assistant-bot";
import { useSidebar } from "@/hooks/use-sidebar";
import { useNavigationTracker } from "@/hooks/use-navigation-tracker";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

export function SidebarLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);

  // Rastreia visitas para o painel de módulos mais visitados
  useNavigationTracker();

  const {
    isCollapsed,
    mobileOpen,
    activeSection,
    openSubMenus,
    toggleSidebar,
    toggleMobileSidebar,
    closeMobileSidebar,
    setActiveSection,
    toggleSubMenu,
  } = useSidebar();

  // Extract active section from URL
  useEffect(() => {
    const parts = location.pathname.split("/").filter(Boolean);
    // For admin routes, track the full admin/XXXX path
    // For regular routes, track just the first segment
    if (parts[0] === "admin" && parts[1]) {
      setActiveSection(`admin/${parts[1]}`);
    } else {
      setActiveSection(parts[0] || "dashboard");
    }
  }, [location.pathname, setActiveSection]);

  // Close mobile sidebar only on actual route changes (not on mount)
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      closeMobileSidebar();
      prevPathRef.current = location.pathname;
    }
  }, [location.pathname, closeMobileSidebar]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [mobileOpen]);

  const handleNavigate = (href: string) => {
    const parts = href.split("/").filter(Boolean);
    // For admin routes, track admin/XXXXX
    if (parts[0] === "admin" && parts[1]) {
      setActiveSection(`admin/${parts[1]}`);
    } else {
      setActiveSection(parts[0] || "dashboard");
    }
    navigate(href);
  };

  // Determine title/subtitle from path
  const getTitleFromPath = () => {
    const path = location.pathname;
    const parts = path.split("/").filter(Boolean);

    const titles: Record<string, string> = {
      dashboard: "Dashboard",
      notificacoes: "Central de Notificações",
      alunos: "Alunos",
      cursos: "Cursos",
      turmas: "Turmas",
      secretaria: "Secretaria",
      rh: "Recursos Humanos",
      financeiro: "Financeiro",
      compras: "Compras",
      almoxarifado: "Almoxarifado",
      patrimonio: "Patrimônio",
      biblioteca: "Biblioteca",
      agenda: "Agenda",
      ti: "Tecnologia da Informação",
      ouvidoria: "Ouvidoria",
      relatorios: "Relatórios",
      bi: "Business Intelligence",
      projetos: "Projetos",
      auditoria: "Auditoria",
      configuracoes: "Configurações",
      perfil: "Meu Perfil",
      admin: "Administração",
    };

    const subtitles: Record<string, string> = {
      novo: "Novo registro",
      lista: "Listagem",
      calendario: "Calendário",
      matriculas: "Matrículas",
      historico: "Histórico",
      servidores: "Servidores",
      professores: "Professores",
      contratos: "Contratos",
      ferias: "Férias",
      receitas: "Receitas",
      despesas: "Despesas",
      fluxo: "Fluxo de Caixa",
      protocolos: "Protocolos",
      declaracoes: "Declarações",
      certidoes: "Certidões",
      solicitacoes: "Solicitações",
      cotacoes: "Cotações",
      licitacoes: "Licitações",
      entradas: "Entradas",
      saidas: "Saídas",
      inventario: "Inventário",
      bens: "Bens Tombados",
      movimentacoes: "Movimentações",
      manutencao: "Manutenção",
      acervo: "Acervo",
      emprestimos: "Empréstimos",
      reservas: "Reservas",
      eventos: "Eventos",
      salas: "Salas",
      laboratorios: "Laboratórios",
      chamados: "Chamados",
      equipamentos: "Equipamentos",
      licencas: "Licenças",
      reclamacoes: "Reclamações",
      sugestoes: "Sugestões",
      usuarios: "Usuários",
      perfis: "Perfis de Acesso",
      permissoes: "Permissões",
    };

    // For admin sub-pages like /admin/usuarios, show appropriate subtitle
    if (parts[0] === "admin" && parts[1]) {
      return {
        title: "Administração",
        subtitle: subtitles[parts[1]] || parts[1],
      };
    }

    const mainSection = parts[0] || "dashboard";
    const subSection = parts[1];

    return {
      title: titles[mainSection] || "Dashboard",
      subtitle: subSection ? subtitles[subSection] : undefined,
    };
  };

  const { title, subtitle } = getTitleFromPath();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        mobileOpen={mobileOpen}
        activeSection={activeSection}
        openSubMenus={openSubMenus}
        onToggleCollapse={toggleSidebar}
        onCloseMobile={closeMobileSidebar}
        onNavigate={handleNavigate}
        onToggleSubMenu={toggleSubMenu}
      />

      {/* Main content area */}
      <div
        className={cn(
          "flex flex-1 flex-col overflow-hidden transition-all duration-300",
          isCollapsed ? "lg:ml-[60px]" : "lg:ml-[260px]"
        )}
      >
        <Header
          title={title}
          subtitle={subtitle}
          onToggleMobile={toggleMobileSidebar}
        />

        <main className="flex-1 overflow-y-auto bg-muted/30">
          <div className="page-container">
            <Outlet />
          </div>
        </main>

        {/* AI Assistant */}
        <AssistantBot />

        {/* Footer */}
        <footer className="flex flex-col xs:flex-row items-center justify-between gap-1 border-t border-border bg-background px-4 sm:px-6 py-2 text-[10px] sm:text-[11px] text-muted-foreground">
          <span>IDEP-Gestor · Desenvolvido por Cristian Marques</span>
          <span>Enterprise v1.0</span>
        </footer>
      </div>
    </div>
  );
}
