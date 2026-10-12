import Link from 'next/link';
import { SignInForm } from '@/components/sign-in-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle>
            <h1>Sign in to SunoAI</h1>
          </CardTitle>
          <CardDescription>
            Use the email and password you signed up with.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignInForm />
        </CardContent>
        <CardFooter className="text-sm">
          New to SunoAI?&nbsp;
          <Link href="/signup" className="underline underline-offset-4">
            Create an account
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
