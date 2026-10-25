'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSignIn } from '@/hooks/use-auth';
import { useHydrated } from '@/hooks/use-hydrated';

export function SignInForm() {
  const hydrated = useHydrated();
  const signIn = useSignIn();

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    signIn.mutate({
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
          autoComplete="current-password"
          minLength={8}
          required
        />
      </div>
      {signIn.error && (
        <p role="alert" className="text-destructive text-sm">
          {signIn.error.message}
        </p>
      )}
      <Button type="submit" disabled={!hydrated || signIn.isPending}>
        {signIn.isPending ? 'Please wait…' : 'Sign in'}
      </Button>
    </form>
  );
}
