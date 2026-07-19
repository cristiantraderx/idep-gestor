// ============================================================
// Voice Commands — Atalhos de Voz para Navegação
// ============================================================
// Comandos em Português, Inglês e Espanhol que navegam
// diretamente para a página sem resposta textual.
// ============================================================

export interface VoiceCommand {
  /** Padrões regex para detectar o comando */
  patterns: RegExp[];
  /** Ação a executar */
  action: "navigate" | "back" | "home" | "help";
  /** Rota de destino (para navigate/home) */
  href?: string;
  /** Rótulo amigável para exibição */
  label: string;
  /** Ícone (emoji) associado */
  icon: string;
}

// ============================================================
// HELPERS: gera patterns para comandos em múltiplos idiomas
// ============================================================

/** Patterns PT para navegação: "ir para X", "abra X", "mostre X", etc */
function ptNav(module: string, ...aliases: string[]): RegExp[] {
  const words = [module, ...aliases];
  return [
    new RegExp(`ir para (${words.join("|")})`, "i"),
    new RegExp(`abri[r] (${words.join("|")})`, "i"),             // abrir, abri
    new RegExp(`abra (?:o |a )?(${words.join("|")})`, "i"),      // abra o/a X
    new RegExp(`vai pra? (${words.join("|")})`, "i"),
    new RegExp(`mostra[r] (?:o |a )?(${words.join("|")})`, "i"), // mostrar, mostra
    new RegExp(`mostre (?:o |a )?(${words.join("|")})`, "i"),    // mostre o/a X
    new RegExp(`vej[aô] (?:o |a )?(${words.join("|")})`, "i"),   // veja, vê o X
    new RegExp(`quero (?:o |a |ver )?(${words.join("|")})`, "i"),// quero X, quero ver X
    new RegExp(`acesse (?:o |a )?(${words.join("|")})`, "i"),    // acesse o X
    new RegExp(`acessa[r] (?:o |a )?(${words.join("|")})`, "i"), // acessar X, acessa X
    new RegExp(`exibi[r] (?:o |a )?(${words.join("|")})`, "i"),  // exibir, exibe X
    new RegExp(`preciso (?:do |da |de )?(${words.join("|")})`, "i"), // preciso de X
    new RegExp(`onde fica (?:o |a )?(${words.join("|")})`, "i"), // onde fica o X
    new RegExp(`leve[- ]me (?:para |ao |a )?(${words.join("|")})`, "i"), // leve-me para X
    new RegExp(`((?:o |a )?${words.join("|")})$`, "i"),           // X no final
  ];
}

/** Patterns EN para navegação: "go to X", "open X", "show me X", etc */
function enNav(module: string, ...aliases: string[]): RegExp[] {
  const words = [module, ...aliases];
  return [
    new RegExp(`go to (?:the )?(${words.join("|")})`, "i"),
    new RegExp(`open (?:the )?(${words.join("|")})`, "i"),
    new RegExp(`show (?:me )?(?:the )?(${words.join("|")})`, "i"),
    new RegExp(`navigate to (?:the )?(${words.join("|")})`, "i"),
    new RegExp(`take me to (?:the )?(${words.join("|")})`, "i"),
    new RegExp(`i want (?:the |to see |to view )?(${words.join("|")})`, "i"),
    new RegExp(`i need (?:the )?(${words.join("|")})`, "i"),
    new RegExp(`view (?:the )?(${words.join("|")})`, "i"),
    new RegExp(`display (?:the )?(${words.join("|")})`, "i"),
    new RegExp(`where is (?:the )?(${words.join("|")})`, "i"),
    new RegExp(`(?:the )?(${words.join("|")})$`, "i"),
  ];
}

