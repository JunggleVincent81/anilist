import type {
  Metadata,
} from 'next';

import RegisterForm from '@/components/auth/register-form';

export const metadata: Metadata = {
  title: 'Create account',
  description:
    'Create your anime platform account.',
};

export default function RegisterPage() {
  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto flex min-h-dvh w-full max-w-md items-center px-5 py-12">
        <section className="w-full">
          <header className="mb-8 space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
              Your anime journey
            </p>

            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Create your account
            </h1>

            <p className="text-sm leading-6 text-muted-foreground">
              Track what you watch,
              discover what comes next,
              and build a record of
              your anime journey.
            </p>
          </header>

          <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
            <RegisterForm />
          </div>
        </section>
      </div>
    </main>
  );
}