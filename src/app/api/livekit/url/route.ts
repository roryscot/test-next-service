import { NextRequest } from "next/server";
import { livekitWsUrl } from "@/lib/livekit";
import { LiveKitUrlResponse } from "@/lib/schemas";
import { createErrorResponse } from "@/lib/errors";
import { createRequestLogger } from "@/lib/logger";

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
      "Fetching LiveKit URL"
    );

    const url = livekitWsUrl();
    const response = LiveKitUrlResponse.parse({ url });

    const duration = Date.now() - startTime;
    requestLogger.info(
      {
        method: "GET",
        url: request.url,
        statusCode: 200,
        duration,
      },
      "LiveKit URL fetched successfully"
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
      "Failed to fetch LiveKit URL"
    );

    return createErrorResponse(error, 500);
  }
}
