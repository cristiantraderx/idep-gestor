// ============================================================
// PageLoader — Componente de loading para rotas com lazy loading
// Extraído para arquivo próprio para evitar warning
// react-refresh/only-export-components no routes/index.tsx
// ============================================================

export function PageLoader() {
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
