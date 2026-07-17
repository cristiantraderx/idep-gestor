// ============================================================
// IDEP-Gestor · Tipos TypeScript do Supabase
// Generated manually based on SQL migrations
// ============================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// ==================== CORE ====================

export interface Unidade {
  id: string;
  nome: string;
  sigla: string;
  tipo: "sede" | "filial";
  cnpj: string | null;
  endereco: string | null;
  cidade: string;
  estado: string;
  telefone: string | null;
  email: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Perfil {
  id: string;
  nome: string;
  codigo: UserRoleCode;
  descricao: string | null;
  nivel: number;
  sistema: boolean;
  created_at: string;
}

export type UserRoleCode =
  | "admin_geral"
  | "diretor"
  | "coordenador"
  | "supervisor"
  | "secretaria"
  | "professor"
  | "aluno"
  | "rh"
  | "financeiro"
  | "compras"
  | "almoxarifado"
  | "patrimonio"
  | "biblioteca"
  | "ti"
  | "ouvidoria"
  | "auditoria"
  | "visitante";

export interface Permissao {
  id: string;
  perfil_id: string;
  modulo: string;
  acao: string;
  escopo: "global" | "unidade" | "proprio";
  created_at: string;
}

export interface Usuario {
  id: string;
  auth_user_id: string | null;
  nome: string;
  cpf: string | null;
  email: string;
  telefone: string | null;
  avatar_url: string | null;
  perfil_id: string;
  unidade_id: string | null;
  ativo: boolean;
  ultimo_acesso: string | null;
  created_at: string;
  updated_at: string;
}

export interface UsuarioUnidade {
  id: string;
  usuario_id: string;
  unidade_id: string;
  created_at: string;
}

export interface Auditoria {
  id: string;
  usuario_id: string | null;
  modulo: string;
  acao: string;
  registro_id: string | null;
  dados_antigos: Json | null;
  dados_novos: Json | null;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface Configuracao {
  id: string;
  unidade_id: string | null;
  chave: string;
  valor: Json;
  created_at: string;
  updated_at: string;
}

// ==================== ACADÊMICO ====================

export interface Curso {
  id: string;
  unidade_id: string;
  nome: string;
  codigo: string | null;
  descricao: string | null;
  tipo: "tecnico" | "graduacao" | "pos_graduacao" | "extensao" | "qualificacao";
  modalidade: "presencial" | "ead" | "hibrido";
  carga_horaria: number | null;
  duracao_semestres: number | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Disciplina {
  id: string;
  curso_id: string;
  nome: string;
  codigo: string | null;
  carga_horaria: number | null;
  ementa: string | null;
  semestre: number | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Turma {
  id: string;
  unidade_id: string;
  curso_id: string;
  nome: string;
  codigo: string | null;
  turno: "matutino" | "vespertino" | "noturno" | "integral" | null;
  sala: string | null;
  vagas: number;
  data_inicio: string | null;
  data_fim: string | null;
  semestre: string | null;
  ano: number | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Aluno {
  id: string;
  usuario_id: string | null;
  unidade_id: string;
  nome: string;
  cpf: string | null;
  rg: string | null;
  data_nascimento: string | null;
  email: string | null;
  telefone: string | null;
  celular: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string;
  nacionalidade: string;
  nome_mae: string | null;
  nome_pai: string | null;
  foto_url: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Matricula {
  id: string;
  aluno_id: string;
  turma_id: string;
  curso_id: string;
  unidade_id: string;
  numero: string | null;
  data_matricula: string;
  status: "ativo" | "trancado" | "concluido" | "cancelado" | "transferido";
  forma_ingresso: "vestibular" | "enem" | "transferencia" | "portador_diploma" | "reingresso" | null;
  created_at: string;
  updated_at: string;
}

export interface Nota {
  id: string;
  matricula_id: string;
  disciplina_id: string;
  avaliacao: string;
  valor: number;
  peso: number;
  data_avaliacao: string | null;
  created_at: string;
  updated_at: string;
}

export interface Frequencia {
  id: string;
  matricula_id: string;
  disciplina_id: string;
  data_aula: string;
  presente: boolean;
  justificativa: string | null;
  created_at: string;
}

export interface HistoricoEscolar {
  id: string;
  aluno_id: string;
  matricula_id: string | null;
  curso_id: string;
  disciplina_id: string;
  nota_final: number | null;
  frequencia_pct: number | null;
  status: "aprovado" | "reprovado" | "cursando" | "dispensado" | null;
  created_at: string;
}

// ==================== SECRETARIA ====================

export interface Protocolo {
  id: string;
  unidade_id: string;
  numero: string | null;
  assunto: string;
  requerente_nome: string;
  requerente_tipo: "aluno" | "professor" | "servidor" | "externo";
  requerente_documento: string | null;
  descricao: string | null;
  data_abertura: string;
  data_conclusao: string | null;
  status: "aberto" | "em_andamento" | "concluido" | "arquivado" | "cancelado";
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export type DeclaracaoTipo = "matricula" | "frequencia" | "historico" | "estagio" | "conclusao" | "outros";

export interface Declaracao {
  id: string;
  unidade_id: string;
  aluno_id: string;
  tipo: DeclaracaoTipo;
  numero: string | null;
  data_emissao: string;
  texto: string | null;
  status: "gerada" | "entregue" | "cancelada";
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export type CertidaoTipo = "nada_consta" | "tempo_servico" | "frequencia" | "conclusao" | "outros";

export interface Certidao {
  id: string;
  unidade_id: string;
  aluno_id: string;
  tipo: CertidaoTipo;
  numero: string | null;
  data_emissao: string;
  requerente: string;
  texto: string | null;
  status: "gerada" | "entregue" | "cancelada";
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

// ==================== GESTÃO ====================

export interface Professor {
  id: string;
  usuario_id: string | null;
  unidade_id: string;
  nome: string;
  cpf: string | null;
  email: string | null;
  telefone: string | null;
  formacao: string | null;
  especializacao: string | null;
  titulacao: "graduacao" | "especializacao" | "mestrado" | "doutorado" | null;
  data_contrato: string | null;
  regime_trabalho: "clt" | "estatutario" | "temporario" | "terceirizado" | null;
  carga_horaria: number | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Servidor {
  id: string;
  usuario_id: string | null;
  unidade_id: string;
  nome: string;
  cpf: string | null;
  cargo: string;
  setor: string | null;
  email: string | null;
  telefone: string | null;
  data_admissao: string | null;
  regime: "clt" | "estatutario" | "comissionado" | "temporario" | "terceirizado" | null;
  carga_horaria: number | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Contrato {
  id: string;
  unidade_id: string;
  tipo: "professor" | "servidor" | "prestador_servico" | "fornecedor";
  contratado_id: string | null;
  contratado_nome: string;
  objeto: string | null;
  valor: number | null;
  data_inicio: string;
  data_fim: string | null;
  status: "ativo" | "vigente" | "expirado" | "rescindido";
  arquivo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Receita {
  id: string;
  unidade_id: string;
  centro_custo_id: string | null;
  descricao: string;
  valor: number;
  data_recebimento: string;
  categoria: "mensalidade" | "convenio" | "subvencao" | "projeto" | "outros" | null;
  origem: string | null;
  documento: string | null;
  created_at: string;
}

export interface Despesa {
  id: string;
  unidade_id: string;
  centro_custo_id: string | null;
  descricao: string;
  valor: number;
  data_pagamento: string;
  categoria: "pessoal" | "material" | "servico" | "utilidade" | "investimento" | "outros" | null;
  empenho_id: string | null;
  documento: string | null;
  created_at: string;
}

export interface Item {
  id: string;
  unidade_id: string;
  categoria_id: string | null;
  nome: string;
  codigo: string | null;
  descricao: string | null;
  unidade_medida: string | null;
  quantidade_minima: number;
  quantidade_atual: number;
  valor_unitario: number | null;
  localizacao: string | null;
  created_at: string;
  updated_at: string;
}

export interface BemPatrimonial {
  id: string;
  unidade_id: string;
  numero_tombo: string | null;
  nome: string;
  descricao: string | null;
  categoria: "moveis" | "equipamentos" | "veiculos" | "imoveis" | "informatica" | "outros" | null;
  localizacao: string | null;
  responsavel_id: string | null;
  valor_aquisicao: number | null;
  data_aquisicao: string | null;
  data_garantia: string | null;
  vida_util_anos: number | null;
  estado: "novo" | "bom" | "regular" | "ruim" | "inservivel";
  status: "ativo" | "manutencao" | "baixado" | "transferido";
  created_at: string;
  updated_at: string;
}

// ==================== TI ====================

export type ChamadoPrioridade = "baixa" | "media" | "alta" | "critica";
export type ChamadoCategoria = "hardware" | "software" | "rede" | "acesso" | "email" | "telefonia" | "outros";
export type ChamadoStatus = "aberto" | "em_andamento" | "aguardando" | "resolvido" | "fechado" | "cancelado";

export interface ChamadoTI {
  id: string;
  unidade_id: string;
  usuario_solicitante_id: string | null;
  solicitante_nome: string;
  solicitante_email: string | null;
  titulo: string;
  descricao: string | null;
  categoria: ChamadoCategoria;
  prioridade: ChamadoPrioridade;
  status: ChamadoStatus;
  tecnico_responsavel: string | null;
  data_abertura: string;
  data_fechamento: string | null;
  solucao: string | null;
  created_at: string;
  updated_at: string;
}

export type EquipamentoTipo = "desktop" | "notebook" | "servidor" | "impressora" | "monitor" | "rede" | "periferico" | "outros";
export type EquipamentoStatusTI = "ativo" | "manutencao" | "emprestado" | "baixado";

export interface EquipamentoTI {
  id: string;
  unidade_id: string;
  tipo: EquipamentoTipo;
  nome: string;
  patrimonio: string | null;
  fabricante: string | null;
  modelo: string | null;
  numero_serie: string | null;
  especificacoes: string | null;
  localizacao: string | null;
  responsavel: string | null;
  status: EquipamentoStatusTI;
  data_aquisicao: string | null;
  data_garantia: string | null;
  valor: number | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export type LicencaStatus = "ativa" | "expirada" | "cancelada";

export interface LicencaSoftware {
  id: string;
  unidade_id: string;
  nome: string;
  fabricante: string | null;
  versao: string | null;
  tipo: "proprietario" | "opensource" | "saas" | "educacional";
  numero_licenca: string | null;
  chave_ativacao: string | null;
  quantidade: number;
  quantidade_utilizada: number;
  data_aquisicao: string | null;
  data_validade: string | null;
  valor_total: number | null;
  status: LicencaStatus;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

// ==================== BIBLIOTECA ====================

export type ObraTipo = "livro" | "revista" | "artigo" | "tcc" | "dissertacao" | "tese" | "periodico" | "dvd" | "outros";
export type ObraCategoria = "didatico" | "literatura" | "referencia" | "periodico" | "multimidia" | "outros";

export interface Obra {
  id: string;
  unidade_id: string;
  titulo: string;
  autor: string | null;
  editora: string | null;
  ano: number | null;
  edicao: string | null;
  isbn: string | null;
  codigo: string | null;
  tipo: ObraTipo;
  categoria: ObraCategoria;
  assunto: string | null;
  localizacao: string | null;
  quantidade_total: number;
  quantidade_disponivel: number;
  created_at: string;
  updated_at: string;
}

export type EmprestimoStatus = "ativo" | "renovado" | "devolvido" | "atrasado" | "perdido";

export interface Emprestimo {
  id: string;
  obra_id: string;
  aluno_id: string;
  unidade_id: string;
  data_emprestimo: string;
  data_devolucao_prevista: string;
  data_devolucao_real: string | null;
  status: EmprestimoStatus;
  renovacoes: number;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export type ReservaStatus = "ativa" | "cancelada" | "concluida" | "expirada";

export interface Reserva {
  id: string;
  obra_id: string;
  aluno_id: string;
  unidade_id: string;
  data_reserva: string;
  data_validade: string;
  status: ReservaStatus;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

// ==================== RH ====================

export type FeriasStatus = "agendadas" | "aprovadas" | "em_andamento" | "concluidas" | "canceladas";

export interface Ferias {
  id: string;
  servidor_id: string;
  unidade_id: string;
  data_inicio: string;
  data_fim: string;
  dias: number;
  periodo: string;
  ano_referencia: number;
  status: FeriasStatus;
  observacoes: string | null;
  aprovado_por: string | null;
  created_at: string;
  updated_at: string;
}

// ==================== COMPRAS ====================

export type SolicitacaoPrioridade = "baixa" | "media" | "alta" | "urgente";
export type SolicitacaoStatus = "rascunho" | "enviada" | "em_analise" | "aprovada" | "rejeitada" | "cancelada";

export interface SolicitacaoCompra {
  id: string;
  unidade_id: string;
  solicitante_nome: string;
  data_solicitacao: string;
  descricao: string | null;
  justificativa: string | null;
  prioridade: SolicitacaoPrioridade;
  status: SolicitacaoStatus;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Cotacao {
  id: string;
  unidade_id: string;
  solicitacao_id: string | null;
  fornecedor_nome: string;
  fornecedor_cnpj: string | null;
  data_cotacao: string;
  data_validade: string | null;
  descricao_itens: string | null;
  valor_total: number | null;
  prazo_entrega: string | null;
  status: "solicitada" | "recebida" | "aprovada" | "rejeitada" | "cancelada";
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export type LicitacaoModalidade = "convite" | "tomada_precos" | "concorrencia" | "pregao" | "dispensa" | "inexigibilidade";
export type LicitacaoStatus = "planejada" | "publicada" | "em_andamento" | "adjudicada" | "homologada" | "cancelada";

export interface Licitacao {
  id: string;
  unidade_id: string;
  numero: string | null;
  modalidade: LicitacaoModalidade;
  objeto: string | null;
  data_publicacao: string | null;
  data_abertura: string | null;
  valor_estimado: number | null;
  status: LicitacaoStatus;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

// ==================== ALMOXARIFADO ====================

export type MovimentoTipo = "entrada" | "saida";

export interface MovimentoEstoque {
  id: string;
  item_id: string;
  unidade_id: string;
  tipo: MovimentoTipo;
  quantidade: number;
  data_movimento: string;
  documento: string | null;
  origem_destino: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

// ==================== PATRIMÔNIO ====================

export type MovimentacaoTipo = "transferencia" | "emprestimo" | "devolucao" | "baixa";

export interface MovimentacaoBem {
  id: string;
  bem_id: string;
  unidade_id: string;
  tipo: MovimentacaoTipo;
  data_movimentacao: string;
  origem: string | null;
  destino: string | null;
  responsavel: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export type ManutencaoTipo = "preventiva" | "corretiva" | "urgente";
export type ManutencaoStatus = "solicitada" | "em_andamento" | "concluida" | "cancelada";

export interface ManutencaoBem {
  id: string;
  bem_id: string;
  unidade_id: string;
  tipo: ManutencaoTipo;
  descricao: string | null;
  data_solicitacao: string;
  data_inicio: string | null;
  data_conclusao: string | null;
  responsavel: string | null;
  custo: number | null;
  status: ManutencaoStatus;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

// ==================== OUVIDORIA ====================

export type ReclamacaoTipo = "reclamacao" | "denuncia" | "elogio" | "solicitacao" | "outros";
export type ReclamacaoStatus = "recebida" | "em_analise" | "em_andamento" | "concluida" | "cancelada";
export type ReclamacaoPrioridade = "baixa" | "media" | "alta";

export interface Reclamacao {
  id: string;
  unidade_id: string;
  numero_protocolo: string | null;
  tipo: ReclamacaoTipo;
  assunto: string;
  descricao: string | null;
  manifestante_nome: string | null;
  manifestante_email: string | null;
  manifestante_telefone: string | null;
  anonimo: boolean;
  prioridade: ReclamacaoPrioridade;
  status: ReclamacaoStatus;
  parecer: string | null;
  data_abertura: string;
  data_conclusao: string | null;
  responsavel: string | null;
  created_at: string;
  updated_at: string;
}

export interface Sugestao {
  id: string;
  unidade_id: string;
  titulo: string;
  descricao: string | null;
  autor_nome: string | null;
  autor_email: string | null;
  categoria: "academica" | "administrativa" | "infraestrutura" | "tecnologia" | "outros";
  status: "recebida" | "em_analise" | "aprovada" | "implementada" | "recusada";
  data_envio: string;
  resposta: string | null;
  created_at: string;
  updated_at: string;
}

// ==================== AGENDA ====================

export type EventoStatus = "agendado" | "confirmado" | "cancelado" | "realizado";
export type EventoTipo = "reuniao" | "evento_institucional" | "aula_inaugural" | "formatura" | "palestra" | "oficina" | "outros";

export interface Evento {
  id: string;
  unidade_id: string;
  titulo: string;
  descricao: string | null;
  tipo: EventoTipo;
  data_inicio: string;
  data_fim: string | null;
  hora_inicio: string | null;
  hora_fim: string | null;
  local: string | null;
  responsavel: string | null;
  publico_alvo: string | null;
  cor: string | null;
  status: EventoStatus;
  created_at: string;
  updated_at: string;
}

export type SalaStatus = "disponivel" | "ocupada" | "manutencao" | "reservada";

export interface Sala {
  id: string;
  unidade_id: string;
  nome: string;
  codigo: string | null;
  capacidade: number;
  tipo: "sala_aula" | "sala_reuniao" | "auditorio" | "laboratorio" | "sala_multimidia" | "outros";
  recursos: string | null;
  localizacao: string | null;
  status: SalaStatus;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export type LaboratorioStatus = "disponivel" | "ocupado" | "manutencao" | "reservado";
export type LaboratorioTipo = "informatica" | "ciencias" | "biologia" | "quimica" | "fisica" | "idiomas" | "multimidia" | "outros";

export interface Laboratorio {
  id: string;
  unidade_id: string;
  nome: string;
  codigo: string | null;
  capacidade: number;
  tipo: LaboratorioTipo;
  equipamentos: string | null;
  softwares: string | null;
  localizacao: string | null;
  responsavel: string | null;
  status: LaboratorioStatus;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

// ==================== PROJETOS ====================

export type ProjetoStatus = "planejado" | "em_andamento" | "pausado" | "concluido" | "cancelado";
export type ProjetoPrioridade = "baixa" | "media" | "alta";

export interface Projeto {
  id: string;
  unidade_id: string;
  nome: string;
  codigo: string | null;
  descricao: string | null;
  objetivo: string | null;
  escopo: string | null;
  orcamento: number | null;
  data_inicio: string | null;
  data_fim: string | null;
  coordenador: string | null;
  equipe: string | null;
  prioridade: ProjetoPrioridade;
  status: ProjetoStatus;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export type IndicadorCategoria = "academico" | "financeiro" | "rh" | "infraestrutura" | "ti" | "outros";

export interface IndicadorBI {
  id: string;
  unidade_id: string;
  nome: string;
  descricao: string | null;
  categoria: IndicadorCategoria;
  valor_atual: number | null;
  valor_meta: number | null;
  periodo: string | null;
  formato: "numero" | "percentual" | "moeda" | "decimal";
  direcao: "maior_melhor" | "menor_melhor";
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== NOTIFICAÇÕES ====================

export interface Notificacao {
  id: string;
  usuario_id: string;
  titulo: string;
  mensagem: string;
  tipo: "info" | "success" | "warning" | "error" | "system";
  modulo: string | null;
  link: string | null;
  lida: boolean;
  lida_em: string | null;
  created_at: string;
}

// ==================== TABLES OBJECT ====================

export interface Database {
  public: {
    Tables: {
      unidades: { Row: Unidade };
      perfis: { Row: Perfil };
      permissoes: { Row: Permissao };
      usuarios: { Row: Usuario };
      usuario_unidades: { Row: UsuarioUnidade };
      notificacoes: { Row: Notificacao };
      auditoria: { Row: Auditoria };
      configuracoes: { Row: Configuracao };
      cursos: { Row: Curso };
      disciplinas: { Row: Disciplina };
      turmas: { Row: Turma };
      alunos: { Row: Aluno };
      matriculas: { Row: Matricula };
      notas: { Row: Nota };
      frequencia: { Row: Frequencia };
      historico_escolar: { Row: HistoricoEscolar };
      professores: { Row: Professor };
      servidores: { Row: Servidor };
      contratos: { Row: Contrato };
      receitas: { Row: Receita };
      despesas: { Row: Despesa };
      itens: { Row: Item };
      bens_patrimoniais: { Row: BemPatrimonial };
      protocolos: { Row: Protocolo };
      declaracoes: { Row: Declaracao };
      certidoes: { Row: Certidao };
      chamados_ti: { Row: ChamadoTI };
      equipamentos_ti: { Row: EquipamentoTI };
      licencas_software: { Row: LicencaSoftware };
      obras: { Row: Obra };
      emprestimos: { Row: Emprestimo };
      reservas: { Row: Reserva };
      ferias: { Row: Ferias };
      solicitacoes_compra: { Row: SolicitacaoCompra };
      cotacoes: { Row: Cotacao };
      licitacoes: { Row: Licitacao };
      movimentos_estoque: { Row: MovimentoEstoque };
      movimentacoes_bens: { Row: MovimentacaoBem };
      manutencoes_bens: { Row: ManutencaoBem };
      reclamacoes: { Row: Reclamacao };
      sugestoes: { Row: Sugestao };
      eventos: { Row: Evento };
      salas: { Row: Sala };
      laboratorios: { Row: Laboratorio };
      projetos: { Row: Projeto };
      indicadores_bi: { Row: IndicadorBI };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
