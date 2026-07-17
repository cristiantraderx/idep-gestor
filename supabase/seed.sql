-- ============================================================
-- IDEP-Gestor · Seed Data
-- Dados iniciais para desenvolvimento e testes
-- ============================================================

-- 1. UNIDADES (3 units as specified)
insert into unidades (id, nome, sigla, tipo, cidade, estado) values
  ('10000000-0000-0000-0000-000000000001', 'Instituto Estadual de Desenvolvimento da Educação Profissional - Sede', 'IDEP-SEDE', 'sede', 'Porto Velho', 'RO'),
  ('10000000-0000-0000-0000-000000000002', 'Instituto Estadual de Desenvolvimento da Educação Profissional - Filial 01', 'IDEP-FILIAL01', 'filial', 'Ji-Paraná', 'RO'),
  ('10000000-0000-0000-0000-000000000003', 'Instituto Estadual de Desenvolvimento da Educação Profissional - Filial 02', 'IDEP-FILIAL02', 'filial', 'Ariquemes', 'RO');

-- 2. PERFIS (All 16 profiles as specified in the master prompt)
insert into perfis (id, nome, codigo, descricao, nivel, sistema) values
  ('20000000-0000-0000-0000-000000000001', 'Administrador Geral', 'admin_geral', 'Acesso total a todas as funcionalidades do sistema', 100, true),
  ('20000000-0000-0000-0000-000000000002', 'Diretor', 'diretor', 'Gestão institucional com acesso a todos os módulos da sua unidade', 90, true),
  ('20000000-0000-0000-0000-000000000003', 'Coordenador', 'coordenador', 'Coordenação acadêmica e pedagógica', 70, true),
  ('20000000-0000-0000-0000-000000000004', 'Supervisor', 'supervisor', 'Supervisão de processos e equipes', 65, true),
  ('20000000-0000-0000-0000-000000000005', 'Secretaria', 'secretaria', 'Gestão de secretaria acadêmica e protocolos', 60, true),
  ('20000000-0000-0000-0000-000000000006', 'Professor', 'professor', 'Acesso ao diário eletrônico, notas e frequência', 50, true),
  ('20000000-0000-0000-0000-000000000007', 'Aluno', 'aluno', 'Acesso ao portal do aluno (notas, frequência, documentos)', 10, true),
  ('20000000-0000-0000-0000-000000000008', 'RH', 'rh', 'Gestão de recursos humanos e contratos', 60, true),
  ('20000000-0000-0000-0000-000000000009', 'Financeiro', 'financeiro', 'Gestão financeira, receitas e despesas', 60, true),
  ('20000000-0000-0000-0000-000000000010', 'Compras', 'compras', 'Gestão de compras e licitações', 60, true),
  ('20000000-0000-0000-0000-000000000011', 'Almoxarifado', 'almoxarifado', 'Gestão de almoxarifado e estoque', 55, true),
  ('20000000-0000-0000-0000-000000000012', 'Patrimônio', 'patrimonio', 'Gestão de bens patrimoniais', 55, true),
  ('20000000-0000-0000-0000-000000000013', 'Biblioteca', 'biblioteca', 'Gestão da biblioteca e acervo', 55, true),
  ('20000000-0000-0000-0000-000000000014', 'TI', 'ti', 'Suporte de tecnologia da informação', 60, true),
  ('20000000-0000-0000-0000-000000000015', 'Ouvidoria', 'ouvidoria', 'Gestão de manifestações e ouvidoria', 55, true),
  ('20000000-0000-0000-0000-000000000016', 'Auditoria', 'auditoria', 'Acesso a logs e relatórios de auditoria', 80, true),
  ('20000000-0000-0000-0000-000000000017', 'Visitante', 'visitante', 'Acesso limitado apenas a visualizações básicas', 5, true);

-- 3. ADMIN DEFAULTS (will be linked when auth user is created)
-- Note: The admin user creation via auth.users happens through the Supabase dashboard or signup flow.
-- This seed creates the public.usuarios profile reference once the auth user exists.

-- 4. PERMISSIONS for admin_geral (all modules, all actions)
insert into permissoes (perfil_id, modulo, acao, escopo)
select
  '20000000-0000-0000-0000-000000000001',
  m.modulo,
  a.acao,
  'global'
from (
  values
    ('unidades'), ('perfis'), ('usuarios'), ('configuracoes'), ('auditoria'),
    ('cursos'), ('disciplinas'), ('turmas'), ('alunos'), ('matriculas'),
    ('notas'), ('frequencia'), ('historico'), ('calendario'),
    ('professores'), ('servidores'), ('contratos'), ('ferias'), ('licencas'),
    ('receitas'), ('despesas'), ('fluxo_caixa'), ('centros_custo'),
    ('fornecedores'), ('compras'), ('licitacoes'),
    ('itens'), ('estoque'), ('transferencias'),
    ('bens'), ('patrimonio'), ('manutencoes'),
    ('obras'), ('emprestimos'), ('reservas'), ('multas'),
    ('eventos'), ('reservas_salas'),
    ('chamados_ti'), ('equipamentos_ti'), ('licencas_software'),
    ('manifestacoes'),
    ('processos'), ('tramitacoes'),
    ('projetos'), ('etapas_projeto'),
    ('documentos'), ('versoes_documentos')
) as m(modulo)
cross join (
  values ('listar'), ('criar'), ('editar'), ('excluir'), ('exportar')
) as a(acao);

-- 5. PERMISSIONS for diretor (all modules at unit scope)
insert into permissoes (perfil_id, modulo, acao, escopo)
select
  '20000000-0000-0000-0000-000000000002',
  m.modulo,
  a.acao,
  'unidade'
