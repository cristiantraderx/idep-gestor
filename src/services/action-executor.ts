// ============================================================
// Action Executor — Executa ações no sistema via Supabase
// ============================================================
// Este serviço é chamado pelo AI Service quando o DeepSeek
// solicita a execução de uma ferramenta (navegar, consultar,
// criar, editar, excluir registros).
// ============================================================

import { supabase } from "@/integrations/supabase/client";
import { searchKnowledge } from "@/constants/assistant-knowledge";
import type { ToolCall } from "./ai-service";

// ============================================================
// Tipos de resultado
// ============================================================

export interface ActionResult {
  success: boolean;
  message: string;
  data?: unknown;
  navigateTo?: string;
}

// ============================================================
// Executor principal
// ============================================================

/**
 * Executa uma tool call baseada no nome da função e argumentos.
 * O DeepSeek decide qual função chamar baseado no contexto.
 */
export async function executeToolCall(toolCall: ToolCall): Promise<string> {
  const { name, arguments: argsStr } = toolCall.function;

  let args: Record<string, unknown>;
  try {
    args = JSON.parse(argsStr);
  } catch {
    return `❌ Erro ao processar argumentos da função "${name}".`;
  }

  try {
    let result: ActionResult;

    switch (name) {
      case "navigate_to":
        result = await handleNavigate(args);
        break;
      case "query_data":
        result = await handleQueryData(args);
        break;
      case "create_record":
        result = await handleCreateRecord(args);
        break;
      case "update_record":
        result = await handleUpdateRecord(args);
        break;
      case "delete_record":
        result = await handleDeleteRecord(args);
        break;
      case "get_knowledge":
        result = await handleGetKnowledge(args);
        break;
      case "generate_report":
        result = await handleGenerateReport(args);
        break;
      case "export_data":
        result = await handleExportData(args);
        break;
      case "get_system_stats":
        result = await handleGetSystemStats(args);
        break;
      case "notify_user":
        result = await handleNotifyUser(args);
        break;
      case "search_all":
        result = await handleSearchAll(args);
        break;
      case "send_email":
        result = await handleSendEmail(args);
        break;
      default:
        result = {
          success: false,
          message: `❌ Função desconhecida: "${name}".`,
        };
    }

    // Se a ação requer navegação, inclui o caminho
    if (result.navigateTo) {
      return JSON.stringify({
        success: result.success,
        message: result.message,
        data: result.data,
        navigateTo: result.navigateTo,
      });
    }

    return JSON.stringify({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    console.error(`Error executing ${name}:`, err);
    return JSON.stringify({
      success: false,
      message: `❌ Erro ao executar "${name}": ${err instanceof Error ? err.message : "Erro desconhecido"}`,
    });
  }
}

// ============================================================
// Handlers específicos
// ============================================================

/**
 * Gera um relatório analítico
 */
async function handleGenerateReport(args: Record<string, unknown>): Promise<ActionResult> {
  const type = args.type as string;
  const periodo = (args.periodo as string) || "geral";
  const filters = args.filters as Record<string, unknown> | undefined;

  if (!type) {
    return { success: false, message: "❌ Tipo de relatório não especificado." };
  }

  // Mapeia tipo de relatório para tabelas relevantes
  // Baseado nas migrations do Supabase
  const reportMap: Record<string, { tables: string[]; title: string }> = {
    // — Acadêmico —
    alunos: {
      tables: ["alunos", "matriculas", "turmas", "notas", "frequencia", "historico_escolar"],
      title: "Relatório de Alunos",
    },
    cursos: {
      tables: ["cursos", "disciplinas", "turma_disciplinas"],
      title: "Relatório de Cursos e Disciplinas",
    },
    turmas: {
      tables: ["turmas", "turma_disciplinas", "calendario_academico"],
      title: "Relatório de Turmas e Calendário",
    },
    secretaria: {
      tables: ["processos", "tramitacoes", "documentos"],
      title: "Relatório da Secretaria",
    },

    // — Gestão —
    rh: {
      tables: ["servidores", "professores", "contratos", "ferias", "licencas"],
      title: "Relatório de Recursos Humanos",
    },
    financeiro: {
      tables: ["receitas", "despesas", "fluxo_caixa", "centros_custo", "contratos_financeiros"],
      title: "Relatório Financeiro",
    },
    compras: {
      tables: ["solicitacoes_compra", "cotacoes", "licitacoes", "ordens_compra", "fornecedores"],
      title: "Relatório de Compras e Licitações",
    },
    almoxarifado: {
      tables: ["itens", "movimentacoes_estoque", "transferencias_estoque", "categorias_item"],
      title: "Relatório do Almoxarifado",
    },
    patrimonio: {
      tables: ["bens_patrimoniais", "movimentacoes_bens", "manutencoes"],
      title: "Relatório Patrimonial",
    },

    // — Serviços —
    biblioteca: {
      tables: ["obras", "emprestimos", "reservas", "multas"],
      title: "Relatório da Biblioteca",
    },
    agenda: {
      tables: ["eventos", "reservas_salas"],
      title: "Relatório da Agenda",
    },
    ti: {
      tables: ["chamados_ti", "equipamentos_ti", "licencas_software"],
      title: "Relatório de TI",
    },
    ouvidoria: {
      tables: ["manifestacoes", "respostas_manifestacoes"],
      title: "Relatório da Ouvidoria",
    },
    projetos: {
      tables: ["projetos", "etapas_projeto"],
      title: "Relatório de Projetos",
    },

    // — Administração —
    usuarios: {
      tables: ["usuarios", "perfis", "permissoes", "sessoes"],
      title: "Relatório de Usuários e Perfis",
    },
    auditoria: {
      tables: ["auditoria", "sessoes"],
      title: "Relatório de Auditoria",
    },
    notificacoes: {
      tables: ["notificacoes"],
      title: "Relatório de Notificações",
    },

    // — Consolidados —
    geral: {
      tables: [
        "alunos", "cursos", "turmas", "professores", "servidores",
        "receitas", "despesas", "itens", "bens_patrimoniais",
        "obras", "chamados_ti", "manifestacoes", "projetos",
      ],
      title: "Relatório Geral Consolidado",
    },
  };

  const reportConfig = reportMap[type];
  if (!reportConfig) {
    return { success: false, message: `❌ Tipo de relatório desconhecido: "${type}".` };
  }

  // Tenta buscar dados de cada tabela
  const summaries: string[] = [];
  for (const table of reportConfig.tables) {
    let query = supabase.from(table as any).select("count", { count: "exact", head: true });
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      }
    }
    const { count, error } = await query;
    if (!error) {
      summaries.push(`📊 **${table}**: ${count ?? 0} registro(s)`);
    }
  }

  const summaryText = summaries.length > 0
    ? summaries.join("\n")
    : "ℹ️ Nenhum dado encontrado para o período selecionado.";

  return {
    success: true,
    message: `📈 **${reportConfig.title}** — Período: ${periodo}\n\n${summaryText}\n\n📌 Acesse o módulo para mais detalhes.`,
    data: { type, periodo, tables: reportConfig.tables },
  };
}

