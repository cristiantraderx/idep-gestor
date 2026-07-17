-- ============================================================
-- IDEP-Gestor · Migration 00004: Módulos de Serviços
-- Biblioteca, Agenda, TI, Ouvidoria, Protocolo, Projetos, GED
-- ============================================================

-- ==================== BIBLIOTECA ====================

-- OBRAS (Collection items - books, etc.)
create table if not exists obras (
  id              uuid primary key default gen_random_uuid(),
  unidade_id      uuid not null references unidades(id),
  titulo          text not null,
  autor           text,
  editora         text,
  ano             integer,
  edicao          text,
  isbn            text unique,
  codigo_barras   text,
  qr_code         text,
  categoria       text,
  localizacao     text,
  exemplares_total integer default 1,
  exemplares_disponiveis integer default 1,
  tipo            text default 'livro' check (tipo in ('livro', 'revista', 'artigo', 'tcc', 'dissertacao', 'tese', 'periodico')),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- EMPRESTIMOS (Loans)
create table if not exists emprestimos (
  id              uuid primary key default gen_random_uuid(),
  unidade_id      uuid not null references unidades(id),
  obra_id         uuid not null references obras(id) on delete cascade,
  aluno_id        uuid references alunos(id),
  professor_id    uuid references professores(id),
  servidor_id     uuid references servidores(id),
  data_emprestimo date not null default current_date,
  data_devolucao  date,
  data_prevista   date not null,
  renovacoes      integer default 0,
  status          text default 'ativo' check (status in ('ativo', 'devolvido', 'atrasado', 'renovado')),
  created_at      timestamptz default now()
);

-- RESERVAS (Reservations)
create table if not exists reservas (
  id              uuid primary key default gen_random_uuid(),
  obra_id         uuid not null references obras(id) on delete cascade,
  aluno_id        uuid references alunos(id),
  professor_id    uuid references professores(id),
  data_reserva    date not null default current_date,
  data_validade   date not null,
  status          text default 'ativa' check (status in ('ativa', 'atendida', 'cancelada')),
  created_at      timestamptz default now()
);

-- MULTAS (Fines)
create table if not exists multas (
  id              uuid primary key default gen_random_uuid(),
  emprestimo_id   uuid not null references emprestimos(id) on delete cascade,
  valor           numeric(8,2) not null,
  dias_atraso     integer,
  paga            boolean default false,
  data_pagamento  date,
  created_at      timestamptz default now()
);

-- ==================== AGENDA INSTITUCIONAL ====================

-- EVENTOS (Events)
create table if not exists eventos (
  id              uuid primary key default gen_random_uuid(),
  unidade_id      uuid not null references unidades(id),
  titulo          text not null,
  descricao       text,
  tipo            text check (tipo in ('evento', 'reuniao', 'aula_inaugural', 'palestra', 'workshop', 'formatura', 'outro')),
  data_inicio     timestamptz not null,
  data_fim        timestamptz,
  local           text,
  responsavel_id  uuid references usuarios(id),
  publico_alvo    text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- RESERVAS_SALAS (Room reservations)
create table if not exists reservas_salas (
  id              uuid primary key default gen_random_uuid(),
  unidade_id      uuid not null references unidades(id),
  sala            text not null,
  tipo            text default 'sala' check (tipo in ('sala', 'laboratorio', 'auditorio', 'sala_reuniao')),
  solicitante_id  uuid not null references usuarios(id),
  data_reserva    date not null,
  hora_inicio     time not null,
  hora_fim        time not null,
  observacao      text,
  status          text default 'pendente' check (status in ('pendente', 'aprovada', 'recusada', 'cancelada')),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ==================== TI (TECNOLOGIA) ====================

-- CHAMADOS_TI (IT tickets)
create table if not exists chamados_ti (
  id              uuid primary key default gen_random_uuid(),
  unidade_id      uuid not null references unidades(id),
  solicitante_id  uuid not null references usuarios(id),
  atendente_id    uuid references usuarios(id),
  titulo          text not null,
  descricao       text not null,
  categoria       text check (categoria in ('hardware', 'software', 'rede', 'impressao', 'email', 'acesso', 'outro')),
  prioridade      text default 'normal' check (prioridade in ('baixa', 'normal', 'alta', 'critica')),
  status          text default 'aberto' check (status in ('aberto', 'em_andamento', 'aguardando', 'resolvido', 'fechado', 'cancelado')),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- EQUIPAMENTOS_TI (IT equipment inventory)
create table if not exists equipamentos_ti (
  id              uuid primary key default gen_random_uuid(),
  unidade_id      uuid not null references unidades(id),
  tipo            text not null check (tipo in ('desktop', 'notebook', 'servidor', 'impressora', 'monitor', 'switch', 'roteador', 'projetor', 'outro')),
  patrimonio_id   uuid references bens_patrimoniais(id),
  numeracao       text unique,
  marca           text,
  modelo          text,
  numero_serie    text,
  especificacoes  jsonb,
  localizacao     text,
  usuario         text,
  status          text default 'ativo' check (status in ('ativo', 'manutencao', 'descarte', 'estoque')),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- LICENCAS_SOFTWARE (Software licenses)
create table if not exists licencas_software (
  id              uuid primary key default gen_random_uuid(),
  unidade_id      uuid not null references unidades(id),
  nome            text not null,
  fornecedor      text,
  tipo            text check (tipo in ('proprietario', 'opensource', 'saas')),
  numero_licenca  text,
  quantidade      integer default 1,
  data_validade   date,
  valor           numeric(10,2),
  status          text default 'ativa' check (status in ('ativa', 'expirada', 'cancelada')),
  created_at      timestamptz default now()
);

-- ==================== OUVIDORIA ====================

-- MANIFESTACOES (Ombudsman records)
create table if not exists manifestacoes (
  id              uuid primary key default gen_random_uuid(),
  unidade_id      uuid not null references unidades(id),
  tipo            text not null check (tipo in ('reclamacao', 'sugestao', 'elogio', 'denuncia', 'informacao')),
  protocolo       text unique,
  assunto         text not null,
  descricao       text not null,
  manifestante_nome   text,
  manifestante_email  text,
  manifestante_telefone text,
  anonimo         boolean default false,
  status          text default 'recebida' check (status in ('recebida', 'em_analise', 'respondida', 'encaminhada', 'concluida', 'arquivada')),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- RESPOSTAS_MANIFESTACOES (Responses to ombudsman records)
create table if not exists respostas_manifestacoes (
  id                uuid primary key default gen_random_uuid(),
  manifestacao_id   uuid not null references manifestacoes(id) on delete cascade,
  resposta          text not null,
  responsavel_id    uuid references usuarios(id),
  created_at        timestamptz default now()
);

-- ==================== PROTOCOLO DIGITAL ====================

-- PROCESSOS (Digital processes)
create table if not exists processos (
  id              uuid primary key default gen_random_uuid(),
  unidade_id      uuid not null references unidades(id),
  numero          text unique,
  titulo          text not null,
  tipo            text not null,
  interessado     text,
  status          text default 'aberto' check (status in ('aberto', 'em_tramitacao', 'aguardando', 'concluido', 'arquivado')),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- TRAMITACOES (Process tracking)
create table if not exists tramitacoes (
  id              uuid primary key default gen_random_uuid(),
  processo_id     uuid not null references processos(id) on delete cascade,
  origem_setor    text not null,
  destino_setor   text not null,
  observacao      text,
  usuario_id      uuid references usuarios(id),
  created_at      timestamptz default now()
);

-- ==================== PROJETOS ====================

-- PROJETOS (Projects)
create table if not exists projetos (
  id              uuid primary key default gen_random_uuid(),
  unidade_id      uuid not null references unidades(id),
  nome            text not null,
  codigo          text unique,
  descricao       text,
  responsavel_id  uuid references usuarios(id),
  orcamento       numeric(12,2),
  data_inicio     date,
  data_fim        date,
  status          text default 'planejado' check (status in ('planejado', 'em_andamento', 'concluido', 'cancelado')),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ETAPAS_PROJETO (Project milestones)
create table if not exists etapas_projeto (
  id              uuid primary key default gen_random_uuid(),
  projeto_id      uuid not null references projetos(id) on delete cascade,
  nome            text not null,
  descricao       text,
  data_inicio     date,
  data_fim        date,
  percentual      integer default 0,
  status          text default 'pendente' check (status in ('pendente', 'em_andamento', 'concluida', 'cancelada')),
  created_at      timestamptz default now()
);

-- ==================== GED (DOCUMENTOS) ====================

-- DOCUMENTOS (Digital documents)
create table if not exists documentos (
  id              uuid primary key default gen_random_uuid(),
  unidade_id      uuid not null references unidades(id),
  titulo          text not null,
  descricao       text,
  tipo            text,
  categoria       text,
  arquivo_url     text not null,
  arquivo_tamanho integer,
  arquivo_tipo    text,
  hash_documento  text,
  versao          integer default 1,
  usuario_id      uuid references usuarios(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- VERSAO_DOCUMENTOS (Document versions)
create table if not exists versao_documentos (
  id              uuid primary key default gen_random_uuid(),
  documento_id    uuid not null references documentos(id) on delete cascade,
  versao          integer not null,
  arquivo_url     text not null,
  arquivo_tamanho integer,
  hash_documento  text,
  alterado_por    uuid references usuarios(id),
  observacao      text,
  created_at      timestamptz default now()
);

-- Indexes
create index if not exists idx_obras_unidade on obras(unidade_id);
create index if not exists idx_emprestimos_obra on emprestimos(obra_id);
create index if not exists idx_emprestimos_status on emprestimos(status);
create index if not exists idx_chamados_ti_unidade on chamados_ti(unidade_id);
create index if not exists idx_chamados_ti_status on chamados_ti(status);
create index if not exists idx_manifestacoes_unidade on manifestacoes(unidade_id);
create index if not exists idx_manifestacoes_status on manifestacoes(status);
create index if not exists idx_processos_unidade on processos(unidade_id);
create index if not exists idx_processos_status on processos(status);
create index if not exists idx_projetos_unidade on projetos(unidade_id);
create index if not exists idx_documentos_unidade on documentos(unidade_id);
create index if not exists idx_reservas_salas_data on reservas_salas(data_reserva);
create index if not exists idx_eventos_data on eventos(data_inicio);

-- Triggers
create trigger set_updated_at_obras
  before update on obras for each row execute function trigger_set_updated_at();
create trigger set_updated_at_chamados_ti
  before update on chamados_ti for each row execute function trigger_set_updated_at();
create trigger set_updated_at_processos
  before update on processos for each row execute function trigger_set_updated_at();
create trigger set_updated_at_projetos
  before update on projetos for each row execute function trigger_set_updated_at();
create trigger set_updated_at_documentos
  before update on documentos for each row execute function trigger_set_updated_at();

-- Auto-decrement available copies on loan
create or replace function trigger_atualizar_exemplares()
returns trigger as $$
begin
  if TG_OP = 'INSERT' and new.status = 'ativo' then
    update obras set exemplares_disponiveis = exemplares_disponiveis - 1
    where id = new.obra_id;
  elsif TG_OP = 'UPDATE' and new.status = 'devolvido' and old.status = 'ativo' then
    update obras set exemplares_disponiveis = exemplares_disponiveis + 1
    where id = new.obra_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger after_emprestimo_change
  after insert or update on emprestimos
  for each row execute function trigger_atualizar_exemplares();
