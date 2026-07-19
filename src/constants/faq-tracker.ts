// ============================================================
// FAQ Tracker — Perguntas Frequentes do Assistente
// ============================================================
// Armazena perguntas do usuário em localStorage e retorna
// as 3 mais frequentes com base na contagem + recência.
// ============================================================

const FAQ_STORAGE_KEY = "idep-assistant-faq";
const MAX_STORED = 50;

export interface FaqEntry {
  /** Texto normalizado da pergunta (lowercase, sem pontuação) */
  normalized: string;
  /** Texto original mais recente */
  original: string;
  /** Quantidade de vezes que foi perguntada */
  count: number;
  /** Timestamp da última vez (para desempate) */
  lastAsked: number;
}

// ============================================================
// Normaliza o texto para agrupar perguntas similares
// ============================================================
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-zà-ú0-9\s]/g, "") // remove pontuação
    .replace(/\s+/g, " ") // espaços múltiplos → simples
    .trim();
}

// ============================================================
// Carrega todas as FAQs do localStorage
// ============================================================
function loadAll(): FaqEntry[] {
  try {
    const stored = localStorage.getItem(FAQ_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// ============================================================
// Salva a lista de FAQs no localStorage
// ============================================================
function saveAll(entries: FaqEntry[]) {
  try {
    localStorage.setItem(FAQ_STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_STORED)));
  } catch { /* ignore */ }
}

// ============================================================
// Registra uma nova pergunta (ou incrementa existente)
// ============================================================
export function recordQuestion(text: string) {
  if (!text.trim()) return;

  const normalized = normalize(text);
  if (normalized.length < 3) return; // ignora perguntas muito curtas

  const entries = loadAll();
  const existing = entries.find((e) => e.normalized === normalized);

  if (existing) {
    existing.count += 1;
    existing.lastAsked = Date.now();
    existing.original = text;
  } else {
    entries.push({
      normalized,
      original: text,
      count: 1,
      lastAsked: Date.now(),
    });
  }

  saveAll(entries);
}

// ============================================================
// Retorna as N perguntas mais frequentes
// ============================================================
export function getTopQuestions(limit: number = 3): { text: string; count: number }[] {
  const entries = loadAll();

  // Ordena: mais frequente primeiro, depois mais recente
  const sorted = entries.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return b.lastAsked - a.lastAsked;
  });

  return sorted.slice(0, limit).map((e) => ({
    text: e.original,
    count: e.count,
  }));
}

// ============================================================
// Calcula similaridade entre duas strings (para agrupar
// perguntas similares escritas de forma diferente)
// ============================================================
function similarity(a: string, b: string): number {
  const wordsA = a.split(" ");
  const wordsB = b.split(" ");
  if (wordsA.length === 0 || wordsB.length === 0) return 0;

  const setA = new Set(wordsA);
  const setB = new Set(wordsB);
  let intersection = 0;

  for (const word of setA) {
    if (word.length < 3) continue; // ignora palavras muito curtas
    if (setB.has(word)) intersection++;
  }

  const union = Math.max(setA.size, setB.size);
  return union > 0 ? intersection / union : 0;
}

// ============================================================
// Registra pergunta com agrupamento por similaridade
// (ex: "Como cadastrar aluno" ≈ "cadastrar um aluno")
// ============================================================
export function recordQuestionSmart(text: string) {
  if (!text.trim()) return;

  const normalized = normalize(text);
  if (normalized.length < 3) return;

  const entries = loadAll();

  // Procura por matching exato ou similar
  let found = false;
  for (const entry of entries) {
    if (entry.normalized === normalized) {
      entry.count += 1;
      entry.lastAsked = Date.now();
      entry.original = text;
      found = true;
      break;
    }
  }

  // Se não achou exato, tenta por similaridade
  if (!found) {
    for (const entry of entries) {
      if (similarity(entry.normalized, normalized) > 0.6) {
        entry.count += 1;
        entry.lastAsked = Date.now();
        entry.original = text;
        // Atualiza o normalized com uma versão mesclada
        entry.normalized = normalized;
        found = true;
        break;
      }
    }
  }

  if (!found) {
    entries.push({
      normalized,
      original: text,
      count: 1,
      lastAsked: Date.now(),
    });
  }

  saveAll(entries);
}

// ============================================================
// Gera texto de markdown com as FAQs para exibir no assistente
// ============================================================
export function getFaqText(limit: number = 3): string | null {
  const top = getTopQuestions(limit);
  if (top.length === 0) return null;

  let text = "📌 **Perguntas Frequentes**\n\n";
  text += "Com base nas suas interações, aqui estão as perguntas mais comuns:\n\n";

  top.forEach((q, i) => {
    text += `${i + 1}. **${q.text}**`;
    if (q.count > 1) {
      text += ` _(${q.count}x)_`;
    }
    text += "\n";
  });

  text += "\n💡 *Clique no 🎤 ou digite sua pergunta!*";
  return text;
}
