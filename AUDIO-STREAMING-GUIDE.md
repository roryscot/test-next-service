# Audio Streaming Implementation Guide

## Current Status ✅

The interview system is now fully functional with:

- ✅ Room-specific prompt association UI
- ✅ Agent automatically joins LiveKit rooms
- ✅ Agent fetches room-specific prompts with fallback
- ✅ Default greeting "Hello! Are you ready to get started?" when no prompt is associated
- ✅ Complete integration between web service and agent

## Audio Streaming Implementation 🎵

To enable real audio streaming between the agent and browser, you need to implement the following:

### 1. Install Required Dependencies

```bash
# In the agent repository
npm install @livekit/agents @livekit/agents-plugin-openai
npm install openai  # For OpenAI Realtime API
```

### 2. Update Agent Implementation

Replace the current `startLiveKitAgent` function with:

```typescript
import { Worker, Room } from "@livekit/agents";
import { OpenAI } from "openai";

async function startLiveKitAgent(options: {
  livekitUrl: string;
  token: string;
  roomName: string;
  agentIdentity: string;
  instructions: string;
}): Promise<void> {
  const { livekitUrl, token, roomName, agentIdentity, instructions } = options;

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });

  // Create LiveKit Worker
  const worker = new Worker({
    url: livekitUrl,
    token: token,
    options: {
      adaptiveStream: true,
      dynacast: true,
    },
  });

  let hasStartedInterview = false;

  worker.on("roomConnected", async (room: Room) => {
    console.log("✅ Connected to LiveKit room successfully");

    // Create audio track for agent
    const audioTrack = await room.localParticipant.createAudioTrack({
      name: "agent-voice",
      source: "microphone",
    });

    // Set up OpenAI Realtime API
    const session = await openai.beta.realtime.sessions.create({
      model: "gpt-4o-realtime-preview-2024-12-17",
      voice: "alloy",
      instructions: instructions,
      input_audio_format: "pcm16",
      output_audio_format: "pcm16",
      turn_detection: {
        type: "server_vad",
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 500,
      },
    });

    // Connect audio streams
    session.on("audio_output", audio => {
      // Send audio to LiveKit room
      audioTrack.sendAudio(audio);
    });

    room.on("audioInput", audio => {
      // Send user audio to OpenAI
      session.sendAudio(audio);
    });

    console.log("🎵 Audio streaming enabled");
  });

  worker.on("participantConnected", participant => {
    console.log(`👥 Participant joined: ${participant.identity}`);

    if (!hasStartedInterview) {
      hasStartedInterview = true;
      console.log("🎬 Starting interview with participant...");

      // Start the conversation
      session.sendMessage({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "assistant",
          content: "Hello! Are you ready to get started?",
        },
      });
    }
  });

  await worker.connect();
}
```

### 3. Environment Variables

Add to your `.env` file:

```bash
OPENAI_API_KEY=your-openai-api-key
OPENAI_REALTIME_MODEL=gpt-4o-realtime-preview-2024-12-17
OPENAI_VOICE=alloy
```

### 4. Docker Configuration

Update the Dockerfile to include native dependencies:

```dockerfile
FROM node:20-alpine

# Install native dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    alsa-lib-dev \
    portaudio-dev

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

CMD ["npm", "start"]
```

### 5. Testing Audio Streaming

1. **Start the system:**

   ```bash
   docker-compose up -d
   ```

2. **Open browser:**
   - Navigate to http://localhost:3000/call
   - Enter room name and identity
   - Click "Connect to Room"

3. **Expected behavior:**
   - Agent joins the room automatically
   - Agent fetches room-specific prompt
   - Agent starts speaking: "Hello! Are you ready to get started?"
   - Real-time conversation begins

## Current Working Features 🎯

Even without audio streaming, the system provides:

1. **Complete UI Integration:**
   - Prompt selection dropdown on `/call` page
   - Room-specific prompt association
   - "New Prompt" and "Edit Prompts" buttons

2. **Agent Integration:**
   - Automatic room joining
   - Room-specific prompt fetching
   - Fallback to global prompt
   - Default greeting for rooms without prompts

3. **API Endpoints:**
   - `GET /api/room-prompt?roomName=X` - Fetch room-specific prompt
   - `POST /api/room-prompt` - Save room-specific prompt
   - `GET /api/questionnaire-prompt-builder` - Global prompt fallback

## Next Steps 🚀

1. **Implement the audio streaming code above**
2. **Test with real OpenAI API key**
3. **Verify audio quality and latency**
4. **Add error handling for audio failures**

The foundation is complete - you just need to add the audio streaming layer!
