// Generation provider abstraction.
//
// Everything downstream talks to GenerationProvider, so comparing models in the
// eval step is a change of model id, and swapping vendors is one new
// implementation rather than a rewrite. OpenRouter is the default because a
// single key and endpoint front both hosted closed models and hosted
// open-source ones — which is exactly the comparison the eval step needs.

export interface GenerationRequest {
  system: string;
  user: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

export interface GenerationResult {
  text: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
}

export interface GenerationProvider {
  readonly id: string;
  generate(req: GenerationRequest): Promise<GenerationResult>;
}

// The quality baseline. The spec's sequence is deliberate: get one strong model
// working end to end, then compare open-source candidates against it.
export const DEFAULT_MODEL = 'anthropic/claude-sonnet-5';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export class GenerationError extends Error {
  // Declared as a field rather than a constructor parameter property: the
  // latter is not erasable syntax, so it breaks Node's type stripping (which
  // the tests and eval scripts rely on).
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'GenerationError';
    this.status = status;
  }
}

interface ChatCompletion {
  choices?: { message?: { content?: string } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  error?: { message?: string };
}

export function openRouterProvider(apiKey: string): GenerationProvider {
  return {
    id: 'openrouter',
    async generate(req) {
      const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: req.model,
          // One-shot, not a conversation — the note is a single generation.
          messages: [
            { role: 'system', content: req.system },
            { role: 'user', content: req.user },
          ],
          // Generous ceiling because reasoning models bill their thinking against
          // this budget: GLM was observed spending 2000+ tokens reasoning and
          // emitting an empty note. The note length is controlled by the prompt,
          // not by this cap, so raising it costs nothing on non-reasoning models.
          max_tokens: req.maxTokens ?? 4000,
          // Narrating supplied facts in under 60 words does not need extended
          // chain-of-thought, and the athlete would be paying for it. Models
          // without a reasoning mode ignore this.
          reasoning: { effort: 'low' },
          // Some variance is wanted: "Regenerate" should produce a genuinely
          // different phrasing, and the eval step needs to see run-to-run
          // spread rather than one lucky sample.
          temperature: req.temperature ?? 0.7,
        }),
      });

      const body = (await res.json().catch(() => ({}))) as ChatCompletion;
      if (!res.ok) {
        throw new GenerationError(body.error?.message ?? `Generation failed (${res.status})`, res.status);
      }

      const text = body.choices?.[0]?.message?.content?.trim();
      if (!text) throw new GenerationError('Model returned an empty note');

      return {
        text,
        model: req.model,
        promptTokens: body.usage?.prompt_tokens,
        completionTokens: body.usage?.completion_tokens,
      };
    },
  };
}
