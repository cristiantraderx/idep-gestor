-- ============================================================
-- IDEP-Gestor · Migration 00003: Módulos de Gestão
-- RH, Financeiro, Compras, Almoxarifado, Patrimônio
-- ============================================================

-- ==================== RECURSOS HUMANOS ====================

-- PROFESSORES (Teachers - linked to usuarios)
create table if not exists professores (
  id              uuid primary key default gen_random_uuid(),
  usuario_id      uuid references usuarios(id),
  unidade_id      uuid not null references unidades(id),
  nome            text not null,
  cpf             text unique,
  email           text,
  telefone        text,
  formacao        text,
  especializacao  text,
  titulacao       text check (titulacao in ('graduacao', 'especializacao', 'mestrado', 'doutorado')),
  data_contrato   date,
  regime_trabalho text check (regime_trabalho in ('clt', 'estatutario', 'temporario', 'terceirizado')),
  carga_horaria   integer,
  ativo           boolean default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- SERVIDORES (Employees - non-teaching staff)
create table if not exists servidores (
  id              uuid primary key default gen_random_uuid(),
  usuario_id      uuid references usuarios(id),
  unidade_id      uuid not null references unidades(id),
  nome            text not null,
  cpf             text unique,
  cargo           text not null,
  setor           text,
  email           text,
  telefone        text,
  data_admissao   date,
  regime          text check (regime in ('clt', 'estatutario', 'comissionado', 'temporario', 'terceirizado')),
  carga_horaria   integer,
  ativo           boolean default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- CONTRATOS (Contracts)
create table if not exists contratos (
  id              uuid primary key default gen_random_uuid(),
  unidade_id      uuid not null references unidades(id),
  tipo            text not null check (tipo in ('professor', 'servidor', 'prestador_servico', 'fornecedor')),
  contratado_id   uuid, -- FK depends on tipo
  contratado_nome text not null,
  objeto          text,
  valor           numeric(12,2),
  data_inicio     date not null,
  data_fim        date,
  status          text default 'ativo' check (status in ('ativo', 'vigente', 'expirado', 'rescindido')),
  arquivo_url     text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- FERIAS (Vacations)
create table if not exists ferias (
  id              uuid primary key default gen_random_uuid(),
  servidor_id     uuid references servidores(id) on delete cascade,
  professor_id    uuid references professores(id) on delete cascade,
  data_inicio     date not null,
  data_fim        date not null,
  periodo         integer not null, -- which vacation period
  status          text default 'agendada' check (status in ('agendada', 'concedida', 'cancelada')),
  created_at      timestamptz default now()
);

-- LICENCAS (Leave of absence)
create table if not exists licencas (
  id              uuid primary key default gen_random_uuid(),
  servidor_id     uuid references servidores(id) on delete cascade,
  professor_id    uuid references professores(id) on delete cascade,
  tipo            text not null check (tipo in ('medica', 'maternidade', 'paternidade', 'premio', 'sem_vencimento', 'interesse_particular')),
  data_inicio     date not null,
  data_fim        date,
  observacao      text,
  created_at      timestamptz default now()
);

-- ==================== FINANCEIRO ====================

-- CENTROS_CUSTO (Cost centers)
create table if not exists centros_custo (
  id              uuid primary key default gen_random_uuid(),
  unidade_id      uuid not null references unidades(id),
  nome            text not null,
  codigo          text unique,
  descricao       text,
  ativo           boolean default true,
  created_at      timestamptz default now()
);

-- RECEITAS (Revenue)
create table if not exists receitas (
  id              uuid primary key default gen_random_uuid(),
  unidade_id      uuid not null references unidades(id),
  centro_custo_id uuid references centros_custo(id),
  descricao       text not null,
  valor           numeric(12,2) not null,
  data_recebimento date not null,
  categoria       text check (categoria in ('mensalidade', 'convenio', 'subvencao', 'projeto', 'outros')),
  origem          text,
  documento       text,
  created_at      timestamptz default now()
);

-- DESPESAS (Expenses)
create table if not exists despesas (
  id              uuid primary key default gen_random_uuid(),
  unidade_id      uuid not null references unidades(id),
  centro_custo_id uuid references centros_custo(id),
  descricao       text not null,
  valor           numeric(12,2) not null,
  data_pagamento  date not null,
  categoria       text check (categoria in ('pessoal', 'material', 'servico', 'utilidade', 'investimento', 'outros')),
  empenho_id      text,
  documento       text,
  created_at      timestamptz default now()
);

-- CONTRATOS_FINANCEIROS (Financial contracts) 
-- (separate from HR contracts for clarity)
create table if not exists contratos_financeiros (
  id              uuid primary key default gen_random_uuid(),
  unidade_id      uuid not null references unidades(id),
  numero          text unique,
  fornecedor      text not null,
  objeto          text,
  valor_global    numeric(12,2),
  valor_mensal    numeric(12,2),
  data_inicio     date not null,
  data_fim        date,
  status          text default 'vigente' check (status in ('vigente', 'encerrado', 'rescindido')),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- FLUXO_CAIXA (Cash flow view - materialized periodically)
create table if not exists fluxo_caixa (
  id              uuid primary key default gen_random_uuid(),
  unidade_id      uuid not null references unidades(id),
  data            date not null,
  saldo_anterior  numeric(12,2) default 0,
  total_receitas  numeric(12,2) default 0,
  total_despesas  numeric(12,2) default 0,
  saldo_atual     numeric(12,2) default 0,
  created_at      timestamptz default now(),
  unique(unidade_id, data)
);

-- ==================== COMPRAS E LICITAÇÕES ====================

-- FORNECEDORES (Suppliers)
create table if not exists fornecedores (
  id              uuid primary key default gen_random_uuid(),
  unidade_id      uuid references unidades(id),
  nome            text not null,
  cnpj            text unique,
  email           text,
  telefone        text,
  endereco        text,
  contato         text,
  categorias      text[],
  aprovado        boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- SOLICITACOES_COMPRA (Purchase requests)
create table if not exists solicitacoes_compra (
  id              uuid primary key default gen_random_uuid(),
  unidade_id      uuid not null references unidades(id),
  solicitante_id  uuid not null references usuarios(id),
  descricao       text not null,
  justificativa   text,
  prioridade      text default 'normal' check (prioridade in ('baixa', 'normal', 'alta', 'urgente')),
  status          text default 'rascunho' check (status in ('rascunho', 'aprovado', 'cotacao', 'ordenado', 'recebido', 'cancelado')),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ITENS_SOLICITACAO (Purchase request items)
create table if not exists itens_solicitacao (
  id                uuid primary key default gen_random_uuid(),
  solicitacao_id    uuid not null references solicitacoes_compra(id) on delete cascade,
  descricao         text not null,
  quantidade        integer not null,
  unidade_medida    text,
  valor_estimado    numeric(10,2),
  created_at        timestamptz default now()
);

-- COTACOES (Quotes)
create table if not exists cotacoes (
  id              uuid primary key default gen_random_uuid(),
  solicitacao_id  uuid not null references solicitacoes_compra(id) on delete cascade,
  fornecedor_id   uuid not null references fornecedores(id),
  numero          text,
  data_validade   date,
  valor_total     numeric(12,2),
  status          text default 'pendente' check (status in ('pendente', 'aprovada', 'recusada')),
  arquivo_url     text,
  created_at      timestamptz default now()
);

-- ORDENS_COMPRA (Purchase orders)
create table if not exists ordens_compra (
  id              uuid primary key default gen_random_uuid(),
  unidade_id      uuid not null references unidades(id),
  solicitacao_id  uuid references solicitacoes_compra(id),
  fornecedor_id   uuid not null references fornecedores(id),
  numero          text unique,
  data_emissao    date default current_date,
  valor_total     numeric(12,2),
  status          text default 'emitida' check (status in ('emitida', 'aprovada', 'entregue_parcial', 'entregue_total', 'cancelada')),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ITENS_ORDEM_COMPRA (Purchase order items)
create table if not exists itens_ordem_compra (
  id                uuid primary key default gen_random_uuid(),
  ordem_compra_id   uuid not null references ordens_compra(id) on delete cascade,
  descricao         text not null,
  quantidade        integer not null,
  valor_unitario    numeric(10,2),
  quantidade_recebida integer default 0,
  created_at        timestamptz default now()
);

-- LICITACOES (Bids)
create table if not exists licitacoes (
  id              uuid primary key default gen_random_uuid(),
  unidade_id      uuid not null references unidades(id),
  numero          text unique,
  modalidade      text check (modalidade in ('pregao', 'concorrencia', 'tomada_precos', 'convite', 'concurso', 'leilao')),
  objeto          text not null,
  data_abertura   date,
  data_julgamento date,
  valor_estimado  numeric(12,2),
  status          text default 'planejada' check (status in ('planejada', 'publicada', 'em_andamento', 'adjudicada', 'homologada', 'cancelada')),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ==================== ALMOXARIFADO ====================

-- CATEGORIAS_ITEM (Item categories)
create table if not exists categorias_item (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  descricao   text,
  created_at  timestamptz default now()
);

-- ITEMS (Stock items)
create table if not exists itens (
  id                uuid primary key default gen_random_uuid(),
  unidade_id        uuid not null references unidades(id),
  categoria_id      uuid references categorias_item(id),
  nome              text not null,
  codigo            text,
  descricao         text,
  unidade_medida    text,
  quantidade_minima numeric(10,2) default 0,
  quantidade_atual  numeric(10,2) default 0,
  valor_unitario    numeric(10,2),
  localizacao       text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- MOVIMENTACOES_ESTOQUE (Stock movements)
create table if not exists movimentacoes_estoque (
  id              uuid primary key default gen_random_uuid(),
  unidade_id      uuid not null references unidades(id),
  item_id         uuid not null references itens(id) on delete cascade,
  tipo            text not null check (tipo in ('entrada', 'saida', 'transferencia', 'ajuste', 'inventario')),
  quantidade      numeric(10,2) not null,
  valor_unitario  numeric(10,2),
  documento       text,
  observacao      text,
  usuario_id      uuid references usuarios(id),
  created_at      timestamptz default now()
);

-- TRANSFERENCIAS_ESTOQUE (Stock transfers between units)
create table if not exists transferencias_estoque (
  id              uuid primary key default gen_random_uuid(),
  item_id         uuid not null references itens(id),
  origem_unidade  uuid not null references unidades(id),
  destino_unidade uuid not null references unidades(id),
  quantidade      numeric(10,2) not null,
  status          text default 'pendente' check (status in ('pendente', 'aprovada', 'em_transito', 'recebida', 'cancelada')),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ==================== PATRIMÔNIO ====================

-- BENS_PATRIMONIAIS (Fixed assets)
create table if not exists bens_patrimoniais (
  id              uuid primary key default gen_random_uuid(),
  unidade_id      uuid not null references unidades(id),
  numero_tombo    text unique,
  nome            text not null,
  descricao       text,
  categoria       text check (categoria in ('moveis', 'equipamentos', 'veiculos', 'imoveis', 'informatica', 'outros')),
  localizacao     text,
  responsavel_id  uuid references usuarios(id),
  valor_aquisicao numeric(12,2),
  data_aquisicao  date,
  data_garantia   date,
  vida_util_anos  integer,
  estado          text default 'bom' check (estado in ('novo', 'bom', 'regular', 'ruim', 'inservivel')),
  status          text default 'ativo' check (status in ('ativo', 'manutencao', 'baixado', 'transferido')),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- MOVIMENTACOES_BENS (Asset movements)
create table if not exists movimentacoes_bens (
  id              uuid primary key default gen_random_uuid(),
  bem_id          uuid not null references bens_patrimoniais(id) on delete cascade,
  tipo            text not null check (tipo in ('transferencia', 'manutencao', 'baixa', 'emprestimo')),
  origem          text,
  destino         text,
  data_movimento  date not null,
  observacao      text,
  created_at      timestamptz default now()
);

-- MANUTENCOES (Maintenance records)
create table if not exists manutencoes (
  id              uuid primary key default gen_random_uuid(),
  bem_id          uuid not null references bens_patrimoniais(id) on delete cascade,
  tipo            text check (tipo in ('preventiva', 'corretiva', 'emergencial')),
  descricao       text not null,
  data_inicio     date,
  data_fim        date,
  custo           numeric(10,2),
  prestador       text,
  status          text default 'aberta' check (status in ('aberta', 'em_andamento', 'concluida', 'cancelada')),
  created_at      timestamptz default now()
);

-- Indexes
create index if not exists idx_professores_unidade on professores(unidade_id);
create index if not exists idx_servidores_unidade on servidores(unidade_id);
create index if not exists idx_receitas_unidade on receitas(unidade_id);
create index if not exists idx_despesas_unidade on despesas(unidade_id);
create index if not exists idx_solicitacoes_unidade on solicitacoes_compra(unidade_id);
create index if not exists idx_itens_unidade on itens(unidade_id);
create index if not exists idx_bens_unidade on bens_patrimoniais(unidade_id);
create index if not exists idx_movimentacoes_estoque_item on movimentacoes_estoque(item_id);
create index if not exists idx_movimentacoes_estoque_data on movimentacoes_estoque(created_at desc);

-- Triggers
create trigger set_updated_at_professores
  before update on professores for each row execute function trigger_set_updated_at();
create trigger set_updated_at_servidores
  before update on servidores for each row execute function trigger_set_updated_at();
create trigger set_updated_at_fornecedores
  before update on fornecedores for each row execute function trigger_set_updated_at();
create trigger set_updated_at_itens
  before update on itens for each row execute function trigger_set_updated_at();
create trigger set_updated_at_bens
  before update on bens_patrimoniais for each row execute function trigger_set_updated_at();

-- Auto-update stock quantity on movement
create or replace function trigger_atualizar_estoque()
returns trigger as $$
begin
  if new.tipo = 'entrada' then
    update itens set quantidade_atual = quantidade_atual + new.quantidade
    where id = new.item_id;
  elsif new.tipo = 'saida' then
    update itens set quantidade_atual = quantidade_atual - new.quantidade
    where id = new.item_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger after_movimentacao_estoque
  after insert on movimentacoes_estoque
  for each row execute function trigger_atualizar_estoque();
