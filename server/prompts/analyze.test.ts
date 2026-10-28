import { describe, expect, it } from 'vitest';
import { ANSWER_JSON_SCHEMA, llmAnswerSchema } from './analyze';

type SchemaNode = Record<string, unknown>;

function nodes(node: unknown): SchemaNode[] {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (typeof node !== 'object' || node === null) return [];
  return [node as SchemaNode, ...Object.values(node).flatMap(nodes)];
}

const lateOrderAnswer = {
  speakers: [
    { speaker_id: 1, role: 'ai_agent', name: null },
    { speaker_id: 2, role: 'customer', name: 'Riya' },
  ],
  customer_mood: [{ segment_id: 1, level: 'annoyed' }],
  checks: [
    {
      check_id: 'order_confirmed',
      result: 'miss',
      segment_id: null,
      quote: null,
      reason: 'The order ID was asked for but never confirmed.',
    },
  ],
  red_flags: [
    {
      flag_id: 'human_not_transferred',
      segment_id: 3,
      quote: 'kisi insaan se baat karni hai',
      note: 'The AI asked for the order ID again instead of transferring.',
    },
  ],
  summary: 'The customer called about a late order and asked for a person.',
  fix_notes: [],
  coaching: { segment_id: 0, quote: '', text: '', english: '' },
};

describe('the JSON schema sent to OpenRouter', () => {
  it('is strict: every object closes its properties and requires all of them', () => {
    const objects = nodes(ANSWER_JSON_SCHEMA).filter(
      (node) => node.type === 'object',
    );

    expect(objects.length).toBeGreaterThan(5);
    for (const object of objects) {
      expect(object.additionalProperties).toBe(false);
      expect(object.required).toEqual(
        Object.keys(object.properties as SchemaNode),
      );
    }
  });

  it('carries no keywords beyond what the strict mode accepts', () => {
    for (const node of nodes(ANSWER_JSON_SCHEMA)) {
      expect(node).not.toHaveProperty('$schema');
      expect(node).not.toHaveProperty('minimum');
      expect(node).not.toHaveProperty('maximum');
    }
  });
});

describe('llmAnswerSchema', () => {
  it('accepts a well-formed answer', () => {
    expect(llmAnswerSchema.safeParse(lateOrderAnswer).success).toBe(true);
  });

  it.each([
    ['without coaching', { ...lateOrderAnswer, coaching: undefined }],
    ['with null coaching', { ...lateOrderAnswer, coaching: null }],
  ])('rejects an answer %s', (_, answer) => {
    expect(llmAnswerSchema.safeParse(answer).success).toBe(false);
  });

  it('rejects a mood outside calm, annoyed and angry', () => {
    const furious = {
      ...lateOrderAnswer,
      customer_mood: [{ segment_id: 1, level: 'furious' }],
    };

    expect(llmAnswerSchema.safeParse(furious).success).toBe(false);
  });
});
