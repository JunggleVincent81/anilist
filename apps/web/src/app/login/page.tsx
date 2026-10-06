import type {
  Metadata,
} from 'next';

import LoginForm from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Sign in',
  description:
    'Sign in to continue your anime journey.',
};

export default function LoginPage() {
  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto flex min-h-dvh w-full max-w-md items-center px-5 py-12">
        <section className="w-full">
          <header className="mb-8 space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
              Welcome back
            </p>

            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Sign in
            </h1>

            <p className="text-sm leading-6 text-muted-foreground">
              Continue tracking,
              discovering, and building
              your anime journey.
            </p>
          </header>

          <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}