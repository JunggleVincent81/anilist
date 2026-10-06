'use client';

import {
  FormEvent,
  useState,
} from 'react';
import Link from 'next/link';
import {
  useRouter,
} from 'next/navigation';

import {
  useAuth,
} from '@/components/auth/auth-provider';
import {
  Button,
} from '@/components/ui/button';
import {
  Input,
} from '@/components/ui/input';
import {
  loginUser,
} from '@/lib/graphql/auth';
import {
  GraphQLRequestError,
} from '@/lib/graphql/client';

export default function LoginForm() {
  const router = useRouter();
  const {
    setAuthenticatedUser,
  } = useAuth();

  const [
    identifier,
    setIdentifier,
  ] = useState('');

  const [
    password,
    setPassword,
  ] = useState('');

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const user =
        await loginUser({
          identifier,
          password,
        });

      setAuthenticatedUser(user);

      router.replace('/');
      router.refresh();
    } catch (requestError) {
      if (
        requestError instanceof
        GraphQLRequestError
      ) {
        if (
          requestError.code ===
          'UNAUTHENTICATED'
        ) {
          setError(
            'Invalid email, username, or password.',
          );
        } else {
          setError(
            'Unable to sign in. Please try again.',
          );
        }
      } else {
        setError(
          'Unable to connect to the server.',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="space-y-5"
      onSubmit={handleSubmit}
    >
      <div className="space-y-2">
        <label
          htmlFor="identifier"
          className="text-sm font-medium text-foreground"
        >
          Email or username
        </label>

        <Input
          id="identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          required
          maxLength={320}
          value={identifier}
          onChange={(event) =>
            setIdentifier(
              event.target.value,
            )
          }
          disabled={isSubmitting}
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <label
            htmlFor="password"
            className="text-sm font-medium text-foreground"
          >
            Password
          </label>

          <Link
            href="/forgot-password"
            className="text-xs font-medium text-primary underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
          value={password}
          onChange={(event) =>
            setPassword(
              event.target.value,
            )
          }
          disabled={isSubmitting}
        />
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      ) : null}

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting
          ? 'Signing in…'
          : 'Sign in'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        New here?{' '}
        <Link
          href="/register"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}