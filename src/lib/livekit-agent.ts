import { RoomServiceClient, AccessToken } from "livekit-server-sdk";
import { OpenAI } from "openai";
import { Buffer } from "buffer";

export interface AgentConfig {
  roomName: string;
  questions: string[];
  onQuestionComplete?: (questionIndex: number, question: string) => void;
  onInterviewComplete?: () => void;
}

export class LiveKitAgent {
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
  private hasAskedCurrentQuestion = false;

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
    this.hasAskedCurrentQuestion = false;
    this.onQuestionComplete = config.onQuestionComplete;
    this.onInterviewComplete = config.onInterviewComplete;
    this.isActive = true;

    console.log(`🤖 Starting LiveKit agent for room: ${this.roomName}`);
    console.log(`📋 Questions: ${this.questions.length}`);

    // Ensure room exists
    await this.ensureRoomExists();

    // Start monitoring participants
    this.startParticipantMonitoring();

    console.log("✅ LiveKit agent started successfully");
  }

  async stop(): Promise<void> {
    this.isActive = false;
    console.log("🛑 LiveKit agent stopped");
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

  private startParticipantMonitoring(): void {
    if (!this.isActive) return;

    const checkParticipants = async () => {
      try {
        const rooms = await this.roomService.listRooms([this.roomName]);
        const room = rooms.find(r => r.name === this.roomName);

        if (room) {
          const realParticipants =
            room.participants?.filter(
              (p: { identity: string }) => !p.identity.startsWith("agent-")
            ) || [];

          console.log(
            `👥 Room has ${realParticipants.length} real participants`
          );

          if (
            realParticipants.length > 0 &&
            this.currentQuestionIndex < this.questions.length &&
            !this.hasAskedCurrentQuestion
          ) {
            await this.askCurrentQuestion();
          }
        }
      } catch (error) {
        console.error("Error monitoring participants:", error);
      }

      // Check again in 3 seconds
      if (this.isActive) {
        setTimeout(checkParticipants, 3000);
      }
    };

    // Start monitoring after a short delay
    setTimeout(checkParticipants, 2000);
  }

  private async askCurrentQuestion(): Promise<void> {
    if (this.currentQuestionIndex >= this.questions.length) {
      console.log("🎉 All questions completed");
      this.onInterviewComplete?.();
      return;
    }

    const question = this.questions[this.currentQuestionIndex];
    console.log(
      `🗣️ Asking question ${this.currentQuestionIndex + 1}/${this.questions.length}: "${question}"`
    );

    try {
      // Generate audio for the question
      const audioBuffer = await this.generateAudioForText(question);

      // Publish audio track to room
      await this.publishAudioTrack(
        audioBuffer,
        `question-${this.currentQuestionIndex + 1}`
      );

      // Notify completion
      this.onQuestionComplete?.(this.currentQuestionIndex, question);

      // Mark that we've asked this question
      this.hasAskedCurrentQuestion = true;

      // Wait for user response before moving to next question
      // In a real implementation, this would be triggered by user input detection
      setTimeout(() => {
        this.moveToNextQuestion();
      }, 5000); // Wait 5 seconds for user response
    } catch (error) {
      console.error(
        `❌ Failed to ask question ${this.currentQuestionIndex + 1}:`,
        error
      );
    }
  }

  private moveToNextQuestion(): void {
    console.log(`⏭️ Moving to next question...`);
    this.currentQuestionIndex++;
    this.hasAskedCurrentQuestion = false;

    // If there are more questions and participants are still in the room, ask the next question
    if (this.currentQuestionIndex < this.questions.length) {
      console.log(`🔄 Ready to ask question ${this.currentQuestionIndex + 1}`);
    }
  }

  private async generateAudioForText(text: string): Promise<Buffer> {
    console.log(`🎵 Generating audio for: "${text}"`);

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

    return audioBuffer;
  }

  private async publishAudioTrack(
    audioBuffer: Buffer,
    trackName: string
  ): Promise<void> {
    // Create agent token for publishing
    const token = new AccessToken(
      process.env.LIVEKIT_API_KEY || "devkey",
      process.env.LIVEKIT_API_SECRET || "secret"
    );
    token.identity = `agent-${Date.now()}`;
    token.name = "AI Interviewer";
    token.addGrant({
      room: this.roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    console.log(
      `🎫 Generated agent token for publishing audio track: ${trackName}`
    );

    // In a real implementation, we would use the LiveKit client SDK to connect as a participant
    // and publish the audio track. For now, we'll simulate this by storing the audio
    // and making it available via HTTP endpoint for the client to fetch

    // TODO: Implement actual LiveKit client SDK connection and track publishing
    console.log(
      `📡 Would publish audio track ${trackName} to room ${this.roomName}`
    );
  }

  // Method to get current audio for HTTP fallback
  getCurrentAudio(): Buffer | null {
    // This is a fallback method for the HTTP-based approach
    // In a proper LiveKit implementation, audio would be streamed via tracks
    return null;
  }
}
