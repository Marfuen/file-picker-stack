import { NextResponse } from "next/server";
import { AxiosError } from "axios";
import { ZodError } from "zod";

export type ApiError = {
  message: string;
  code: string;
  status: number;
};

// For error responses, we wrap in an object with error field
export type ApiErrorResponse = {
  error: ApiError;
};

// For success responses, we return the data directly
export type ApiResponse<T> = T;

export function createApiError(
  message: string,
  status: number = 500,
  code: string = "INTERNAL_SERVER_ERROR"
): ApiError {
  return {
    message,
    status,
    code,
  };
}

export function handleApiError(
  error: unknown
): NextResponse<ApiErrorResponse | unknown[]> {
  console.error("API Error:", error);

  // Handle Axios errors
  if (error instanceof AxiosError) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message;
    const code = error.code || "API_ERROR";

    // Special case for 400 errors that should return empty arrays
    if (status === 400 && message.includes("resource doesn't exist")) {
      return NextResponse.json([]);
    }

    return NextResponse.json(
      { error: createApiError(message, status, code) },
      { status }
    );
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: createApiError("Validation error", 400, "VALIDATION_ERROR"),
      },
      { status: 400 }
    );
  }

  // Handle standard errors
  if (error instanceof Error) {
    const status = error.message.toLowerCase().includes("not found")
      ? 404
      : error.message.toLowerCase().includes("unauthorized") ||
        error.message.toLowerCase().includes("authentication")
      ? 401
      : 500;

    return NextResponse.json(
      { error: createApiError(error.message, status) },
      { status }
    );
  }

  // Handle unknown errors
  return NextResponse.json(
    {
      error: createApiError("An unexpected error occurred"),
    },
    { status: 500 }
  );
}

export function createApiResponse<T>(data: T): NextResponse<ApiResponse<T>> {
  return NextResponse.json(data);
}
