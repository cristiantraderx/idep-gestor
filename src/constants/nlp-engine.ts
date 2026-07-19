// ============================================================
// NLP Engine — Processamento de Linguagem Natural em Português
// ============================================================
// Motor leve sem dependências externas com:
// - Stemmer para português (sufixos verbais, plurais, etc.)
// - Mapa de sinônimos do domínio IDEP-Gestor
// - Detecção de intenções (tutorial, navegação, ação, módulo)
// - Extração de entidades (módulos, ações, objetos)
// - Expansão de consultas para busca inteligente
// ============================================================

// ============================================================
// Tipos
// ============================================================
export type IntentType =
  | "TUTORIAL"      // "como cadastrar um aluno"
  | "NAVEGACAO"     // "onde fica o financeiro"
  | "ACAO"          // "criar usuario", "gerenciar permissoes"
  | "MODULO_INFO"   // "o que é patrimonio", "sobre o almoxarifado"
  | "DICA"          // "dicas de produtividade", "atalhos"
  | "AJUDA"         // "socorro", "ajuda", "erro"
  | "SAUDACAO"      // "olá", "bom dia"
  | "GENERAL"       // fallback
  | "RELATORIO";    // "relatório financeiro", "exportar dados"

export interface EntityMap {
  module?: string;
  action?: string;
  object?: string;
}

export interface ProcessedQuery {
  original: string;
  expanded: string;
  stemmed: string[];
  intent: IntentType;
  entities: EntityMap;
  confidence: number;
  isSaudacao: boolean;
  suggestedActions?: string[];
}

// ============================================================
// Stemmer Português — regras de sufixos
// ============================================================
const PLURAL_RULES: [RegExp, string][] = [
  [/ões$/i, "ão"], [/ães$/i, "ão"], [/ais$/i, "al"],
  [/eis$/i, "el"], [/is$/i, "il"], [/ns$/i, "m"],
  [/res$/i, "r"], [/zes$/i, "z"], [/s$/i, ""],
];

const VERB_RULES: [RegExp, string][] = [
  // Infinitivo (-ar, -er, -ir)
  [/[aei]r$/i, ""],
  // Gerúndio (-ando, -endo, -indo)
  [/[aei]ndo$/i, ""],
  // Particípio (-ado, -ido, -ado, -ido)
  [/[aei]do$/i, ""],
  // Pretérito perfeito (-ei, -ou, -eu, -iu)
  [/ei$/i, "a"], [/ou$/i, "a"], [/eu$/i, "e"], [/iu$/i, "i"],
  // Futuro (-arei, -erei, -irei)
  [/arei$/i, "ar"], [/erei$/i, "er"], [/irei$/i, "ir"],
  // Condicional (-aria, -eria, -iria)
  [/aria$/i, "ar"], [/eria$/i, "er"], [/iria$/i, "ir"],
];

const ADVERB_RULES: [RegExp, string][] = [
  [/mente$/i, ""],
];

const DIMINUTIVE_RULES: [RegExp, string][] = [
  [/zinho$/i, ""], [/zinha$/i, ""],
  [/inho$/i, ""], [/inha$/i, ""],
  [/ão$/i, ""],
];

function applyRules(word: string, rules: [RegExp, string][]): string {
  for (const [pattern, replacement] of rules) {
    if (pattern.test(word)) {
      return word.replace(pattern, replacement);
    }
  }
  return word;
}

function stemWord(word: string): string {
  if (word.length <= 3) return word;

  let stem = word.toLowerCase();

  // Remove acentos comuns
  stem = stem
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

  if (stem.length <= 3) return stem;

  // Aplica regras em ordem
  stem = applyRules(stem, DIMINUTIVE_RULES);
  stem = applyRules(stem, ADVERB_RULES);
  stem = applyRules(stem, VERB_RULES);
  stem = applyRules(stem, PLURAL_RULES);

  return stem.length >= 2 ? stem : word.toLowerCase();
}

export function stemQuery(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[\s,;.!?]+/)
    .filter(Boolean)
    .map(stemWord);
}

