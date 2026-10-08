class AchievementValidationError
extends Error {
  constructor(
    message: string,
  ) {
    super(message);

    this.name =
      'AchievementValidationError';
  }
}

export {
  AchievementValidationError,
};
