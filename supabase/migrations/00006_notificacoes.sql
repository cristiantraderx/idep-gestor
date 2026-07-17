-- ============================================================
-- IDEP-Gestor · Migration 00006: Notificações
-- Sistema de notificações em tempo real com Supabase Realtime
-- ============================================================

-- 1. NOTIFICACOES
create table if not exists notificacoes (
  id            uuid primary key default gen_random_uuid(),
  usuario_id    uuid not null references usuarios(id) on delete cascade,
  titulo        text not null,
  mensagem      text not null,
  tipo          text not null default 'info' check (tipo in ('info', 'success', 'warning', 'error', 'system')),
  modulo        text, -- e.g., 'alunos', 'financeiro'
  link          text, -- URL opcional para redirecionamento
  lida          boolean not null default false,
  lida_em       timestamptz,
  created_at    timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_notificacoes_usuario on notificacoes(usuario_id);
create index if not exists idx_notificacoes_usuario_lida on notificacoes(usuario_id, lida);
create index if not exists idx_notificacoes_created on notificacoes(created_at desc);

-- Enable RLS
alter table notificacoes enable row level security;

-- RLS Policies
create policy "notificacoes_select" on notificacoes for select
  using (usuario_id = (select id from usuarios where auth_user_id = auth.uid()));

create policy "notificacoes_insert" on notificacoes for insert
  with check (true); -- Sistema pode inserir, RLS por usuário na select

create policy "notificacoes_update" on notificacoes for update
  using (usuario_id = (select id from usuarios where auth_user_id = auth.uid()));

-- Enable realtime for notifications
alter publication supabase_realtime add table notificacoes;
