import { RouterProvider } from "react-router-dom";
import { router } from "@/routes";
import { AppProvider } from "@/providers/app-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { NotificationProvider } from "@/contexts/notification-context";

export function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <NotificationProvider>
          <RouterProvider router={router} />
        </NotificationProvider>
      </AuthProvider>
    </AppProvider>
  );
}
