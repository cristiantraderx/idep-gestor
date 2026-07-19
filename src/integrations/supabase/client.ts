import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

const isConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isConfigured) {
  console.warn(
    "⚠️ Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env."
  );
}

// ============================================================
// Mock do Supabase para quando não houver credenciais
// ============================================================

/** Cria um query builder mock que retorna dados vazios */
function mockQueryBuilder() {
  const resolve = () => Promise.resolve({ data: null, error: new Error("Supabase não configurado") });
  const resolveEmpty = () => Promise.resolve({ data: [], error: null });
  const chainable = {
    select: () => chainable,
    insert: () => ({ select: () => mockQueryBuilder(), single: () => resolve() }),
    update: () => chainable,
    delete: () => chainable,
    eq: () => chainable,
    neq: () => chainable,
    gt: () => chainable,
    gte: () => chainable,
    lt: () => chainable,
    lte: () => chainable,
    like: () => chainable,
    ilike: () => chainable,
    is: () => chainable,
    in: () => chainable,
    contains: () => chainable,
    order: () => chainable,
    limit: () => chainable,
    range: () => chainable,
    single: () => resolve(),
    maybeSingle: () => resolve(),
    then: (onfulfilled: (v: unknown) => unknown) => resolveEmpty().then(onfulfilled),
    catch: (onrejected: (e: Error) => unknown) => resolveEmpty().catch(onrejected),
  };
  return chainable;
}

/** Mock do cliente Supabase para uso sem credenciais */
function createMockClient() {
  return {
    from: () => mockQueryBuilder(),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithPassword: () =>
        Promise.resolve({ data: null, error: new Error("Supabase não configurado") }),
      signUp: () =>
        Promise.resolve({ data: null, error: new Error("Supabase não configurado") }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      resetPasswordForEmail: () =>
        Promise.resolve({ data: null, error: new Error("Supabase não configurado") }),
      updateUser: () =>
        Promise.resolve({ data: null, error: new Error("Supabase não configurado") }),
      exchangeCodeForSession: () =>
        Promise.resolve({ data: { session: null }, error: null }),
      refreshSession: () =>
        Promise.resolve({ data: { session: null }, error: null }),
      setSession: () =>
        Promise.resolve({ data: { session: null }, error: null }),
      getUser: () =>
        Promise.resolve({ data: { user: null }, error: null }),
      signInWithOAuth: () =>
        Promise.resolve({ data: null, error: new Error("Supabase não configurado") }),
      signInAnonymously: () =>
        Promise.resolve({ data: null, error: new Error("Supabase não configurado") }),
      verifyOtp: () =>
        Promise.resolve({ data: null, error: new Error("Supabase não configurado") }),
    },
    rpc: () => Promise.resolve({ data: null, error: new Error("Supabase não configurado") }),
    storage: {
      from: () => ({
        upload: async () => ({}),
        download: async () => ({}),
        list: async () => ({ data: [], error: null }),
        remove: async () => ({}),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
      }),
    },
    functions: {
      invoke: () => Promise.resolve({ data: null, error: new Error("Supabase não configurado") }),
    },
    channel: () => ({
      on: () => ({ subscribe: () => {} }),
      subscribe: () => {},
      unsubscribe: () => {},
    }),
    realtime: {
      channels: [],
    },
  };
}

/**
 * Cliente Supabase.
 * Se as credenciais estiverem configuradas, usa o cliente real.
 * Caso contrário, usa um mock que retorna dados vazios/erros controlados
 * para permitir o desenvolvimento da interface sem Supabase.
 */
export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : (createMockClient() as unknown as ReturnType<typeof createClient>);

