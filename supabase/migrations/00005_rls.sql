-- ============================================================
-- IDEP-Gestor · Migration 00005: Row Level Security (RLS)
-- Políticas granulares por perfil, módulo e escopo
-- ============================================================

-- Enable RLS on all tables
alter table unidades enable row level security;
alter table perfis enable row level security;
alter table permissoes enable row level security;
alter table usuarios enable row level security;
alter table usuario_unidades enable row level security;
alter table sessoes enable row level security;
alter table auditoria enable row level security;
alter table configuracoes enable row level security;

alter table cursos enable row level security;
alter table disciplinas enable row level security;
alter table turmas enable row level security;
alter table alunos enable row level security;
alter table matriculas enable row level security;
alter table turma_disciplinas enable row level security;
alter table calendario_academico enable row level security;
alter table notas enable row level security;
alter table frequencia enable row level security;
alter table historico_escolar enable row level security;

alter table professores enable row level security;
alter table servidores enable row level security;
alter table contratos enable row level security;
alter table ferias enable row level security;
alter table licencas enable row level security;
alter table receitas enable row level security;
alter table despesas enable row level security;
alter table centros_custo enable row level security;
alter table contratos_financeiros enable row level security;
alter table fluxo_caixa enable row level security;
alter table fornecedores enable row level security;
alter table solicitacoes_compra enable row level security;
alter table itens_solicitacao enable row level security;
alter table cotacoes enable row level security;
alter table ordens_compra enable row level security;
alter table itens_ordem_compra enable row level security;
alter table licitacoes enable row level security;
alter table categorias_item enable row level security;
alter table itens enable row level security;
alter table movimentacoes_estoque enable row level security;
alter table transferencias_estoque enable row level security;
alter table bens_patrimoniais enable row level security;
alter table movimentacoes_bens enable row level security;
alter table manutencoes enable row level security;

alter table obras enable row level security;
alter table emprestimos enable row level security;
alter table reservas enable row level security;
alter table multas enable row level security;
alter table eventos enable row level security;
alter table reservas_salas enable row level security;
alter table chamados_ti enable row level security;
alter table equipamentos_ti enable row level security;
alter table licencas_software enable row level security;
alter table manifestacoes enable row level security;
alter table respostas_manifestacoes enable row level security;
alter table processos enable row level security;
alter table tramitacoes enable row level security;
alter table projetos enable row level security;
alter table etapas_projeto enable row level security;
alter table documentos enable row level security;
alter table versao_documentos enable row level security;

-- ============================================================
-- Helper functions for RLS (SECURITY DEFINER for cross-schema access)
-- ============================================================

create or replace function public.get_user_perfil_id()
returns uuid
language sql stable security definer
as $$
  select perfil_id from public.usuarios where auth_user_id = auth.uid()
$$;

create or replace function public.get_user_unidade_id()
returns uuid
language sql stable security definer
as $$
  select unidade_id from public.usuarios where auth_user_id = auth.uid()
$$;

create or replace function public.get_user_perfil_codigo()
returns text
language sql stable security definer
as $$
  select p.codigo from public.usuarios u
  join public.perfis p on p.id = u.perfil_id
  where u.auth_user_id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
as $$
  select exists (
    select 1 from public.usuarios u
    join public.perfis p on p.id = u.perfil_id
    where u.auth_user_id = auth.uid() and p.codigo = 'admin_geral'
  )
$$;

create or replace function public.user_has_permission(p_modulo text, p_acao text)
returns boolean
language sql stable security definer
as $$
  select exists (
    select 1 from public.usuarios u
    join public.permissoes perm on perm.perfil_id = u.perfil_id
    where u.auth_user_id = auth.uid()
    and perm.modulo = p_modulo
    and perm.acao = p_acao
  )
$$;

-- Check constraint for emprestimos (exactly one borrower type)
alter table emprestimos add constraint check_um_tomador check (
  (aluno_id is not null)::integer +
  (professor_id is not null)::integer +
  (servidor_id is not null)::integer = 1
);

-- Check constraint for reservas (exactly one reserving type)
alter table reservas add constraint check_um_reservante check (
  (aluno_id is not null)::integer +
  (professor_id is not null)::integer = 1
);

-- ============================================================
-- RLS POLICIES - CORE
-- ============================================================

create policy "unidades_select" on unidades for select
  using (auth.role() = 'authenticated');

create policy "unidades_insert" on unidades for insert
  with check (public.is_admin());

