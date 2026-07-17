import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export function RecoverPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Informe seu e-mail institucional.");
      return;
    }

    setLoading(true);
    const authError = await resetPassword(email);
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="shadow-xl shadow-idep-700/5 border-border/50">
        <CardHeader className="pb-4 text-center">
          <CardTitle className="text-xl font-bold">Recuperar Senha</CardTitle>
          <CardDescription>
            Enviaremos um link de recuperação para seu e-mail
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <div className="flex justify-center">
                <div className="rounded-full bg-rondonia-50 dark:bg-rondonia-950/50 p-3">
                  <CheckCircle2 className="h-8 w-8 text-rondonia-600" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  E-mail enviado!
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                </p>
              </div>
              <Link
                to="/auth/login"
                className="inline-flex items-center gap-2 text-xs font-medium text-idep-700 hover:text-idep-800 dark:text-idep-300 transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Voltar ao login
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive"
                >
                  {error}
                </motion.div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="text-xs font-medium text-foreground"
                >
                  E-mail institucional
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@idep.ro.gov.br"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  disabled={loading}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-10 gap-2"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                {loading ? "Enviando..." : "Enviar link de recuperação"}
              </Button>

              <Link
                to="/auth/login"
                className="flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Voltar ao login
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
