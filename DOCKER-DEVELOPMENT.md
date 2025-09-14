# Docker Development Guide

This guide explains how to use Docker for development of the Interview Strella
system.

## Quick Start

### 1. Prerequisites

- Docker and Docker Compose installed
- OpenAI API key
- Git

### 2. Setup Development Environment

```bash
# Clone the repositories
git clone <web-service-repo-url>
git clone <agent-repo-url>

# Run the setup script
./docker-dev-setup.sh setup
```

### 3. Configure Environment

Edit the environment files with your credentials:

```bash
# Update OpenAI API key in both files
vim interview-next-service/.env.local
vim interview-strella-agent/.env
```

### 4. Start Services

```bash
# Start all services
./docker-dev-setup.sh start

# Or start individually
cd interview-next-service && npm run docker:dev
cd interview-strella-agent && npm run docker:dev
```

## Available Services

| Service        | URL                                                | Description               |
| -------------- | -------------------------------------------------- | ------------------------- |
| Web Service    | http://localhost:3000                              | Next.js application       |
| Prompt Builder | http://localhost:3000/questionnaire-prompt-builder | Interview prompt editor   |
| Call Interface | http://localhost:3000/call                         | LiveKit room interface    |
| LiveKit Server | wss://localhost:7880                               | WebRTC signaling server   |
| Redis          | localhost:6379                                     | Caching and rate limiting |

## Docker Commands

### Web Service

```bash
cd interview-next-service

# Build image
npm run docker:build

# Run container
npm run docker:run

# Start with compose
npm run docker:dev

# View logs
npm run docker:logs

# Stop services
npm run docker:stop

# Clean up
npm run docker:clean
```

### Agent

```bash
cd interview-strella-agent

# Build image
npm run docker:build

# Run container
npm run docker:run

# Start with compose
npm run docker:dev

# View logs
npm run docker:logs

# Stop services
npm run docker:stop

# Clean up
npm run docker:clean
```

## Development Workflow

### 1. Start Web Service

```bash
cd interview-next-service
npm run docker:dev
```

### 2. Configure Interview Prompt

1. Visit http://localhost:3000/questionnaire-prompt-builder
2. Enter your interview instructions
3. Click "Save Changes"

### 3. Start Agent

```bash
cd interview-strella-agent
npm run docker:dev
```

### 4. Join Interview

1. Visit http://localhost:3000/call
2. Enter room name: "demo-room"
3. Click "Connect to Room"
4. Allow microphone permissions

## Docker Compose Services

### Web Service (`interview-next-service/docker-compose.yml`)

- **web**: Next.js application
- **livekit**: LiveKit server for WebRTC
- **redis**: Redis for caching
- **postgres**: PostgreSQL database (optional)

### Agent (`interview-strella-agent/docker-compose.yml`)

- **agent**: AI interview agent
- **web**: Next.js web service (from parent)
- **livekit**: LiveKit server
- **redis**: Redis for caching

## Environment Variables

### Web Service (.env.local)

```bash
# LiveKit Configuration
NEXT_PUBLIC_LIVEKIT_URL=wss://localhost:7880
LIVEKIT_URL=wss://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
```

### Agent (.env)

```bash
# LiveKit Configuration
LIVEKIT_URL=wss://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret

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

## Troubleshooting

### Common Issues

1. **Port conflicts**:

   ```bash
   # Check what's using the ports
   lsof -i :3000
   lsof -i :7880

   # Stop conflicting services
   docker-compose down
   ```

2. **Permission issues**:

   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   ```

3. **Environment variables not loaded**:

   ```bash
   # Check if .env files exist
   ls -la interview-next-service/.env.local
   ls -la interview-strella-agent/.env
   ```

4. **LiveKit connection issues**:

   ```bash
   # Check LiveKit server logs
   docker-compose logs livekit

   # Restart LiveKit
   docker-compose restart livekit
   ```

### Debug Mode

Enable debug logging:

```bash
# Set debug level in agent
echo "LOG_LEVEL=debug" >> interview-strella-agent/.env

# Restart agent
cd interview-strella-agent
docker-compose restart agent
```

### Health Checks

```bash
# Check service health
curl http://localhost:3000/api/health

# Check LiveKit server
curl http://localhost:7880/

# Check Redis
redis-cli -h localhost -p 6379 ping
```

## Production Deployment

### Build Production Images

```bash
# Web service
cd interview-next-service
docker build -t interview-next-service:prod .

# Agent
cd interview-strella-agent
docker build -t interview-strella-agent:prod .
```

### Production Environment

Update environment variables for production:

```bash
# Use production LiveKit URL
LIVEKIT_URL=wss://your-livekit-server.com

# Use production API keys
LIVEKIT_API_KEY=your-production-key
LIVEKIT_API_SECRET=your-production-secret

# Use production server
SERVER_ORIGIN=https://your-domain.com
```

## Advanced Usage

### Custom Docker Compose

Create custom compose files for different environments:

```bash
# Development
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Staging
docker-compose -f docker-compose.yml -f docker-compose.staging.yml up

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
```

### Volume Mounts

For development with hot reload:

```bash
# Mount source code
docker run -v $(pwd):/app -p 3000:3000 interview-next-service:dev
```

### Network Configuration

```bash
# Create custom network
docker network create interview-network

# Use custom network
docker run --network interview-network interview-next-service:dev
```

## Monitoring

### Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f web
docker-compose logs -f agent
docker-compose logs -f livekit
```

### Metrics

```bash
# Container stats
docker stats

# Service health
docker-compose ps
```

## Cleanup

### Remove Everything

```bash
# Stop and remove containers
docker-compose down -v

# Remove images
docker rmi interview-next-service:dev interview-strella-agent:dev

# Remove volumes
docker volume prune -f

# Remove networks
docker network prune -f
```

### Reset Development Environment

```bash
# Run cleanup script
./docker-dev-setup.sh clean

# Rebuild from scratch
./docker-dev-setup.sh setup
./docker-dev-setup.sh start
```

## Best Practices

1. **Always use .env files** for configuration
2. **Don't commit .env files** to version control
3. **Use multi-stage builds** for production images
4. **Run as non-root user** in containers
5. **Use health checks** for service monitoring
6. **Clean up resources** regularly
7. **Use specific image tags** instead of `latest`
8. **Mount volumes** for development hot reload
9. **Use Docker Compose** for multi-service applications
10. **Monitor resource usage** with `docker stats`