create policy "unidades_update" on unidades for update
  using (public.is_admin());

create policy "unidades_delete" on unidades for delete
  using (public.is_admin());

create policy "perfis_select" on perfis for select
  using (auth.role() = 'authenticated');

create policy "perfis_manage" on perfis for all
  using (public.is_admin());

create policy "permissoes_select" on permissoes for select
  using (auth.role() = 'authenticated');

create policy "permissoes_manage" on permissoes for all
  using (public.is_admin());

create policy "usuarios_select" on usuarios for select
  using (
    auth_user_id = auth.uid()
    or public.is_admin()
    or public.get_user_perfil_codigo() in ('diretor', 'coordenador', 'rh')
  );

create policy "usuarios_insert" on usuarios for insert
  with check (public.is_admin() or public.get_user_perfil_codigo() in ('diretor', 'rh'));

create policy "usuarios_update" on usuarios for update
  using (
    auth_user_id = auth.uid()
    or public.is_admin()
    or public.get_user_perfil_codigo() in ('diretor', 'rh')
  );

create policy "auditoria_select" on auditoria for select
  using (public.is_admin() or public.get_user_perfil_codigo() = 'auditoria');

create policy "auditoria_insert" on auditoria for insert
  with check (true);

-- ============================================================
-- RLS POLICIES - ACADEMIC
-- ============================================================

create policy "cursos_select" on cursos for select
  using (
    unidade_id = public.get_user_unidade_id()
    or public.is_admin()
    or public.get_user_perfil_codigo() in ('diretor', 'coordenador')
  );

create policy "cursos_manage" on cursos for insert
  with check (public.is_admin() or public.get_user_perfil_codigo() in ('diretor', 'coordenador'));

create policy "cursos_update" on cursos for update
  using (public.is_admin() or public.get_user_perfil_codigo() in ('diretor', 'coordenador'));

create policy "alunos_select" on alunos for select
  using (
    public.is_admin()
    or usuario_id = auth.uid()
    or public.get_user_perfil_codigo() in ('diretor', 'secretaria', 'coordenador', 'professor')
  );

create policy "alunos_manage" on alunos for insert
  with check (public.is_admin() or public.get_user_perfil_codigo() in ('diretor', 'secretaria'));

create policy "alunos_update" on alunos for update
  using (public.is_admin() or public.get_user_perfil_codigo() in ('diretor', 'secretaria'));

create policy "matriculas_select" on matriculas for select
  using (
    public.is_admin()
    or public.get_user_perfil_codigo() in ('diretor', 'secretaria', 'coordenador')
    or exists (select 1 from alunos a where a.id = matriculas.aluno_id and a.usuario_id = auth.uid())
  );

create policy "matriculas_manage" on matriculas for insert
  with check (public.is_admin() or public.get_user_perfil_codigo() in ('diretor', 'secretaria'));

create policy "matriculas_update" on matriculas for update
  using (public.is_admin() or public.get_user_perfil_codigo() in ('diretor', 'secretaria'));

create policy "notas_select" on notas for select
  using (
    public.is_admin()
    or public.get_user_perfil_codigo() in ('diretor', 'coordenador', 'professor', 'secretaria')
    or exists (
      select 1 from matriculas m
      join alunos a on a.id = m.aluno_id
      where m.id = notas.matricula_id and a.usuario_id = auth.uid()
    )
  );

create policy "notas_manage" on notas for all
  using (public.is_admin() or public.get_user_perfil_codigo() in ('professor', 'coordenador'))
  with check (public.is_admin() or public.get_user_perfil_codigo() in ('professor', 'coordenador'));

create policy "frequencia_select" on frequencia for select
  using (
    public.is_admin()
    or public.get_user_perfil_codigo() in ('diretor', 'coordenador', 'professor')
    or exists (
      select 1 from matriculas m
      join alunos a on a.id = m.aluno_id
      where m.id = frequencia.matricula_id and a.usuario_id = auth.uid()
    )
  );

create policy "frequencia_manage" on frequencia for all
  using (public.is_admin() or public.get_user_perfil_codigo() in ('professor', 'coordenador'));

-- ============================================================
-- RLS POLICIES - MANAGEMENT
-- ============================================================

create policy "professores_select" on professores for select
  using (
    public.is_admin()
    or usuario_id = auth.uid()
    or public.get_user_perfil_codigo() in ('diretor', 'rh', 'coordenador')
  );

