// ============================================================
// Contextual Help — Ajuda Contextual por Página/Módulo
// ============================================================
// Detecta qual módulo/página o usuário está visitando e sugere
// dicas e ações relevantes para aquela página específica.
// ============================================================

export interface ContextualTip {
  /** Ícone (emoji) da dica */
  icon: string;
  /** Texto curto da dica */
  text: string;
  /** Ação sugerida (pergunta para fazer ao assistente) */
  action?: string;
}

export interface PageHelp {
  /** Nome amigável do módulo */
  moduleName: string;
  /** Descrição curta do que fazer nesta página */
  context: string;
  /** Dicas específicas para esta página */
  tips: ContextualTip[];
}

// ============================================================
// Detecta o módulo atual baseado na URL
// ============================================================
function detectModuleFromPath(path: string): string {
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return "dashboard";

  // Primeiro segmento da URL é o módulo principal
  const mainSlug = parts[0]!.toLowerCase();

  // Mapeia slugs conhecidos
  const moduleMap: Record<string, string> = {
    alunos: "alunos",
    cursos: "cursos",
    turmas: "turmas",
    secretaria: "secretaria",
    rh: "rh",
    financeiro: "financeiro",
    compras: "compras",
    almoxarifado: "almoxarifado",
    patrimonio: "patrimonio",
    biblioteca: "biblioteca",
    agenda: "agenda",
    ti: "ti",
    ouvidoria: "ouvidoria",
    relatorios: "relatorios",
    bi: "bi",
    projetos: "projetos",
    admin: "admin",
    auditoria: "auditoria",
    configuracoes: "configuracoes",
    perfil: "perfil",
    notificacoes: "notificacoes",
    chat: "chat",
    dashboard: "dashboard",
  };

  return moduleMap[mainSlug] || mainSlug;
}

