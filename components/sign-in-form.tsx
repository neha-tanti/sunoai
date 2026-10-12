'use client';

import { CredentialsForm } from '@/components/credentials-form';
import { useSignIn } from '@/hooks/use-auth';

export function SignInForm() {
  const signIn = useSignIn();

  return (
    <CredentialsForm
      submitLabel="Sign in"
      passwordAutoComplete="current-password"
      isPending={signIn.isPending}
      error={signIn.error}
      onSubmit={signIn.mutate}
    />
  );
}
