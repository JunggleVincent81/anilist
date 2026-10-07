class AnimeTrackingValidationError extends Error {
  constructor(message: string) {
    super(message);

    this.name =
      'AnimeTrackingValidationError';
  }
}

export {
  AnimeTrackingValidationError,
};
