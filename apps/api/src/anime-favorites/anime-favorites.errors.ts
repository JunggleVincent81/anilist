class AnimeFavoriteValidationError
  extends Error {
  constructor(
    message: string,
  ) {
    super(message)

    this.name =
      "AnimeFavoriteValidationError"
  }
}

export {
  AnimeFavoriteValidationError,
}