/**
 * Exporta dados para CSV
 */
async function handleExportData(args: Record<string, unknown>): Promise<ActionResult> {
  const table = args.table as string;
  const format = (args.format as string) || "csv";
  const filters = args.filters as Record<string, unknown> | undefined;

  if (!table) {
    return { success: false, message: "❌ Tabela não especificada para exportação." };
  }

  // Busca dados para exportar
  let query = supabase.from(table as any).select("*");
  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    }
  }
  query = query.limit(1000);

  const { data, error } = await query;

  if (error) {
    return {
      success: false,
      message: `❌ Erro ao exportar dados de **${table}**: ${error.message}`,
    };
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return {
      success: true,
      message: `📭 Nenhum dado encontrado em **${table}** para exportar.`,
      data: [],
    };
  }

  const count = Array.isArray(data) ? data.length : 1;
  return {
    success: true,
    message: `📥 **${count} registro(s)** de **${table}** prontos para exportação no formato **${format.toUpperCase()}**.\n\n💡 No futuro, você poderá baixar o arquivo diretamente pelo navegador.`,
    data: { records: count, format, table },
  };
}

/**
 * Obtém estatísticas gerais do sistema
 */
async function handleGetSystemStats(args: Record<string, unknown>): Promise<ActionResult> {
  const modules = args.modules as string[] | undefined;

  // Tabelas para consultar estatísticas
  const statsConfig: Record<string, { table: string; label: string; icon: string }> = {
    // Acadêmico
    alunos: { table: "alunos", label: "Alunos", icon: "👨‍🎓" },
    cursos: { table: "cursos", label: "Cursos", icon: "📚" },
    disciplinas: { table: "disciplinas", label: "Disciplinas", icon: "📖" },
    turmas: { table: "turmas", label: "Turmas", icon: "🏫" },
    matriculas: { table: "matriculas", label: "Matrículas", icon: "📝" },
    professores: { table: "professores", label: "Professores", icon: "👨‍🏫" },
    // Gestão
    servidores: { table: "servidores", label: "Servidores", icon: "👤" },
    contratos: { table: "contratos", label: "Contratos", icon: "📄" },
    receitas: { table: "receitas", label: "Receitas", icon: "💰" },
    despesas: { table: "despesas", label: "Despesas", icon: "💸" },
    fornecedores: { table: "fornecedores", label: "Fornecedores", icon: "🏢" },
    itens_estoque: { table: "itens", label: "Itens em Estoque", icon: "📦" },
    bens: { table: "bens_patrimoniais", label: "Bens Tombados", icon: "🏛️" },
    // Serviços
    obras: { table: "obras", label: "Obras do Acervo", icon: "📖" },
    emprestimos: { table: "emprestimos", label: "Empréstimos", icon: "🔄" },
    chamados: { table: "chamados_ti", label: "Chamados TI", icon: "🔧" },
    equipamentos: { table: "equipamentos_ti", label: "Equipamentos TI", icon: "💻" },
    manifestacoes: { table: "manifestacoes", label: "Manifestações", icon: "📢" },
    projetos: { table: "projetos", label: "Projetos", icon: "🎯" },
    eventos: { table: "eventos", label: "Eventos", icon: "📅" },
    processos: { table: "processos", label: "Processos", icon: "📋" },
    // Administração
    usuarios: { table: "usuarios", label: "Usuários", icon: "👥" },
    notificacoes: { table: "notificacoes", label: "Notificações", icon: "🔔" },
  };

  const entries = modules
    ? Object.entries(statsConfig).filter(([key]) => modules.includes(key))
    : Object.entries(statsConfig);

  const results: string[] = [];
  const statsData: Record<string, { label: string; count: number }> = {};

  for (const [key, config] of entries) {
    const { count, error } = await supabase
      .from(config.table as any)
      .select("*", { count: "exact", head: true });

    const actualCount = (!error && count !== null) ? count : 0;
    statsData[key] = { label: config.label, count: actualCount };

    if (!error) {
      results.push(`${config.icon} **${config.label}**: ${actualCount}`);
    }
  }

  if (results.length === 0) {
    return {
      success: true,
      message: "📭 Nenhuma estatística disponível no momento.",
      data: statsData,
    };
  }

  return {
    success: true,
    message: `📊 **Estatísticas do Sistema**\n\n${results.join("\n")}`,
    data: statsData,
  };
}

