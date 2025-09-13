import { NextRequest } from "next/server";
import { PromptStore } from "@/lib/prompt-store";
import { PromptRequest, PromptResponse } from "@/lib/schemas";
import { createErrorResponse } from "@/lib/errors";
import { createRequestLogger } from "@/lib/logger";
import { ZodError } from "zod";

// Generate correlation ID for request tracking
function getCorrelationId(request: NextRequest): string {
  return (
    request.headers.get("x-correlation-id") ||
    request.headers.get("x-request-id") ||
    `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  );
}

export async function GET(request: NextRequest) {
  const correlationId = getCorrelationId(request);
  const requestLogger = createRequestLogger(correlationId);
  const startTime = Date.now();

  try {
    requestLogger.info({ method: "GET", url: request.url }, "Fetching prompt");

    const rec = await PromptStore.read();
    const response = PromptResponse.parse(rec);

    const duration = Date.now() - startTime;
    requestLogger.info(
      {
        method: "GET",
        url: request.url,
        statusCode: 200,
        duration,
      },
      "Prompt fetched successfully"
    );

    return Response.json(response, {
      status: 200,
      headers: {
        "x-correlation-id": correlationId,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    requestLogger.error(
      {
        method: "GET",
        url: request.url,
        statusCode: 500,
        duration,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      "Failed to fetch prompt"
    );

    return createErrorResponse(error, 500);
  }
}

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request);
  const requestLogger = createRequestLogger(correlationId);
  const startTime = Date.now();

  try {
    requestLogger.info({ method: "POST", url: request.url }, "Saving prompt");

    const body = await request.json();
    const validatedData = PromptRequest.parse(body);

    await PromptStore.write(validatedData);

    const duration = Date.now() - startTime;
    requestLogger.info(
      {
        method: "POST",
        url: request.url,
        statusCode: 204,
        duration,
      },
      "Prompt saved successfully"
    );

    return new Response(null, {
      status: 204,
      headers: {
        "x-correlation-id": correlationId,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    if (error instanceof ZodError) {
      requestLogger.warn(
        {
          method: "POST",
          url: request.url,
          statusCode: 400,
          duration,
          validationErrors: error.issues,
        },
        "Prompt validation failed"
      );
    } else {
      requestLogger.error(
        {
          method: "POST",
          url: request.url,
          statusCode: 500,
          duration,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        "Failed to save prompt"
      );
    }

    return createErrorResponse(error, 500);
  }
}
