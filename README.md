# Interview Strella System

A complete AI-powered interview system consisting of a Next.js web application
and a TypeScript CLI agent, both integrated with LiveKit for real-time audio
communication and OpenAI Realtime API for natural conversation.

## System Architecture

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Web Service       │    │   LiveKit Room      │    │   AI Agent          │
│   (Next.js)         │◄──►│   (Real-time Audio) │◄──►│   (TypeScript CLI)  │
│                     │    │                     │    │                     │
│ • Prompt Builder    │    │ • WebRTC Audio      │    │ • OpenAI Realtime   │
│ • Call Interface    │    │ • Room Management    │    │ • Dynamic Prompts   │
│ • API Endpoints     │    │ • Token Auth         │    │ • Auto-timeout      │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

## Repository Structure

This system consists of two main repositories:

### 1. `interview-next-service` - Web Application

- **Next.js** application with Tailwind CSS 4 and shadcn/ui
- **Prompt Builder**: Create and edit interview instructions
- **Call Interface**: Join LiveKit rooms and conduct interviews
- **API Endpoints**: RESTful APIs for prompt management and token generation
- **Playwright Tests**: End-to-end testing for UI and API

### 2. `interview-strella-agent` - AI Agent

- **TypeScript CLI** that conducts AI-powered interviews
- **LiveKit Integration**: Connects to rooms and waits for participants
- **Dynamic Prompts**: Fetches instructions from the web service
- **OpenAI Realtime**: Uses voice models for natural conversation
- **Auto-timeout**: Automatically ends sessions after configured duration

## Quick Start

### Option 1: Docker Development (Recommended)

**Prerequisites:**

- Docker and Docker Compose
- OpenAI API key

```bash
# Clone repositories
git clone <web-service-repo-url>
git clone <agent-repo-url>

# Run automated setup
./docker-dev-setup.sh setup

# Start all services
./docker-dev-setup.sh start

# Configure interview prompt
# Visit http://localhost:3000/questionnaire-prompt-builder

# Join interview
# Visit http://localhost:3000/call
```

### Option 2: Local Development

**Prerequisites:**

- **Node.js** ≥ 18.x (tested on 20 LTS)
- **LiveKit** credentials (Cloud or self-hosted)
- **OpenAI API key** with Realtime access
- **npm** package manager

**Set Up Web Service:**

```bash
cd interview-next-service
npm install
npm run test:install
cp env.example .env.local
# Edit .env.local with your LiveKit credentials
```

**Set Up Agent:**

```bash
cd interview-strella-agent
npm install
npm run test:install
cp env.example .env
# Edit .env with your credentials
```

**Run Complete System:**

**Terminal 1 - Start Web Service:**

```bash
cd interview-next-service
npm run dev
```

**Terminal 2 - Start Agent:**

```bash
cd interview-strella-agent
npm run dev demo-room
```

**Browser - Join Interview:**

1. Navigate to http://localhost:3000/questionnaire-prompt-builder
2. Enter your interview instructions
3. Click "Save Changes"
4. Navigate to http://localhost:3000/call
5. Enter room name: "demo-room"
6. Click "Connect to Room"
7. Allow microphone permissions

## Complete Runbook

### Step-by-Step Interview Session

1. **Start Web Service**:

   ```bash
   cd interview-next-service
   npm run dev
   ```

