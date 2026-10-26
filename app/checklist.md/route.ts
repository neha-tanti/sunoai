import { loadChecklist } from '@/server/checklist';

export async function GET() {
  const { checklist } = await loadChecklist();

  const markdown = [
    '# SunoAI checklist',
    '',
    'What SunoAI checks on every call. The team leader can change it; each report keeps the checklist it was made with.',
    '',
    '## Checks',
    '',
    'Each check is marked Passed, Missed or Not needed. A check passes only with a quote from the call as proof ("no quote, no pass"). The score is passed checks divided by the checks that apply.',
    '',
    ...checklist.checks.map((check) => `- **${check.name}:** ${check.rule}`),
    '',
    '## Red flags',
    '',
    'Any one of these marks the call Needs review, whatever its score.',
    '',
    ...checklist.red_flags.map((flag) => `- **${flag.name}:** ${flag.example}`),
    '',
    '## Refund and compensation rules',
    '',
    'SunoAI flags a promise that breaks these as a wrong promise.',
    '',
    checklist.rules,
    '',
  ].join('\n');

  return new Response(markdown, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}