/** Patterns ES para navegação: "ir a X", "muéstrame X", etc */
function esNav(module: string, ...aliases: string[]): RegExp[] {
  const words = [module, ...aliases];
  return [
    new RegExp(`ir a (?:el |la |los |las )?(${words.join("|")})`, "i"),
    new RegExp(`abri[r] (?:el |la )?(${words.join("|")})`, "i"),
    new RegExp(`vamos a (?:el |la )?(${words.join("|")})`, "i"),
    new RegExp(`mu[eé]strame (?:el |la )?(${words.join("|")})`, "i"),
    new RegExp(`mostra[r] (?:el |la )?(${words.join("|")})`, "i"),
    new RegExp(`quiero (?:el |la |ver )?(${words.join("|")})`, "i"),
    new RegExp(`necesito (?:el |la )?(${words.join("|")})`, "i"),
    new RegExp(`d[oó]nde est[áa] (?:el |la )?(${words.join("|")})`, "i"),
    new RegExp(`accede a (?:el |la )?(${words.join("|")})`, "i"),
    new RegExp(`ve[r] (?:el |la )?(${words.join("|")})`, "i"),
    new RegExp(`(?:el |la |los |las )?(${words.join("|")})$`, "i"),
  ];
}

// ============================================================
// Mapa completo de comandos de voz (PT, EN, ES)
// ============================================================
export const VOICE_COMMANDS: VoiceCommand[] = [
  // ==================== DASHBOARD ====================
  {
    patterns: [...ptNav("dashboard", "início", "painel"), ...enNav("dashboard", "home"), ...esNav("dashboard", "inicio", "panel")],
    action: "navigate", href: "/dashboard", label: "Dashboard", icon: "📊",
  },
  // ==================== ALUNOS ====================
  {
    patterns: [...ptNav("alunos", "estudantes"), ...enNav("students", "alunos"), ...esNav("alumnos", "estudiantes")],
    action: "navigate", href: "/alunos", label: "Alunos", icon: "👥",
  },
  // ==================== MATRÍCULAS ====================
  {
    patterns: [...ptNav("matrículas", "matriculas"), ...enNav("enrollments", "enrollment"), ...esNav("matrículas", "matriculas")],
    action: "navigate", href: "/alunos/matriculas", label: "Matrículas", icon: "📝",
  },
  // ==================== CURSOS ====================
  {
    patterns: [...ptNav("cursos"), ...enNav("courses", "course"), ...esNav("cursos")],
    action: "navigate", href: "/cursos", label: "Cursos", icon: "🎓",
  },
  // ==================== DISCIPLINAS ====================
  {
    patterns: [...ptNav("disciplinas"), ...enNav("subjects", "disciplines"), ...esNav("asignaturas", "disciplinas")],
    action: "navigate", href: "/cursos/disciplinas", label: "Disciplinas", icon: "📖",
  },
  // ==================== TURMAS ====================
  {
    patterns: [...ptNav("turmas"), ...enNav("classes", "class"), ...esNav("clases", "aulas")],
    action: "navigate", href: "/turmas", label: "Turmas", icon: "📚",
  },
  // ==================== CALENDÁRIO ====================
  {
    patterns: [...ptNav("calendário", "calendario", "calendário acadêmico", "calendario academico"), ...enNav("calendar", "academic calendar"), ...esNav("calendario", "calendario académico")],
    action: "navigate", href: "/turmas/calendario", label: "Calendário", icon: "🗓️",
  },
  // ==================== SECRETARIA ====================
  {
    patterns: [...ptNav("secretaria", "protocolos"), ...enNav("secretary", "protocols"), ...esNav("secretaría", "protocolo")],
    action: "navigate", href: "/secretaria/protocolos", label: "Secretaria", icon: "📋",
  },
  // ==================== RH ====================
  {
    patterns: [
      ...ptNav("rh", "recursos humanos", "pessoal"),
      ...enNav("hr", "human resources", "staff"),
      ...esNav("rh", "recursos humanos", "personal"),
    ],
    action: "navigate", href: "/rh/servidores", label: "Recursos Humanos", icon: "👤",
  },
  // ==================== FINANCEIRO ====================
  {
    patterns: [
      ...ptNav("financeiro", "contabilidade", "tesouraria"),
      ...enNav("financial", "finance", "accounting"),
      ...esNav("financiero", "contabilidad"),
    ],
    action: "navigate", href: "/financeiro/dashboard", label: "Financeiro", icon: "💰",
  },
  // ==================== RECEITAS ====================
  {
    patterns: [...ptNav("receitas", "receita"), ...enNav("revenues", "income"), ...esNav("ingresos", "ganancias")],
    action: "navigate", href: "/financeiro/receitas", label: "Receitas", icon: "📈",
  },
  // ==================== DESPESAS ====================
  {
    patterns: [...ptNav("despesas", "despesa", "gastos"), ...enNav("expenses", "expenditures"), ...esNav("gastos", "egresos")],
    action: "navigate", href: "/financeiro/despesas", label: "Despesas", icon: "📉",
  },
  // ==================== FLUXO DE CAIXA ====================
  {
    patterns: [...ptNav("fluxo de caixa", "fluxo caixa"), ...enNav("cash flow", "cashflow"), ...esNav("flujo de caja", "efectivo")],
    action: "navigate", href: "/financeiro/fluxo-caixa", label: "Fluxo de Caixa", icon: "💵",
  },
  // ==================== COMPRAS ====================
  {
    patterns: [...ptNav("compras", "licitações", "licitacoes"), ...enNav("purchases", "procurement"), ...esNav("compras")],
    action: "navigate", href: "/compras/solicitacoes", label: "Compras", icon: "🛒",
  },
  // ==================== ALMOXARIFADO ====================
  {
    patterns: [...ptNav("almoxarifado", "estoque"), ...enNav("warehouse", "stock", "inventory"), ...esNav("almacén", "inventario")],
    action: "navigate", href: "/almoxarifado/entradas", label: "Almoxarifado", icon: "📦",
  },
  // ==================== PATRIMÔNIO ====================
  {
    patterns: [
      ...ptNav("patrimônio", "patrimonio", "bens"),
      ...enNav("assets", "patrimony", "goods"),
      ...esNav("patrimonio", "bienes"),
    ],
    action: "navigate", href: "/patrimonio/bens", label: "Patrimônio", icon: "🏛️",
  },
  // ==================== BIBLIOTECA ====================
  {
    patterns: [
      ...ptNav("biblioteca", "acervo", "livros"),
      ...enNav("library", "books"),
      ...esNav("biblioteca", "acervo", "libros"),
    ],
    action: "navigate", href: "/biblioteca/acervo", label: "Biblioteca", icon: "📖",
  },
  // ==================== AGENDA ====================
  {
    patterns: [
      ...ptNav("agenda", "eventos"),
      ...enNav("agenda", "events"),
      ...esNav("agenda", "eventos"),
    ],
    action: "navigate", href: "/agenda/eventos", label: "Agenda", icon: "📅",
  },
  // ==================== TI ====================
  {
    patterns: [
      ...ptNav("ti", "chamados", "suporte"),
      ...enNav("it", "support", "tickets"),
      ...esNav("ti", "soporte"),
    ],
    action: "navigate", href: "/ti/chamados", label: "TI / Chamados", icon: "💻",
  },
  // ==================== OUVIDORIA ====================
  {
    patterns: [
      ...ptNav("ouvidoria", "reclamações", "reclamacoes"),
      ...enNav("ombudsman", "complaints"),
      ...esNav("auditoría", "quejas", "reclamos"),
    ],
    action: "navigate", href: "/ouvidoria/sugestoes", label: "Ouvidoria", icon: "🎧",
  },
  // ==================== RELATÓRIOS ====================
  {
    patterns: [
      ...ptNav("relatórios", "relatorios", "relatorio"),
      ...enNav("reports", "report"),
      ...esNav("informes", "reportes"),
    ],
    action: "navigate", href: "/relatorios", label: "Relatórios", icon: "📈",
  },
  // ==================== BI ====================
  {
    patterns: [
      ...ptNav("bi"),
      ...enNav("bi", "business intelligence"),
      ...esNav("bi", "inteligencia de negocios"),
    ],
    action: "navigate", href: "/bi", label: "BI", icon: "📊",
  },
  // ==================== PROJETOS ====================
  {
    patterns: [...ptNav("projetos"), ...enNav("projects", "project"), ...esNav("proyectos")],
    action: "navigate", href: "/projetos", label: "Projetos", icon: "🚀",
  },
  // ==================== ADMIN ====================
  {
    patterns: [
      ...ptNav("admin", "administração", "administracao", "usuários", "usuarios"),
      ...enNav("admin", "administration", "users"),
      ...esNav("admin", "administración", "usuarios"),
    ],
    action: "navigate", href: "/admin/usuarios", label: "Administração", icon: "⚙️",
  },
  // ==================== AUDITORIA ====================
  {
    patterns: [...ptNav("auditoria"), ...enNav("audit"), ...esNav("auditoría")],
    action: "navigate", href: "/auditoria", label: "Auditoria", icon: "🛡️",
  },
  // ==================== CONFIGURAÇÕES ====================
  {
    patterns: [
      ...ptNav("configurações", "configuracoes", "config"),
      ...enNav("settings", "configuration"),
      ...esNav("configuración", "ajustes", "config"),
    ],
    action: "navigate", href: "/configuracoes", label: "Configurações", icon: "🔧",
  },
  // ==================== PERFIL ====================
  {
    patterns: [
      ...ptNav("perfil", "meu perfil"),
      ...enNav("profile", "my profile"),
      ...esNav("perfil", "mi perfil"),
    ],
    action: "navigate", href: "/perfil", label: "Meu Perfil", icon: "👤",
  },
  // ==================== NOTIFICAÇÕES ====================
  {
    patterns: [
      ...ptNav("notificações", "notificacoes", "alertas"),
      ...enNav("notifications", "alerts"),
      ...esNav("notificaciones", "alertas"),
    ],
    action: "navigate", href: "/notificacoes", label: "Notificações", icon: "🔔",
  },
  // ==================== COMANDOS ESPECIAIS ====================
  {
    patterns: [
      /voltar/i, /retornar/i, /volta/i,
      /back/i, /go back/i, /return/i,
      /atr[áa]s/i, /regresar/i, /volver/i,
    ],
    action: "back", label: "Voltar", icon: "🔙",
  },
  {
    patterns: [
      /in[íi]cio/i, /home/i, /pagina inicial/i,
      /go home/i, /start/i,
      /inicio/i, /p[áa]gina inicial/i, /comienzo/i,
    ],
    action: "home", href: "/dashboard", label: "Início", icon: "🏠",
  },
  {
    patterns: [
      /ajuda/i, /socorro/i, /o que (eu )?posso (dizer|falar|perguntar)/i, /comandos de voz/i, /comandos dispon[ií]veis/i,
      /help/i, /what can I (say|ask)/i, /voice commands/i,
      /ayuda/i, /socorro/i, /qu[eé] puedo (decir|preguntar)/i, /comandos de voz/i,
    ],
    action: "help", label: "Ajuda (Comandos de Voz)", icon: "❓",
  },
];

