-- ============================================================
-- IDEP-Gestor · Migration 00002: Módulo Acadêmico
-- Cursos, disciplinas, turmas, alunos, matrículas, notas, frequência
-- ============================================================

-- 1. CURSOS (Courses)
create table if not exists cursos (
  id              uuid primary key default gen_random_uuid(),
  unidade_id      uuid not null references unidades(id),
  nome            text not null,
  codigo          text unique,
  descricao       text,
  tipo            text not null check (tipo in ('tecnico', 'graduacao', 'pos_graduacao', 'extensao', 'qualificacao')),
  modalidade      text default 'presencial' check (modalidade in ('presencial', 'ead', 'hibrido')),
  carga_horaria   integer,
  duracao_semestres integer,
  ativo           boolean default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- 2. DISCIPLINAS (Subjects)
create table if not exists disciplinas (
  id              uuid primary key default gen_random_uuid(),
  curso_id        uuid not null references cursos(id) on delete cascade,
  nome            text not null,
  codigo          text,
  carga_horaria   integer,
  ementa          text,
  semestre        integer,
  ativo           boolean default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- 3. TURMAS (Classes/Groups)
create table if not exists turmas (
  id              uuid primary key default gen_random_uuid(),
  unidade_id      uuid not null references unidades(id),
  curso_id        uuid not null references cursos(id),
  nome            text not null,
  codigo          text unique,
  turno           text check (turno in ('matutino', 'vespertino', 'noturno', 'integral')),
  sala            text,
  vagas           integer default 40,
  data_inicio     date,
  data_fim        date,
  semestre        text,
  ano             integer,
  ativo           boolean default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- 4. ALUNOS (Students)
create table if not exists alunos (
  id              uuid primary key default gen_random_uuid(),
  usuario_id      uuid references usuarios(id),
  unidade_id      uuid not null references unidades(id),
  nome            text not null,
  cpf             text unique,
  rg              text,
  data_nascimento date,
  email           text,
  telefone        text,
  celular         text,
  endereco        text,
  cidade          text,
  estado          text default 'RO',
  nacionalidade   text default 'Brasileira',
  nome_mae        text,
  nome_pai        text,
  foto_url        text,
  ativo           boolean default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- 5. MATRICULAS (Enrollments)
create table if not exists matriculas (
  id              uuid primary key default gen_random_uuid(),
  aluno_id        uuid not null references alunos(id) on delete cascade,
  turma_id        uuid not null references turmas(id) on delete cascade,
  curso_id        uuid not null references cursos(id),
  unidade_id      uuid not null references unidades(id),
  numero          text unique,
  data_matricula  date default current_date,
  status          text default 'ativo' check (status in ('ativo', 'trancado', 'concluido', 'cancelado', 'transferido')),
  forma_ingresso  text check (forma_ingresso in ('vestibular', 'enem', 'transferencia', 'portador_diploma', 'reingresso')),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique(aluno_id, turma_id)
);

-- 6. TURMA_DISCIPLINAS (Class-Subject assignment)
create table if not exists turma_disciplinas (
  id              uuid primary key default gen_random_uuid(),
  turma_id        uuid not null references turmas(id) on delete cascade,
  disciplina_id   uuid not null references disciplinas(id) on delete cascade,
  professor_id    uuid,
  dia_semana      integer check (dia_semana between 1 and 7),
  horario_inicio  time,
  horario_fim     time,
  created_at      timestamptz default now(),
  unique(turma_id, disciplina_id)
);

-- 7. CALENDARIO_ACADEMICO (Academic calendar)
create table if not exists calendario_academico (
  id              uuid primary key default gen_random_uuid(),
  unidade_id      uuid not null references unidades(id),
  turma_id        uuid references turmas(id) on delete cascade,
  titulo          text not null,
  descricao       text,
  tipo            text not null check (tipo in ('aula', 'prova', 'feriado', 'evento', 'recesso', 'matricula')),
  data_inicio     date not null,
  data_fim        date,
  created_at      timestamptz default now()
);

-- 8. NOTAS (Grades)
create table if not exists notas (
  id              uuid primary key default gen_random_uuid(),
  matricula_id    uuid not null references matriculas(id) on delete cascade,
  disciplina_id   uuid not null references disciplinas(id) on delete cascade,
  avaliacao       text not null, -- e.g., 'AV1', 'AV2', 'AV3', 'REC', 'FINAL'
  valor           numeric(5,2) not null check (valor >= 0 and valor <= 10),
  peso            numeric(3,2) default 1.0,
  data_avaliacao  date,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- 9. FREQUENCIA (Attendance)
create table if not exists frequencia (
  id              uuid primary key default gen_random_uuid(),
  matricula_id    uuid not null references matriculas(id) on delete cascade,
  disciplina_id   uuid not null references disciplinas(id) on delete cascade,
  data_aula       date not null,
  presente        boolean not null default true,
  justificativa   text,
  created_at      timestamptz default now(),
  unique(matricula_id, disciplina_id, data_aula)
);

-- 10. HISTORICO_ESCOLAR (Academic history)
create table if not exists historico_escolar (
  id              uuid primary key default gen_random_uuid(),
  aluno_id        uuid not null references alunos(id) on delete cascade,
  matricula_id    uuid references matriculas(id),
  curso_id        uuid not null references cursos(id),
  disciplina_id   uuid not null references disciplinas(id),
  nota_final      numeric(5,2),
  frequencia_pct  numeric(5,2),
  status          text check (status in ('aprovado', 'reprovado', 'cursando', 'dispensado')),
  created_at      timestamptz default now()
);

-- Unique index for historico_escolar UPSERT
create unique index if not exists idx_historico_unique on historico_escolar(aluno_id, disciplina_id) where matricula_id is not null;

-- Indexes
create index if not exists idx_cursos_unidade on cursos(unidade_id);
create index if not exists idx_disciplinas_curso on disciplinas(curso_id);
create index if not exists idx_turmas_unidade on turmas(unidade_id);
create index if not exists idx_turmas_curso on turmas(curso_id);
create index if not exists idx_alunos_unidade on alunos(unidade_id);
create index if not exists idx_matriculas_aluno on matriculas(aluno_id);
create index if not exists idx_matriculas_turma on matriculas(turma_id);
create index if not exists idx_matriculas_status on matriculas(status);
create index if not exists idx_notas_matricula on notas(matricula_id);
create index if not exists idx_notas_disciplina on notas(disciplina_id);
create index if not exists idx_frequencia_matricula on frequencia(matricula_id);
create index if not exists idx_frequencia_data on frequencia(data_aula);
create index if not exists idx_historico_aluno on historico_escolar(aluno_id);
create index if not exists idx_calendario_unidade on calendario_academico(unidade_id);

-- Triggers
create trigger set_updated_at_cursos
  before update on cursos for each row execute function trigger_set_updated_at();
create trigger set_updated_at_disciplinas
  before update on disciplinas for each row execute function trigger_set_updated_at();
create trigger set_updated_at_turmas
  before update on turmas for each row execute function trigger_set_updated_at();
create trigger set_updated_at_alunos
  before update on alunos for each row execute function trigger_set_updated_at();
create trigger set_updated_at_matriculas
  before update on matriculas for each row execute function trigger_set_updated_at();
create trigger set_updated_at_notas
  before update on notas for each row execute function trigger_set_updated_at();

-- Auto-create historico on grade update
create or replace function trigger_atualizar_historico()
returns trigger as $$
declare
  v_aluno_id uuid;
  v_curso_id uuid;
  v_nota_final numeric(5,2);
  v_freq_pct numeric(5,2);
begin
  select m.aluno_id, m.curso_id into v_aluno_id, v_curso_id
  from matriculas m where m.id = new.matricula_id;

  -- Calculate final grade (weighted average)
  select round(sum(n.valor * n.peso) / sum(n.peso), 2) into v_nota_final
  from notas n
  where n.matricula_id = new.matricula_id and n.disciplina_id = new.disciplina_id;

  -- Calculate attendance percentage
  select round(
    (count(*) filter (where f.presente = true)::numeric / count(*)::numeric) * 100, 2
  ) into v_freq_pct
  from frequencia f
  where f.matricula_id = new.matricula_id and f.disciplina_id = new.disciplina_id;

  -- Upsert historico
  insert into historico_escolar (aluno_id, matricula_id, curso_id, disciplina_id, nota_final, frequencia_pct, status)
  values (v_aluno_id, new.matricula_id, v_curso_id, new.disciplina_id, v_nota_final, v_freq_pct,
    case when v_nota_final >= 6.0 and (v_freq_pct >= 75 or v_freq_pct is null) then 'aprovado'
         when v_nota_final is null then 'cursando'
         else 'reprovado' end
  )
  on conflict (aluno_id, disciplina_id) where matricula_id is not null
  do update set nota_final = v_nota_final, frequencia_pct = v_freq_pct,
    status = case when v_nota_final >= 6.0 and (v_freq_pct >= 75 or v_freq_pct is null) then 'aprovado'
                 when v_nota_final is null then 'cursando'
                 else 'reprovado' end;

  return new;
end;
$$ language plpgsql;

create trigger after_nota_insert
  after insert or update on notas
  for each row execute function trigger_atualizar_historico();
