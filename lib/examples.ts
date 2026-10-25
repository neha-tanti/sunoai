import { z } from 'zod';

export const EXAMPLE_CALLS = [
  {
    id: 'late-order',
    title: 'Late order',
    about: 'The customer asks for a person twice before the AI hands over.',
    call_langs: ['hi-IN', 'en-IN'],
    coaching_lang: 'hi-IN',
  },
  {
    id: 'insect-in-food',
    title: 'Insect in the food',
    about: 'A food safety complaint the AI handles on its own.',
    call_langs: ['hi-IN', 'en-IN'],
    coaching_lang: 'hi-IN',
  },
  {
    id: 'order-id-loop',
    title: 'Order ID loop',
    about: 'The AI keeps asking for an order ID it was already given.',
    call_langs: ['hi-IN', 'en-IN'],
    coaching_lang: 'hi-IN',
  },
] as const;

export type ExampleCallId = (typeof EXAMPLE_CALLS)[number]['id'];

export const exampleSchema = z.object({
  example: z.enum(EXAMPLE_CALLS.map((example) => example.id)),
});

export function exampleCall(id: ExampleCallId) {
  const example = EXAMPLE_CALLS.find((call) => call.id === id);
  if (!example) throw new Error(`Unknown example call ${id}`);
  return example;
}
