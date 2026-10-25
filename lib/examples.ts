import { z } from 'zod';

export const EXAMPLE_CALLS = [
  {
    id: 'late-order',
    title: 'Late order',
    about: 'The customer asks for a person twice before the AI hands over.',
  },
  {
    id: 'insect-in-food',
    title: 'Insect in the food',
    about: 'A food safety complaint the AI handles on its own.',
  },
  {
    id: 'order-id-loop',
    title: 'Order ID loop',
    about: 'The AI keeps asking for an order ID it was already given.',
  },
] as const;

export type ExampleCallId = (typeof EXAMPLE_CALLS)[number]['id'];

export const exampleSchema = z.object({
  example: z.enum(
    EXAMPLE_CALLS.map((example) => example.id) as [
      ExampleCallId,
      ...ExampleCallId[],
    ],
  ),
});

export function exampleCall(id: ExampleCallId) {
  const example = EXAMPLE_CALLS.find((call) => call.id === id);
  if (!example) throw new Error(`Unknown example call ${id}`);
  return example;
}
