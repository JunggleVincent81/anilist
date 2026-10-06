import {
  graphqlRequest,
} from './client';
import type {
  UserRole,
} from './auth';

type UserProfile = {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  role: UserRole;
  createdAt: string;
};

type UserProfileResponse = {
  userProfile:
    | UserProfile
    | null;
};

const USER_PROFILE_QUERY = `
  query UserProfile(
    $username: String!
  ) {
    userProfile(
      username: $username
    ) {
      id
      username
      displayName
      bio
      avatarUrl
      role
      createdAt
    }
  }
`;

async function getUserProfile(
  username: string,
): Promise<UserProfile | null> {
  const data =
    await graphqlRequest<
      UserProfileResponse,
      {
        username: string;
      }
    >(
      USER_PROFILE_QUERY,
      {
        username,
      },
    );

  return data.userProfile;
}

export {
  getUserProfile,
};

export type {
  UserProfile,
};