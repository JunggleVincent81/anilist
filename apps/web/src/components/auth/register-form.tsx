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
  GraphQLRequestError,
} from '@/lib/graphql/client';
import {
  registerUser,
} from '@/lib/graphql/auth';

export default function RegisterForm() {
  const router = useRouter();
  const {
    setAuthenticatedUser,
  } = useAuth();

  const [email, setEmail] =
    useState('');

  const [username, setUsername] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('');

  const [error, setError] =
    useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError(null);

    if (
      password !== confirmPassword
    ) {
      setError(
        'Passwords do not match.',
      );

      return;
    }

    setIsSubmitting(true);

    try {
      const user =
        await registerUser({
          email,
          username,
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
          'BAD_USER_INPUT'
        ) {
          setError(
            requestError.message,
          );
        } else {
          setError(
            'Unable to create your account. Please try again.',
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
      noValidate={false}
    >
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="text-sm font-medium text-foreground"
        >
          Email
        </label>

        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          maxLength={320}
          value={email}
          onChange={(event) =>
            setEmail(
              event.target.value,
            )
          }
          disabled={isSubmitting}
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="username"
          className="text-sm font-medium text-foreground"
        >
          Username
        </label>

        <Input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          minLength={3}
          maxLength={24}
          pattern="[A-Za-z0-9_]{3,24}"
          value={username}
          onChange={(event) =>
            setUsername(
              event.target.value,
            )
          }
          disabled={isSubmitting}
          placeholder="tegar_01"
          aria-describedby="username-help"
        />

        <p
          id="username-help"
          className="text-xs text-muted-foreground"
        >
          3–24 characters. Letters,
          numbers, and underscores only.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="text-sm font-medium text-foreground"
        >
          Password
        </label>

        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          maxLength={128}
          value={password}
          onChange={(event) =>
            setPassword(
              event.target.value,
            )
          }
          disabled={isSubmitting}
          aria-describedby="password-help"
        />

        <p
          id="password-help"
          className="text-xs text-muted-foreground"
        >
          Use at least 6 characters.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="confirm-password"
          className="text-sm font-medium text-foreground"
        >
          Confirm password
        </label>

        <Input
          id="confirm-password"
          name="confirm-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          maxLength={128}
          value={confirmPassword}
          onChange={(event) =>
            setConfirmPassword(
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
          ? 'Creating account…'
          : 'Create account'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}