from (
  values
    ('cursos'), ('disciplinas'), ('turmas'), ('alunos'), ('matriculas'),
    ('notas'), ('frequencia'), ('historico'), ('calendario'),
    ('professores'), ('servidores'), ('contratos'), ('ferias'), ('licencas'),
    ('receitas'), ('despesas'), ('fluxo_caixa'), ('centros_custo'),
    ('fornecedores'), ('compras'), ('licitacoes'),
    ('itens'), ('estoque'), ('transferencias'),
    ('bens'), ('patrimonio'), ('manutencoes'),
    ('obras'), ('emprestimos'), ('reservas'), ('multas'),
    ('eventos'), ('reservas_salas'),
    ('chamados_ti'), ('equipamentos_ti'),
    ('manifestacoes'),
    ('processos'), ('tramitacoes'),
    ('projetos'), ('etapas_projeto'),
    ('documentos'), ('versoes_documentos')
) as m(modulo)
cross join (
  values ('listar'), ('criar'), ('editar'), ('excluir'), ('exportar')
) as a(acao);

-- 6. PERMISSIONS for professor
insert into permissoes (perfil_id, modulo, acao, escopo)
values
  ('20000000-0000-0000-0000-000000000006', 'notas', 'listar', 'unidade'),
  ('20000000-0000-0000-0000-000000000006', 'notas', 'criar', 'proprio'),
  ('20000000-0000-0000-0000-000000000006', 'notas', 'editar', 'proprio'),
  ('20000000-0000-0000-0000-000000000006', 'frequencia', 'listar', 'unidade'),
  ('20000000-0000-0000-0000-000000000006', 'frequencia', 'criar', 'proprio'),
  ('20000000-0000-0000-0000-000000000006', 'frequencia', 'editar', 'proprio'),
  ('20000000-0000-0000-0000-000000000006', 'turmas', 'listar', 'unidade'),
  ('20000000-0000-0000-0000-000000000006', 'alunos', 'listar', 'unidade');

-- 7. PERMISSIONS for aluno
insert into permissoes (perfil_id, modulo, acao, escopo)
values
  ('20000000-0000-0000-0000-000000000007', 'notas', 'listar', 'proprio'),
  ('20000000-0000-0000-0000-000000000007', 'frequencia', 'listar', 'proprio'),
  ('20000000-0000-0000-0000-000000000007', 'historico', 'listar', 'proprio'),
  ('20000000-0000-0000-0000-000000000007', 'matriculas', 'listar', 'proprio'),
  ('20000000-0000-0000-0000-000000000007', 'eventos', 'listar', 'unidade'),
  ('20000000-0000-0000-0000-000000000007', 'obras', 'listar', 'unidade'),
  ('20000000-0000-0000-0000-000000000007', 'documentos', 'listar', 'proprio'),
  ('20000000-0000-0000-0000-000000000007', 'chamados_ti', 'criar', 'proprio'),
  ('20000000-0000-0000-0000-000000000007', 'chamados_ti', 'listar', 'proprio');

-- 8. DEMO CURSOS (for development)
insert into cursos (id, unidade_id, nome, codigo, tipo, modalidade, carga_horaria, duracao_semestres) values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Técnico em Enfermagem', 'TEC-ENF', 'tecnico', 'presencial', 1800, 4),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Técnico em Informática', 'TEC-INF', 'tecnico', 'presencial', 1200, 3),
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Técnico em Administração', 'TEC-ADM', 'tecnico', 'hibrido', 1000, 3),
  ('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'Técnico em Agropecuária', 'TEC-AGRO', 'tecnico', 'presencial', 1500, 4),
  ('30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', 'Técnico em Meio Ambiente', 'TEC-AMB', 'tecnico', 'presencial', 1200, 3);

-- 9. DEMO DISCIPLINAS
insert into disciplinas (id, curso_id, nome, codigo, carga_horaria, semestre) values
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Anatomia Humana', 'ENF-101', 80, 1),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'Fundamentos de Enfermagem', 'ENF-102', 120, 1),
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', 'Farmacologia', 'ENF-201', 60, 2),
  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000002', 'Programação I', 'INF-101', 80, 1),
  ('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000002', 'Redes de Computadores', 'INF-102', 60, 1),
  ('40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000003', 'Gestão Empresarial', 'ADM-101', 80, 1),
  ('40000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000003', 'Contabilidade Geral', 'ADM-102', 60, 1);

-- 10. CENTROS DE CUSTO
insert into centros_custo (id, unidade_id, nome, codigo) values
  ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Ensino Técnico', 'CUSTO-ENSINO'),
  ('50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Administrativo', 'CUSTO-ADM'),
  ('50000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Manutenção', 'CUSTO-MAN'),
  ('50000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'Ensino Técnico Filial 01', 'CUSTO-ENSINO-F1'),
  ('50000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', 'Ensino Técnico Filial 02', 'CUSTO-ENSINO-F2');

-- 11. CATEGORIAS DE ITEM (warehouse)
insert into categorias_item (id, nome) values
  ('60000000-0000-0000-0000-000000000001', 'Material de Escritório'),
  ('60000000-0000-0000-0000-000000000002', 'Material de Limpeza'),
  ('60000000-0000-0000-0000-000000000003', 'Material de Laboratório'),
  ('60000000-0000-0000-0000-000000000004', 'Material de Informática'),
  ('60000000-0000-0000-0000-000000000005', 'Material Didático'),
  ('60000000-0000-0000-0000-000000000006', 'EPI');
