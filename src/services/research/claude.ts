import Anthropic from '@anthropic-ai/sdk';
import type {
  ClarifyingQuestion,
  QuestionAnswer,
  ResearchResult,
  Source,
} from '@/types/research';
import { researchConfig } from '@/lib/config/research';

const anthropicClient = researchConfig.anthropicApiKey
  ? new Anthropic({ apiKey: researchConfig.anthropicApiKey })
  : null;

/** Call either Anthropic or DeepSeek (OpenAI-compatible) depending on what's configured. */
async function callLLM(opts: {
  system: string;
  userMessage: string;
  maxTokens: number;
}): Promise<string> {
  if (anthropicClient) {
    const response = await anthropicClient.messages.create({
      model: researchConfig.claudeModel,
      max_tokens: opts.maxTokens,
      system: opts.system,
      messages: [{ role: 'user', content: opts.userMessage }],
    });
    const content = response.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type from Claude');
    return content.text;
  }

  if (researchConfig.deepseekApiUrl && researchConfig.deepseekApiKey) {
    const baseUrl = researchConfig.deepseekApiUrl.replace(/\/$/, '');
    const endpoint = baseUrl.endsWith('/chat/completions')
      ? baseUrl
      : `${baseUrl}/chat/completions`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${researchConfig.deepseekApiKey}`,
      },
      body: JSON.stringify({
        model: researchConfig.deepseekModel,
        max_tokens: opts.maxTokens,
        messages: [
          { role: 'system', content: opts.system },
          { role: 'user', content: opts.userMessage },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      throw new Error(`DeepSeek API error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const text: string = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error('DeepSeek returned no content');
    return text;
  }

  throw new Error(
    'No AI provider configured. Set ANTHROPIC_API_KEY or both DEEPSEEK_API_URL and DEEPSEEK_API_KEY in your .env file.'
  );
}

export interface QueryAnalysis {
  needsClarification: boolean;
  questions?: ClarifyingQuestion[];
  searchTerms: string[];
  isOffTopic?: boolean;
  offTopicReason?: string;
}

export interface DocumentContext {
  content: string;
  title: string;
  docType: string;
  publication?: string;
  date?: string;
  url?: string;
  author?: string;
}

export interface ConversationContext {
  originalQuery: string;
  summary: string;
}

const QUERY_ANALYSIS_PROMPT = `You are a Hawaiian research assistant specializing in Hawaiian history, culture, and traditional practices. Your task is to analyze research queries before searching Hawaiian language databases (Papa Kilo) and historical newspaper archives (Ke Alakai o Hawaii, Ka Nupepa Kuokoa, etc.).

Analyze the user's query and respond with JSON in exactly this format:
{
  "needsClarification": boolean,
  "questions": [
    {
      "id": "q1",
      "question": "string",
      "type": "text" | "choice" | "multi-choice" | "date",
      "options": [{"value": "string", "label": "string"}],
      "required": true,
      "placeholder": "string"
    }
  ],
  "searchTerms": ["term1", "term2"],
  "isOffTopic": boolean,
  "offTopicReason": "string"
}

Rules:
- "questions" is only included when needsClarification is true
- "options" is only included for "choice" or "multi-choice" types
- "placeholder" is only included for "text" or "date" types
- "isOffTopic" and "offTopicReason" are only included when a prior conversation context is provided
- Always include 3-7 searchTerms, including Hawaiian language terms when relevant

A query needs clarification when it is genuinely ambiguous about:
- Time period (ancient, pre-contact, 1800s, early 1900s, specific decade)
- Geographic scope (all islands, specific island, specific ahupuaʻa or district)
- Aspect of interest (cultivation practices, ceremonial use, linguistic history, social context)
- Type of sources desired (oral tradition vs. written records vs. archaeological)

Do NOT ask for clarification when the query is reasonably specific. Focus clarifying questions on dimensions that would significantly change the search strategy.

When a prior conversation context is provided:
- Set isOffTopic = true if the new query is about a fundamentally different Hawaiian topic with no meaningful overlap
- Set isOffTopic = false if the new query refines, extends, or relates to the prior topic
- Refinements include: asking about a specific variety/place/person mentioned, requesting more detail, asking about a related practice
- New topics include: switching from kalo cultivation to navigational chants, or from fishing to genealogy with no connection

When generating searchTerms:
- Include core Hawaiian concepts in both English and ʻŌlelo Hawaiʻi (e.g., "awa", "kava", "ʻawa")
- Include relevant place names, people, time periods
- If answers to clarifying questions are provided, incorporate them to narrow the search terms
- Include related cultural concepts that would appear in historical documents`;