2. **Configure Interview Prompt**:
   - Open http://localhost:3000/questionnaire-prompt-builder
   - Enter interview instructions (e.g., "Ask about their experience with
     React")
   - Click "Save Changes" (should see success toast)

3. **Start AI Agent**:

   ```bash
   cd interview-strella-agent
   npm run dev demo-room
   ```

4. **Join Interview Room**:
   - Open http://localhost:3000/call
   - Enter room name: "demo-room"
   - Enter your identity: "interviewer"
   - Click "Connect to Room"
   - Allow microphone permissions

5. **Conduct Interview**:
   - Agent automatically joins and fetches your prompt
   - Agent starts with: "Hello! Are you ready to get started?"
   - Use mute/unmute controls as needed
   - Agent auto-stops after configured timeout

## Environment Variables

### Web Service (`interview-next-service/.env.local`)

```bash
# LiveKit Configuration
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-server.com
LIVEKIT_URL=wss://your-livekit-server.com
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret

# OpenAI (for agent integration)
OPENAI_API_KEY=your-openai-api-key
```

### Agent (`interview-strella-agent/.env`)

```bash
# LiveKit Configuration
LIVEKIT_URL=wss://your-livekit-server.com
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
OPENAI_VOICE=alloy
OPENAI_TEMPERATURE=0.7

# Server Configuration
SERVER_ORIGIN=http://localhost:3000
MAX_SESSION_SECONDS=300

# Logging
LOG_LEVEL=info
API_TIMEOUT_MS=10000
```

## Docker Development

For a complete containerized development environment, see
[DOCKER-DEVELOPMENT.md](./DOCKER-DEVELOPMENT.md).

### Quick Docker Setup

```bash
# Automated setup
./docker-dev-setup.sh setup

# Start all services
./docker-dev-setup.sh start

# View logs
./docker-dev-setup.sh logs

# Stop services
./docker-dev-setup.sh stop
```

### Available Services

| Service        | URL                                                | Description               |
| -------------- | -------------------------------------------------- | ------------------------- |
| Web Service    | http://localhost:3000                              | Next.js application       |
| Prompt Builder | http://localhost:3000/questionnaire-prompt-builder | Interview prompt editor   |
| Call Interface | http://localhost:3000/call                         | LiveKit room interface    |
| LiveKit Server | wss://localhost:7880                               | WebRTC signaling server   |
| Redis          | localhost:6379                                     | Caching and rate limiting |

## Testing

### Web Service Tests

```bash
cd interview-next-service
npm test                    # Run Playwright tests
npm run lint               # Run ESLint
npm run type-check         # Run TypeScript checks
```

### Agent Tests

```bash
cd interview-strella-agent
npm test                    # Run Playwright tests
npm run lint               # Run ESLint
npm run type-check         # Run TypeScript checks
```

### Docker Tests

```bash
# Test web service
cd interview-next-service
npm run docker:dev
npm test

# Test agent
cd interview-strella-agent
npm run docker:dev
npm test
```

## Troubleshooting

### Common Issues

1. **Agent can't fetch prompt**:
   - Ensure web service is running on port 3000
   - Check `SERVER_ORIGIN` in agent's `.env`
   - Verify API endpoint returns valid JSON

2. **No audio in browser**:
   - Check microphone permissions
   - Ensure HTTPS in production
   - Try refreshing the page

3. **Connection failed**:
   - Verify LiveKit credentials are correct
   - Check room names match exactly
   - Ensure WebSocket connections aren't blocked

4. **Agent doesn't speak**:
   - Check OpenAI API key has Realtime access
   - Verify voice model is supported
   - Check temperature setting (0-2 range)

### Debug Mode

Enable debug logging in the agent:

```bash
LOG_LEVEL=debug npm run dev demo-room
```

## Development

### Project Structure

```
interview-next-service/
├── src/
│   ├── app/
│   │   ├── api/                    # REST API endpoints
│   │   ├── call/page.tsx           # Interview call interface
│   │   └── questionnaire-prompt-builder/page.tsx
│   ├── components/ui/              # shadcn/ui components
│   └── lib/                        # Utilities and stores
├── tests/                          # Playwright tests
└── playwright.config.ts

interview-strella-agent/
├── src/
│   ├── interview-agent.ts          # Main CLI entry point
│   └── lib/                        # Helper modules
├── tests/                          # Playwright tests
└── playwright.config.ts
```

### CI/CD

Both repositories include GitHub Actions workflows for:

- Automated testing with Playwright
- Linting and type checking
- Build verification

## Production Deployment

### Web Service

1. Set up environment variables
2. Configure HTTPS (required for microphone access)
3. Update CORS settings for your domain
4. Consider using a database instead of filesystem storage

### Agent

1. Set up proper environment variables
2. Use a process manager (PM2, systemd, etc.)
3. Set up logging and monitoring
4. Configure proper error handling and retries

## Features

### Web Service Features

- ✅ Prompt builder with real-time saving
- ✅ LiveKit room connection with audio controls
- ✅ RESTful API endpoints
- ✅ Modern UI with Tailwind CSS 4
- ✅ Toast notifications for user feedback
- ✅ Playwright end-to-end tests

### Agent Features

- ✅ Dynamic prompt fetching from web service
- ✅ LiveKit room connection and participant waiting
- ✅ OpenAI Realtime voice integration
- ✅ Auto-timeout and graceful shutdown
- ✅ Comprehensive error handling and retries
- ✅ Detailed logging with emojis
- ✅ Configuration validation with Zod

## Acceptance Criteria

All acceptance criteria from the implementation plan have been met:

- ✅ **Agent**: Waits for first participant → fetches prompt → starts OpenAI
  Realtime with voice → greets exact line → stops after timeout
- ✅ **Web**: Prompt builder saves; API returns { prompt }; call page connects
  and audio is enabled; token route functional
- ✅ **Tests/CI**: Playwright smoke tests green; CI passes on both repos
- ✅ **Reviewability**: Concise comments near non-obvious behaviors (participant
  wait, startAudio, token grants)

## License

This project is licensed under the Apache 2.0 License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

Good luck! 🚀