// ============================================================
// Mapa de Sinônimos — termos do domínio IDEP-Gestor
// ============================================================
const SYNONYM_MAP: Record<string, string[]> = {
  // Alunos
  aluno: ["estudante", "discente", "educando", "aprendiz"],
  alunos: ["estudantes", "discentes", "educandos", "aprendizes"],
  matricula: ["inscrição", "registro", "cadastro", "matrícula"],
  matricular: ["inscrever", "registrar", "cadastrar"],

  // Financeiro
  financeiro: ["contábil", "contabilidade", "fiscal", "tesouraria", "caixa"],
  receita: ["entrada", "ingresso", "faturamento", "renda"],
  despesa: ["gasto", "custo", "desembolso", "saída"],
  fluxo: ["movimento", "movimentação", "fluxo de caixa"],

  // RH
  rh: ["recursos humanos", "pessoal", "departamento pessoal", "dp"],
  servidor: ["funcionário", "colaborador", "empregado", "servidor público"],
  professor: ["docente", "instrutor", "educador", "prof"],
  ferias: ["férias", "recesso", "descanso"],

  // Patrimônio
  patrimonio: ["patrimônio", "bens", "ativos", "patrimonial"],
  tombo: ["número de tombo", "registro patrimonial"],

  // Compras
  compras: ["aquisição", "aquisições", "compra", "suprimentos"],
  cotacao: ["cotação", "orçamento", "proposta", "orçar"],
  licitacao: ["licitação", "concorrência", "pregão", "tomada de preços"],

  // Biblioteca
  biblioteca: ["livros", "acervo", "empréstimo"],
  emprestimo: ["empréstimo", "retirada", "devolução"],

  // Almoxarifado
  almoxarifado: ["estoque", "depósito", "almoxarife", "materiais"],

  // TI
  ti: ["tecnologia", "informática", "suporte", "help desk"],

  // Projetos
  projeto: ["programa", "iniciativa", "editais"],
  pesquis: ["pesquis", "estudo", "investigação"],

  // Agenda
  agenda: ["calendário", "eventos", "programação"],
  evento: ["reunião", "palestra", "encontro", "solenidade"],

  // Cursos
  curso: ["formação", "capacitação", "treinamento", "curso técnico"],
  disciplina: ["matéria", "componente curricular"],

  // Ouvidoria
  ouvidoria: ["manifestação", "sugestão", "reclamação", "elogio"],

  // Geral
  criar: ["cadastrar", "adicionar", "inserir", "incluir", "novo", "nova", "registrar"],
  editar: ["alterar", "modificar", "atualizar", "mudar", "editar dados"],
  excluir: ["remover", "deletar", "apagar", "eliminar"],
  listar: ["ver", "visualizar", "mostrar", "exibir", "consultar", "relatório"],
  gerenciar: ["administrar", "gerir", "controlar", "manusear"],
  buscar: ["procurar", "pesquisar", "encontrar", "localizar", "consultar"],
  relatorio: ["relatório", "relatórios", "relatorio", "relatorios", "report", "dashboard", "indicadores", "kpi"],
  ajuda: ["socorro", "suporte", "problema", "erro", "bug", "dúvida", "dificuldade"],
  atalho: ["shortcut", "tecla", "comando", "hotkey", "ctrl"],
};

// ============================================================
// Mapa de entidades — módulos do sistema
// ============================================================
const MODULE_KEYWORDS: Record<string, string[]> = {
  alunos: ["aluno", "alunos", "estudante", "estudantes"],
  turmas: ["turma", "turmas"],
  biblioteca: ["biblioteca", "livro", "livros", "acervo", "emprestimo"],
  financeiro: ["financeiro", "receita", "receitas", "despesa", "despesas", "fluxo de caixa"],
  rh: ["rh", "recursos humanos", "servidor", "servidores", "professor", "professores", "funcionário"],
  almoxarifado: ["almoxarifado", "estoque", "inventário", "material"],
  patrimonio: ["patrimônio", "patrimonio", "bem", "bens", "tombo"],
  compras: ["compras", "cotação", "licitação", "solicitação de compra"],
  ti: ["ti", "chamado", "suporte", "equipamento", "informática"],
  projetos: ["projeto", "projetos", "programa", "edital"],
  agenda: ["agenda", "evento", "eventos", "calendário", "laboratório", "sala"],
  cursos: ["curso", "cursos", "disciplina", "matriz curricular"],
  ouvidoria: ["ouvidoria", "sugestão", "reclamação"],
  secretaria: ["secretaria", "certidão", "declaração"],
  admin: ["usuário", "perfil", "permissão", "configuração"],
};

