export class AccountIdentityConflictError extends Error {
  constructor() {
    super(
      'Email or username is already in use.',
    );

    this.name =
      'AccountIdentityConflictError';
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid credentials.');

    this.name =
      'InvalidCredentialsError';
  }
}