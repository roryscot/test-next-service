import { NextRequest, NextResponse } from "next/server";
import { LiveKitConversationAgent } from "@/lib/livekit-conversation-agent";

// Global state for agent
let conversationAgent: LiveKitConversationAgent | null = null;
let interviewQuestions: string[] = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomName, action, text } = body;

    if (action === "start") {
      return await startAgent(roomName);
    } else if (action === "stop") {
      return await stopAgent();
    } else if (action === "speak") {
      return await speakText(text);
    } else if (action === "getAudio") {
      return await getAudio();
    } else if (action === "startInterview") {
      return await startInterview();
    } else if (action === "userResponse") {
      return await handleUserResponse(body.transcript);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Agent API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function startAgent(roomName: string) {
  if (conversationAgent) {
    return NextResponse.json({ message: "Agent already active" });
  }

  try {
    console.log(`🎤 Starting LiveKit conversation agent for room: ${roomName}`);

    // Fetch the current prompt
    let currentPrompt = "";
    try {
      const promptResponse = await fetch(
        `${process.env.SERVER_ORIGIN || "http://localhost:3000"}/api/questionnaire-prompt-builder`
      );
      if (promptResponse.ok) {
        const promptData = await promptResponse.json();
        currentPrompt = promptData.prompt;
        console.log(
          `📋 Fetched current prompt: ${currentPrompt.substring(0, 100)}...`
        );
      } else {
        console.log(`⚠️ Failed to fetch current prompt, using default`);
      }
    } catch (error) {
      console.log(`⚠️ Error fetching current prompt:`, error);
    }

    // Parse prompt content to extract questions
    interviewQuestions = parseQuestionnaire(currentPrompt);

    console.log(
      `📝 Parsed ${interviewQuestions.length} questions from current prompt`
    );

    // Create and start the LiveKit conversation agent
    conversationAgent = new LiveKitConversationAgent();
    await conversationAgent.start({
      roomName,
      questions: interviewQuestions,
      onQuestionComplete: (questionIndex, question) => {
        console.log(
          `✅ Question ${questionIndex + 1} completed: "${question}"`
        );
      },
      onInterviewComplete: () => {
        console.log("🎉 Interview completed!");
      },
    });

    return NextResponse.json({
      message: "LiveKit conversation agent started successfully",
      isActive: true,
      questionsCount: interviewQuestions.length,
    });
  } catch (error) {
    console.error("Failed to start LiveKit conversation agent:", error);
    return NextResponse.json(
      { error: "Failed to start LiveKit conversation agent" },
      { status: 500 }
    );
  }
}

async function stopAgent() {
  if (conversationAgent) {
    await conversationAgent.stop();
    conversationAgent = null;
  }

  interviewQuestions = [];

  console.log("🛑 LiveKit conversation agent stopped");

  return NextResponse.json({ message: "Agent stopped" });
}

async function getAudio() {
  if (conversationAgent) {
    const audioBuffer = conversationAgent.getCurrentAudio();
    if (audioBuffer) {
      console.log(
        `🎵 Returning audio from conversation agent (${audioBuffer.length} bytes)`
      );
      return new NextResponse(audioBuffer, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": audioBuffer.length.toString(),
        },
      });
    }
  }

  // No audio available - return 404 to stop polling
  console.log("🔇 No audio available from conversation agent");
  return NextResponse.json({ error: "No audio available" }, { status: 404 });
}

async function speakText(text: string) {
  if (!conversationAgent) {
    return NextResponse.json({ error: "Agent not active" }, { status: 400 });
  }

  try {
    console.log(`🗣️ Agent speaking: "${text}"`);
    await conversationAgent.askQuestion(text);

    return NextResponse.json({
      message: "Speech sent successfully",
      text,
    });
  } catch (error) {
    console.error("Failed to speak:", error);
    return NextResponse.json({ error: "Failed to speak" }, { status: 500 });
  }
}

async function startInterview() {
  if (!conversationAgent) {
    return NextResponse.json({ error: "Agent not active" }, { status: 400 });
  }

  // The LiveKit conversation agent handles interview flow automatically
  return NextResponse.json({
    message: "Interview flow managed by LiveKit conversation agent",
    questionsCount: interviewQuestions.length,
  });
}

async function handleUserResponse(transcript?: string) {
  if (!conversationAgent) {
    return NextResponse.json({ error: "Agent not active" }, { status: 400 });
  }

  try {
    console.log(
      `👂 Received user response: "${transcript || "No transcript provided"}"`
    );

    // Send the user response to the conversation agent
    await conversationAgent.handleUserResponse(transcript || "User responded");

    return NextResponse.json({
      message: "User response processed successfully",
      transcript,
    });
  } catch (error) {
    console.error("Failed to handle user response:", error);
    return NextResponse.json(
      { error: "Failed to handle user response" },
      { status: 500 }
    );
  }
}

function parseQuestionnaire(content: string): string[] {
  // Parse questionnaire content to extract questions
  const questions: string[] = [];

  // First, try to extract questions from quoted text
  const quotedMatches = content.match(/"([^"]*\?[^"]*)"/g);

  if (quotedMatches) {
    quotedMatches.forEach(match => {
      const question = match.replace(/"/g, "");
      if (question.includes("?")) {
        questions.push(question);
      }
    });
  }

  // If no quoted questions found, try to extract from numbered list format
  if (questions.length === 0) {
    // Look for patterns like "1. \"question?\" 2. \"question?\""
    const numberedMatches = content.match(/\d+\.\s*"([^"]*\?[^"]*)"/g);
    if (numberedMatches) {
      numberedMatches.forEach(match => {
        const questionMatch = match.match(/"([^"]*\?[^"]*)"/);
        if (questionMatch) {
          questions.push(questionMatch[1]);
        }
      });
    }
  }

  // If still no questions found, try to extract from lines
  if (questions.length === 0) {
    const lines = content
      .split("\n")
      .map(line => line.trim())
      .filter(line => line);

    for (const line of lines) {
      // Extract text between quotes that contains questions
      const quotedMatches = line.match(/"([^"]*\?[^"]*)"/g);
      if (quotedMatches) {
        quotedMatches.forEach(match => {
          const question = match.replace(/"/g, "");
          if (question.includes("?")) {
            questions.push(question);
          }
        });
      }

      // Also look for direct questions without quotes
      if (line.includes("?") && !line.includes('"')) {
        // Clean up the line
        const cleanLine = line
          .replace(/^(Start with:|Then ask:|Finally ask:|Ask:)/i, "")
          .trim();
        if (cleanLine.includes("?")) {
          questions.push(cleanLine);
        }
      }
    }
  }

  // Fallback questions if none found
  if (questions.length === 0) {
    questions.push(
      "Hello! Welcome to the interview. How are you doing today?",
      "Can you tell me a bit about yourself?",
      "What interests you most about this role?",
      "Do you have any questions for me?"
    );
  }

  console.log(`📝 Parsed ${questions.length} questions:`, questions);
  questions.forEach((q, i) => {
    console.log(`  ${i + 1}. "${q}"`);
  });
  return questions;
}
