import { NextRequest, NextResponse } from "next/server";
import { createRequestLogger } from "@/lib/logger";
import { ZodError } from "zod";
import { z } from "zod";
import { PromptStore } from "@/lib/prompt-store";

// Generate correlation ID for request tracking
function getCorrelationId(request: NextRequest): string {
  return (
    request.headers.get("x-correlation-id") ||
    request.headers.get("x-request-id") ||
    `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  );
}

// Schema for questionnaire
const QuestionnaireSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const QuestionnairesResponseSchema = z.object({
  questionnaires: z.array(QuestionnaireSchema),
});

export type Questionnaire = z.infer<typeof QuestionnaireSchema>;
export type QuestionnairesResponse = z.infer<
  typeof QuestionnairesResponseSchema
>;

export async function GET(request: NextRequest) {
  const correlationId = getCorrelationId(request);
  const requestLogger = createRequestLogger(correlationId);
  const startTime = Date.now();

  try {
    requestLogger.info(
      { method: "GET", url: request.url },
      "Fetching questionnaires"
    );

    // Get saved prompts from PromptStore
    const savedPrompts = await PromptStore.read();

    // Convert saved prompts to questionnaire format
    const questionnaires = savedPrompts.map(prompt => ({
      id: prompt.id,
      name: prompt.title,
      description: `Custom questionnaire: ${prompt.title}`,
      content: prompt.content,
      createdAt: prompt.createdAt,
      updatedAt: prompt.updatedAt,
    }));

    const response = QuestionnairesResponseSchema.parse({
      questionnaires,
    });

    const duration = Date.now() - startTime;
    requestLogger.info(
      {
        method: "GET",
        url: request.url,
        statusCode: 200,
        duration,
        count: questionnaires.length,
      },
      "Questionnaires fetched successfully"
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
        "Questionnaires response validation failed"
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
        "Failed to fetch questionnaires"
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch questionnaires" },
      { status: 500 }
    );
  }
}
