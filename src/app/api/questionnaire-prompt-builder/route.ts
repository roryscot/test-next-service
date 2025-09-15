import { NextRequest } from "next/server";
import { PromptStore } from "@/lib/prompt-store";
import { PromptRequest, PromptResponse, PromptsResponse } from "@/lib/schemas";
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
    // Check if this is a request for a specific prompt ID
    const url = new URL(request.url);
    const promptId = url.searchParams.get("id");
    const listRequest = url.searchParams.get("list") === "true";

    if (promptId) {
      // Return specific prompt
      requestLogger.info(
        { method: "GET", url: request.url, promptId },
        "Fetching specific prompt"
      );

      const prompts = await PromptStore.read();
      const prompt = prompts.find(p => p.id === promptId);

      if (!prompt) {
        return Response.json({ error: "Prompt not found" }, { status: 404 });
      }

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
          promptId,
        },
        "Specific prompt fetched successfully"
      );

      return Response.json(response, {
        status: 200,
        headers: {
          "x-correlation-id": correlationId,
        },
      });
    } else if (listRequest) {
      // Return all prompts (for UI)
      requestLogger.info(
        { method: "GET", url: request.url },
        "Fetching all prompts for UI"
      );

      const prompts = await PromptStore.read();
      const response = PromptsResponse.parse({ prompts });

      const duration = Date.now() - startTime;
      requestLogger.info(
        {
          method: "GET",
          url: request.url,
          statusCode: 200,
          duration,
          count: prompts.length,
        },
        "All prompts fetched successfully for UI"
      );

      return Response.json(response, {
        status: 200,
        headers: {
          "x-correlation-id": correlationId,
        },
      });
    } else {
      // Return main/default prompt (legacy behavior for agent consumption)
      requestLogger.info(
        { method: "GET", url: request.url },
        "Fetching main prompt"
      );

      const prompts = await PromptStore.read();
      const mainPrompt = prompts.find(p => p.id === "default") || prompts[0];

      if (!mainPrompt) {
        return Response.json(
          { error: "No prompts available" },
          { status: 404 }
        );
      }

      const response = PromptResponse.parse({
        prompt: mainPrompt.content,
        title: mainPrompt.title,
      });

      const duration = Date.now() - startTime;
      requestLogger.info(
        {
          method: "GET",
          url: request.url,
          statusCode: 200,
          duration,
          promptId: mainPrompt.id,
        },
        "Main prompt fetched successfully"
      );

      return Response.json(response, {
        status: 200,
        headers: {
          "x-correlation-id": correlationId,
        },
      });
    }
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
      "Failed to fetch prompts"
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
