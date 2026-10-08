class ActivityValidationError
  extends Error {
  constructor(
    message: string,
  ) {
    super(message);

    this.name =
      'ActivityValidationError';
  }
}

export {
  ActivityValidationError,
};