const SYNTHESIS_PROMPT = `You are a Hawaiian research assistant synthesizing findings from Hawaiian language newspaper archives and the Papa Kilo database. Present findings in a structured, scholarly format that respects Hawaiian culture and language.

Respond with JSON in exactly this format:
{
  "summary": "string (2-3 paragraphs synthesizing key findings, preserving Hawaiian terms with English translations in parentheses)",
  "findings": [
    {
      "id": "f1",
      "tier": 1,
      "title": "string (English title or description)",
      "hawaiianTitle": "string (Hawaiian language title if present in source, otherwise omit)",
      "content": "string (detailed explanation; every claim must include an inline citation like [src_0]; preserve Hawaiian text with English translation in parentheses)",
      "sources": ["src_0", "src_1"],
      "confidence": "high" | "medium" | "low",
      "keyExcerpts": ["string (verbatim Hawaiian or English excerpt from source, clearly legible only)"],
      "placeNames": ["string (ahupuaʻa, moku, island, district names mentioned)"],
      "methods": ["string (cultivation methods, practices, techniques described)"]
    }
  ],
  "relatedTopics": ["string"]
}

Tiering rules — assign EVERY finding a tier:
- tier 1 (HIGH VALUE): Multiple corroborating sources, high confidence, rich detail
- tier 2 (MEDIUM VALUE): Single strong source, moderate detail or clarity
- tier 3 (SUPPLEMENTARY): Partial, inferred, or OCR-degraded content, low confidence

Citation rules — strictly enforced:
- Every factual claim in "content" must have an inline [src_N] citation
- Include the source URL in citations whenever available, e.g. "According to [src_0](url)"
- Preserve Hawaiian language text exactly as it appears in the source, followed by English translation in parentheses
- Do NOT fabricate sources or citations

Additional guidelines:
- Include physical descriptions, measurements, colors, textures when present in sources
- Extract place names (ahupuaʻa, moku, island) into the placeNames array
- Extract cultivation methods, preparation techniques, ceremonial practices into methods array
- keyExcerpts: only include clearly legible text — never attempt to reconstruct garbled OCR
- Sources with docType "papakilo-live" are live-scraped OCR — apply tier 2 or 3 unless content is clearly readable
- The summary should synthesize across tiers and be accessible to a general audience
- relatedTopics: suggest 3-5 areas for further research
- If no documents were found, state this clearly and use tier 3 with confidence "low" for any general knowledge provided
- If prior research context is provided, build upon it rather than repeating already-covered material`;

/**
 * Analyzes a user query using Claude to determine if clarification is needed
 * and to extract search terms for the vector database.
 *
 * When conversationContext is provided (refinement flow), Claude also checks
 * whether the new query is on-topic relative to the prior research.
 */
