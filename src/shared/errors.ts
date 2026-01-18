export type ErrorContext = Record<string, unknown>;

export type AppErrorOptions = {
  code: string;
  message: string;
  userMessage?: string;
  cause?: unknown;
  context?: ErrorContext;
};

export class AppError extends Error {
  code: string;
  userMessage?: string;
  cause?: unknown;
  context?: ErrorContext;

  constructor({ code, message, userMessage, cause, context }: AppErrorOptions) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.userMessage = userMessage;
    this.cause = cause;
    this.context = context;
  }
}

const hasCode = (error: unknown): error is { code: string } => {
  return typeof (error as { code?: string })?.code === 'string';
};

export const toAppError = (error: unknown, fallback: AppErrorOptions): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  const message = error instanceof Error ? error.message : fallback.message;
  const code = hasCode(error) ? error.code : fallback.code;

  return new AppError({
    code,
    message,
    userMessage: fallback.userMessage,
    cause: error,
    context: fallback.context,
  });
};
