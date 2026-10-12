'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useHydrated } from '@/hooks/use-hydrated';

type CredentialsFormProps = {
  submitLabel: string;
  passwordAutoComplete: 'current-password' | 'new-password';
  isPending: boolean;
  error: Error | null;
  onSubmit: (credentials: { email: string; password: string }) => void;
};

export function CredentialsForm({
  submitLabel,
  passwordAutoComplete,
  isPending,
  error,
  onSubmit,
}: CredentialsFormProps) {
  const hydrated = useHydrated();

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit({
      email: String(form.get('email')).trim(),
      password: String(form.get('password')),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Work email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={passwordAutoComplete}
          minLength={8}
          required
        />
      </div>
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error.message}
        </p>
      )}
      <Button type="submit" disabled={!hydrated || isPending}>
        {isPending ? 'Please wait…' : submitLabel}
      </Button>
    </form>
  );
}
