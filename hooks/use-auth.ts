import {
  isAuthRetryableFetchError,
  type AuthError,
} from '@supabase/supabase-js';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

type Credentials = { email: string; password: string };

const AUTH_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Wrong email or password.',
  over_request_rate_limit:
    'Too many attempts. Wait a few minutes and try again.',
};

function toReadableError(error: AuthError) {
  if (isAuthRetryableFetchError(error)) {
    return new Error(
      "Couldn't reach the sign-in service. Check your connection and try again.",
    );
  }
  return new Error(
    AUTH_MESSAGES[error.code ?? ''] ??
      'Something went wrong signing you in. Try again in a minute.',
  );
}

function useOpenAppAfterAuth(path: string) {
  const router = useRouter();
  return () => {
    router.replace(path);
    router.refresh();
  };
}

export function useSignIn() {
  const openApp = useOpenAppAfterAuth('/check');
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

export function useTryIt(reportPath?: string) {
  const openApp = useOpenAppAfterAuth(reportPath ?? '/check');
  return useMutation({
    mutationFn: async () => {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.auth.getClaims();
      if (data) return;

      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw toReadableError(error);
    },
    onSuccess: openApp,
  });
}
