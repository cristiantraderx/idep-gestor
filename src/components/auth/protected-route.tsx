import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";

function AuthLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-idep-700 text-white text-lg font-bold">
          ID
        </div>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Verificando autenticação...</p>
      </div>
    </div>
  );
}

/**
 * Wraps routes that require authentication.
 * Redirects to /auth/login if user is not authenticated.
 */
export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AuthLoader />;
  }

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

/**
 * Wraps routes that should only be accessible to unauthenticated users (login, register, etc.).
 * Redirects to /dashboard if user is already authenticated.
 */
export function PublicRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AuthLoader />;
  }

  if (user) {
    // Redirect to the page they were trying to access, or dashboard
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/dashboard";
    return <Navigate to={from} replace />;
  }

  return <Outlet />;
}
