import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Processando autenticação...");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Parse the URL hash fragment from the OAuth redirect
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          setStatus("error");
          setMessage(error.message);
          return;
        }

        if (data.session) {
          setStatus("success");
          setMessage("Autenticação realizada com sucesso!");
          setTimeout(() => {
            navigate("/dashboard", { replace: true });
          }, 1500);
        } else {
          // Try to exchange the auth code for a session
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
            window.location.href
          );

          if (exchangeError) {
            setStatus("error");
            setMessage(exchangeError.message);
            return;
          }

          setStatus("success");
          setMessage("Autenticação realizada com sucesso!");
          setTimeout(() => {
            navigate("/dashboard", { replace: true });
          }, 1500);
        }
      } catch (err) {
        setStatus("error");
        setMessage("Erro inesperado na autenticação.");
        console.error("Auth callback error:", err);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center min-h-[300px] gap-4"
    >
      {status === "loading" && (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-idep-700" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </>
      )}
      {status === "success" && (
        <>
          <CheckCircle2 className="h-12 w-12 text-green-500" />
          <p className="text-sm text-green-600 font-medium">{message}</p>
          <p className="text-xs text-muted-foreground">Redirecionando...</p>
        </>
      )}
      {status === "error" && (
        <>
          <XCircle className="h-12 w-12 text-destructive" />
          <p className="text-sm text-destructive font-medium">{message}</p>
          <button
            onClick={() => navigate("/auth/login", { replace: true })}
            className="text-xs text-idep-700 hover:underline mt-2"
          >
            Voltar para o login
          </button>
        </>
      )}
    </motion.div>
  );
}
