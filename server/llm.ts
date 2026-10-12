import 'server-only';
import { OpenRouter } from '@openrouter/sdk';
import { requireEnv } from './env';
import { ANSWER_JSON_SCHEMA, type buildMessages } from './prompts/analyze';

function llmModels() {
  const models = requireEnv('LLM_MODELS')
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean);
  if (models.length === 0) throw new Error('LLM_MODELS lists no models.');
  return models;
}

export async function requestAnalysis(
  messages: ReturnType<typeof buildMessages>,
  signal: AbortSignal,
) {
  const openRouter = new OpenRouter({
    apiKey: requireEnv('OPENROUTER_API_KEY'),
    retryConfig: { strategy: 'none' },
  });
  const result = await openRouter.chat.send(
    {
      chatRequest: {
        models: llmModels(),
        messages,
        responseFormat: {
          type: 'json_schema',
          jsonSchema: {
            name: 'call_report',
            strict: true,
            schema: ANSWER_JSON_SCHEMA,
          },
        },
        provider: { requireParameters: true },
        reasoning: { effort: 'none' },
        temperature: 0,
      },
    },
    { signal },
  );
  if (!('choices' in result)) throw new Error('OpenRouter answered a stream');

  const content = result.choices[0]?.message.content;
  return {
    model: result.model,
    content: typeof content === 'string' ? content : null,
  };
}
