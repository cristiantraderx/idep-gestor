import { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  Navigate,
} from "react-router-dom";
import { SidebarLayout } from "@/layouts/sidebar-layout";
import { AuthLayout } from "@/layouts/auth-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { PublicRoute } from "@/components/auth/protected-route";

// Lazy loaded pages
const DashboardPage = lazy(() =>
  import("@/pages/dashboard").then((m) => ({ default: m.DashboardPage }))
);

const ModulePlaceholder = lazy(() =>
  import("@/pages/module-placeholder").then((m) => ({
    default: m.ModulePlaceholder,
  }))
);

const LoginPage = lazy(() =>
  import("@/pages/auth/login").then((m) => ({ default: m.LoginPage }))
);

const RegisterPage = lazy(() =>
  import("@/pages/auth/register").then((m) => ({ default: m.RegisterPage }))
);

const RecoverPasswordPage = lazy(() =>
  import("@/pages/auth/recover-password").then((m) => ({
    default: m.RecoverPasswordPage,
  }))
);

const UpdatePasswordPage = lazy(() =>
  import("@/pages/auth/update-password").then((m) => ({
    default: m.UpdatePasswordPage,
  }))
);

const AuthCallbackPage = lazy(() =>
  import("@/pages/auth/callback").then((m) => ({
    default: m.AuthCallbackPage,
  }))
);

const NotificacoesPage = lazy(() =>
  import("@/pages/notifications/notificacoes").then((m) => ({
    default: m.NotificacoesPage,
  }))
);

const AdminUsuariosPage = lazy(() =>
  import("@/pages/admin/usuarios").then((m) => ({
    default: m.AdminUsuariosPage,
  }))
);

const PerfilPage = lazy(() =>
  import("@/pages/perfil/perfil").then((m) => ({
    default: m.PerfilPage,
  }))
);

const AdminPerfisPage = lazy(() =>
  import("@/pages/admin/perfis").then((m) => ({
    default: m.AdminPerfisPage,
  }))
);

const AdminPermissoesPage = lazy(() =>
  import("@/pages/admin/permissoes").then((m) => ({
    default: m.AdminPermissoesPage,
  }))
);

const AlunosListPage = lazy(() =>
  import("@/pages/alunos/alunos-list").then((m) => ({
    default: m.AlunosListPage,
  }))
);

const MatriculasPage = lazy(() =>
  import("@/pages/alunos/matriculas").then((m) => ({
    default: m.MatriculasPage,
  }))
);

const CursosListPage = lazy(() =>
  import("@/pages/cursos/cursos-list").then((m) => ({
    default: m.CursosListPage,
  }))
);

const TurmasListPage = lazy(() =>
  import("@/pages/turmas/turmas-list").then((m) => ({
    default: m.TurmasListPage,
  }))
);

const CalendarioPage = lazy(() =>
  import("@/pages/turmas/calendario").then((m) => ({
    default: m.CalendarioPage,
  }))
);

const ProtocolosPage = lazy(() =>
  import("@/pages/secretaria/protocolos").then((m) => ({
    default: m.ProtocolosPage,
  }))
);

const DeclaracoesPage = lazy(() =>
  import("@/pages/secretaria/declaracoes").then((m) => ({
    default: m.DeclaracoesPage,
  }))
);

const CertidoesPage = lazy(() =>
  import("@/pages/secretaria/certidoes").then((m) => ({
    default: m.CertidoesPage,
  }))
);

const ChamadosPage = lazy(() =>
  import("@/pages/ti/chamados").then((m) => ({
    default: m.ChamadosPage,
  }))
);

const EquipamentosPage = lazy(() =>
  import("@/pages/ti/equipamentos").then((m) => ({
    default: m.EquipamentosPage,
  }))
);

const LicencasPage = lazy(() =>
  import("@/pages/ti/licencas").then((m) => ({
    default: m.LicencasPage,
  }))
);

const AcervoPage = lazy(() =>
  import("@/pages/biblioteca/acervo").then((m) => ({
    default: m.AcervoPage,
  }))
);

const EmprestimosPage = lazy(() =>
  import("@/pages/biblioteca/emprestimos").then((m) => ({
    default: m.EmprestimosPage,
  }))
);

