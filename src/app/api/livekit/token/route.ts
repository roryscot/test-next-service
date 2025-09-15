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

    // Automatically start agent when someone joins a room
    try {
      const agentResponse = await fetch(
        `${process.env.SERVER_ORIGIN || "http://localhost:3000"}/api/agent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomName: validatedData.roomName,
            action: "start",
          }),
        }
      );

      if (agentResponse.ok) {
        requestLogger.info(
          { roomName: validatedData.roomName },
          "Agent automatically started for room"
        );
      } else {
        requestLogger.warn(
          { roomName: validatedData.roomName, status: agentResponse.status },
          "Failed to auto-start agent"
        );
      }
    } catch (error) {
      requestLogger.warn(
        {
          roomName: validatedData.roomName,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        "Error auto-starting agent"
      );
    }

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
