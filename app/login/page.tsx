import type { Metadata } from 'next';
import { SignInForm } from '@/components/sign-in-form';
import { SiteHeader } from '@/components/site-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
        <Card>
          <CardHeader>
            <CardTitle>
              <h1>Sign in to SunoAI</h1>
            </CardTitle>
            <CardDescription>Use your email and password.</CardDescription>
          </CardHeader>
          <CardContent>
            <SignInForm />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
