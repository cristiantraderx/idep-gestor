import { RouterProvider } from "react-router-dom";
import { router } from "@/routes";
import { AppProvider } from "@/providers/app-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AuthProvider>
          <NotificationProvider>
            <RouterProvider router={router} />
          </NotificationProvider>
        </AuthProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}