// ============================================================
// Detecta se um texto é um comando de voz de navegação
// ============================================================
export function detectVoiceCommand(text: string): VoiceCommand | null {
  for (const cmd of VOICE_COMMANDS) {
    for (const pattern of cmd.patterns) {
      if (pattern.test(text.trim())) {
        return cmd;
      }
    }
  }
  return null;
}

// ============================================================
// Gera mensagem de ajuda com todos os comandos disponíveis
// ============================================================
export function getVoiceHelpText(): string {
  const navCommands = VOICE_COMMANDS.filter((c) => c.action === "navigate");
  const specialCommands = VOICE_COMMANDS.filter((c) => c.action !== "navigate");

  let help = "🎤 **Comandos de Voz** (Voice Commands / Comandos de Voz)\n\n";
  help += "Diga em Português, English ou Español:\n\n";
  help += "**📍 Navegação**\n";
  help += navCommands
    .map((c) => `• ${c.icon} **${c.label}**`)
    .join("\n");
  help += "\n\n**⚡ Especiais**\n";
  help += specialCommands
    .map((c) => `• ${c.icon} **${c.label}**`)
    .join("\n");
  help += "\n\n🌐 *Reconhecimento automático: PT, EN, ES*\n💡 *Clique no 🎤 e fale o comando!*";

  return help;
}
