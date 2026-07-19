// ============================================================
// Language Detector — Detecção de Idioma para Reconhecimento de Voz
// ============================================================
// Detecta automaticamente se o texto falado está em Português,
// Inglês ou Espanhol, usando palavras características.
// Suporta 3 modos: manual (usuário escolhe), automático (detecta
// do texto), e cascata (tenta cada idioma até um funcionar).
// ============================================================

export type SupportedLang = "pt-BR" | "en-US" | "es-ES";

export interface LangConfig {
  code: SupportedLang;
  label: string;
  nativeLabel: string;
  flag: string;
  /** Palavras características para detecção de idioma */
  markers: string[];
  /** Artigos e conectores comuns que indicam o idioma */
  articles: string[];
}

export const LANG_CONFIGS: Record<SupportedLang, LangConfig> = {
  "pt-BR": {
    code: "pt-BR",
    label: "Português",
    nativeLabel: "Português (BR)",
    flag: "🇧🇷",
    markers: [
      "aluno", "professor", "cadastrar", "financeiro", "patrimônio",
      "biblioteca", "secretaria", "ouvidoria", "almoxarifado",
      "matrícula", "disciplina", "turma", "curso", "relatório",
    ],
    articles: [
      "o", "a", "os", "as", "um", "uma", "uns", "umas",
      "de", "da", "do", "das", "dos", "em", "no", "na",
      "para", "por", "com", "como", "que", "é", "são",
      "este", "esta", "esse", "essa", "aquele", "aquela",
    ],
  },
  "en-US": {
    code: "en-US",
    label: "English",
    nativeLabel: "English (US)",
    flag: "🇺🇸",
    markers: [
      "student", "teacher", "register", "financial", "heritage",
      "library", "secretary", "ombudsman", "warehouse",
      "enrollment", "subject", "class", "course", "report",
      "dashboard", "settings", "profile", "users", "permissions",
    ],
    articles: [
      "the", "a", "an", "this", "that", "these", "those",
      "in", "on", "at", "to", "for", "with", "by", "from",
      "is", "are", "was", "were", "have", "has", "had",
      "my", "your", "our", "their", "its", "his", "her",
    ],
  },
  "es-ES": {
    code: "es-ES",
    label: "Español",
    nativeLabel: "Español (ES)",
    flag: "🇪🇸",
    markers: [
      "estudiante", "profesor", "registrar", "financiero", "patrimonio",
      "biblioteca", "secretaría", "auditoría", "almacén",
      "matrícula", "asignatura", "clase", "curso", "informe",
      "estudiantes", "docente", "alumno", "gestión",
    ],
    articles: [
      "el", "la", "los", "las", "un", "una", "unos", "unas",
      "de", "del", "en", "para", "por", "con", "es", "son",
      "este", "esta", "ese", "esa", "aquel", "aquella",
      "mi", "tu", "su", "nuestro", "vuestro",
    ],
  },
};

export const LANG_ORDER: SupportedLang[] = ["pt-BR", "en-US", "es-ES"];

// ============================================================
// Storage para preferência de idioma do usuário
// ============================================================
const LANG_PREF_KEY = "idep-voice-lang";

export function getSavedLanguage(): SupportedLang | null {
  try {
    const val = localStorage.getItem(LANG_PREF_KEY);
    if (val && (val === "pt-BR" || val === "en-US" || val === "es-ES")) {
      return val;
    }
  } catch { /* ignore */ }
  return null;
}

export function saveLanguagePreference(lang: SupportedLang) {
  try {
    localStorage.setItem(LANG_PREF_KEY, lang);
  } catch { /* ignore */ }
}

// ============================================================
// Detecta o idioma de um texto usando palavras características
// ============================================================
export function detectLanguage(text: string): SupportedLang {
  const lower = text.toLowerCase().trim();
  if (!lower) return "pt-BR"; // fallback padrão

  const scores: Record<SupportedLang, number> = {
    "pt-BR": 0,
    "en-US": 0,
    "es-ES": 0,
  };

  // Pontua por palavras características
  for (const [lang, config] of Object.entries(LANG_CONFIGS)) {
    for (const marker of config.markers) {
      if (lower.includes(marker)) {
        scores[lang as SupportedLang] += 3;
      }
    }
    for (const article of config.articles) {
      // Busca como palavra inteira (com limites de palavra)
      const regex = new RegExp(`\\b${article}\\b`, "i");
      if (regex.test(lower)) {
        scores[lang as SupportedLang] += 1;
      }
    }
  }

  // Encontra o idioma com maior pontuação
  let best: SupportedLang = "pt-BR";
  let bestScore = 0;

  for (const lang of LANG_ORDER) {
    if (scores[lang] > bestScore) {
      bestScore = scores[lang];
      best = lang;
    }
  }

  // Se a pontuação for muito baixa, mantém o padrão
  if (bestScore < 2) {
    const saved = getSavedLanguage();
    if (saved) return saved;
  }

  return best;
}

// ============================================================
// Gera a ordem de tentativas para reconhecimento de voz
// baseado no idioma preferido + fallbacks
// ============================================================
export function getLanguageAttemptOrder(preferred?: SupportedLang): SupportedLang[] {
  const order: SupportedLang[] = [];

  // Primeiro o preferido
  if (preferred && LANG_ORDER.includes(preferred)) {
    order.push(preferred);
  } else {
    // Se não tem preferido, tenta o salvo ou pt-BR
    const saved = getSavedLanguage();
    order.push(saved || "pt-BR");
  }

  // Depois os outros em ordem
  for (const lang of LANG_ORDER) {
    if (!order.includes(lang)) {
      order.push(lang);
    }
  }

  return order;
}

// ============================================================
// Mensagens de status em cada idioma
// ============================================================
export const LISTENING_MESSAGES: Record<SupportedLang, {
  recording: string;
  placeholder: string;
  transcribing: string;
}> = {
  "pt-BR": {
    recording: "Gravando",
    placeholder: "🎤 Falando... A transcrição aparecerá aqui",
    transcribing: "Transcrevendo...",
  },
  "en-US": {
    recording: "Recording",
    placeholder: "🎤 Speaking... The transcription will appear here",
    transcribing: "Transcribing...",
  },
  "es-ES": {
    recording: "Grabando",
    placeholder: "🎤 Hablando... La transcripción aparecerá aquí",
    transcribing: "Transcribiendo...",
  },
};

// ============================================================
// Tipos para API de reconhecimento de voz
// ============================================================
export interface SpeechRecognitionAttempt {
  lang: SupportedLang;
  transcript?: string;
  error?: string;
}

export interface VoiceRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: unknown) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
}

export interface VoiceRecognitionConstructor {
  new (config?: Record<string, unknown>): VoiceRecognitionInstance;
}

// ============================================================
// API de reconhecimento de voz específica por idioma
// ============================================================
export function createRecognitionForLang(
  SpeechRecognitionAPI: VoiceRecognitionConstructor,
  lang: SupportedLang,
) {
  const recognition = new SpeechRecognitionAPI();
  recognition.lang = lang;
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  return recognition;
}
