import { NextRequest } from "next/server";
import { createAccessToken } from "@/lib/livekit";
import { TokenRequest, TokenResponse } from "@/lib/schemas";
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

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request);
  const requestLogger = createRequestLogger(correlationId);
  const startTime = Date.now();

  try {
    requestLogger.info(
      { method: "POST", url: request.url },
      "Generating LiveKit token"
    );

    const body = await request.json();
    const validatedData = TokenRequest.parse(body);

    const token = await createAccessToken(validatedData);
    const response = TokenResponse.parse({ token });

    const duration = Date.now() - startTime;
    requestLogger.info(
      {
        method: "POST",
        url: request.url,
        statusCode: 200,
        duration,
        roomName: validatedData.roomName,
        identity: validatedData.identity,
      },
      "LiveKit token generated successfully"
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
          method: "POST",
          url: request.url,
          statusCode: 400,
          duration,
          validationErrors: error.issues,
        },
        "Token request validation failed"
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
        "Failed to generate LiveKit token"
      );
    }

    return createErrorResponse(error, 500);
  }
}
