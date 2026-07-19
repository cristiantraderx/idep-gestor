// ============================================================
// AI Service — Comunicação com APIs de IA (DeepSeek + OpenAI)
// ============================================================
// Suporta dois provedores: DeepSeek e OpenAI, selecionáveis
// pelo usuário via seletor no assistente.
// ============================================================

import { SYSTEM_PROMPT, AI_TOOLS } from "@/constants/ai-prompts";

// ============================================================
// Types
// ============================================================

export type Role = "system" | "user" | "assistant" | "tool";

export type AIProvider = "deepseek" | "openai";

export interface Message {
  role: Role;
  content: string;
  tool_call_id?: string;
  name?: string;
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface AIResponse {
  content: string | null;
  toolCalls: ToolCall[];
  finishReason: "stop" | "tool_calls" | "length" | "error";
}

export interface AIConfig {
  provider: AIProvider;
  model: string;
  temperature: number;
  maxTokens: number;
}

// ============================================================
// Configurações dos provedores
// ============================================================

const PROVIDER_CONFIGS: Record<AIProvider, { apiUrl: string; defaultModel: string }> = {
  deepseek: {
    apiUrl: "https://api.deepseek.com/v1/chat/completions",
    defaultModel: "deepseek-chat",
  },
  openai: {
    apiUrl: "https://api.openai.com/v1/chat/completions",
    defaultModel: "gpt-4o-mini",
  },
};

const DEFAULT_CONFIG: AIConfig = {
  provider: "deepseek",
  model: "deepseek-chat",
  temperature: 0.7,
  maxTokens: 2048,
};

/**
 * Obtém a chave da API do provedor selecionado
 */
function getApiKey(provider: AIProvider): string {
  if (provider === "openai") {
    const key = import.meta.env.VITE_OPENAI_API_KEY || "";
    if (!key) {
      console.warn(
        "⚠️ OpenAI API Key não configurada. Defina VITE_OPENAI_API_KEY no .env"
      );
    }
    return key;
  }

  // deepseek
  const key = import.meta.env.VITE_DEEPSEEK_API_KEY || "";
  if (!key) {
    console.warn(
      "⚠️ DeepSeek API Key não configurada. Defina VITE_DEEPSEEK_API_KEY no .env"
    );
  }
  return key;
}

/**
 * Obtém o nome amigável do modelo para exibição
 */
export function getModelDisplayName(provider: AIProvider, model?: string): string {
  if (provider === "openai") {
    const modelName = model || "gpt-4o-mini";
    const names: Record<string, string> = {
      "gpt-4o-mini": "GPT-4o Mini",
      "gpt-4o": "GPT-4o",
      "gpt-4-turbo": "GPT-4 Turbo",
    };
    return names[modelName] || modelName;
  }
  const modelName = model || "deepseek-chat";
  const names: Record<string, string> = {
    "deepseek-chat": "DeepSeek Chat",
    "deepseek-reasoner": "DeepSeek Reasoner",
  };
  return names[modelName] || modelName;
}

/**
 * Obtém o ícone/emoji do provedor
 */
export function getProviderIcon(provider: AIProvider): string {
  return provider === "openai" ? "🟢" : "🧠";
}

// ============================================================
// API Chat — Unificada para DeepSeek e OpenAI
// ============================================================

/**
 * Envia uma mensagem para a API do provedor selecionado
 * com suporte a function calling.
 */
export async function sendMessage(
  messages: Message[],
  config: Partial<AIConfig> = {}
): Promise<AIResponse> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const provider = fullConfig.provider;
  const apiKey = getApiKey(provider);

  if (!apiKey) {
    return {
      content: null,
      toolCalls: [],
      finishReason: "error",
    };
  }

  const providerConfig = PROVIDER_CONFIGS[provider];
  // Usa o modelo padrão do provedor atual. Só usa modelo customizado
  // se ele for diferente do modelo padrão do outro provedor.
  const model = fullConfig.model === DEFAULT_CONFIG.model
    ? providerConfig.defaultModel
    : fullConfig.model;
  const apiUrl = providerConfig.apiUrl;

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        temperature: fullConfig.temperature,
        max_tokens: fullConfig.maxTokens,
        tools: AI_TOOLS,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.error(`${provider} API error:`, response.status, errorBody);
      return {
        content: `❌ Erro na API ${provider}: ${response.status}`,
        toolCalls: [],
        finishReason: "error",
      };
    }

    const data = await response.json();
    const choice = data.choices?.[0];

    if (!choice) {
      return { content: null, toolCalls: [], finishReason: "error" };
    }

    const message = choice.message;

    return {
      content: message.content || null,
      toolCalls: (message.tool_calls as Array<{ id: string; function: { name: string; arguments: string } }>)?.map((tc) => ({
        id: tc.id,
        type: "function" as const,
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments,
        },
      })) || [],
      finishReason: choice.finish_reason === "stop"
        ? "stop"
        : choice.finish_reason === "tool_calls"
        ? "tool_calls"
        : choice.finish_reason === "length"
        ? "length"
        : "error",
    };
  } catch (err) {
    console.error(`${provider} API request failed:`, err);
    return {
      content: `❌ Erro de conexão com ${provider}: ${err instanceof Error ? err.message : "Erro desconhecido"}`,
      toolCalls: [],
      finishReason: "error",
    };
  }
}

/**
 * Verifica se algum provedor de IA está configurado
 */
export function isAnyAIConfigured(): boolean {
  return !!(import.meta.env.VITE_DEEPSEEK_API_KEY || import.meta.env.VITE_OPENAI_API_KEY);
}

/**
 * Verifica se um provedor específico está configurado
 */
export function isProviderConfigured(provider: AIProvider): boolean {
  if (provider === "openai") return !!import.meta.env.VITE_OPENAI_API_KEY;
  return !!import.meta.env.VITE_DEEPSEEK_API_KEY;
}

/**
 * Envia mensagens e processa tool calls automaticamente
 * (loop de function calling)
 */
export async function sendMessageWithTools(
  messages: Message[],
  executeTool: (toolCall: ToolCall) => Promise<string>,
  config: Partial<AIConfig> = {}
): Promise<{ content: string; toolResults: string[] }> {
  const currentMessages = [...messages];
  const toolResults: string[] = [];
  const maxIterations = 5; // segurança para evitar loops infinitos
  let iteration = 0;

  while (iteration < maxIterations) {
    const response = await sendMessage(currentMessages, config);

    if (response.finishReason === "error") {
      return {
        content: response.content || "❌ Erro ao processar a requisição.",
        toolResults,
      };
    }

    // Se não tem tool calls, é a resposta final
    if (response.toolCalls.length === 0) {
      return {
        content: response.content || "",
        toolResults,
      };
    }

    // Processa cada tool call
    for (const toolCall of response.toolCalls) {
      // Adiciona a resposta do assistente com o tool call
      currentMessages.push({
        role: "assistant",
        content: response.content ?? "",
        tool_call_id: toolCall.id,
      });

      // Executa a ferramenta
      const result = await executeTool(toolCall);
      toolResults.push(result);

      // Adiciona o resultado da ferramenta
      currentMessages.push({
        role: "tool",
        content: result,
        tool_call_id: toolCall.id,
        name: toolCall.function.name,
      });
    }

    iteration++;
  }

  // Se chegou aqui, excedeu o número máximo de iterações
  return {
    content: "⚠️ Número máximo de operações atingido. Tente ser mais específico.",
    toolResults,
  };
}
