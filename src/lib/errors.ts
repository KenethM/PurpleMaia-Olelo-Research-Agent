export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const Errors = {
  NO_SESSION: new AppError('NO_SESSION', 401, 'No session cookie found. Please log in.'),
  INVALID_CREDENTIALS: new AppError('INVALID_CREDENTIALS', 400, 'Invalid credentials. Please try again.'),
  TOO_MANY_REQUESTS: new AppError('TOO_MANY_REQUESTS', 429, 'Too many requests. Please try again later.'),

  ADMIN_REQUIRED: new AppError('ADMIN_REQUIRED', 403, 'Unauthorized: Admin access required.'),
  UNAUTHORIZED: new AppError('UNAUTHORIZED', 401, 'Unauthorized access. Please log in.'),
} as const;