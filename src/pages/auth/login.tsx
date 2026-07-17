import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Eye, EyeOff, Github, Loader2, LogIn } from "lucide-react";
import { motion } from "framer-motion";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithGitHub } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email.trim() || !password.trim()) {
      setError("Preencha todos os campos.");
      setLoading(false);
      return;
    }

    const authError = await login(email, password);
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    navigate("/dashboard", { replace: true });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="shadow-xl shadow-idep-700/5 border-border/50">
        <CardHeader className="pb-4 text-center">
          <CardTitle className="text-xl font-bold">Acessar Sistema</CardTitle>
          <CardDescription>
            Entre com suas credenciais institucionais
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* GitHub Login */}
          <button
            type="button"
            onClick={loginWithGitHub}
            className="w-full h-10 flex items-center justify-center gap-2 rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            <Github className="h-4 w-4" />
            Entrar com GitHub
          </button>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                ou continue com e-mail
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive"
              >
                {error}
              </motion.div>
            )}

            {/* Email */}
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
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input transition-all"
                autoComplete="email"
                disabled={loading}
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-xs font-medium text-foreground"
              >
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input transition-all"
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="flex justify-end">
              <Link
                to="/auth/recover-password"
                className="text-xs font-medium text-idep-700 hover:text-idep-800 dark:text-idep-300 transition-colors"
              >
                Esqueceu a senha?
              </Link>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-10 gap-2"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          {/* Register link */}
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Não tem conta?{" "}
            <Link
              to="/auth/register"
              className="font-medium text-idep-700 hover:text-idep-800 dark:text-idep-300 transition-colors"
            >
              Solicitar cadastro
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
