# Room-Questionnaire System

## Overview

The Interview Strella system has been redesigned to use a database-driven
room-questionnaire association system instead of environment-based room
configuration. This allows for:

- **Dynamic Room Creation**: Rooms are created automatically when users connect
- **Room-Specific Questionnaires**: Each room can have its own custom
  questionnaire
- **Scalable Architecture**: No need to restart agents or modify environment
  variables
- **Database Management**: All room and questionnaire data is stored in
  PostgreSQL

## Architecture

### Database Schema

```sql
-- Questionnaires store the interview instructions and questions
CREATE TABLE questionnaires (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  instructions TEXT NOT NULL,
  startMessage TEXT,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

-- Questions belong to questionnaires
CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  questionnaireId TEXT REFERENCES questionnaires(id) ON DELETE CASCADE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

-- Rooms can have associated questionnaires
CREATE TABLE rooms (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  questionnaireId TEXT REFERENCES questionnaires(id),
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints

#### Get Room Information

```
GET /api/rooms/{roomName}
```

Returns room details and associated questionnaire. Creates the room if it
doesn't exist.

#### Assign Questionnaire to Room

```
POST /api/rooms/{roomName}
{
  "questionnaireId": "questionnaire-id"
}
```

#### Create Questionnaire

```
POST /api/questionnaires
{
  "title": "Interview Title",
  "instructions": "Interview instructions...",
  "startMessage": "Hello!",
  "questions": [
    {"text": "Question 1", "order": 0},
    {"text": "Question 2", "order": 1}
  ]
}
```

#### List Questionnaires

```
GET /api/questionnaires
```

## Agent Behavior

### Dynamic Room Joining

1. **Agent Startup**: Agent starts without specifying a room name
2. **User Connection**: When a user connects to any room, the agent
   automatically joins
3. **Questionnaire Fetching**: Agent fetches room-specific questionnaire from
   API
4. **Fallback**: If no questionnaire is assigned, uses default instructions

### Flow Example

1. User connects to room "technical-interview"
2. Agent automatically joins "technical-interview" room
3. Agent calls `GET /api/rooms/technical-interview`
4. If questionnaire exists, agent uses it; otherwise uses default
5. Agent conducts interview according to the questionnaire

## Setup Instructions

### 1. Database Migration

```bash
cd interview-next-service
npm run db:migrate-rooms
```

This creates:

- Default questionnaire and "demo-room"
- Example questionnaires for "technical-interview" and "behavioral-interview"

### 2. Start the Services

```bash
# Terminal 1: Start Next.js API
cd interview-next-service
npm run dev

# Terminal 2: Start Agent
cd interview-strella-agent
./start-agent.sh
```

### 3. Test the System

1. Go to `http://localhost:3000/call`
2. Enter room name: "technical-interview"
3. Join the room
4. Agent should join automatically and use the technical interview questionnaire

## Room Management

### Creating New Rooms

Rooms are created automatically when users connect to them. To assign a specific
questionnaire:

```bash
curl -X POST http://localhost:3000/api/rooms/my-new-room \
  -H "Content-Type: application/json" \
  -d '{"questionnaireId": "questionnaire-id"}'
```

### Creating Questionnaires

```bash
curl -X POST http://localhost:3000/api/questionnaires \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Sales Interview",
    "instructions": "You are conducting a sales interview...",
    "questions": [
      {"text": "Tell me about your sales experience", "order": 0},
      {"text": "How do you handle objections?", "order": 1}
    ]
  }'
```

## Default Rooms

The system comes with these pre-configured rooms:

- **demo-room**: General interview with basic questions
- **technical-interview**: Focused on technical skills and coding
- **behavioral-interview**: Focused on past experiences and soft skills

## Benefits

### For Developers

- No need to restart agents when adding new rooms
- Centralized questionnaire management
- Easy to add new room types
- Database-driven configuration

### For Users

- Consistent interview experience per room type
- Room-specific instructions and questions
- Automatic agent availability

### For Operations

- Scalable room management
- Easy questionnaire updates
- Room usage analytics possible
- Centralized configuration

## Migration from File-Based System

The migration script automatically:

1. Reads existing questionnaire.json file
2. Creates database questionnaire
3. Assigns to "demo-room"
4. Creates example rooms
5. Preserves backward compatibility

## Troubleshooting

### Agent Not Joining Rooms

- Check that Next.js API is running
- Verify LiveKit credentials
- Check agent logs for connection errors

### No Questionnaire in Room

- Verify room exists in database
- Check if questionnaire is assigned to room
- Agent will use default instructions if no questionnaire

### API Errors

- Check database connection
- Verify Prisma schema is up to date
- Run `npm run db:push` if needed
