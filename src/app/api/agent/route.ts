import { NextRequest, NextResponse } from "next/server";
import { RoomServiceClient } from "livekit-server-sdk";
import { OpenAI } from "openai";
import { Buffer } from "buffer";

// Global state for agent
let isAgentActive = false;
let agentRoomName = "";
let roomService: RoomServiceClient;
let currentAudioBuffer: Buffer | null = null;

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
  if (isAgentActive) {
    return NextResponse.json({ message: "Agent already active" });
  }

  try {
    console.log(`🎤 Starting agent for room: ${roomName}`);

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

  console.log("🛑 Agent stopped");

  return NextResponse.json({ message: "Agent stopped" });
}

async function speakText(text: string) {
  if (!isAgentActive || !agentRoomName) {
    return NextResponse.json({ error: "Agent not active" }, { status: 400 });
  }

  try {
    console.log(`🗣️  Agent speaking: "${text}"`);

    // Generate audio data
    let audioBuffer: Buffer;

    // Check if we have OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;
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

    return NextResponse.json({
      message: "Speech generated successfully",
      text,
      audioSize: audioBuffer.length,
      note: "Audio is available for browser to fetch",
    });
  } catch (error) {
    console.error("Failed to speak:", error);
    return NextResponse.json({ error: "Failed to speak" }, { status: 500 });
  }
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

async function startParticipantMonitoring() {
  if (!isAgentActive) return;

  try {
    const rooms = await roomService.listRooms([agentRoomName]);
    const room = rooms.find(r => r.name === agentRoomName);

    if (room) {
      const participants = room.participants || [];
      console.log(`👥 Room has ${participants.length} participants`);

      // Check if there are non-agent participants
      const realParticipants = participants.filter(
        p => !p.identity.startsWith("agent-")
      );

      if (realParticipants.length > 0) {
        console.log(
          `🎬 Starting interview with ${realParticipants.length} participants`
        );
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

  const questions = [
    "Hello! What's your age?",
    "Tell me about yourself and your background.",
    "What interests you most about software development?",
    "Do you have any questions for me?",
  ];

  for (const question of questions) {
    await speakText(question);
    // Wait between questions
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}

// Keep the agent alive
setInterval(() => {
  if (isAgentActive) {
    console.log("💓 Agent heartbeat");
  }
}, 30000);