// ============================================================
// Padrões de Intenção
// ============================================================
const INTENT_PATTERNS: [RegExp, IntentType][] = [
  // Tutorial — "como fazer X", "como cadastrar", "passo a passo"
  [/^(como|como que|como é que|como faço|como fazer|como posso|como criar|como cadastrar)/i, "TUTORIAL"],
  [/^(passo a passo|tutorial|guia|manual|instruções)/i, "TUTORIAL"],
  [/^(me ensina|me mostra|aprenda|aprender)/i, "TUTORIAL"],

  // Navegação — "onde fica", "abrir", "ir para"
  [/^(onde|onde fica|onde está|como acesso|como chego)/i, "NAVEGACAO"],
  [/^(abrir|ir para|navegar|acessar|entrar em)/i, "NAVEGACAO"],

  // Ação — "criar", "cadastrar", "gerenciar"
  [/^(criar|cadastrar|adicionar|registrar|inserir|novo|gerenciar|administrar)/i, "ACAO"],
  [/^(editar|alterar|modificar|atualizar|excluir|remover|deletar)/i, "ACAO"],

  // Módulo Info — "o que é", "sobre", "para que serve"
  [/^(o que é|o que são|oque é|oque são|definição)/i, "MODULO_INFO"],
  [/^(sobre|fale sobre|me fale sobre|conte sobre)/i, "MODULO_INFO"],
  [/^(para que serve|qual a função|qual o objetivo)/i, "MODULO_INFO"],

  // Relatório — "relatório", "relatorio", "dashboard"
  [/relat[oó]ri/i, "RELATORIO"],
  [/dashboard|indicador|kpi|gráfic/i, "RELATORIO"],
  [/^(exportar|imprimir|gerar)/i, "RELATORIO"],

  // Dica — "dica", "dicas", "atalhos"
  [/^dica/i, "DICA"],
  [/atalho|tecla|shortcut|hotkey/i, "DICA"],
  [/produtividade|otimizaç/i, "DICA"],

  // Ajuda — "ajuda", "socorro", "erro"
  [/^ajuda|socorro|help/i, "AJUDA"],
  [/erro|bug|problema|não funciona|quebr/i, "AJUDA"],

  // Saudação
  [/^(ol[áa]|oi|bom dia|boa tarde|boa noite|hey|e aí|fala|iae)/i, "SAUDACAO"],
];

// ============================================================
// Funções principais
// ============================================================

/**
 * Extrai entidades da consulta (módulo, ação, objeto)
 */
function extractEntities(words: string[]): EntityMap {
  const entities: EntityMap = {};
  const joined = words.join(" ").toLowerCase();

  // Detecta módulo
  for (const [module, keywords] of Object.entries(MODULE_KEYWORDS)) {
    for (const kw of keywords) {
      if (joined.includes(kw)) {
        entities.module = module;
        break;
      }
    }
    if (entities.module) break;
  }

  // Detecta ação
  const ACAO_KEYWORDS: Record<string, string[]> = {
    criar: ["criar", "cadastrar", "adicionar", "novo", "inserir", "registrar"],
    editar: ["editar", "alterar", "modificar", "atualizar", "mudar"],
    excluir: ["excluir", "remover", "deletar", "apagar"],
    listar: ["listar", "ver", "visualizar", "mostrar", "consultar", "buscar"],
    gerenciar: ["gerenciar", "administrar", "controlar"],
  };
  for (const [action, kws] of Object.entries(ACAO_KEYWORDS)) {
    for (const kw of kws) {
      if (joined.includes(kw)) {
        entities.action = action;
        break;
      }
    }
    if (entities.action) break;
  }

  // Detecta objeto — palavras após ação ou preposição
  const OBJETO_KEYWORDS: Record<string, string[]> = {
    aluno: ["aluno", "alunos", "estudante"],
    usuario: ["usuário", "usuario", "usuários", "usuarios"],
    servidor: ["servidor", "funcionário", "funcionario"],
    professor: ["professor", "docente", "instrutor"],
    turma: ["turma", "turmas"],
    bem: ["bem", "bens", "patrimônio", "patrimonio"],
    chamado: ["chamado", "chamados"],
    evento: ["evento", "eventos"],
    curso: ["curso", "cursos", "disciplina", "disciplinas"],
  };
  for (const [obj, kws] of Object.entries(OBJETO_KEYWORDS)) {
    for (const kw of kws) {
      if (joined.includes(kw)) {
        entities.object = obj;
        break;
      }
    }
    if (entities.object) break;
  }

  return entities;
}

/**
 * Detecta a intenção do usuário
 */
