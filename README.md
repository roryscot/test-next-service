# Interview App (Next.js + LiveKit)

A Next.js application that allows interviewers to compose interview questions
and conduct AI-powered interviews via LiveKit audio calls.

## Features

- **Prompt Builder**: Create and edit interview instructions for the AI agent
- **Live Interview**: Join LiveKit rooms and conduct real-time audio interviews
- **AI Agent**: External CLI agent that fetches prompts and conducts interviews
  using OpenAI Realtime API

## Quick Start

### 1. Environment Setup

Copy `.env.local` and fill in your credentials:

```bash
# LiveKit Cloud or your self-hosted instance
LIVEKIT_URL="wss://<your-livekit-domain>"
LIVEKIT_API_KEY="lk_..."
LIVEKIT_API_SECRET="..."

# OpenAI (Agent only)
OPENAI_API_KEY="sk-..."
OPENAI_REALTIME_MODEL="gpt-4o-realtime-preview-2024-12-17"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Application

```bash
npm run dev
```

The app will be available at http://localhost:3000

### 4. Start an Interview

1. Visit `/questionnaire-prompt-builder` to create your interview instructions
2. Visit `/call` to join a LiveKit room
3. In another terminal, run the AI agent:

```bash
SERVER_ORIGIN=http://localhost:3000 \
LIVEKIT_URL=wss://<your-livekit-domain> \
LIVEKIT_API_KEY=lk_... \
LIVEKIT_API_SECRET=... \
OPENAI_API_KEY=sk-... \
npm run agent demo-room
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── questionnaire-prompt-builder/route.ts  # GET/POST prompt API
│   │   └── livekit/
│   │       ├── token/route.ts                      # LiveKit access tokens
│   │       └── url/route.ts                        # LiveKit WebSocket URL
│   ├── call/page.tsx                               # Interview call interface
│   ├── questionnaire-prompt-builder/page.tsx       # Prompt builder UI
│   ├── layout.tsx                                  # Root layout
│   └── page.tsx                                    # Home page with navigation
├── lib/
│   ├── prompt-store.ts                             # Filesystem prompt persistence
│   └── livekit.ts                                  # LiveKit token utilities
└── agents/
    └── interview-strella-agent.ts                  # External AI agent CLI
```

## API Endpoints

- `GET /api/questionnaire-prompt-builder` - Returns current prompt
- `POST /api/questionnaire-prompt-builder` - Saves new prompt
- `POST /api/livekit/token` - Issues LiveKit access tokens
- `GET /api/livekit/url` - Returns LiveKit WebSocket URL

## LiveKit Setup

1. Create a project at [LiveKit Cloud](https://cloud.livekit.io/) or set up
   self-hosted LiveKit
2. Copy your WebSocket URL, API key, and secret to `.env.local`
3. Ensure CORS/WebSocket ingress works from localhost:3000

## AI Agent

The external agent:

- Fetches prompts from `/api/questionnaire-prompt-builder`
- Connects to the same LiveKit room as the browser client
- Uses OpenAI Realtime API for voice interaction
- Starts conversations with "Hello! Are you ready to get started?"

## Development

- **Port**: 3000 (required for agent integration)
- **Styling**: Tailwind CSS 4 with dark theme
- **Persistence**: Filesystem-based prompt storage (easily swappable to
  database)
- **Error Handling**: Graceful fallbacks for connection issues

## Troubleshooting

- Ensure all environment variables are set correctly
- Check that LiveKit credentials are valid
- Verify OpenAI API key has access to Realtime models
- Make sure the agent can reach `http://localhost:3000`

Good luck! 🚀
