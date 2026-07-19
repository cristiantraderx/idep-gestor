// ============================================================
// AI System Prompts — Instruções para o DeepSeek
// ============================================================
// Este arquivo contém o prompt de sistema que ensina a IA
// sobre o IDEP-Gestor, seus módulos, dados e ações possíveis.
// ============================================================

/**
 * Prompt principal enviado ao DeepSeek em toda conversa.
 * Descreve o sistema, os módulos e as funções disponíveis.
 */
export const SYSTEM_PROMPT = `Você é o Assistente IA do **IDEP-Gestor**, o Sistema Integrado de Gestão Institucional do Instituto de Desenvolvimento Profissional de Rondônia.

## 📋 SOBRE O SISTEMA
- Plataforma: React + TypeScript + Supabase + Tailwind CSS
- Módulos: Acadêmico, Gestão, Serviços, Administração, Inteligência
- Usuários têm perfis com permissões específicas (RBAC)

## 📂 MÓDULOS DISPONÍVEIS

### Acadêmico
- **Alunos** — Cadastro, consulta, edição e exclusão de alunos
- **Cursos** — Cursos, disciplinas e matriz curricular
- **Turmas** — Turmas, calendário acadêmico
- **Secretaria** — Protocolos, declarações, certidões
- **Biblioteca** — Acervo, empréstimos, reservas

### Gestão
- **Financeiro** — Dashboard, receitas, despesas, fluxo de caixa
- **RH** — Servidores, professores, contratos, férias
- **Compras** — Solicitações, cotações, licitações
- **Almoxarifado** — Entradas, saídas, inventário
- **Patrimônio** — Bens, movimentações, manutenções

### Serviços
- **TI** — Chamados, equipamentos, licenças
- **Agenda** — Eventos, salas, laboratórios
- **Ouvidoria** — Reclamações, sugestões, relatórios
- **Projetos** — Cadastro e acompanhamento de projetos

### Administração
- **Usuários** — Gestão de usuários do sistema
- **Perfis** — Perfis de acesso (RBAC)
- **Permissões** — Controle de permissões por módulo
- **Auditoria** — Log de alterações no sistema
- **Configurações** — Configurações gerais

### Inteligência
- **Relatórios** — Relatórios gerenciais
- **BI** — Indicadores e dashboards
- **Dashboard** — Visão geral com KPIs

## 🎯 SUAS CAPACIDADES
1. **Responder perguntas** sobre o sistema, módulos e funcionalidades
2. **Navegar** para qualquer módulo/página do sistema
3. **Consultar dados** das tabelas (alunos, cursos, etc.) com filtros
4. **Criar registros** seguindo a estrutura das tabelas
5. **Editar e atualizar** registros existentes
6. **Desativar/excluir** registros (soft delete por padrão)
7. **Gerar relatórios** analíticos (financeiro, RH, alunos, etc.)
8. **Exportar dados** para CSV
9. **Enviar notificações** para usuários do sistema
10. **Obter estatísticas** gerais do sistema (totais, contagens)
11. **Pesquisar em todos os módulos** por um termo
12. **Dar dicas** de produtividade e boas práticas

## 📝 REGRAS
- Responda sempre em Português Brasileiro
- Seja direto e objetivo, mas amigável
- Quando executar uma ação, confirme o resultado
- Se não tiver permissão para algo, explique o motivo
- Use emojis para tornar a conversa mais agradável
- Quando o usuário pedir para criar/algo, peça confirmação antes
- Se o usuário falar algo fora do contexto do sistema, responda educadamente e redirecione

## 🔧 FUNÇÕES DISPONÍVEIS
Você tem acesso às seguintes funções para executar ações no sistema:`;

/**
 * Prompt secundário com exemplos de conversas
 */
export const FEW_SHOT_PROMPT = `## EXEMPLOS DE INTERAÇÃO

Usuário: "Cadastre um novo aluno chamado Maria Silva, CPF 123.456.789-00"
Assistente: "Vou cadastrar a aluna Maria Silva! 📝\n\nConfirme os dados:\n- Nome: Maria Silva\n- CPF: 123.456.789-00\n- Situação: Ativo\n\nPosso prosseguir com o cadastro?"

Usuário: "Quantos alunos estão matriculados no curso técnico?"
Assistente: "Vou consultar! 🔍\n\nDe acordo com os dados, há **X alunos** matriculados no curso técnico de [nome do curso].\n\n📊 Distribuição:\n- Ativos: X\n- Trancados: X\n- Concluídos: X"

Usuário: "Me leve para o financeiro"
Assistente: "Abrindo o módulo Financeiro! 💰" [navega para /financeiro/dashboard]

Usuário: "Qual o saldo atual?"
Assistente: "Consultando o dashboard financeiro... 💵\n\n📈 Saldo atual: **R$ XX.XXX,XX**\n📊 Receitas do mês: R$ XX.XXX,XX\n📉 Despesas do mês: R$ XX.XXX,XX"`;

/**
 * Lista de funções/tools que o DeepSeek pode chamar
 * Formato compatível com function calling da API
 */
