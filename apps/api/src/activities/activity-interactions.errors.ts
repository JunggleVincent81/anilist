class ActivityInteractionValidationError
  extends Error {
  constructor(
    message: string,
  ) {
    super(message);

    this.name =
      'ActivityInteractionValidationError';
  }
}

class ActivityUnavailableError
  extends Error {
  constructor() {
    super(
      'Activity is not available.',
    );

    this.name =
      'ActivityUnavailableError';
  }
}

export {
  ActivityInteractionValidationError,
  ActivityUnavailableError,
};
