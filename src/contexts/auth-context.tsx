import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { PERFIL_UUIDS } from "@/constants/perfis";

export type AuthError = {
  message: string;
  code?: string;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: { nome: string; perfil: string } | null;
  login: (email: string, password: string) => Promise<AuthError | null>;
  signup: (email: string, password: string, nome: string) => Promise<AuthError | null>;
  loginWithGitHub: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthError | null>;
  updatePassword: (password: string) => Promise<AuthError | null>;
}

// Tipo para o retorno da query .select("nome, perfis(nome)")
interface UsuarioComPerfil {
  nome: string;
  perfis: { nome: string } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ nome: string; perfil: string } | null>(null);

  // Fetch user profile from public.usuarios
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("usuarios")
        .select("nome, perfis(nome)")
        .eq("auth_user_id", userId)
        .single();

      if (error || !data) {
        // Try to create profile if it doesn't exist
        const userData = await supabase.auth.getUser();
        const email = userData.data.user?.email;
        if (email) {
          // Attempt to create a basic profile
          const { data: newProfile } = await supabase
            .from("usuarios")
            .insert({
              auth_user_id: userId,
              nome: email.split("@")[0] || "Usuário",
              email,
              perfil_id: PERFIL_UUIDS.VISITANTE,
            })
            .select("nome, perfis(nome)")
            .single();

          if (newProfile) {
            const typed = newProfile as unknown as UsuarioComPerfil;
            setProfile({
              nome: typed.nome,
              perfil: typed.perfis?.nome || "Visitante",
            });
          }
        }
        return;
      }

      const typed = data as unknown as UsuarioComPerfil;
      setProfile({
        nome: typed.nome,
        perfil: typed.perfis?.nome || "Usuário",
      });
    } catch (err) {
      console.error("Erro ao buscar perfil do usuário:", err);
    }
  }, []);

  // Initialize session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        fetchProfile(currentSession.user.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        fetchProfile(currentSession.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const login = useCallback(async (email: string, password: string): Promise<AuthError | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return {
        message: error.message,
        code: error.code,
      };
    }
    return null;
  }, []);

  const signup = useCallback(
    async (email: string, password: string, nome: string): Promise<AuthError | null> => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nome },
        },
      });

      if (error) {
        return {
          message: error.message,
          code: error.code,
        };
      }

      // Create public.usuarios profile
      if (data.user) {
        const { error: profileError } = await supabase.from("usuarios").insert({
          auth_user_id: data.user.id,
          nome,
          email,
          perfil_id: PERFIL_UUIDS.ALUNO,
        });

        if (profileError) {
          return { message: "Erro ao criar perfil: " + profileError.message };
        }
      }

      return null;
    },
    []
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<AuthError | null> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    if (error) {
      return { message: error.message, code: error.code };
    }
    return null;
  }, []);

  const updatePassword = useCallback(async (password: string): Promise<AuthError | null> => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      return { message: error.message, code: error.code };
    }
    return null;
  }, []);

  // Login with GitHub OAuth
  const loginWithGitHub = useCallback(async (): Promise<void> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("Erro ao autenticar com GitHub:", error.message);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        profile,
        login,
        signup,
        loginWithGitHub,
        logout,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