const ReservasPage = lazy(() =>
  import("@/pages/biblioteca/reservas").then((m) => ({
    default: m.ReservasPage,
  }))
);

const DisciplinasPage = lazy(() =>
  import("@/pages/cursos/disciplinas").then((m) => ({
    default: m.DisciplinasPage,
  }))
);

const MatrizCurricularPage = lazy(() =>
  import("@/pages/cursos/matriz-curricular").then((m) => ({
    default: m.MatrizCurricularPage,
  }))
);

const FinanceiroDashboardPage = lazy(() =>
  import("@/pages/financeiro/dashboard-financeiro").then((m) => ({
    default: m.FinanceiroDashboardPage,
  }))
);

const ReceitasPage = lazy(() =>
  import("@/pages/financeiro/receitas").then((m) => ({
    default: m.ReceitasPage,
  }))
);

const DespesasPage = lazy(() =>
  import("@/pages/financeiro/despesas").then((m) => ({
    default: m.DespesasPage,
  }))
);

const FluxoCaixaPage = lazy(() =>
  import("@/pages/financeiro/fluxo-caixa").then((m) => ({
    default: m.FluxoCaixaPage,
  }))
);

const ServidoresPage = lazy(() =>
  import("@/pages/rh/servidores").then((m) => ({
    default: m.ServidoresPage,
  }))
);

const ProfessoresPage = lazy(() =>
  import("@/pages/rh/professores").then((m) => ({
    default: m.ProfessoresPage,
  }))
);

const ContratosPage = lazy(() =>
  import("@/pages/rh/contratos").then((m) => ({
    default: m.ContratosPage,
  }))
);

const FeriasPage = lazy(() =>
  import("@/pages/rh/ferias").then((m) => ({
    default: m.FeriasPage,
  }))
);

const SolicitacoesCompraPage = lazy(() =>
  import("@/pages/compras/solicitacoes").then((m) => ({
    default: m.SolicitacoesCompraPage,
  }))
);

const CotacoesPage = lazy(() =>
  import("@/pages/compras/cotacoes").then((m) => ({
    default: m.CotacoesPage,
  }))
);

const LicitacoesPage = lazy(() =>
  import("@/pages/compras/licitacoes").then((m) => ({
    default: m.LicitacoesPage,
  }))
);

const MovEntradasPage = lazy(() =>
  import("@/pages/almoxarifado/entradas").then((m) => ({
    default: m.MovEntradasPage,
  }))
);

const MovSaidasPage = lazy(() =>
  import("@/pages/almoxarifado/saidas").then((m) => ({
    default: m.MovSaidasPage,
  }))
);

const InventarioPage = lazy(() =>
  import("@/pages/almoxarifado/inventario").then((m) => ({
    default: m.InventarioPage,
  }))
);

const BensPage = lazy(() =>
  import("@/pages/patrimonio/bens").then((m) => ({
    default: m.BensPage,
  }))
);

const MovimentacoesBensPage = lazy(() =>
  import("@/pages/patrimonio/movimentacoes").then((m) => ({
    default: m.MovimentacoesBensPage,
  }))
);

const ManutencaoBensPage = lazy(() =>
  import("@/pages/patrimonio/manutencao").then((m) => ({
    default: m.ManutencaoBensPage,
  }))
);

const ReclamacoesPage = lazy(() =>
  import("@/pages/ouvidoria/reclamacoes").then((m) => ({
    default: m.ReclamacoesPage,
  }))
);

const SugestoesPage = lazy(() =>
  import("@/pages/ouvidoria/sugestoes").then((m) => ({
    default: m.SugestoesPage,
  }))
);

const RelatoriosOuvidoriaPage = lazy(() =>
  import("@/pages/ouvidoria/relatorios").then((m) => ({
    default: m.RelatoriosOuvidoriaPage,
  }))
);

const EventosPage = lazy(() =>
  import("@/pages/agenda/eventos").then((m) => ({
    default: m.EventosPage,
  }))
);

const SalasPage = lazy(() =>
  import("@/pages/agenda/salas").then((m) => ({
    default: m.SalasPage,
  }))
);

const LaboratoriosPage = lazy(() =>
  import("@/pages/agenda/laboratorios").then((m) => ({
    default: m.LaboratoriosPage,
  }))
);