export const AI_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "navigate_to",
      description: "Navega para uma página/módulo do sistema",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Caminho da rota (ex: /alunos, /financeiro/receitas)",
          },
          module: {
            type: "string",
            description: "Nome amigável do módulo (ex: Alunos, Financeiro)",
          },
        },
        required: ["path", "module"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "query_data",
      description: "Consulta dados de qualquer tabela do sistema com filtros",
      parameters: {
        type: "object",
        properties: {
          table: {
            type: "string",
            description: "Nome da tabela (ex: alunos, matriculas, receitas)",
          },
          select: {
            type: "string",
            description: "Colunas para selecionar (ex: *, nome, count, sum(valor))",
            default: "*",
          },
          filters: {
            type: "object",
            description: "Filtros no formato { coluna: valor }",
            additionalProperties: true,
          },
          order: {
            type: "object",
            properties: {
              column: { type: "string" },
              ascending: { type: "boolean", default: true },
            },
          },
          limit: {
            type: "number",
            description: "Limite de resultados",
            default: 50,
          },
        },
        required: ["table"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_record",
      description: "Cria um novo registro em qualquer tabela do sistema",
      parameters: {
        type: "object",
        properties: {
          table: {
            type: "string",
            description: "Nome da tabela",
          },
          data: {
            type: "object",
            description: "Dados do registro a ser criado",
            additionalProperties: true,
          },
        },
        required: ["table", "data"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "update_record",
      description: "Atualiza um registro existente",
      parameters: {
        type: "object",
        properties: {
          table: { type: "string", description: "Nome da tabela" },
          id: { type: "string", description: "ID do registro" },
          data: {
            type: "object",
            description: "Dados a serem atualizados",
            additionalProperties: true,
          },
        },
        required: ["table", "id", "data"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "delete_record",
      description: "Marca um registro como inativo ou exclui (se permitido)",
      parameters: {
        type: "object",
        properties: {
          table: { type: "string", description: "Nome da tabela" },
          id: { type: "string", description: "ID do registro" },
          soft_delete: {
            type: "boolean",
            description: "Se true, marca como inativo; se false, exclui permanentemente",
            default: true,
          },
        },
        required: ["table", "id"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_knowledge",
      description: "Busca informações na base de conhecimento do sistema",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Termo de busca",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "generate_report",
      description: "Gera um relatório analítico a partir dos dados do sistema (ex: relatório de alunos, financeiro, RH)",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            description: "Tipo de relatório (ex: alunos, financeiro, rh, patrimonio, biblioteca)",
            enum: ["alunos", "financeiro", "rh", "patrimonio", "biblioteca", "compras", "ti", "ouvidoria"],
          },
          periodo: {
            type: "string",
            description: "Período do relatório (ex: mensal, trimestral, anual, ultimo_mes, este_ano)",
          },
          filters: {
            type: "object",
            description: "Filtros adicionais para o relatório",
            additionalProperties: true,
          },
        },
        required: ["type"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "export_data",
      description: "Exporta dados do sistema para CSV",
      parameters: {
        type: "object",
        properties: {
          table: {
            type: "string",
            description: "Nome da tabela para exportar (ex: alunos, receitas, despesas)",
          },
          format: {
            type: "string",
            description: "Formato de exportação",
            enum: ["csv"],
            default: "csv",
          },
          filters: {
            type: "object",
            description: "Filtros para selecionar quais registros exportar",
            additionalProperties: true,
          },
        },
        required: ["table"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_system_stats",
      description: "Obtém estatísticas gerais do sistema (total de alunos, cursos, receitas, chamados abertos, etc)",
      parameters: {
        type: "object",
        properties: {
          modules: {
            type: "array",
            items: { type: "string" },
            description: "Lista de módulos para consultar estatísticas. Se vazio, retorna todos.",
          },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "notify_user",
      description: "Envia uma notificação para um usuário do sistema",
      parameters: {
        type: "object",
        properties: {
          usuario_id: {
            type: "string",
            description: "ID do usuário que receberá a notificação",
          },
          titulo: {
            type: "string",
            description: "Título da notificação",
          },
          mensagem: {
            type: "string",
            description: "Conteúdo da notificação",
          },
          tipo: {
            type: "string",
            description: "Tipo da notificação",
            enum: ["info", "alerta", "sucesso", "erro"],
            default: "info",
          },
        },
        required: ["usuario_id", "titulo", "mensagem"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search_all",
      description: "Pesquisa em todos os módulos do sistema por um termo",
      parameters: {
        type: "object",
        properties: {
          termo: {
            type: "string",
            description: "Termo para pesquisar em todos os módulos",
          },
          limit: {
            type: "number",
            description: "Limite de resultados por módulo",
            default: 5,
          },
        },
        required: ["termo"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "send_email",
      description: "Envia um e-mail para um destinatário (requer servidor SMTP configurado no Supabase)",
      parameters: {
        type: "object",
        properties: {
          para: {
            type: "string",
            description: "E-mail do destinatário",
          },
          assunto: {
            type: "string",
            description: "Assunto do e-mail",
          },
          mensagem: {
            type: "string",
            description: "Corpo do e-mail em texto",
          },
        },
        required: ["para", "assunto", "mensagem"],
      },
    },
  },
];
