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
    requestLogger.info(
      { method: "GET", url: request.url },
      "Fetching current prompt"
    );

    const prompt = await PromptStore.read();
    const response = PromptResponse.parse({
      prompt: prompt.content,
      title: prompt.title,
    });

    const duration = Date.now() - startTime;
    requestLogger.info(
      {
        method: "GET",
        url: request.url,
        statusCode: 200,
        duration,
        promptId: prompt.id,
      },
      "Current prompt fetched successfully"
    );

    return Response.json(response, {
      status: 200,
      headers: {
        "x-correlation-id": correlationId,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    if (error instanceof ZodError) {
      requestLogger.warn(
        {
          method: "GET",
          url: request.url,
          statusCode: 400,
          duration,
          validationErrors: error.issues,
        },
        "Prompt response validation failed"
      );
    } else {
      requestLogger.error(
        {
          method: "GET",
          url: request.url,
          statusCode: 500,
          duration,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        "Failed to fetch current prompt"
      );
    }

    return createErrorResponse(
      "Failed to fetch current prompt",
      500,
      correlationId
    );
  }
}

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request);
  const requestLogger = createRequestLogger(correlationId);
  const startTime = Date.now();

  try {
    const body = await request.json();
    requestLogger.info(
      { method: "POST", url: request.url },
      "Saving new prompt"
    );

    const validatedData = PromptRequest.parse(body);
    const savedPrompt = await PromptStore.write(validatedData);

    const duration = Date.now() - startTime;
    requestLogger.info(
      {
        method: "POST",
        url: request.url,
        statusCode: 200,
        duration,
        promptId: savedPrompt.id,
      },
      "Prompt saved successfully"
    );

    return Response.json(
      {
        message: "Prompt saved successfully",
        prompt: savedPrompt,
      },
      {
        status: 200,
        headers: {
          "x-correlation-id": correlationId,
        },
      }
    );
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
        "Prompt request validation failed"
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

    return createErrorResponse("Failed to save prompt", 500, correlationId);
  }
}
