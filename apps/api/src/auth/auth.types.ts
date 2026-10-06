import type { UserRole } from '@prisma/client';
import type {
  Request,
  Response,
} from 'express';

type AuthenticatedUser = {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  role: UserRole;
};

type AuthenticatedSession = {
  id: string;
  expiresAt: Date;
};

type GraphQLAuthContext = {
  req: Request;
  res: Response;
  currentUser: AuthenticatedUser | null;
  currentSession: AuthenticatedSession | null;
};

export type {
  AuthenticatedSession,
  AuthenticatedUser,
  GraphQLAuthContext,
};