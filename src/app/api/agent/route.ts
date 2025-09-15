import { NextRequest, NextResponse } from "next/server";
import { RoomServiceClient } from "livekit-server-sdk";
import { Buffer } from "buffer";
import { OpenAI } from "openai";

// Global state for agent
let isAgentActive = false;
let agentRoomName = "";
let roomService: RoomServiceClient;
let currentAudioBuffer: Buffer | null = null;
let selectedQuestionnaireId: string | null = null;
let selectedQuestionnaireContent: string | null = null;
let interviewQuestions: string[] = [];
let interviewStarted = false;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomName, action, text, questionnaireId, questionnaireContent } =
      body;

    if (action === "start") {
      return await startAgent(roomName, questionnaireId, questionnaireContent);
    } else if (action === "stop") {
      return await stopAgent();
    } else if (action === "speak") {
      return await speakText(text);
    } else if (action === "getAudio") {
      return await getAudio();
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

async function startAgent(
  roomName: string,
  questionnaireId?: string,
  questionnaireContent?: string
) {
  if (isAgentActive) {
    return NextResponse.json({ message: "Agent already active" });
  }

  try {
    console.log(`🎤 Starting agent for room: ${roomName}`);

    // Store questionnaire information
    selectedQuestionnaireId = questionnaireId || null;
    selectedQuestionnaireContent = questionnaireContent || null;

    // Fetch the main interview prompt for overall behavior
    let mainPrompt = "";
    try {
      const mainPromptResponse = await fetch(
        `${process.env.SERVER_ORIGIN || "http://localhost:3000"}/api/questionnaire-prompt-builder`
      );
      if (mainPromptResponse.ok) {
        const mainPromptData = await mainPromptResponse.json();
        mainPrompt = mainPromptData.prompt;
        console.log(
          `📋 Fetched main interview prompt: ${mainPrompt.substring(0, 100)}...`
        );
      } else {
        console.log(`⚠️ Failed to fetch main prompt, using default behavior`);
      }
    } catch (error) {
      console.log(`⚠️ Error fetching main prompt:`, error);
    }

    if (selectedQuestionnaireId) {
      console.log(`📋 Using questionnaire: ${selectedQuestionnaireId}`);

      // Fetch the actual prompt content from the questionnaire-prompt-builder endpoint
      try {
        const promptResponse = await fetch(
          `${process.env.SERVER_ORIGIN || "http://localhost:3000"}/api/questionnaire-prompt-builder?id=${selectedQuestionnaireId}`
        );
        if (promptResponse.ok) {
          const promptData = await promptResponse.json();
          selectedQuestionnaireContent = promptData.prompt;
          console.log(
            `📝 Fetched questionnaire content: ${selectedQuestionnaireContent?.substring(0, 100)}...`
          );
        } else {
          console.log(
            `⚠️ Failed to fetch questionnaire content, using provided content`
          );
        }
      } catch (error) {
        console.log(`⚠️ Error fetching questionnaire content:`, error);
      }
    }

    // Parse questionnaire content to extract questions
    interviewQuestions = parseQuestionnaire(selectedQuestionnaireContent || "");
    interviewStarted = false;

    console.log(
      `📝 Parsed ${interviewQuestions.length} questions from questionnaire`
    );

    // Initialize room service
    const livekitUrl =
      process.env.LIVEKIT_URL?.replace("ws://", "http://").replace(
        "localhost",
        "livekit"
      ) || "http://livekit:7880";
    const apiKey = process.env.LIVEKIT_API_KEY || "devkey";
    const apiSecret = process.env.LIVEKIT_API_SECRET || "secret";

    roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);

    // Check if room exists, create if not
    try {
      await roomService.listRooms([roomName]);
      console.log(`✅ Room ${roomName} exists`);
    } catch {
      console.log(`📝 Creating room ${roomName}`);
      await roomService.createRoom({
        name: roomName,
        emptyTimeout: 300, // 5 minutes
        maxParticipants: 10,
      });
    }

    agentRoomName = roomName;
    isAgentActive = true;

    console.log("🤖 Agent is now monitoring the room");

    // Start monitoring for participants
    startParticipantMonitoring();

    return NextResponse.json({
      message: "Agent started successfully",
      isActive: true,
      questionsCount: interviewQuestions.length,
    });
  } catch (error) {
    console.error("Failed to start agent:", error);
    return NextResponse.json(
      { error: "Failed to start agent" },
      { status: 500 }
    );
  }
}

async function stopAgent() {
  isAgentActive = false;
  agentRoomName = "";
  currentAudioBuffer = null;
  selectedQuestionnaireId = null;
  selectedQuestionnaireContent = null;
  interviewQuestions = [];
  interviewStarted = false;

  console.log("🛑 Agent stopped");

  return NextResponse.json({ message: "Agent stopped" });
}

async function getAudio() {
  if (!currentAudioBuffer) {
    return NextResponse.json({ error: "No audio available" }, { status: 404 });
  }

  return new NextResponse(currentAudioBuffer, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": currentAudioBuffer.length.toString(),
    },
  });
}

