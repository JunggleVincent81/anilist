class AiringScheduleValidationError
  extends Error {
  constructor(
    message: string,
  ) {
    super(message);

    this.name =
      'AiringScheduleValidationError';
  }
}

class AiringScheduleUpstreamError
  extends Error {
  constructor(
    message =
      'Airing schedule provider is unavailable.',
  ) {
    super(message);

    this.name =
      'AiringScheduleUpstreamError';
  }
}

export {
  AiringScheduleUpstreamError,
  AiringScheduleValidationError,
};
