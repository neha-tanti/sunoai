'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { SavedChecklist } from '@/hooks/use-checklist';
import {
  DETAIL_MAX,
  HANDOVER_CHECK_ID,
  NOT_TRANSFERRED_FLAG_ID,
  MAX_CHECKS,
  MAX_RED_FLAGS,
  NAME_MAX,
  RULES_MAX,
  type SaveChecklist,
} from '@/lib/checklist';

const NOT_BLANK = '.*\\S.*';

type Item = { key: string; id?: string; name: string; detail: string };

type ChecklistEditorProps = {
  checklist: SavedChecklist;
  saving: boolean;
  onSave: (checklist: SaveChecklist) => void;
  onEdit: () => void;
};

const newItem = (): Item => ({
  key: crypto.randomUUID(),
  name: '',
  detail: '',
});

export function ChecklistEditor({
  checklist,
  saving,
  onSave,
  onEdit,
}: ChecklistEditorProps) {
  const [checks, setChecks] = useState<Item[]>(() =>
    checklist.checks.map((check) => ({
      key: check.id,
      id: check.id,
      name: check.name,
      detail: check.rule,
    })),
  );
  const [redFlags, setRedFlags] = useState<Item[]>(() =>
    checklist.red_flags.map((flag) => ({
      key: flag.id,
      id: flag.id,
      name: flag.name,
      detail: flag.example,
    })),
  );
  const [rules, setRules] = useState(checklist.rules);

  function updateChecks(next: Item[]) {
    setChecks(next);
    onEdit();
  }

  function updateRedFlags(next: Item[]) {
    setRedFlags(next);
    onEdit();
  }

  function updateRules(next: string) {
    setRules(next);
    onEdit();
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave({
      checks: checks.map(({ id, name, detail }) => ({
        id,
        name,
        rule: detail,
      })),
      red_flags: redFlags.map(({ id, name, detail }) => ({
        id,
        name,
        example: detail,
      })),
      rules,
      version: checklist.version,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <fieldset disabled={saving} className="flex flex-col gap-4">
        <Card role="region" aria-label="Checks">
          <CardHeader>
            <CardTitle>Checks</CardTitle>
            <CardDescription>
              Each one is marked Passed, Missed or Not needed, with a quote from
              the call as proof.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {checks.map((check, index) => (
              <ItemFields
                key={check.key}
                legend={`Check ${index + 1}`}
                detailLabel="Passes when the agent…"
                item={check}
                removable={check.id !== HANDOVER_CHECK_ID}
                onChange={(changed) =>
                  updateChecks(checks.with(index, changed))
                }
                onRemove={() => updateChecks(checks.toSpliced(index, 1))}
              />
            ))}
            <Button
              type="button"
              variant="outline"
              className="self-start"
              disabled={checks.length >= MAX_CHECKS}
              onClick={() => updateChecks([...checks, newItem()])}
            >
              Add a check
            </Button>
          </CardContent>
        </Card>

        <Card role="region" aria-label="Red flags">
          <CardHeader>
            <CardTitle>Red flags</CardTitle>
            <CardDescription>
              Any one of these marks the call Needs review, whatever its score.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {redFlags.map((flag, index) => (
              <ItemFields
                key={flag.key}
                legend={`Red flag ${index + 1}`}
                detailLabel="Example"
                item={flag}
                removable={flag.id !== NOT_TRANSFERRED_FLAG_ID}
                onChange={(changed) =>
                  updateRedFlags(redFlags.with(index, changed))
                }
                onRemove={() => updateRedFlags(redFlags.toSpliced(index, 1))}
              />
            ))}
            <Button
              type="button"
              variant="outline"
              className="self-start"
              disabled={redFlags.length >= MAX_RED_FLAGS}
              onClick={() => updateRedFlags([...redFlags, newItem()])}
            >
              Add a red flag
            </Button>
          </CardContent>
        </Card>

        <Card role="region" aria-label="Refund and compensation rules">
          <CardHeader>
            <CardTitle>
              <Label htmlFor="company-rules" className="text-base">
                Refund and compensation rules
              </Label>
            </CardTitle>
            <CardDescription>
              SunoAI flags a promise that breaks these as a wrong promise.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              id="company-rules"
              value={rules}
              maxLength={RULES_MAX}
              onChange={(event) => updateRules(event.target.value)}
            />
          </CardContent>
        </Card>
      </fieldset>

      <Button type="submit" className="self-start" disabled={saving}>
        {saving ? 'Saving…' : 'Save checklist'}
      </Button>
    </form>
  );
}

type ItemFieldsProps = {
  legend: string;
  detailLabel: string;
  item: Item;
  removable: boolean;
  onChange: (item: Item) => void;
  onRemove: () => void;
};

function ItemFields({
  legend,
  detailLabel,
  item,
  removable,
  onChange,
  onRemove,
}: ItemFieldsProps) {
  const nameId = `${item.key}-name`;
  const detailId = `${item.key}-detail`;

  function handleDetailChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const detail = event.target.value;
    event.target.setCustomValidity(detail.trim() ? '' : 'Fill in this field.');
    onChange({ ...item, detail });
  }

  return (
    <fieldset className="flex flex-col gap-3 rounded-lg border p-3">
      <legend className="px-1 text-sm font-medium">{legend}</legend>
      <div className="flex flex-col gap-2">
        <Label htmlFor={nameId}>Name</Label>
        <Input
          id={nameId}
          value={item.name}
          required
          pattern={NOT_BLANK}
          maxLength={NAME_MAX}
          onChange={(event) => onChange({ ...item, name: event.target.value })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={detailId}>{detailLabel}</Label>
        <Textarea
          id={detailId}
          value={item.detail}
          required
          maxLength={DETAIL_MAX}
          onChange={handleDetailChange}
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="self-end"
        disabled={!removable}
        onClick={onRemove}
        aria-label={`Remove ${legend.toLowerCase()}`}
      >
        Remove
      </Button>
    </fieldset>
  );
}