function detectIntent(input: string): { intent: IntentType; confidence: number } {
  for (const [pattern, intent] of INTENT_PATTERNS) {
    if (pattern.test(input)) {
      return { intent, confidence: 0.8 };
    }
  }

  // Detecção secundária baseada em palavras-chave
  const lower = input.toLowerCase();
  if (/\bcomo\b/i.test(lower)) return { intent: "TUTORIAL", confidence: 0.6 };
  if (/\bonde\b/i.test(lower)) return { intent: "NAVEGACAO", confidence: 0.6 };
  if (/\bnov[oa]\b/i.test(lower) || /\bcadastr/i.test(lower)) return { intent: "ACAO", confidence: 0.6 };
  if (/\bsobre\b/i.test(lower) || /\bé [oa]\b/i.test(lower)) return { intent: "MODULO_INFO", confidence: 0.6 };

  return { intent: "GENERAL", confidence: 0.3 };
}

/**
 * Expande a consulta com sinônimos e termos relacionados
 */
function expandQuery(input: string): string {
  const words = input.toLowerCase().split(/\s+/);
  const expanded = new Set<string>();
  const originalWords: string[] = [];

  for (const word of words) {
    originalWords.push(word);
    expanded.add(word);

    // Adiciona sinônimos
    const stemmed = stemWord(word);
    const synonyms = SYNONYM_MAP[word] || SYNONYM_MAP[stemmed];
    if (synonyms) {
      for (const syn of synonyms) {
        expanded.add(syn);
        // Extrai palavras individuais de sinônimos compostos
        for (const part of syn.split(/\s+/)) {
          expanded.add(part);
        }
      }
    }

    // Adiciona radical (stem) como termo de busca
    if (stemmed !== word && stemmed.length > 2) {
      expanded.add(stemmed);
    }
  }

  return [...new Set([...originalWords, ...expanded])].join(" ");
}

/**
 * Sugere ações rápidas baseadas na intenção
 */
function suggestActions(intent: IntentType, entities: EntityMap): string[] {
  const actions: string[] = [];

  if (entities.module) {
    actions.push(`Ver módulo ${entities.module}`);
    if (entities.action) {
      actions.push(`${entities.action} ${entities.object || entities.module}`);
    }
  }

  switch (intent) {
    case "TUTORIAL":
      actions.push("Ver tutoriais disponíveis");
      break;
    case "NAVEGACAO":
      actions.push("Abrir busca global (Ctrl+K)");
      break;
    case "RELATORIO":
      actions.push("Acessar dashboard");
      actions.push("Exportar relatórios");
      break;
    case "DICA":
      actions.push("Ver todos os atalhos");
      break;
    case "AJUDA":
      actions.push("Abrir assistente");
      actions.push("Busca global (Ctrl+K)");
      break;
    default:
      break;
  }

  return actions;
}

// ============================================================
// Função principal — processa a consulta do usuário
// ============================================================
export function processQuery(input: string): ProcessedQuery {
  const trimmed = input.trim();
  const words = trimmed.toLowerCase().split(/\s+/).filter(Boolean);

  // Detecta saudação
  const isSaudacao = /^(ol[áa]|oi|bom dia|boa tarde|boa noite|hey|e aí|fala)/i.test(trimmed);

  // Detecta intenção
  const { intent, confidence } = detectIntent(trimmed);

  // Extrai entidades
  const entities = extractEntities(words);

  // Expande consulta
  const expanded = expandQuery(trimmed);

  // Sugere ações
  const suggestedActions = suggestActions(intent, entities);

  return {
    original: trimmed,
    expanded,
    stemmed: stemQuery(trimmed),
    intent,
    entities,
    confidence,
    isSaudacao,
    suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined,
  };
}

/**
 * Versão NL P‑enhanced da busca: usa expansão de consulta antes de pesquisar
 */
export function searchWithNLP(
  input: string,
  baseSearch: (query: string) => unknown[]
): { results: unknown[]; nlp: ProcessedQuery } {
  const nlp = processQuery(input);

  // Se for saudação, retorna sem buscar
  if (nlp.isSaudacao) {
    return { results: [], nlp };
  }

  // Expansão multi‑tentativa: tenta consulta expandida, depois original, depois termos radicais
  const attempts = [
    nlp.expanded,
    nlp.original,
    nlp.stemmed.join(" "),
  ];

  for (const query of attempts) {
    const results = baseSearch(query);
    if (results.length > 0) {
      return { results, nlp };
    }
  }

  return { results: [], nlp };
}
