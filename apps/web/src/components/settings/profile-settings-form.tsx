'use client';

import {
  FormEvent,
  useEffect,
  useState,
} from 'react';
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
  Textarea,
} from '@/components/ui/textarea';
import {
  updateProfile,
  type AuthUser,
} from '@/lib/graphql/auth';

type ProfileSettingsEditorProps = {
  user: AuthUser;

  setAuthenticatedUser: (
    user: AuthUser,
  ) => void;
};

function ProfileSettingsEditor({
  user,
  setAuthenticatedUser,
}: ProfileSettingsEditorProps) {
  const [
    displayName,
    setDisplayName,
  ] = useState(
    user.displayName ?? '',
  );

  const [bio, setBio] =
    useState(
      user.bio ?? '',
    );

  const [
    avatarUrl,
    setAvatarUrl,
  ] = useState(
    user.avatarUrl ?? '',
  );

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState<string | null>(
    null,
  );

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setMessage(null);
    setError(null);
    setIsSubmitting(true);

    try {
      const updatedUser =
        await updateProfile({
          displayName,
          bio,
          avatarUrl,
        });

      setDisplayName(
        updatedUser.displayName ??
          '',
      );

      setBio(
        updatedUser.bio ?? '',
      );

      setAvatarUrl(
        updatedUser.avatarUrl ??
          '',
      );

      setAuthenticatedUser(
        updatedUser,
      );

      setMessage(
        'Profile updated.',
      );
    } catch {
      setError(
        'Unable to update your profile.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div className="space-y-2">
        <label
          htmlFor="settings-username"
          className="text-sm font-medium"
        >
          Username
        </label>

        <Input
          id="settings-username"
          value={user.username}
          disabled
        />

        <p className="text-xs text-muted-foreground">
          Username changes are not
          available yet.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="settings-email"
          className="text-sm font-medium"
        >
          Email
        </label>

        <Input
          id="settings-email"
          value={user.email}
          disabled
        />

        <p className="text-xs text-muted-foreground">
          Email changes are not
          available yet.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="settings-display-name"
          className="text-sm font-medium"
        >
          Display name
        </label>

        <Input
          id="settings-display-name"
          maxLength={80}
          value={displayName}
          onChange={(event) =>
            setDisplayName(
              event.target.value,
            )
          }
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="settings-bio"
          className="text-sm font-medium"
        >
          Bio
        </label>

        <Textarea
          id="settings-bio"
          maxLength={500}
          value={bio}
          onChange={(event) =>
            setBio(
              event.target.value,
            )
          }
          disabled={isSubmitting}
          className="min-h-32 resize-y"
        />

        <p className="text-xs text-muted-foreground">
          {bio.length}/500
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="settings-avatar"
          className="text-sm font-medium"
        >
          Avatar URL
        </label>

        <Input
          id="settings-avatar"
          type="url"
          inputMode="url"
          placeholder="https://..."
          value={avatarUrl}
          onChange={(event) =>
            setAvatarUrl(
              event.target.value,
            )
          }
          disabled={isSubmitting}
        />

        <p className="text-xs text-muted-foreground">
          Direct image upload will be
          added later.
        </p>
      </div>

      {message ? (
        <p
          role="status"
          className="text-sm text-success"
        >
          {message}
        </p>
      ) : null}

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
        disabled={isSubmitting}
      >
        {isSubmitting
          ? 'Saving…'
          : 'Save changes'}
      </Button>
    </form>
  );
}

export function ProfileSettingsForm() {
  const router = useRouter();

  const {
    user,
    status,
    setAuthenticatedUser,
  } = useAuth();

  useEffect(() => {
    if (
      status === 'anonymous'
    ) {
      router.replace('/login');
    }
  }, [
    router,
    status,
  ]);

  if (
    status === 'loading' ||
    status === 'anonymous'
  ) {
    return (
      <p className="text-sm text-muted-foreground">
        Loading account…
      </p>
    );
  }

  if (
    status === 'error' ||
    !user
  ) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
      >
        Unable to load your account.
      </div>
    );
  }

  return (
    <ProfileSettingsEditor
      key={user.id}
      user={user}
      setAuthenticatedUser={
        setAuthenticatedUser
      }
    />
  );
}