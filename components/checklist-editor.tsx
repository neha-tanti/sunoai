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
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              removable={checks.length > 1}
              onChange={(changed) => setChecks(checks.with(index, changed))}
              onRemove={() => setChecks(checks.toSpliced(index, 1))}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            className="self-start"
            disabled={checks.length >= MAX_CHECKS}
            onClick={() => setChecks([...checks, newItem()])}
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
          {redFlags.length === 0 && (
            <p className="text-sm text-muted-foreground">No red flags.</p>
          )}
          {redFlags.map((flag, index) => (
            <ItemFields
              key={flag.key}
              legend={`Red flag ${index + 1}`}
              detailLabel="Example"
              item={flag}
              removable
              onChange={(changed) => setRedFlags(redFlags.with(index, changed))}
              onRemove={() => setRedFlags(redFlags.toSpliced(index, 1))}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            className="self-start"
            disabled={redFlags.length >= MAX_RED_FLAGS}
            onClick={() => setRedFlags([...redFlags, newItem()])}
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
            onChange={(event) => setRules(event.target.value)}
          />
        </CardContent>
      </Card>

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
          onChange={(event) =>
            onChange({ ...item, detail: event.target.value })
          }
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
