// Imports here must stay extensionless. Vercel compiles these functions to
// JavaScript and resolves specifiers at runtime, so a ".ts" specifier crashes
// the deployed function with FUNCTION_INVOCATION_FAILED even though bundlers
// and Node's type stripping both accept it. Local runs use tsx instead.
import type { ApiRequest, ApiResponse } from '../strava/_lib';
import { buildCoachPrompt } from '../../src/cardio/prompt';
import { DEFAULT_MODEL, GenerationError, openRouterProvider } from '../../src/cardio/provider';
import type { SessionSummary } from '../../src/cardio/sessionSummary';

// Generation runs server-side because the model key must never reach the
// browser. The client posts the SessionSummary it already computed — structuring
// is deterministic, so there is nothing to gain by recomputing it here.

interface GenerateBody {
  summary?: SessionSummary;
  model?: string;
}

// Vercel parses JSON bodies, but the shared ApiRequest type predates that.
interface BodyRequest extends ApiRequest {
  body?: GenerateBody | string;
}

export default async function handler(req: BodyRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('OPENROUTER_API_KEY is not set');
    res.status(500).json({ error: 'generation_not_configured' });
    return;
  }

  let body: GenerateBody;
  try {
    body = typeof req.body === 'string' ? (JSON.parse(req.body) as GenerateBody) : (req.body ?? {});
  } catch {
    res.status(400).json({ error: 'invalid_json' });
    return;
  }

  const summary = body.summary;
  if (!summary || typeof summary !== 'object' || !summary.intent || !summary.activity) {
    res.status(400).json({ error: 'missing_summary' });
    return;
  }

  try {
    const prompt = buildCoachPrompt(summary);
    const provider = openRouterProvider(apiKey);
    const result = await provider.generate({
      ...prompt,
      // Model is overridable so the eval step can drive this same endpoint.
      model: typeof body.model === 'string' && body.model ? body.model : DEFAULT_MODEL,
    });
    res.status(200).json({ note: result.text, model: result.model });
  } catch (err) {
    const status = err instanceof GenerationError ? (err.status ?? 502) : 502;
    console.error('Coach note generation failed', err);
    // Upstream rate limits are worth distinguishing — the UI can suggest retrying.
    res.status(status === 429 ? 429 : 502).json({
      error: status === 429 ? 'rate_limited' : 'generation_failed',
    });
  }
}