/**
 * Envia notificação para um usuário
 */
async function handleNotifyUser(args: Record<string, unknown>): Promise<ActionResult> {
  const usuarioId = args.usuario_id as string;
  const titulo = args.titulo as string;
  const mensagem = args.mensagem as string;
  const tipo = (args.tipo as string) || "info";

  if (!usuarioId || !titulo || !mensagem) {
    return { success: false, message: "❌ Usuário, título e mensagem são obrigatórios." };
  }

  // Tenta criar notificação no Supabase
  const { error } = await supabase
    .from("notificacoes" as any)
    .insert({
      user_id: usuarioId,
      title: titulo,
      message: mensagem,
      type: tipo,
      read: false,
      created_at: new Date().toISOString(),
    } as any);

  if (error) {
    return {
      success: false,
      message: `❌ Erro ao enviar notificação: ${error.message}.\n\n📝 **Notificação não enviada:**\n• Título: ${titulo}\n• Mensagem: ${mensagem}\n• Tipo: ${tipo}`,
    };
  }

  return {
    success: true,
    message: `✅ Notificação enviada com sucesso!\n\n📬 **${titulo}**\n${mensagem}`,
  };
}

/**
 * Pesquisa em todos os módulos
 */
async function handleSearchAll(args: Record<string, unknown>): Promise<ActionResult> {
  const termo = args.termo as string;
  const limit = (args.limit as number) || 5;

  if (!termo || termo.length < 2) {
    return { success: false, message: "❌ Termo de pesquisa deve ter pelo menos 2 caracteres." };
  }

  const searchTables = [
    { table: "alunos", label: "Alunos", columns: ["nome", "cpf", "email"] },
    { table: "cursos", label: "Cursos", columns: ["nome", "sigla", "descricao"] },
    { table: "disciplinas", label: "Disciplinas", columns: ["nome", "sigla", "carga_horaria"] },
    { table: "professores", label: "Professores", columns: ["nome", "cpf", "email", "especialidade"] },
    { table: "servidores", label: "Servidores", columns: ["nome", "cpf", "email", "cargo"] },
    { table: "bens_patrimoniais", label: "Bens Tombados", columns: ["nome", "numero_tombo", "localizacao"] },
    { table: "chamados_ti", label: "Chamados TI", columns: ["titulo", "descricao", "status"] },
    { table: "obras", label: "Obras do Acervo", columns: ["titulo", "autor", "isbn", "editora"] },
    { table: "fornecedores", label: "Fornecedores", columns: ["nome", "cnpj", "contato"] },
    { table: "projetos", label: "Projetos", columns: ["nome", "descricao", "status"] },
    { table: "eventos", label: "Eventos", columns: ["titulo", "descricao", "local"] },
    { table: "processos", label: "Processos", columns: ["numero", "assunto", "interessado"] },
    { table: "equipamentos_ti", label: "Equipamentos TI", columns: ["nome", "patrimonio", "localizacao"] },
    { table: "licencas_software", label: "Licenças de Software", columns: ["nome", "fornecedor", "versao"] },
    { table: "itens", label: "Itens do Almoxarifado", columns: ["nome", "codigo", "categoria"] },
  ];

  const results: string[] = [];

  for (const { table, label, columns } of searchTables) {
    try {
      // Busca apenas na primeira coluna (nome) por simplicidade
      const col = columns[0]!;
      const { data, error } = await supabase
        .from(table as any)
        .select(col)
        .ilike(col, `%${termo}%`)
        .limit(limit);

      if (!error && data && Array.isArray(data) && data.length > 0) {
        const items = data.slice(0, limit).map((item: Record<string, unknown>) => `  • ${item[col]}`).join("\n");
        results.push(`📁 **${label}** (${data.length} encontrado(s)):\n${items}`);
      }
    } catch { /* ignora erro em uma tabela específica */ }
  }

  if (results.length === 0) {
    return {
      success: true,
      message: `🔍 Nenhum resultado encontrado para "**${termo}**" em todos os módulos.`,
      data: [],
    };
  }

  return {
    success: true,
    message: `🔍 **Resultados da busca por "${termo}"**\n\n${results.join("\n\n")}`,
    data: results,
  };
}

