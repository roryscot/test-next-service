import { NextRequest } from "next/server";
import { createRequestLogger } from "@/lib/logger";
import { PromptStore } from "@/lib/prompt-store";
import { serverEnv } from "@/lib/env";

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
    // Readiness check - verify all dependencies are available
    const checks = {
      promptStore: false,
      livekitConfig: false,
    };

    // Check prompt store
    try {
      await PromptStore.read();
      checks.promptStore = true;
    } catch (error) {
      requestLogger.warn(
        { error: error instanceof Error ? error.message : "Unknown error" },
        "Prompt store check failed"
      );
    }

    // Check LiveKit configuration
    try {
      if (
        serverEnv.LIVEKIT_URL &&
        serverEnv.LIVEKIT_API_KEY &&
        serverEnv.LIVEKIT_API_SECRET
      ) {
        checks.livekitConfig = true;
      }
    } catch (error) {
      requestLogger.warn(
        { error: error instanceof Error ? error.message : "Unknown error" },
        "LiveKit config check failed"
      );
    }

    const isReady = Object.values(checks).every(Boolean);
    const status = isReady ? "ready" : "not_ready";

    const readiness = {
      status,
      timestamp: new Date().toISOString(),
      checks,
    };

    const duration = Date.now() - startTime;
    const logLevel = isReady ? "info" : "warn";
    requestLogger[logLevel](
      {
        method: "GET",
        url: request.url,
        statusCode: isReady ? 200 : 503,
        duration,
        checks,
      },
      `Readiness check: ${status}`
    );

    return Response.json(readiness, {
      status: isReady ? 200 : 503,
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
      "Readiness check failed"
    );

    return Response.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
