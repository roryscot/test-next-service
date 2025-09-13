// src/lib/errors.ts
import { ZodError } from "zod";
import { ErrorResponseT } from "./schemas";

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Rate limit exceeded") {
    super(message, 429, "RATE_LIMIT");
    this.name = "RateLimitError";
  }
}

// Error handler utilities
export function handleZodError(error: ZodError): ErrorResponseT {
  const details = error.issues.reduce((acc, err) => {
    const path = err.path.join(".");
    acc[path] = err.message;
    return acc;
  }, {} as Record<string, string>);

  return {
    error: "Validation failed",
    code: "VALIDATION_ERROR",
    details,
  };
}

export function handleAppError(error: AppError): ErrorResponseT {
  return {
    error: error.message,
    code: error.code,
    details: error.details,
  };
}

export function handleUnknownError(error: unknown): ErrorResponseT {
  console.error("Unexpected error:", error);
  return {
    error: "Internal server error",
    code: "INTERNAL_ERROR",
  };
}

// Response helpers
export function createErrorResponse(
  error: unknown,
  statusCode: number = 500
): Response {
  let errorResponse: ErrorResponseT;
  let finalStatusCode = statusCode;

  if (error instanceof ZodError) {
    errorResponse = handleZodError(error);
    finalStatusCode = 400;
  } else if (error instanceof AppError) {
    errorResponse = handleAppError(error);
    finalStatusCode = error.statusCode;
  } else {
    errorResponse = handleUnknownError(error);
  }

  return Response.json(errorResponse, { status: finalStatusCode });
}
