# Interview System - Next.js Service

A comprehensive interview system built with Next.js, LiveKit, and OpenAI Realtime API.

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+
- OpenAI API Key

### Environment Setup

1. **Copy environment template:**

   ```bash
   cp .env.example .env.local
   ```

2. **Set your OpenAI API key:**
   ```bash
   echo "OPENAI_API_KEY=your-api-key-here" >> .env.local
   ```

### Running the System

**Start all services:**

```bash
docker-compose up -d
```

**Services:**

- **Web Service**: http://localhost:3000
- **LiveKit Server**: ws://localhost:7880
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **Agent Service**: Running in background

## 🎯 Features

### Web Service

- **Prompt Builder**: Create and save interview prompts
- **Live Call Interface**: Join LiveKit rooms with audio
- **Microphone Permission Handling**: Comprehensive permission management
- **Real-time Participants**: See who's in the room
- **Responsive UI**: Built with Tailwind CSS 4 and shadcn/ui

### Agent Service

- **OpenAI Realtime Integration**: Voice-powered AI interviewer
- **LiveKit Participant Detection**: Waits for users to join
- **Prompt-based Interviews**: Uses saved prompts for conversations
- **Graceful Shutdown**: Proper cleanup and timeout handling

## 🧪 Testing

### Manual Testing

1. **Start the system**: `docker-compose up -d`
2. **Open**: http://localhost:3000/call
3. **Enter room**: `demo-room`
4. **Connect**: Click "Connect to Room"
5. **Agent**: Will automatically detect and start interview

### Automated Testing

```bash
npm test
```

## 🔧 Development

### Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   │   ├── livekit/      # LiveKit token generation
│   │   └── questionnaire/ # Prompt management
│   ├── call/             # Live call interface
│   └── questionnaire-prompt-builder/ # Prompt creation
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utility functions
└── middleware.ts         # Security headers & CSP
```

### Key Components

**LiveKit Integration:**

- Token generation with proper API keys
- WebSocket connection handling
- Audio track management
- Participant tracking

**Microphone Permissions:**

- Permission state checking
- User-friendly prompts
- Graceful fallbacks
- Browser compatibility

**Security:**

- Content Security Policy (CSP)
- Permissions Policy
- CORS handling
- Request validation

## 🐳 Docker Services

### Web Service

- **Port**: 3000
- **Environment**: Development mode with hot reload
- **Dependencies**: PostgreSQL, Redis

### LiveKit Server

- **Port**: 7880 (HTTP/WebSocket)
- **Configuration**: Development mode with `devkey: secret`
- **Features**: Room management, participant tracking

### Agent Service

- **Command**: `npx tsx src/interview-agent.ts demo-room interviewer-001`
- **Integration**: OpenAI Realtime API
- **Dependencies**: LiveKit, Web Service

## 🔍 Troubleshooting

### Common Issues

**Connection Failed:**

- Check if all services are running: `docker-compose ps`
- Verify LiveKit server logs: `docker-compose logs livekit`
- Ensure microphone permissions are granted

**API Key Errors:**

- Verify environment variables in docker-compose.yml
- Check LiveKit server configuration in livekit.yaml
- Ensure web service has correct API keys

**CSP Blocking:**

- Check middleware.ts for correct CSP configuration
- Verify ws:// and wss:// are allowed in connect-src

### Logs

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs web
docker-compose logs livekit
docker-compose logs agent
```

## 📚 API Reference

### LiveKit Token Generation

```http
POST /api/livekit/token
Content-Type: application/json

{
  "roomName": "demo-room",
  "identity": "user-123"
}
```

### Prompt Management

```http
GET /api/questionnaire-prompt-builder
POST /api/questionnaire-prompt-builder
```

## 🚀 Production Deployment

For production deployment:

1. Update environment variables
2. Configure proper SSL certificates
3. Set up reverse proxy (nginx)
4. Configure database backups
5. Set up monitoring and logging

## 📄 License

MIT License - see LICENSE file for details.
