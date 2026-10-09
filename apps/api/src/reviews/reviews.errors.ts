class ReviewValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReviewValidationError';
  }
}

class ReviewForbiddenError extends Error {
  constructor(message = 'Review access denied.') {
    super(message);
    this.name = 'ReviewForbiddenError';
  }
}

class ReviewNotFoundError extends Error {
  constructor(message = 'Review not found.') {
    super(message);
    this.name = 'ReviewNotFoundError';
  }
}

class ReviewConflictError extends Error {
  constructor(message = 'You have already reviewed this anime.') {
    super(message);
    this.name = 'ReviewConflictError';
  }
}

export {
  ReviewValidationError,
  ReviewForbiddenError,
  ReviewNotFoundError,
  ReviewConflictError,
};