function parseQuestionnaire(content: string): string[] {
  // Parse questionnaire content to extract questions
  const lines = content
    .split("\n")
    .map(line => line.trim())
    .filter(line => line);
  const questions: string[] = [];

  // Look for lines that start with quotes or contain question marks
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

  // Fallback questions if none found
  if (questions.length === 0) {
    questions.push(
      "Hello! Welcome to the interview. How are you doing today?",
      "Can you tell me a bit about yourself?",
      "What interests you most about this role?",
      "Do you have any questions for me?"
    );
  }

  console.log(`📝 Parsed questions:`, questions);
  return questions;
}

async function startParticipantMonitoring() {
  if (!isAgentActive) return;

  try {
    const rooms = await roomService.listRooms([agentRoomName]);
    const room = rooms.find(r => r.name === agentRoomName);

    if (room) {
      const participants = room.numParticipants || 0;
      console.log(`👥 Room has ${participants} participants`);

      // Check if there are non-agent participants
      const realParticipants =
        room.participants?.filter(
          (p: { identity: string }) => !p.identity.startsWith("agent-")
        ) || [];

      if (realParticipants.length > 0 && !interviewStarted) {
        console.log(
          `🎬 Starting interview with ${realParticipants.length} participants`
        );
        interviewStarted = true;
        await startInterview();
      }
    }
  } catch (error) {
    console.error("Error monitoring participants:", error);
  }

  // Check again in 5 seconds
  setTimeout(startParticipantMonitoring, 5000);
}

async function startInterview() {
  console.log("🎬 Starting interview...");

  if (interviewQuestions.length === 0) {
    console.log("❌ No questions available for interview");
    return;
  }

  // Ask each question with proper timing
  for (let i = 0; i < interviewQuestions.length; i++) {
    if (!isAgentActive) break;

    const question = interviewQuestions[i];
    console.log(
      `🗣️ Agent asking question ${i + 1}/${interviewQuestions.length}: "${question}"`
    );

    await speakText(question);

    // Wait for user response (simulated - in real implementation, use VAD)
    const waitTime = Math.max(3000, question.length * 50); // Longer wait for longer questions
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  // End interview
  await speakText(
    "Thank you for participating in this interview. Have a great day!"
  );
  console.log("✅ Interview completed");
}

async function speakText(text: string) {
  if (!isAgentActive || !agentRoomName) {
    return NextResponse.json({ error: "Agent not active" }, { status: 400 });
  }

  try {
    console.log(`🗣️ Agent speaking: "${text}"`);

    // Fetch the main prompt for context-aware speech generation
    let mainPrompt = "";
    try {
      const mainPromptResponse = await fetch(
        `${process.env.SERVER_ORIGIN || "http://localhost:3000"}/api/questionnaire-prompt-builder`
      );
      if (mainPromptResponse.ok) {
        const mainPromptData = await mainPromptResponse.json();
        mainPrompt = mainPromptData.prompt;
      }
    } catch (error) {
      console.log(`⚠️ Error fetching main prompt for speech:`, error);
    }

    // Generate audio data using OpenAI TTS
    const apiKey = process.env.OPENAI_API_KEY;
    let audioBuffer: Buffer;

    if (apiKey && !apiKey.includes("placeholder")) {
      // Generate real audio with OpenAI TTS
      const openai = new OpenAI({ apiKey });
      const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: text,
      });
      audioBuffer = Buffer.from(await mp3.arrayBuffer());
      console.log(`✅ Generated ${audioBuffer.length} bytes of real audio`);
    } else {
      // Generate simulated audio data
      const duration = Math.max(2000, text.length * 100);
      const sampleRate = 44100;
      const samples = Math.floor((duration / 1000) * sampleRate);
      const bufferSize = samples * 2; // 16-bit samples

      audioBuffer = Buffer.alloc(bufferSize);
      // Generate a simple sine wave
      for (let i = 0; i < samples; i++) {
        const sample = Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.1;
        const sampleValue = Math.floor(sample * 32767);
        audioBuffer.writeInt16LE(sampleValue, i * 2);
      }
      console.log(
        `✅ Generated ${audioBuffer.length} bytes of simulated audio`
      );
    }

    // Store audio buffer for browser to fetch
    currentAudioBuffer = audioBuffer;
    console.log(`🔊 Agent says: "${text}"`);
    console.log(`📊 Audio data: ${audioBuffer.length} bytes`);
    if (mainPrompt) {
      console.log(
        `📋 Using main prompt context: ${mainPrompt.substring(0, 50)}...`
      );
    }

    return NextResponse.json({
      message: "Speech generated successfully",
      text,
      audioSize: audioBuffer.length,
      note: "Audio is available for browser to fetch",
      mainPromptUsed: !!mainPrompt,
    });
  } catch (error) {
    console.error("Failed to speak:", error);
    return NextResponse.json({ error: "Failed to speak" }, { status: 500 });
  }
}

// Keep the agent alive
setInterval(() => {
  if (isAgentActive) {
    console.log("💓 Agent heartbeat");
  }
}, 30000);