/**
 * Envia e-mail (placeholder — requer SMTP configurado no Supabase)
 */
async function handleSendEmail(args: Record<string, unknown>): Promise<ActionResult> {
  const para = args.para as string;
  const assunto = args.assunto as string;
  const mensagem = args.mensagem as string;

  if (!para || !assunto || !mensagem) {
    return { success: false, message: "❌ Destinatário, assunto e mensagem são obrigatórios." };
  }

  if (!para.includes("@")) {
    return { success: false, message: "❌ Endereço de e-mail inválido." };
  }

  // Tenta enviar via função Supabase (se configurada)
  const { error } = await supabase.functions.invoke("send-email", {
    body: { to: para, subject: assunto, message: mensagem },
  }).catch(() => ({ error: new Error("Função send-email não implantada") }));

  if (error) {
    return {
      success: true,
      message: `📧 **E-mail preparado!**\n\nPara habilitar o envio real:\n📌 Configure um servidor SMTP no Supabase Studio\n📌 Crie uma Edge Function "send-email"\n📌 Defina as variáveis SMTP no .env\n\n**Detalhes do e-mail:**\n• Para: ${para}\n• Assunto: ${assunto}\n• Mensagem: ${mensagem.substring(0, 100)}${mensagem.length > 100 ? "..." : ""}`,
      data: { to: para, subject: assunto, messagePreview: mensagem.substring(0, 100) },
    };
  }

  return {
    success: true,
    message: `✅ E-mail enviado com sucesso para **${para}**!`,
  };
}

/**
 * Navega para uma página do sistema
 */
async function handleNavigate(args: Record<string, unknown>): Promise<ActionResult> {
  const path = args.path as string;
  const module = (args.module as string) || path;

  if (!path) {
    return { success: false, message: "❌ Caminho não especificado." };
  }

  // Valida se o path é uma rota válida
  const validRoutes = [
    "/dashboard", "/alunos", "/cursos", "/turmas",
    "/secretaria/protocolos", "/rh/servidores", "/financeiro/dashboard",
    "/compras/solicitacoes", "/almoxarifado/entradas", "/patrimonio/bens",
    "/biblioteca/acervo", "/agenda/eventos", "/ti/chamados",
    "/ouvidoria/sugestoes", "/relatorios", "/bi", "/projetos",
    "/admin/usuarios", "/auditoria", "/configuracoes", "/perfil",
    "/notificacoes",
  ];

  // Se for um path curto como /alunos, verifica se existe rota específica
  if (!validRoutes.includes(path) && !path.startsWith("/admin/")) {
    const possibleRoute = validRoutes.find((r) => r.startsWith(path));
    if (possibleRoute) {
      return {
        success: true,
        message: `📍 Navegando para **${module}**...`,
        navigateTo: possibleRoute,
      };
    }
  }

  return {
    success: true,
    message: `📍 Navegando para **${module}**...`,
    navigateTo: path,
  };
}