export async function analyzeQuery(
  query: string,
  options?: {
    answers?: QuestionAnswer[];
    conversationContext?: ConversationContext;
  }
): Promise<QueryAnalysis> {
  const { answers, conversationContext } = options ?? {};

  let userMessage = query;

  if (answers && answers.length > 0) {
    const answersText = answers
      .map((a) => `- ${a.questionId}: ${Array.isArray(a.answer) ? a.answer.join(', ') : a.answer}`)
      .join('\n');
    userMessage += `\n\nUser clarifications:\n${answersText}`;
  }

  if (conversationContext) {
    userMessage =
      `Prior research context:\n` +
      `Original query: "${conversationContext.originalQuery}"\n` +
      `Summary: ${conversationContext.summary}\n\n` +
      `New follow-up query: ${query}`;
  }

  const text = await callLLM({
    system: QUERY_ANALYSIS_PROMPT,
    userMessage,
    maxTokens: 1024,
  });

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Claude did not return valid JSON for query analysis');

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    needsClarification: Boolean(parsed.needsClarification),
    questions: parsed.questions ?? undefined,
    searchTerms: Array.isArray(parsed.searchTerms) ? parsed.searchTerms : [],
    isOffTopic: conversationContext ? Boolean(parsed.isOffTopic) : undefined,
    offTopicReason: parsed.offTopicReason ?? undefined,
  };
}

/**
 * Synthesizes research results from retrieved document context using Claude.
 * Takes the original query, relevant document chunks, user answers to clarifying
 * questions, and optional prior conversation context for refinement queries.
 */
export async function synthesize(
  query: string,
  context: DocumentContext[],
  answers?: QuestionAnswer[],
  conversationContext?: ConversationContext
): Promise<ResearchResult> {
  const contextText = context
    .map((doc, i) => {
      const meta = [
        doc.publication,
        doc.author ? `by ${doc.author}` : null,
        doc.date,
        doc.url ? `URL: ${doc.url}` : null,
      ]
        .filter(Boolean)
        .join(' | ');
      return `[Source src_${i}] ${doc.title}${meta ? ` | ${meta}` : ''}:\n${doc.content}`;
    })
    .join('\n\n---\n\n');

  const answersText =
    answers && answers.length > 0
      ? `\n\nUser provided additional context:\n${answers
          .map(
            (a) =>
              `- ${a.questionId}: ${Array.isArray(a.answer) ? a.answer.join(', ') : a.answer}`
          )
          .join('\n')}`
      : '';

  const priorContextText = conversationContext
    ? `\n\nPrior research context (do not repeat, build upon):\n` +
      `Original query: "${conversationContext.originalQuery}"\n` +
      `Previous summary: ${conversationContext.summary}`
    : '';

  const userMessage =
    `Research Query: ${query}${answersText}${priorContextText}\n\n` +
    `Retrieved Documents (${context.length} found):\n${contextText || 'No documents found in corpus.'}`;

  const text = await callLLM({
    system: SYNTHESIS_PROMPT,
    userMessage,
    maxTokens: 4096,
  });

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Claude did not return valid JSON for synthesis');

  const parsed = JSON.parse(jsonMatch[0]);

  const sources: Source[] = context.map((doc, i) => ({
    id: `src_${i}`,
    title: doc.title,
    author: doc.author,
    publication: doc.publication,
    date: doc.date,
    url: doc.url,
    type: doc.docType as 'papa-kilo' | 'newspaper' | 'web' | 'other',
    excerpt: doc.content.slice(0, 200),
  }));

  const findings = Array.isArray(parsed.findings)
    ? parsed.findings.map((f: Record<string, unknown>, i: number) => ({
        id: (f.id as string) ?? `f${i}`,
        tier: (f.tier as 1 | 2 | 3) ?? 3,
        title: (f.title as string) ?? '',
        hawaiianTitle: (f.hawaiianTitle as string) ?? undefined,
        content: (f.content as string) ?? '',
        sources: Array.isArray(f.sources) ? (f.sources as string[]) : [],
        confidence: (f.confidence as 'high' | 'medium' | 'low') ?? 'low',
        keyExcerpts: Array.isArray(f.keyExcerpts) ? (f.keyExcerpts as string[]) : undefined,
        placeNames: Array.isArray(f.placeNames) ? (f.placeNames as string[]) : undefined,
        methods: Array.isArray(f.methods) ? (f.methods as string[]) : undefined,
      }))
    : [];

  return {
    summary: parsed.summary ?? '',
    findings,
    sources,
    relatedTopics: Array.isArray(parsed.relatedTopics) ? parsed.relatedTopics : [],
  };
}
