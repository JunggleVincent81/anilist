'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getCurrentUser,
  logoutUser,
  type AuthUser,
} from '@/lib/graphql/auth';

type AuthStatus =
  | 'loading'
  | 'anonymous'
  | 'authenticated'
  | 'error';

type AuthContextValue = {
  user: AuthUser | null;
  status: AuthStatus;

  setAuthenticatedUser: (
    user: AuthUser,
  ) => void;

  refreshAuth: () =>
    Promise<void>;

  logout: () =>
    Promise<void>;
};

const AuthContext =
  createContext<
    AuthContextValue | undefined
  >(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] =
    useState<AuthUser | null>(
      null,
    );

  const [status, setStatus] =
    useState<AuthStatus>(
      'loading',
    );

  const refreshAuth =
    useCallback(async () => {
      setStatus('loading');

      try {
        const currentUser =
          await getCurrentUser();

        setUser(currentUser);

        setStatus(
          currentUser
            ? 'authenticated'
            : 'anonymous',
        );
      } catch {
        setUser(null);
        setStatus('error');
      }
    }, []);

  useEffect(() => {
    let cancelled = false;

    void getCurrentUser()
      .then((currentUser) => {
        if (cancelled) {
          return;
        }

        setUser(currentUser);

        setStatus(
          currentUser
            ? 'authenticated'
            : 'anonymous',
        );
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setUser(null);
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const setAuthenticatedUser =
    useCallback(
      (
        authenticatedUser:
          AuthUser,
      ) => {
        setUser(
          authenticatedUser,
        );

        setStatus(
          'authenticated',
        );
      },
      [],
    );

  const logout =
    useCallback(async () => {
      await logoutUser();

      setUser(null);
      setStatus('anonymous');
    }, []);

  const value =
    useMemo<AuthContextValue>(
      () => ({
        user,
        status,
        setAuthenticatedUser,
        refreshAuth,
        logout,
      }),
      [
        user,
        status,
        setAuthenticatedUser,
        refreshAuth,
        logout,
      ],
    );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

function useAuth():
  AuthContextValue {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within AuthProvider.',
    );
  }

  return context;
}

export {
  AuthProvider,
  useAuth,
};

export type {
  AuthStatus,
};