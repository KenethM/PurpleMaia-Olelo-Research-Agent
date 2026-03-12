import Anthropic from '@anthropic-ai/sdk';
import type {
  ClarifyingQuestion,
  QuestionAnswer,
  ResearchResult,
  Source,
  Finding,
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
    const msg = data?.choices?.[0]?.message;
    // Some reasoning models return null content with reasoning_content (e.g. gpt-oss-120b)
    const text: string = msg?.content ?? msg?.reasoning_content;
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

const TRIAGE_SYSTEM_PROMPT = `You are a research triage agent for the Papakilo Hawaiian Newspaper Database. Article OCR text is provided directly to you. Assess each article's relevance against the provided research brief and extract structured findings.

## Process

For each article:

### Step 1: Assess relevance tier using the brief's criteria
- **Tier 1** — Article directly addresses the research topic with substantial detail
- **Tier 2** — Article contains relevant information but not as primary focus, or limited content
- **Tier 3** — Article only mentions the topic in passing. No substantive content.

Write a 1-2 sentence reason referencing specific content from the article.

### Step 2: Extract findings (Tier 1 and 2 ONLY)
- Quote DIRECTLY from the OCR text — no paraphrasing, no cleanup, no inference
- Tag with taxonomy tags from the brief
- Assess OCR clarity: high / medium / low
- Write a brief note explaining what the quote contains (interpretation goes here, not in the quote)
- If OCR prevents accurate extraction, write: "OCR too garbled for accurate extraction — researcher should view original scan"

### Step 3: Identify follow-ups
- Author names worth searching separately
- Series continuations ("Aole i pau" = article continues)
- New search terms discovered in the text
- Region or time period gaps this article reveals

## Strict Rules (non-negotiable)

1. NO INFERENCE — only report what is explicitly present
   - author: only if byline is explicitly present in text
   - region_mentions: only regions named in the article text
   - quote: direct OCR text verbatim, never cleaned up
2. NO HALLUCINATION — mark garbled OCR as [OCR unclear], never guess
3. Tier 3 articles get NO findings extracted
4. Every quote must be traceable to the provided article text

## Output Format

Return ONLY a JSON object, no other text:

{
  "triage_summary": {
    "articles_processed": 5,
    "tier_1": 1,
    "tier_2": 2,
    "tier_3": 2,
    "errors": 0
  },
  "articles": [
    {
      "id": "src_0",
      "title": "article title from text or metadata",
      "date": "YYYY-MM-DD or null",
      "source": "newspaper name or null",
      "author": null,
      "region_mentions": [],
      "tier": 1,
      "reason": "1-2 sentence explanation referencing specific content",
      "ocr_quality": "high|medium|low",
      "series": null
    }
  ],
  "findings": [
    {
      "article_id": "src_0",
      "priority": "primary-tag-from-brief-taxonomy",
      "tags": ["tag1", "tag2"],
      "quote": "verbatim OCR text from the article",
      "ocr_clarity": "high|medium|low",
      "note": "what this quote means or contains — interpretation goes here"
    }
  ],
  "followups": [
    {
      "type": "term|author|series|newspaper|region-gap|time-gap|source-gap",
      "value": "the specific thing to follow up on",
      "source_article_id": "src_0",
      "priority": "high|medium|low",
      "notes": "why this is worth pursuing"
    }
  ]
}`;

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

  let userMessage: string;

  if (conversationContext) {
    userMessage =
      `<prior_context>\n` +
      `Original query: ${conversationContext.originalQuery}\n` +
      `Summary: ${conversationContext.summary}\n` +
      `</prior_context>\n\n` +
      `<new_query>${query}</new_query>`;
  } else {
    userMessage = `<query>${query}</query>`;
  }

  if (answers && answers.length > 0) {
    const answersText = answers
      .map((a) => `- ${a.questionId}: ${Array.isArray(a.answer) ? a.answer.join(', ') : a.answer}`)
      .join('\n');
    userMessage += `\n\n<clarifications>\n${answersText}\n</clarifications>`;
  }

  const text = await callLLM({
    system: QUERY_ANALYSIS_PROMPT,
    userMessage,
    maxTokens: 1024,
  });

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('LLM did not return valid JSON for query analysis');

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error('LLM returned malformed JSON for query analysis');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('LLM query analysis response was not an object');
  }

  return {
    needsClarification: Boolean(parsed.needsClarification),
    questions: Array.isArray(parsed.questions) ? parsed.questions : undefined,
    searchTerms: Array.isArray(parsed.searchTerms)
      ? (parsed.searchTerms as string[]).filter((t) => typeof t === 'string')
      : [],
    isOffTopic: conversationContext ? Boolean(parsed.isOffTopic) : undefined,
    offTopicReason: typeof parsed.offTopicReason === 'string' ? parsed.offTopicReason : undefined,
  };
}

// Internal triage types matching the triage agent output schema
interface TriageArticle {
  id: string;
  title: string;
  date: string | null;
  source: string | null;
  author: string | null;
  region_mentions: string[];
  tier: 1 | 2 | 3;
  reason: string;
  ocr_quality: 'high' | 'medium' | 'low';
  series: string | null;
}

interface TriageFinding {
  article_id: string;
  priority: string;
  tags: string[];
  quote: string;
  ocr_clarity: 'high' | 'medium' | 'low';
  note: string;
}

interface TriageFollowup {
  type: string;
  value: string;
  source_article_id: string;
  priority: 'high' | 'medium' | 'low';
  notes: string;
}

