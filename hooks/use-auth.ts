import type { AuthError } from '@supabase/supabase-js';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

type Credentials = { email: string; password: string };

const AUTH_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Wrong email or password.',
  user_already_exists:
    'An account with this email already exists. Sign in instead.',
  email_exists: 'An account with this email already exists. Sign in instead.',
  weak_password: 'Use a password of at least 8 characters.',
  over_request_rate_limit:
    'Too many attempts. Wait a few minutes and try again.',
};

function toReadableError(error: AuthError) {
  return new Error(
    AUTH_MESSAGES[error.code ?? ''] ??
      "Couldn't reach the sign-in service. Check your connection and try again.",
  );
}

function useOpenAppAfterAuth() {
  const router = useRouter();
  return () => {
    router.replace('/');
    router.refresh();
  };
}

export function useSignIn() {
  const openApp = useOpenAppAfterAuth();
  return useMutation({
    mutationFn: async (credentials: Credentials) => {
      const { error } =
        await createSupabaseBrowserClient().auth.signInWithPassword(
          credentials,
        );
      if (error) throw toReadableError(error);
    },
    onSuccess: openApp,
  });
}

export function useSignUp() {
  const openApp = useOpenAppAfterAuth();
  return useMutation({
    mutationFn: async (credentials: Credentials) => {
      const { data, error } =
        await createSupabaseBrowserClient().auth.signUp(credentials);
      if (error) throw toReadableError(error);
      if (!data.session) {
        throw new Error(
          'Account created, but this Supabase project still asks for email confirmation. Turn it off (see README).',
        );
      }
    },
    onSuccess: openApp,
  });
}