/**
 * Consulta dados de qualquer tabela
 */
async function handleQueryData(args: Record<string, unknown>): Promise<ActionResult> {
  const table = args.table as string;
  const select = (args.select as string) || "*";
  const filters = args.filters as Record<string, unknown> | undefined;
  const order = args.order as Record<string, unknown> | undefined;
  const limit = (args.limit as number) || 50;

  if (!table) {
    return { success: false, message: "❌ Tabela não especificada." };
  }

  let query = supabase.from(table as any).select(select);

  // Aplica filtros
  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    }
  }

  // Aplica ordenação
  if (order?.column) {
    query = query.order(order.column as string, {
      ascending: (order.ascending as boolean) ?? true,
    });
  }

  // Aplica limite
  if (limit > 0) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    return {
      success: false,
      message: `❌ Erro ao consultar ${table}: ${error.message}`,
    };
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return {
      success: true,
      message: `📭 Nenhum registro encontrado em **${table}** com os filtros informados.`,
      data: [],
    };
  }

  const count = Array.isArray(data) ? data.length : 1;
  return {
    success: true,
    message: `✅ Encontrado(s) **${count}** registro(s) em **${table}**.`,
    data,
  };
}

/**
 * Cria um novo registro
 */
async function handleCreateRecord(args: Record<string, unknown>): Promise<ActionResult> {
  const table = args.table as string;
  const data = args.data as Record<string, unknown>;

  if (!table || !data) {
    return { success: false, message: "❌ Tabela e dados são obrigatórios." };
  }

  const { data: created, error } = await supabase
    .from(table as any)
    .insert(data as any)
    .select()
    .single();

  if (error) {
    return {
      success: false,
      message: `❌ Erro ao criar registro em **${table}**: ${error.message}`,
    };
  }

  return {
    success: true,
    message: `✅ Registro criado com sucesso em **${table}**!`,
    data: created,
  };
}

/**
 * Atualiza um registro existente
 */
async function handleUpdateRecord(args: Record<string, unknown>): Promise<ActionResult> {
  const table = args.table as string;
  const id = args.id as string;
  const data = args.data as Record<string, unknown>;

  if (!table || !id || !data) {
    return { success: false, message: "❌ Tabela, ID e dados são obrigatórios." };
  }

  const { data: updated, error } = await supabase
    .from(table as any)
    .update(data as any)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return {
      success: false,
      message: `❌ Erro ao atualizar registro em **${table}**: ${error.message}`,
    };
  }

  return {
    success: true,
    message: `✅ Registro atualizado com sucesso em **${table}**!`,
    data: updated,
  };
}

/**
 * Exclui (ou marca como inativo) um registro
 */
async function handleDeleteRecord(args: Record<string, unknown>): Promise<ActionResult> {
  const table = args.table as string;
  const id = args.id as string;
  const softDelete = args.soft_delete !== false; // default: soft delete

  if (!table || !id) {
    return { success: false, message: "❌ Tabela e ID são obrigatórios." };
  }

  if (softDelete) {
    // Soft delete: marca como inativo
    const { data: updated, error } = await supabase
      .from(table as any)
      .update({ ativo: false } as any)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        message: `❌ Erro ao desativar registro em **${table}**: ${error.message}`,
      };
    }

    return {
      success: true,
      message: `✅ Registro desativado com sucesso em **${table}**!`,
      data: updated,
    };
  }

  // Hard delete
  const { error } = await supabase
    .from(table as any)
    .delete()
    .eq("id", id);

  if (error) {
    return {
      success: false,
      message: `❌ Erro ao excluir registro de **${table}**: ${error.message}`,
    };
  }

  return {
    success: true,
    message: `✅ Registro excluído permanentemente de **${table}**!`,
  };
}

/**
 * Busca na base de conhecimento local
 */
async function handleGetKnowledge(args: Record<string, unknown>): Promise<ActionResult> {
  const query = args.query as string;

  if (!query) {
    return { success: false, message: "❌ Termo de busca não informado." };
  }

  const results = searchKnowledge(query);

  if (results.length === 0) {
    return {
      success: true,
      message: `📭 Nenhum resultado encontrado na base de conhecimento para "${query}".`,
      data: [],
    };
  }

  return {
    success: true,
    message: `✅ Encontrado(s) **${results.length}** resultado(s) na base de conhecimento.`,
    data: results.map((r) => ({
      title: r.title,
      message: r.message,
      link: r.link,
      category: r.category,
    })),
  };
}
