'use client';

import { CredentialsForm } from '@/components/credentials-form';
import { useSignUp } from '@/hooks/use-auth';

export function SignUpForm() {
  const signUp = useSignUp();

  return (
    <CredentialsForm
      submitLabel="Create account"
      passwordAutoComplete="new-password"
      isPending={signUp.isPending}
      error={signUp.error}
      onSubmit={signUp.mutate}
    />
  );
}