create policy "professores_manage" on professores for all
  using (public.is_admin() or public.get_user_perfil_codigo() in ('diretor', 'rh'));

create policy "servidores_select" on servidores for select
  using (
    public.is_admin()
    or usuario_id = auth.uid()
    or public.get_user_perfil_codigo() in ('diretor', 'rh')
  );

create policy "servidores_manage" on servidores for all
  using (public.is_admin() or public.get_user_perfil_codigo() in ('diretor', 'rh'));

create policy "receitas_select" on receitas for select
  using (public.is_admin() or public.get_user_perfil_codigo() in ('diretor', 'financeiro'));

create policy "receitas_manage" on receitas for all
  using (public.is_admin() or public.get_user_perfil_codigo() in ('diretor', 'financeiro'));

create policy "despesas_select" on despesas for select
  using (public.is_admin() or public.get_user_perfil_codigo() in ('diretor', 'financeiro'));

create policy "despesas_manage" on despesas for all
  using (public.is_admin() or public.get_user_perfil_codigo() in ('diretor', 'financeiro'));

create policy "solicitacoes_select" on solicitacoes_compra for select
  using (
    public.is_admin()
    or solicitante_id = auth.uid()
    or public.get_user_perfil_codigo() in ('diretor', 'compras')
  );

create policy "solicitacoes_insert" on solicitacoes_compra for insert
  with check (auth.role() = 'authenticated');

create policy "solicitacoes_manage" on solicitacoes_compra for update
  using (public.is_admin() or public.get_user_perfil_codigo() in ('diretor', 'compras'));

create policy "itens_select" on itens for select
  using (
    public.is_admin()
    or public.get_user_perfil_codigo() in ('diretor', 'almoxarifado', 'compras')
  );

create policy "itens_manage" on itens for all
  using (public.is_admin() or public.get_user_perfil_codigo() in ('diretor', 'almoxarifado'));

create policy "bens_select" on bens_patrimoniais for select
  using (
    public.is_admin()
    or public.get_user_perfil_codigo() in ('diretor', 'patrimonio')
  );

create policy "bens_manage" on bens_patrimoniais for all
  using (public.is_admin() or public.get_user_perfil_codigo() in ('diretor', 'patrimonio'));

-- ============================================================
-- RLS POLICIES - SERVICES
-- ============================================================

create policy "obras_select" on obras for select
  using (auth.role() = 'authenticated');

create policy "obras_manage" on obras for all
  using (public.is_admin() or public.get_user_perfil_codigo() in ('diretor', 'biblioteca'));

create policy "chamados_ti_select" on chamados_ti for select
  using (
    public.is_admin()
    or solicitante_id = auth.uid()
    or atendente_id = auth.uid()
    or public.get_user_perfil_codigo() in ('diretor', 'ti')
  );

create policy "chamados_ti_insert" on chamados_ti for insert
  with check (auth.role() = 'authenticated');

create policy "chamados_ti_update" on chamados_ti for update
  using (public.is_admin() or public.get_user_perfil_codigo() in ('diretor', 'ti'));

create policy "manifestacoes_insert" on manifestacoes for insert
  with check (true);

create policy "manifestacoes_select" on manifestacoes for select
  using (public.is_admin() or public.get_user_perfil_codigo() in ('ouvidoria', 'diretor'));

create policy "manifestacoes_manage" on manifestacoes for update
  using (public.is_admin() or public.get_user_perfil_codigo() in ('ouvidoria', 'diretor'));

create policy "processos_select" on processos for select
  using (
    public.is_admin()
    or public.get_user_perfil_codigo() in ('diretor', 'secretaria')
  );

create policy "processos_manage" on processos for all
  using (public.is_admin() or public.get_user_perfil_codigo() in ('diretor', 'secretaria'));

create policy "projetos_select" on projetos for select
  using (
    public.is_admin()
    or responsavel_id = auth.uid()
    or public.get_user_perfil_codigo() in ('diretor', 'coordenador')
  );

create policy "projetos_manage" on projetos for all
  using (public.is_admin() or public.get_user_perfil_codigo() in ('diretor', 'coordenador'));

create policy "documentos_select" on documentos for select
  using (auth.role() = 'authenticated');

create policy "documentos_insert" on documentos for insert
  with check (usuario_id = auth.uid() or public.is_admin());

create policy "documentos_update" on documentos for update
  using (usuario_id = auth.uid() or public.is_admin());