// ============================================================
// Ajuda contextual para cada módulo
// ============================================================
const PAGE_HELP: Record<string, PageHelp> = {
  dashboard: {
    moduleName: "Dashboard",
    context: "Visão executiva com indicadores e métricas institucionais.",
    tips: [
      { icon: "📊", text: "Os KPIs são atualizados automaticamente conforme os dados dos módulos.", action: "Quais indicadores aparecem no dashboard?" },
      { icon: "🎯", text: "Clique nos cartões de KPI para ver detalhes e gráficos aprofundados." },
      { icon: "📈", text: "Use os filtros de período no topo para comparar dados mensais.", action: "Como filtrar dados no dashboard?" },
    ],
  },
  alunos: {
    moduleName: "Alunos",
    context: "Gestão completa do corpo discente da instituição.",
    tips: [
      { icon: "➕", text: "Clique em '+ Novo Aluno' para cadastrar um novo estudante.", action: "Como cadastrar um aluno?" },
      { icon: "🔍", text: "Use a barra de busca para localizar alunos por nome, CPF ou matrícula." },
      { icon: "📋", text: "Acesse o histórico do aluno clicando no nome para ver matrículas e documentos.", action: "Como ver o histórico de um aluno?" },
    ],
  },
  rh: {
    moduleName: "Recursos Humanos",
    context: "Gestão de servidores, professores, contratos e férias.",
    tips: [
      { icon: "👤", text: "Navegue pelas abas: Servidores, Professores, Contratos e Férias.", action: "Como cadastrar um servidor?" },
      { icon: "📄", text: "Contratos próximos do vencimento são destacados em vermelho." },
      { icon: "🏖️", text: "Solicitações de férias podem ser aprovadas diretamente na lista.", action: "Como gerenciar férias?" },
    ],
  },
  financeiro: {
    moduleName: "Financeiro",
    context: "Controle de receitas, despesas e fluxo de caixa.",
    tips: [
      { icon: "📊", text: "O dashboard financeiro mostra o resumo do mês atual automaticamente.", action: "Como ver o dashboard financeiro?" },
      { icon: "➕", text: "Registre receitas e despesas usando os botões '+ Receita' e '+ Despesa'.", action: "Como cadastrar uma receita?" },
      { icon: "💳", text: "Acompanhe o fluxo de caixa para projeções de saldo futuro.", action: "Como funciona o fluxo de caixa?" },
    ],
  },
  biblioteca: {
    moduleName: "Biblioteca",
    context: "Acervo, empréstimos e reservas de livros.",
    tips: [
      { icon: "📖", text: "Cadastre novos livros no Acervo com ISBN para busca automática.", action: "Como cadastrar um livro no acervo?" },
      { icon: "🔄", text: "Empréstimos têm prazo de 14 dias com renovação online.", action: "Como fazer um empréstimo?" },
      { icon: "🔖", text: "Livros emprestados podem ser reservados por outros alunos.", action: "Como reservar um livro?" },
    ],
  },
  patrimonio: {
    moduleName: "Patrimônio",
    context: "Tombamento e controle de bens patrimoniais.",
    tips: [
      { icon: "🏛️", text: "Registre novos bens com número de tombamento automático.", action: "Como tombar um bem?" },
      { icon: "🔄", text: "Registre movimentações quando um bem mudar de local/setor.", action: "Como registrar movimentação?" },
      { icon: "🔧", text: "Agende manutenções preventivas e corretivas para cada bem.", action: "Como agendar manutenção?" },
    ],
  },
  almoxarifado: {
    moduleName: "Almoxarifado",
    context: "Controle de estoque e inventário de materiais.",
    tips: [
      { icon: "📥", text: "Registre entradas de materiais com nota fiscal e quantidade.", action: "Como registrar entrada no almoxarifado?" },
      { icon: "📤", text: "Saídas são registradas com destino e responsável.", action: "Como registrar saída?" },
      { icon: "📊", text: "O inventário mostra saldo atual e alerta de estoque mínimo.", action: "Como ver o inventário?" },
    ],
  },
  secretaria: {
    moduleName: "Secretaria",
    context: "Protocolos, declarações e certidões acadêmicas.",
    tips: [
      { icon: "📋", text: "Protocolos são numerados automaticamente para rastreamento.", action: "Como abrir um protocolo?" },
      { icon: "📄", text: "Declarações e certidões podem ser emitidas com assinatura digital.", action: "Como emitir uma declaração?" },
      { icon: "🔍", text: "Consulte o andamento de protocolos pelo número de registro." },
    ],
  },
  compras: {
    moduleName: "Compras e Licitações",
    context: "Solicitações de compra, cotações e licitações.",
    tips: [
      { icon: "📝", text: "Crie solicitações de compra que passam por fluxo de aprovação.", action: "Como fazer uma solicitação de compra?" },
      { icon: "💰", text: "Cotações comparam preços de diferentes fornecedores.", action: "Como criar uma cotação?" },
      { icon: "⚖️", text: "Licitações seguem modalidades conforme valor (convite, tomada de preços, concorrência).", action: "Como funciona o módulo de licitações?" },
    ],
  },
  agenda: {
    moduleName: "Agenda",
    context: "Eventos, salas e laboratórios com calendário compartilhado.",
    tips: [
      { icon: "📅", text: "Crie eventos no calendário para agendar reuniões e prazos.", action: "Como criar um evento?" },
      { icon: "🏢", text: "Salas e laboratórios podem ser reservados com horário específico.", action: "Como reservar uma sala?" },
      { icon: "👥", text: "Convide participantes e receba notificações automaticamente." },
    ],
  },
  ti: {
    moduleName: "TI / Chamados",
    context: "Chamados técnicos, equipamentos e licenças de software.",
    tips: [
      { icon: "🆘", text: "Abra chamados técnicos descrevendo o problema com detalhes.", action: "Como abrir um chamado?" },
      { icon: "💻", text: "O inventário de equipamentos rastreia máquinas por patrimônio.", action: "Como cadastrar um equipamento?" },
      { icon: "🔑", text: "Licenças de software com alerta de vencimento automático.", action: "Como gerenciar licenças?" },
    ],
  },
  ouvidoria: {
    moduleName: "Ouvidoria",
    context: "Canal de comunicação com reclamações, sugestões e relatórios.",
    tips: [
      { icon: "📢", text: "Registre manifestações com nível de anonimato configurável.", action: "Como registrar uma reclamação?" },
      { icon: "💡", text: "Sugestões são encaminhadas automaticamente à direção.", action: "Como enviar uma sugestão?" },
      { icon: "📊", text: "Relatórios gerenciais consolidam manifestações por período." },
    ],
  },
  admin: {
    moduleName: "Administração",
    context: "Usuários, perfis e permissões do sistema.",
    tips: [
      { icon: "👥", text: "Gerencie usuários com ativação/desativação e redefinição de senha.", action: "Como criar um usuário?" },
      { icon: "🛡️", text: "Perfis de acesso controlam quais módulos cada usuário pode acessar.", action: "Como gerenciar permissões?" },
      { icon: "🔑", text: "Permissões granulares por funcionalidade dentro de cada módulo." },
    ],
  },
  auditoria: {
    moduleName: "Auditoria",
    context: "Logs e histórico de alterações do sistema.",
    tips: [
      { icon: "📜", text: "Todos os logs são registrados com timestamp e IP do usuário." },
      { icon: "🔍", text: "Filtre por data, usuário ou tipo de ação para encontrar eventos específicos." },
    ],
  },
  configuracoes: {
    moduleName: "Configurações",
    context: "Configurações gerais do sistema e preferências.",
    tips: [
      { icon: "⚙️", text: "Configure os dados da instituição, unidades e perfis de acesso." },
      { icon: "🎨", text: "Personalize o tema do sistema (claro/escuro) nas preferências.", action: "Como mudar o tema do sistema?" },
    ],
  },
  relatorios: {
    moduleName: "Relatórios",
    context: "Geração de relatórios acadêmicos, financeiros e gerenciais.",
    tips: [
      { icon: "📄", text: "Exporte relatórios em PDF, Excel ou CSV com um clique.", action: "Como gerar um relatório?" },
      { icon: "📅", text: "Agende relatórios recorrentes para receber por email automaticamente." },
    ],
  },
  projetos: {
    moduleName: "Projetos",
    context: "Planejamento e acompanhamento de projetos institucionais.",
    tips: [
      { icon: "📋", text: "Crie projetos com cronograma, equipe e orçamento.", action: "Como criar um projeto?" },
      { icon: "📊", text: "Acompanhe o progresso com indicadores de desempenho (KPIs)." },
    ],
  },
  cursos: {
    moduleName: "Cursos",
    context: "Gerenciamento de cursos, disciplinas e matrizes curriculares.",
    tips: [
      { icon: "🎓", text: "Cadastre cursos técnicos com carga horária e coordenador.", action: "Como cadastrar um curso?" },
      { icon: "📚", text: "Monte matrizes curriculares com disciplinas por semestre.", action: "Como criar matriz curricular?" },
    ],
  },
  turmas: {
    moduleName: "Turmas",
    context: "Organização de turmas e calendário acadêmico.",
    tips: [
      { icon: "👥", text: "Aloque professores e alunos nas turmas por período.", action: "Como criar uma turma?" },
      { icon: "📅", text: "Use o calendário interativo para agendar aulas e eventos.", action: "Como ver o calendário de turmas?" },
    ],
  },
  perfil: {
    moduleName: "Meu Perfil",
    context: "Suas informações pessoais e preferências.",
    tips: [
      { icon: "👤", text: "Atualize seus dados pessoais como telefone e email." },
      { icon: "🔒", text: "Altere sua senha e configure a autenticação de dois fatores." },
    ],
  },
  notificacoes: {
    moduleName: "Notificações",
    context: "Central de notificações e alertas do sistema.",
    tips: [
      { icon: "🔔", text: "As notificações são organizadas por tipo: alertas, lembretes e avisos." },
      { icon: "✅", text: "Marque notificações como lidas clicando no ícone de check." },
    ],
  },
  chat: {
    moduleName: "Chat / Mensagens",
    context: "Comunicação interna entre usuários do sistema.",
    tips: [
      { icon: "💬", text: "Envie mensagens diretas para outros usuários do sistema." },
      { icon: "👥", text: "Crie grupos de conversa por setor ou projeto." },
    ],
  },
};

// ============================================================
// Obtém ajuda contextual para a página atual
// ============================================================
export function getContextualHelp(path: string): PageHelp | null {
  const module = detectModuleFromPath(path);
  return PAGE_HELP[module] || null;
}

// ============================================================
// Gera texto formatado de ajuda contextual
// ============================================================
export function getContextualHelpText(path: string): string | null {
  const help = getContextualHelp(path);
  if (!help) return null;

  let text = `📍 Você está em **${help.moduleName}**\n\n`;
  text += `${help.context}\n\n`;
  text += `💡 **Dicas para esta página:**\n`;

  help.tips.forEach((tip) => {
    text += `• ${tip.icon} ${tip.text}\n`;
  });

  text += `\n🤖 *Pergunte-me algo sobre este módulo!*`;
  return text;
}

// ============================================================
// Gera lista de ações rápidas contextuais
// ============================================================
export function getContextualActions(path: string): { label: string; action: string }[] {
  const help = getContextualHelp(path);
  if (!help) return [];

  return help.tips
    .filter((tip) => tip.action)
    .map((tip) => ({
      label: tip.icon + " " + tip.text.split(".")[0]!,
      action: tip.action!,
    }));
}
