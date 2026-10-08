class UserFollowValidationError
  extends Error {
  constructor(
    message: string,
  ) {
    super(message);

    this.name =
      'UserFollowValidationError';
  }
}

export {
  UserFollowValidationError,
};
