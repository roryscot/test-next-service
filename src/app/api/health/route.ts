import { NextRequest } from "next/server";
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
    // Basic health check - just verify the app is running
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "1.0.0",
    };

    const duration = Date.now() - startTime;
    requestLogger.info(
      {
        method: "GET",
        url: request.url,
        statusCode: 200,
        duration,
      },
      "Health check passed"
    );

    return Response.json(health, {
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
      "Health check failed"
    );

    return Response.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
