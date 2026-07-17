-- ============================================================
-- IDEP-Gestor · Migration 00001: Core Schema
-- Core tables: unidades, perfis, usuarios, permissoes, auditoria
-- ============================================================

-- 0. Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 1. UNIDADES (Schools/Units)
create table if not exists unidades (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  sigla       text not null unique,
  tipo        text not null check (tipo in ('sede', 'filial')),
  cnpj        text unique,
  endereco    text,
  cidade      text default 'Porto Velho',
  estado      text default 'RO',
  telefone    text,
  email       text,
  ativo       boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- 2. PERFIS (Roles - RBAC)
create table if not exists perfis (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null unique,
  codigo      text not null unique,
  descricao   text,
  nivel       integer not null default 0, -- higher = more privileged
  sistema     boolean default false, -- true = sistema, não pode ser deletado
  created_at  timestamptz default now()
);

-- 3. PERMISSOES (Granular permissions)
create table if not exists permissoes (
  id          uuid primary key default gen_random_uuid(),
  perfil_id   uuid not null references perfis(id) on delete cascade,
  modulo      text not null, -- e.g., 'alunos', 'financeiro'
  acao        text not null, -- e.g., 'listar', 'criar', 'editar', 'excluir'
  escopo      text not null default 'unidade' check (escopo in ('global', 'unidade', 'proprio')),
  created_at  timestamptz default now(),
  unique(perfil_id, modulo, acao)
);

-- 4. USUARIOS (Extended profiles on top of auth.users)
create table if not exists usuarios (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid unique references auth.users(id) on delete cascade,
  nome          text not null,
  cpf           text unique,
  email         text unique not null,
  telefone      text,
  avatar_url    text,
  perfil_id     uuid not null references perfis(id),
  unidade_id    uuid references unidades(id),
  ativo         boolean default true,
  ultimo_acesso timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- 5. USUARIO_UNIDADES (User can be assigned to multiple units)
create table if not exists usuario_unidades (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null references usuarios(id) on delete cascade,
  unidade_id  uuid not null references unidades(id) on delete cascade,
  created_at  timestamptz default now(),
  unique(usuario_id, unidade_id)
);

-- 6. SESSOES (Session audit trail)
create table if not exists sessoes (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null references usuarios(id) on delete cascade,
  ip          text,
  dispositivo text,
  user_agent  text,
  login_at    timestamptz default now(),
  logout_at   timestamptz
);

-- 7. AUDITORIA (Complete audit log)
create table if not exists auditoria (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid references usuarios(id),
  modulo      text not null,
  acao        text not null,
  registro_id uuid,
  dados_antigos jsonb,
  dados_novos  jsonb,
  ip          text,
  user_agent  text,
  created_at  timestamptz default now()
);

-- 8. CONFIGURACOES (Institutional settings)
create table if not exists configuracoes (
  id          uuid primary key default gen_random_uuid(),
  unidade_id  uuid references unidades(id) on delete cascade,
  chave       text not null,
  valor       jsonb not null default '{}',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique(unidade_id, chave)
);

-- Indexes
create index if not exists idx_usuarios_perfil on usuarios(perfil_id);
create index if not exists idx_usuarios_unidade on usuarios(unidade_id);
create index if not exists idx_permissoes_perfil on permissoes(perfil_id);
create index if not exists idx_auditoria_modulo on auditoria(modulo);
create index if not exists idx_auditoria_usuario on auditoria(usuario_id);
create index if not exists idx_auditoria_created on auditoria(created_at desc);
create index if not exists idx_sessoes_usuario on sessoes(usuario_id);
create index if not exists idx_configuracoes_unidade on configuracoes(unidade_id);

-- Auto-update updated_at trigger
create or replace function trigger_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_unidades
  before update on unidades
  for each row execute function trigger_set_updated_at();

create trigger set_updated_at_usuarios
  before update on usuarios
  for each row execute function trigger_set_updated_at();

create trigger set_updated_at_configuracoes
  before update on configuracoes
  for each row execute function trigger_set_updated_at();

