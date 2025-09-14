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
    const url = new URL(request.url);
    const roomName = url.searchParams.get("roomName");

    requestLogger.info(
      { method: "GET", url: request.url, roomName },
      "Fetching room-specific prompt"
    );

    let prompt;
    if (roomName) {
      // Try to get room-specific prompt first
      prompt = await PromptStore.getRoomPrompt(roomName);

      // If no room-specific prompt exists, return 404
      if (!prompt) {
        const duration = Date.now() - startTime;
        requestLogger.info(
          {
            method: "GET",
            url: request.url,
            statusCode: 404,
            duration,
            roomName,
          },
          "No room-specific prompt found"
        );

        return Response.json(
          { error: "No prompt found for this room" },
          {
            status: 404,
            headers: {
              "x-correlation-id": correlationId,
            },
          }
        );
      }
    } else {
      // Fall back to global prompt if no roomName provided
      const rec = await PromptStore.read();
      prompt = rec.prompt;
    }

    const response = PromptResponse.parse({ prompt });

    const duration = Date.now() - startTime;
    requestLogger.info(
      {
        method: "GET",
        url: request.url,
        statusCode: 200,
        duration,
        roomName,
      },
      "Room prompt fetched successfully"
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
      "Failed to fetch room prompt"
    );

    return createErrorResponse(error, 500);
  }
}

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request);
  const requestLogger = createRequestLogger(correlationId);
  const startTime = Date.now();

  try {
    requestLogger.info(
      { method: "POST", url: request.url },
      "Saving room-specific prompt"
    );

    const body = await request.json();
    const { roomName, prompt } = body;

    if (!roomName || !prompt) {
      throw new Error("Room name and prompt are required");
    }

    const validatedData = PromptRequest.parse({ prompt });
    await PromptStore.saveRoomPrompt(roomName, validatedData.prompt);

    const duration = Date.now() - startTime;
    requestLogger.info(
      {
        method: "POST",
        url: request.url,
        statusCode: 204,
        duration,
        roomName,
      },
      "Room prompt saved successfully"
    );

    return new Response(null, {
      status: 204,
      headers: {
        "x-correlation-id": correlationId,
      },
    });
  } catch (error) {
    const duration = Date.now();

    if (error instanceof ZodError) {
      requestLogger.warn(
        {
          method: "POST",
          url: request.url,
          statusCode: 400,
          duration,
          validationErrors: error.issues,
        },
        "Room prompt validation failed"
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
        "Failed to save room prompt"
      );
    }

    return createErrorResponse(error, 500);
  }
}
