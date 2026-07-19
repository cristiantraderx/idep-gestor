import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";

// ============================================================
// ErrorBoundary — Captura erros de renderização no React
// Exibe uma UI amigável em vez da tela branca de erro
// ============================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log do erro no console
    console.error("[ErrorBoundary] Erro capturado:", error.message, errorInfo.componentStack);

    // Callback opcional (ex: enviar para serviço de monitoramento)
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/";
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Fallback customizado
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const error = this.state.error;
      const isDev = import.meta.env.DEV;

      return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
          <div className="w-full max-w-md space-y-6">
            {/* Error Icon */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                  <AlertTriangle className="h-10 w-10 text-destructive" />
                </div>
                <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground shadow-lg">
                  !
                </span>
              </div>
            </div>

            {/* Error Title */}
            <div className="space-y-2 text-center">
              <h1 className="text-xl font-bold text-foreground">
                Algo deu errado
              </h1>
              <p className="text-sm text-muted-foreground">
                Ocorreu um erro inesperado ao renderizar esta página. Nossa equipe foi notificada.
              </p>
            </div>

            {/* Error Details (apenas em desenvolvimento) */}
            {isDev && error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-destructive">
                  <Bug className="h-3.5 w-3.5" />
                  <span>Detalhes do erro (dev)</span>
                </div>
                <p className="text-xs font-mono text-foreground/80 break-all leading-relaxed">
                  {error.name}: {error.message}
                </p>
                {this.state.errorInfo && (
                  <details className="group">
                    <summary className="cursor-pointer text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors">
                      Stack trace
                    </summary>
                    <pre className="mt-2 text-[9px] font-mono text-muted-foreground/70 overflow-auto max-h-32 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all duration-200 active:scale-[0.98]"
              >
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </button>
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-all duration-200"
              >
                <Home className="h-4 w-4" />
                Ir para o início
              </button>
            </div>

            {/* Error Reference */}
            <p className="text-center text-[9px] text-muted-foreground/40">
              Se o problema persistir, entre em contato com o suporte técnico informando o erro acima.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
