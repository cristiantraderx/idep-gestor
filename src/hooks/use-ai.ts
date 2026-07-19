// ============================================================
// useAI — Hook para gerenciar conversa com a IA
// ============================================================
// Gerencia o estado da conversa com o DeepSeek, histórico de
// mensagens, e integração com o executor de ações.
// ============================================================

import { useState, useCallback, useRef } from "react";
import {
  sendMessageWithTools,
  isProviderConfigured,
  isAnyAIConfigured,
  getModelDisplayName,
  getProviderIcon,
  type AIProvider,
  type Message,
} from "@/services/ai-service";
import { executeToolCall } from "@/services/action-executor";

// ============================================================
// Types
// ============================================================

export type AIStatus = "idle" | "thinking" | "executing" | "error" | "done";

export interface AIState {
  messages: Message[];
  status: AIStatus;
  lastToolResult: string | null;
  pendingNavigation: string | null;
}

export interface UseAIReturn {
  /** Estado atual da IA */
  state: AIState;
  /** Envia uma mensagem e processa a resposta */
  sendMessage: (text: string) => Promise<void>;
  /** Limpa o histórico da conversa */
  clearConversation: () => void;
  /** Se o provedor atual está configurado */
  isConfigured: boolean;
  /** Se algum provedor está configurado */
  isAnyConfigured: boolean;
  /** Limpa navegação pendente */
  clearNavigation: () => void;
  /** Se a IA está processando */
  isProcessing: boolean;
  /** Provedor ativo */
  provider: AIProvider;
  /** Define o provedor ativo (já limpa a conversa) */
  setProvider: (p: AIProvider) => void;
  /** Nome de exibição do modelo */
  modelDisplayName: string;
  /** Ícone do provedor */
  providerIcon: string;
}

// ============================================================
// Hook
// ============================================================

export function useAI(initialProvider: AIProvider = "deepseek"): UseAIReturn {
  const [provider, setProviderState] = useState<AIProvider>(initialProvider);
  const [state, setState] = useState<AIState>({
    messages: [],
    status: "idle",
    lastToolResult: null,
    pendingNavigation: null,
  });
  const abortRef = useRef(false);

  const isConfigured = isProviderConfigured(provider);
  const isAnyConfigured = isAnyAIConfigured();
  const modelDisplayName = getModelDisplayName(provider);
  const providerIcon = getProviderIcon(provider);

  const clearConversation = useCallback(() => {
    setState({
      messages: [],
      status: "idle",
      lastToolResult: null,
      pendingNavigation: null,
    });
  }, []);

  const clearNavigation = useCallback(() => {
    setState((prev) => ({ ...prev, pendingNavigation: null }));
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    abortRef.current = false;
    const userMessage: Message = { role: "user", content: text.trim() };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      status: "thinking",
      lastToolResult: null,
    }));

    // Se o provedor atual não está configurado
    if (!isConfigured) {
      const providerName = provider === "openai" ? "OpenAI" : "DeepSeek";
      const envKey = provider === "openai" ? "VITE_OPENAI_API_KEY" : "VITE_DEEPSEEK_API_KEY";

      setState((prev) => ({
        ...prev,
        status: "done",
        messages: [
          ...prev.messages,
          {
            role: "assistant",
            content:
              `⚙️ **${providerName} não configurado!**\n\n` +
              `Para usar este modelo, configure a chave da API ${providerName}:\n\n` +
              `1️⃣ Edite o arquivo **.env**\n` +
              `2️⃣ Adicione: \`${envKey}=sua_chave_aqui\`\n` +
              `3️⃣ Reinicie o servidor\n\n` +
              (provider === "deepseek"
                ? `💡 Você também pode alternar para o modelo **OpenAI** no seletor ao lado do 🧠.`
                : `💡 Você também pode alternar para o modelo **DeepSeek** no seletor ao lado do 🟢.`),
          },
        ],
      }));
      return;
    }

    try {
      const result = await sendMessageWithTools(
        [...state.messages, userMessage],
        async (toolCall) => {
          if (abortRef.current) return "❌ Operação cancelada.";

          setState((prev) => ({ ...prev, status: "executing" }));
          const result = await executeToolCall(toolCall);

          try {
            const parsed = JSON.parse(result);
            if (parsed.navigateTo) {
              setState((prev) => ({
                ...prev,
                pendingNavigation: parsed.navigateTo,
              }));
            }
          } catch { /* ignore */ }

          return result;
        },
        { provider } // passa o provider atual
      );

      setState((prev) => ({
        ...prev,
        status: "done",
        messages: [
          ...prev.messages,
          ...(result.content
            ? [{ role: "assistant" as const, content: result.content, tool_call_id: undefined }]
            : []),
        ],
        lastToolResult: result.toolResults.join("\n"),
      }));
    } catch (err) {
      console.error("AI conversation error:", err);
      setState((prev) => ({
        ...prev,
        status: "error",
        messages: [
          ...prev.messages,
          {
            role: "assistant",
            content: `❌ **Erro na comunicação com a IA:** ${err instanceof Error ? err.message : "Erro desconhecido"}\n\nTente novamente ou digite sua pergunta de outra forma.`,
          },
        ],
      }));
    }
  }, [state.messages, isConfigured, provider]);

  const setProvider = useCallback((newProvider: AIProvider) => {
    setProviderState(newProvider);
    setState({
      messages: [],
      status: "idle",
      lastToolResult: null,
      pendingNavigation: null,
    });
  }, []);

  return {
    state,
    sendMessage,
    clearConversation,
    isConfigured,
    isAnyConfigured,
    clearNavigation,
    isProcessing: state.status === "thinking" || state.status === "executing",
    provider,
    modelDisplayName,
    providerIcon,
    setProvider,
  };
}