const RelatoriosPage = lazy(() =>
  import("@/pages/relatorios/relatorios").then((m) => ({
    default: m.RelatoriosPage,
  }))
);

const BIPage = lazy(() =>
  import("@/pages/bi/bi").then((m) => ({
    default: m.BIPage,
  }))
);

const ProjetosPage = lazy(() =>
  import("@/pages/projetos/projetos").then((m) => ({
    default: m.ProjetosPage,
  }))
);

const AuditoriaPage = lazy(() =>
  import("@/pages/auditoria/auditoria").then((m) => ({
    default: m.AuditoriaPage,
  }))
);

const ConfiguracoesPage = lazy(() =>
  import("@/pages/configuracoes/configuracoes").then((m) => ({
    default: m.ConfiguracoesPage,
  }))
);

// Loading fallback
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="space-y-4 w-full max-w-md">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-32 w-full" />
        <div className="skeleton h-24 w-full" />
      </div>
    </div>
  );
}

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Public auth routes (login, register, recover password) */}
      <Route element={<PublicRoute />}>
        <Route element={<AuthLayout />}>
          <Route
            path="auth/login"
            element={
              <Suspense fallback={<PageLoader />}>
                <LoginPage />
              </Suspense>
            }
          />
          <Route
            path="auth/register"
            element={
              <Suspense fallback={<PageLoader />}>
                <RegisterPage />
              </Suspense>
            }
          />
          <Route
            path="auth/recover-password"
            element={
              <Suspense fallback={<PageLoader />}>
                <RecoverPasswordPage />
              </Suspense>
            }
          />
          <Route
            path="auth/update-password"
            element={
              <Suspense fallback={<PageLoader />}>
                <UpdatePasswordPage />
              </Suspense>
            }
          />
          <Route
            path="auth/callback"
            element={
              <Suspense fallback={<PageLoader />}>
                <AuthCallbackPage />
              </Suspense>
            }
          />
          {/* Auth index redirects to login */}
          <Route
            path="auth"
            element={<Navigate to="/auth/login" replace />}
          />
        </Route>
      </Route>

      {/* Protected routes (require authentication) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<SidebarLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Dashboard */}
          <Route
            path="dashboard"
            element={
              <Suspense fallback={<PageLoader />}>
                <DashboardPage />
              </Suspense>
            }
          />

          {/* Notifications */}
          <Route
            path="notificacoes"
            element={
              <Suspense fallback={<PageLoader />}>
                <NotificacoesPage />
              </Suspense>
            }
          />

          {/* Alunos Module */}
          <Route
            path="alunos"
            element={
              <Suspense fallback={<PageLoader />}>
                <AlunosListPage />
              </Suspense>
            }
          />
          <Route
            path="alunos/novo"
            element={<Navigate to="/alunos" replace />}
          />
          <Route
            path="alunos/matriculas"
            element={
              <Suspense fallback={<PageLoader />}>
                <MatriculasPage />
              </Suspense>
            }
          />
          <Route
            path="alunos/historico"
            element={
              <Suspense fallback={<PageLoader />}>
                <AlunosListPage />
              </Suspense>
            }
          />

          {/* Cursos Module */}
          <Route
            path="cursos"
            element={
              <Suspense fallback={<PageLoader />}>
                <CursosListPage />
              </Suspense>
            }
          />
          <Route
            path="cursos/novo"
            element={<Navigate to="/cursos" replace />}
          />
          <Route
            path="cursos/disciplinas"
            element={
              <Suspense fallback={<PageLoader />}>
                <DisciplinasPage />
              </Suspense>
            }
          />
          <Route
            path="cursos/matriz"
            element={
              <Suspense fallback={<PageLoader />}>
                <MatrizCurricularPage />
              </Suspense>
            }
          />

          {/* Perfil */}
          <Route
            path="perfil"
            element={
              <Suspense fallback={<PageLoader />}>
                <PerfilPage />
              </Suspense>
            }
          />

          {/* Financeiro Module */}
          <Route
            path="financeiro"
            element={
              <Suspense fallback={<PageLoader />}>
                <FinanceiroDashboardPage />
              </Suspense>
            }
          />
          <Route
            path="financeiro/receitas"
            element={
              <Suspense fallback={<PageLoader />}>
                <ReceitasPage />
              </Suspense>
            }
          />
          <Route
            path="financeiro/despesas"
            element={
              <Suspense fallback={<PageLoader />}>
                <DespesasPage />
              </Suspense>
            }
          />
          <Route
            path="financeiro/fluxo"
            element={
              <Suspense fallback={<PageLoader />}>
                <FluxoCaixaPage />
              </Suspense>
            }
          />

          {/* Admin Routes */}
          <Route
            path="admin/usuarios"
            element={
              <Suspense fallback={<PageLoader />}>
                <AdminUsuariosPage />
              </Suspense>
            }
          />
          <Route
            path="admin/usuarios/novo"
            element={<Navigate to="/admin/usuarios" replace />}
          />
          <Route
            path="admin/perfis"
            element={
              <Suspense fallback={<PageLoader />}>
                <AdminPerfisPage />
              </Suspense>
            }
          />
          <Route
            path="admin/permissoes"
            element={
              <Suspense fallback={<PageLoader />}>
                <AdminPermissoesPage />
              </Suspense>
            }
          />

          {/* Turmas Module */}
          <Route
            path="turmas"
            element={
              <Suspense fallback={<PageLoader />}>
                <TurmasListPage />
              </Suspense>
            }
          />
          <Route
            path="turmas/novo"
            element={<Navigate to="/turmas" replace />}
          />
          <Route
            path="turmas/calendario"
            element={
              <Suspense fallback={<PageLoader />}>
                <CalendarioPage />
              </Suspense>
            }
          />

          {/* Secretaria Module */}
          <Route
            path="secretaria"
            element={<Navigate to="/secretaria/protocolos" replace />}
          />
          <Route
            path="secretaria/protocolos"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProtocolosPage />
              </Suspense>
            }
          />
          <Route
            path="secretaria/declaracoes"
            element={
              <Suspense fallback={<PageLoader />}>
                <DeclaracoesPage />
              </Suspense>
            }
          />
          <Route
            path="secretaria/certidoes"
            element={
              <Suspense fallback={<PageLoader />}>
                <CertidoesPage />
              </Suspense>
            }
          />

          {/* RH Module */}
          <Route
            path="rh"
            element={<Navigate to="/rh/servidores" replace />}
          />
          <Route
            path="rh/servidores"
            element={
              <Suspense fallback={<PageLoader />}>
                <ServidoresPage />
              </Suspense>
            }
          />
          <Route
            path="rh/professores"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProfessoresPage />
              </Suspense>
            }
          />
          <Route
            path="rh/contratos"
            element={
              <Suspense fallback={<PageLoader />}>
                <ContratosPage />
              </Suspense>
            }
          />
          <Route
            path="rh/ferias"
            element={
              <Suspense fallback={<PageLoader />}>
                <FeriasPage />
              </Suspense>
            }
          />

          {/* Patrimônio Module */}
          <Route
            path="patrimonio"
            element={<Navigate to="/patrimonio/bens" replace />}
          />
          <Route
            path="patrimonio/bens"
            element={
              <Suspense fallback={<PageLoader />}>
                <BensPage />
              </Suspense>
            }
          />
          <Route
            path="patrimonio/movimentacoes"
            element={
              <Suspense fallback={<PageLoader />}>
                <MovimentacoesBensPage />
              </Suspense>
            }
          />
          <Route
            path="patrimonio/manutencao"
            element={
              <Suspense fallback={<PageLoader />}>
                <ManutencaoBensPage />
              </Suspense>
            }
          />

          {/* Compras Module */}
          <Route
            path="compras"
            element={<Navigate to="/compras/solicitacoes" replace />}
          />
          <Route
            path="compras/solicitacoes"
            element={
              <Suspense fallback={<PageLoader />}>
                <SolicitacoesCompraPage />
              </Suspense>
            }
          />
          <Route
            path="compras/cotacoes"
            element={
              <Suspense fallback={<PageLoader />}>
                <CotacoesPage />
              </Suspense>
            }
          />
          <Route
            path="compras/licitacoes"
            element={
              <Suspense fallback={<PageLoader />}>
                <LicitacoesPage />
              </Suspense>
            }
          />

          {/* Almoxarifado Module */}
          <Route
            path="almoxarifado"
            element={<Navigate to="/almoxarifado/entradas" replace />}
          />
          <Route
            path="almoxarifado/entradas"
            element={
              <Suspense fallback={<PageLoader />}>
                <MovEntradasPage />
              </Suspense>
            }
          />
          <Route
            path="almoxarifado/saidas"
            element={
              <Suspense fallback={<PageLoader />}>
                <MovSaidasPage />
              </Suspense>
            }
          />
          <Route
            path="almoxarifado/inventario"
            element={
              <Suspense fallback={<PageLoader />}>
                <InventarioPage />
              </Suspense>
            }
          />

          {/* TI Module */}
          <Route
            path="ti"
            element={<Navigate to="/ti/chamados" replace />}
          />
          <Route
            path="ti/chamados"
            element={
              <Suspense fallback={<PageLoader />}>
                <ChamadosPage />
              </Suspense>
            }
          />
          <Route
            path="ti/equipamentos"
            element={
              <Suspense fallback={<PageLoader />}>
                <EquipamentosPage />
              </Suspense>
            }
          />
          <Route
            path="ti/licencas"
            element={
              <Suspense fallback={<PageLoader />}>
                <LicencasPage />
              </Suspense>
            }
          />

          {/* Biblioteca Module */}
          <Route
            path="biblioteca"
            element={<Navigate to="/biblioteca/acervo" replace />}
          />
          <Route
            path="biblioteca/acervo"
            element={
              <Suspense fallback={<PageLoader />}>
                <AcervoPage />
              </Suspense>
            }
          />
          <Route
            path="biblioteca/emprestimos"
            element={
              <Suspense fallback={<PageLoader />}>
                <EmprestimosPage />
              </Suspense>
            }
          />
          <Route
            path="biblioteca/reservas"
            element={
              <Suspense fallback={<PageLoader />}>
                <ReservasPage />
              </Suspense>
            }
          />

          {/* Ouvidoria Module */}
          <Route
            path="ouvidoria"
            element={<Navigate to="/ouvidoria/reclamacoes" replace />}
          />
          <Route
            path="ouvidoria/reclamacoes"
            element={
              <Suspense fallback={<PageLoader />}>
                <ReclamacoesPage />
              </Suspense>
            }
          />
          <Route
            path="ouvidoria/sugestoes"
            element={
              <Suspense fallback={<PageLoader />}>
                <SugestoesPage />
              </Suspense>
            }
          />
          <Route
            path="ouvidoria/relatorios"
            element={
              <Suspense fallback={<PageLoader />}>
                <RelatoriosOuvidoriaPage />
              </Suspense>
            }
          />

          {/* Agenda Module */}
          <Route
            path="agenda"
            element={<Navigate to="/agenda/eventos" replace />}
          />
          <Route
            path="agenda/eventos"
            element={
              <Suspense fallback={<PageLoader />}>
                <EventosPage />
              </Suspense>
            }
          />
          <Route
            path="agenda/salas"
            element={
              <Suspense fallback={<PageLoader />}>
                <SalasPage />
              </Suspense>
            }
          />
          <Route
            path="agenda/laboratorios"
            element={
              <Suspense fallback={<PageLoader />}>
                <LaboratoriosPage />
              </Suspense>
            }
          />

          {/* Relatórios Module */}
          <Route
            path="relatorios"
            element={
              <Suspense fallback={<PageLoader />}>
                <RelatoriosPage />
              </Suspense>
            }
          />

          {/* BI Module */}
          <Route
            path="bi"
            element={
              <Suspense fallback={<PageLoader />}>
                <BIPage />
              </Suspense>
            }
          />

          {/* Projetos Module */}
          <Route
            path="projetos"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProjetosPage />
              </Suspense>
            }
          />

          {/* Auditoria Module */}
          <Route
            path="auditoria"
            element={
              <Suspense fallback={<PageLoader />}>
                <AuditoriaPage />
              </Suspense>
            }
          />

          {/* Configurações Module */}
          <Route
            path="configuracoes"
            element={
              <Suspense fallback={<PageLoader />}>
                <ConfiguracoesPage />
              </Suspense>
            }
          />

          {/* Module placeholders */}
          <Route
            path=":module/*"
            element={
              <Suspense fallback={<PageLoader />}>
                <ModulePlaceholder />
              </Suspense>
            }
          />
        </Route>
      </Route>


    </>
  )
);
