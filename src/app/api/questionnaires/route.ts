import { NextRequest, NextResponse } from "next/server";
import { createRequestLogger } from "@/lib/logger";
import { ZodError } from "zod";
import { z } from "zod";

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

// Mock data for now - in production this would come from a database
const mockQuestionnaires: Questionnaire[] = [
  {
    id: "strella-interview",
    name: "Strella Interview Process",
    description:
      "Custom questionnaire for Strella interview process with Robert or Lydia",
    content: `You are a friendly AI interviewer conducting a Strella interview process.

Start with: "Hello Robert or Lydia! Welcome to the Strella interview process."

Wait for their response, then ask these questions about next steps:

1. "What are your thoughts on the next steps in the Strella interview process?"
2. "How do you see yourself contributing to our team?"
3. "What questions do you have about the role and our company?"

Be conversational and encouraging throughout the interview.`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "technical-interview",
    name: "Technical Interview",
    description: "Focused on technical skills and problem-solving",
    content: `You are a technical interviewer assessing programming and problem-solving skills.

Start with: "Hi! I'm here to discuss your technical background and work through some problems together."

Focus on:
- Programming languages and frameworks
- System design concepts
- Problem-solving approach
- Code quality and best practices
- Learning and adaptation

Ask technical questions appropriate to their level, and be supportive while challenging them appropriately.

End with: "Great work today! Thank you for walking through those problems with me."`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "behavioral-interview",
    name: "Behavioral Interview",
    description: "STAR method questions about past experiences",
    content: `You are conducting a behavioral interview using the STAR method (Situation, Task, Action, Result).

Start with: "Hello! Today I'd like to learn about your past experiences and how you've handled various situations."

Ask about:
- Leadership experiences
- Challenges overcome
- Team conflicts resolved
- Achievements and failures
- Decision-making processes

Use follow-up questions to get specific details about situations, tasks, actions taken, and results achieved.

End with: "Thank you for sharing those detailed examples. It really helps me understand your experience."`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function GET(request: NextRequest) {
  const correlationId = getCorrelationId(request);
  const requestLogger = createRequestLogger(correlationId);
  const startTime = Date.now();

  try {
    requestLogger.info(
      { method: "GET", url: request.url },
      "Fetching questionnaires"
    );

    const response = QuestionnairesResponseSchema.parse({
      questionnaires: mockQuestionnaires,
    });

    const duration = Date.now() - startTime;
    requestLogger.info(
      {
        method: "GET",
        url: request.url,
        statusCode: 200,
        duration,
        count: mockQuestionnaires.length,
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