interface TriageOutput {
  triage_summary: {
    articles_processed: number;
    tier_1: number;
    tier_2: number;
    tier_3: number;
    errors: number;
  };
  articles: TriageArticle[];
  findings: TriageFinding[];
  followups: TriageFollowup[];
}

/**
 * Triages retrieved articles against a research brief using the triage agent approach
 * from the Research_agentic_tool system. Returns structured ResearchResult with
 * direct OCR quotes, tier assignments, and follow-up leads.
 */
export async function triage(
  query: string,
  context: DocumentContext[],
  briefText: string,
  answers?: QuestionAnswer[],
  conversationContext?: ConversationContext
): Promise<ResearchResult> {
  if (context.length === 0) {
    return {
      summary: 'No articles were retrieved to triage. Try different search terms.',
      findings: [],
      sources: [],
      relatedTopics: [],
    };
  }

  const articlesText = context
    .map((doc, i) => {
      const meta = [
        doc.publication,
        doc.author ? `by ${doc.author}` : null,
        doc.date,
        doc.url ? `URL: ${doc.url}` : null,
      ]
        .filter(Boolean)
        .join(' | ');
      return `--- Article [src_${i}] ---\nTitle: ${doc.title}${meta ? `\nMeta: ${meta}` : ''}\n\nOCR Text:\n${doc.content}`;
    })
    .join('\n\n');

  const answersText =
    answers && answers.length > 0
      ? `\n\nResearcher clarifications:\n${answers
          .map((a) => `- ${a.questionId}: ${Array.isArray(a.answer) ? a.answer.join(', ') : a.answer}`)
          .join('\n')}`
      : '';

  const priorContextText = conversationContext
    ? `\n\nPrior research (do not repeat findings already covered):\nOriginal query: "${conversationContext.originalQuery}"\nPrevious summary: ${conversationContext.summary}`
    : '';

  const userMessage =
    `Research Query: ${query}${answersText}${priorContextText}\n\n` +
    `Research Brief:\n${briefText}\n\n` +
    `Articles to triage (${context.length} total):\n\n${articlesText}`;

  const text = await callLLM({
    system: TRIAGE_SYSTEM_PROMPT,
    userMessage,
    maxTokens: 6000,
  });

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Triage agent did not return valid JSON');

  let parsed: TriageOutput;
  try {
    parsed = JSON.parse(jsonMatch[0]) as TriageOutput;
  } catch {
    throw new Error('Triage agent returned malformed JSON');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Triage agent response was not a valid object');
  }

  // Ensure required arrays exist to prevent downstream crashes
  if (!Array.isArray(parsed.articles)) parsed.articles = [];
  if (!Array.isArray(parsed.findings)) parsed.findings = [];
  if (!Array.isArray(parsed.followups)) parsed.followups = [];
  if (!parsed.triage_summary || typeof parsed.triage_summary !== 'object') {
    parsed.triage_summary = { articles_processed: 0, tier_1: 0, tier_2: 0, tier_3: 0, errors: 0 };
  }

  // Build sources from triage articles (all tiers — let UI filter by tier)
  const sources: Source[] = parsed.articles.map((a, i) => {
    const originalDoc = context[parseInt(a.id.replace('src_', ''), 10)] ?? context[i];
    const firstFinding = parsed.findings.find((f) => f.article_id === a.id);
    return {
      id: a.id,
      title: a.title || originalDoc?.title || a.id,
      author: a.author ?? undefined,
      publication: a.source ?? originalDoc?.publication,
      date: a.date ?? originalDoc?.date,
      url: originalDoc?.url,
      type: (originalDoc?.docType as Source['type']) ?? 'papakilo-live',
      excerpt: firstFinding?.quote?.slice(0, 200) ?? originalDoc?.content?.slice(0, 200),
    };
  });

  // Build findings from triage findings — inherit tier from parent article
  const findings: Finding[] = parsed.findings.map((f, i) => {
    const parentArticle = parsed.articles.find((a) => a.id === f.article_id);
    const tier = (parentArticle?.tier as 1 | 2 | 3) ?? 3;
    const ocrToConfidence = (clarity: string): 'high' | 'medium' | 'low' =>
      clarity === 'high' ? 'high' : clarity === 'medium' ? 'medium' : 'low';

    return {
      id: `f${String(i + 1).padStart(3, '0')}`,
      tier,
      title: f.priority,
      hawaiianTitle: undefined,
      content: `${f.note} [${f.article_id}]`,
      sources: [f.article_id],
      confidence: ocrToConfidence(f.ocr_clarity),
      keyExcerpts: f.quote ? [f.quote] : undefined,
      placeNames:
        parentArticle?.region_mentions?.length ? parentArticle.region_mentions : undefined,
      methods: f.tags?.length ? f.tags : undefined,
    };
  });

  // Summary from triage stats
  const s = parsed.triage_summary;
  const summary =
    `Triaged ${s.articles_processed} articles from the Papakilo Database: ` +
    `${s.tier_1} high value, ${s.tier_2} medium value, ${s.tier_3} excluded as peripheral. ` +
    (s.errors > 0 ? `${s.errors} articles could not be loaded. ` : '') +
    `${parsed.findings.length} findings extracted with direct OCR quotes.`;

  // Related topics from high-priority followups
  const relatedTopics = parsed.followups
    .filter((f) => f.priority === 'high' || f.priority === 'medium')
    .map((f) => f.value)
    .slice(0, 6);

  return { summary, findings, sources, relatedTopics };
}
