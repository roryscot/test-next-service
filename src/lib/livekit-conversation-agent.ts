import { RoomServiceClient } from "livekit-server-sdk";
import { OpenAI } from "openai";

export interface AgentConfig {
  roomName: string;
  questions: string[];
  onQuestionComplete?: (questionIndex: number, question: string) => void;
  onInterviewComplete?: () => void;
}

export class LiveKitConversationAgent {
  private roomService: RoomServiceClient;
  private isActive = false;
  private currentQuestionIndex = 0;
  private questions: string[] = [];
  private roomName = "";
  private onQuestionComplete?: (
    questionIndex: number,
    question: string
  ) => void;
  private onInterviewComplete?: () => void;
  private isWaitingForResponse = false;
  private currentAudioBuffer: Buffer | null = null;

  constructor() {
    const livekitUrl =
      process.env.LIVEKIT_URL?.replace("ws://", "http://").replace(
        "localhost",
        "livekit"
      ) || "http://livekit:7880";
    const apiKey = process.env.LIVEKIT_API_KEY || "devkey";
    const apiSecret = process.env.LIVEKIT_API_SECRET || "secret";

    this.roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);
  }

  async start(config: AgentConfig): Promise<void> {
    if (this.isActive) {
      throw new Error("Agent is already active");
    }

    this.roomName = config.roomName;
    this.questions = config.questions;
    this.currentQuestionIndex = 0;
    this.onQuestionComplete = config.onQuestionComplete;
    this.onInterviewComplete = config.onInterviewComplete;
    this.isActive = true;
    this.isWaitingForResponse = false;

    console.log(
      `🤖 Starting LiveKit conversation agent for room: ${this.roomName}`
    );
    console.log(`📋 Questions: ${this.questions.length}`);

    // Ensure room exists
    await this.ensureRoomExists();

    console.log("✅ LiveKit conversation agent started successfully");

    // Start the interview after a short delay
    setTimeout(() => {
      this.askCurrentQuestion();
    }, 2000);
  }

  private async askCurrentQuestion(): Promise<void> {
    if (this.currentQuestionIndex >= this.questions.length) {
      console.log("🎉 All questions completed");
      const closingMessage =
        "Thank you for participating in this interview. Have a great day!";
      await this.speakText(closingMessage);
      this.onInterviewComplete?.();
      return;
    }

    const question = this.questions[this.currentQuestionIndex];
    console.log(
      `🗣️ Asking question ${this.currentQuestionIndex + 1}/${this.questions.length}: "${question}"`
    );

    await this.speakText(question);
    this.isWaitingForResponse = true;

    // Wait for real user response from client
    console.log("⏳ Waiting for user response...");
  }

  private async speakText(text: string): Promise<void> {
    try {
      console.log(`🎵 Generating audio for: "${text}"`);

      // Generate audio using OpenAI TTS
      const apiKey = process.env.OPENAI_API_KEY;
      let audioBuffer: Buffer;

      if (apiKey && !apiKey.includes("placeholder")) {
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

      // Store the audio buffer for the client to fetch
      this.currentAudioBuffer = audioBuffer;
      console.log(`📡 Audio ready for client to fetch: "${text}"`);
      console.log(
        `🔄 Conversation state: Question ${this.currentQuestionIndex + 1}/${this.questions.length}, Waiting: ${this.isWaitingForResponse}`
      );
    } catch (error) {
      console.error(`❌ Failed to speak: "${text}"`, error);
    }
  }

  async handleUserResponse(transcript: string): Promise<void> {
    if (!this.isWaitingForResponse) {
      console.log("⚠️ Not waiting for user response, ignoring transcript");
      return;
    }

    console.log(`👂 User said: "${transcript}"`);

    // Notify that the current question is complete
    if (this.currentQuestionIndex < this.questions.length) {
      this.onQuestionComplete?.(
        this.currentQuestionIndex,
        this.questions[this.currentQuestionIndex]
      );
    }

    // Move to next question
    this.currentQuestionIndex++;
    this.isWaitingForResponse = false;

    // Wait a moment before asking the next question
    setTimeout(() => {
      this.askCurrentQuestion();
    }, 2000);
  }

  private async ensureRoomExists(): Promise<void> {
    try {
      await this.roomService.listRooms([this.roomName]);
      console.log(`✅ Room ${this.roomName} exists`);
    } catch {
      console.log(`📝 Creating room ${this.roomName}`);
      await this.roomService.createRoom({
        name: this.roomName,
        emptyTimeout: 300, // 5 minutes
        maxParticipants: 10,
      });
    }
  }

  async stop(): Promise<void> {
    this.isActive = false;
    this.currentAudioBuffer = null;
    console.log("🛑 LiveKit conversation agent stopped");
  }

  // Method to manually trigger a question (for testing)
  async askQuestion(question: string): Promise<void> {
    console.log(`🗣️ Manually asking: "${question}"`);
    await this.speakText(question);
  }

  // Method to get current audio buffer (for HTTP fallback)
  getCurrentAudio(): Buffer | null {
    const audio = this.currentAudioBuffer;
    // Clear the buffer after it's fetched to prevent repeated playback
    this.currentAudioBuffer = null;
    return audio;
  }
}
