import {
  GraphQLRequestError,
  graphqlRequest,
} from './client';

type UserRole =
  | 'USER'
  | 'MODERATOR'
  | 'ADMIN';

type AuthUser = {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  role: UserRole;
};

type RegisterInput = {
  email: string;
  username: string;
  password: string;
};

type LoginInput = {
  identifier: string;
  password: string;
};

type UpdateProfileInput = {
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
};

type RegisterResponse = {
  register: {
    user: AuthUser;
  };
};

type LoginResponse = {
  login: {
    user: AuthUser;
  };
};

type MeResponse = {
  me: AuthUser;
};

type LogoutResponse = {
  logout: boolean;
};

type UpdateProfileResponse = {
  updateProfile: AuthUser;
};

const AUTH_USER_FIELDS = `
  id
  email
  username
  displayName
  bio
  avatarUrl
  role
`;

const REGISTER_MUTATION = `
  mutation Register(
    $input: RegisterInput!
  ) {
    register(input: $input) {
      user {
        ${AUTH_USER_FIELDS}
      }
    }
  }
`;

const LOGIN_MUTATION = `
  mutation Login(
    $input: LoginInput!
  ) {
    login(input: $input) {
      user {
        ${AUTH_USER_FIELDS}
      }
    }
  }
`;

const ME_QUERY = `
  query Me {
    me {
      ${AUTH_USER_FIELDS}
    }
  }
`;

const LOGOUT_MUTATION = `
  mutation Logout {
    logout
  }
`;

const UPDATE_PROFILE_MUTATION = `
  mutation UpdateProfile(
    $input: UpdateProfileInput!
  ) {
    updateProfile(input: $input) {
      ${AUTH_USER_FIELDS}
    }
  }
`;

async function registerUser(
  input: RegisterInput,
): Promise<AuthUser> {
  const data =
    await graphqlRequest<
      RegisterResponse,
      {
        input: RegisterInput;
      }
    >(
      REGISTER_MUTATION,
      {
        input,
      },
    );

  return data.register.user;
}

async function loginUser(
  input: LoginInput,
): Promise<AuthUser> {
  const data =
    await graphqlRequest<
      LoginResponse,
      {
        input: LoginInput;
      }
    >(
      LOGIN_MUTATION,
      {
        input,
      },
    );

  return data.login.user;
}

async function getCurrentUser():
  Promise<AuthUser | null> {
  try {
    const data =
      await graphqlRequest<MeResponse>(
        ME_QUERY,
      );

    return data.me;
  } catch (error) {
    if (
      error instanceof
        GraphQLRequestError &&
      error.code ===
        'UNAUTHENTICATED'
    ) {
      return null;
    }

    throw error;
  }
}

async function logoutUser():
  Promise<void> {
  await graphqlRequest<LogoutResponse>(
    LOGOUT_MUTATION,
  );
}

async function updateProfile(
  input: UpdateProfileInput,
): Promise<AuthUser> {
  const data =
    await graphqlRequest<
      UpdateProfileResponse,
      {
        input:
          UpdateProfileInput;
      }
    >(
      UPDATE_PROFILE_MUTATION,
      {
        input,
      },
    );

  return data.updateProfile;
}

export {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  updateProfile,
};

export type {
  AuthUser,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
  UserRole,
};