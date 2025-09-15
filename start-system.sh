#!/bin/bash

# Complete Interview System Startup Script
# This script starts all services using docker-compose

set -e

echo "🚀 Starting Complete Interview System..."
echo "========================================"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from example..."
    cat > .env << EOF
# Environment Variables for Complete Interview System
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_REALTIME_MODEL=gpt-4o-realtime-preview-2024-12-17
OPENAI_VOICE=alloy
OPENAI_TEMPERATURE=0.7
MAX_SESSION_SECONDS=300
LOG_LEVEL=info
NODE_ENV=development
EOF
    echo "📝 Please edit .env file with your actual OpenAI API key"
    echo "   You can get it from: https://platform.openai.com/api-keys"
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down --remove-orphans

# Clean up any orphaned volumes (optional)
echo "🧹 Cleaning up orphaned volumes..."
docker volume prune -f

# Start all services
echo "🏗️  Building and starting all services..."
docker-compose up --build -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🔍 Checking service health..."

# Check PostgreSQL
if docker-compose exec -T postgres pg_isready -U strella -d strella_interview > /dev/null 2>&1; then
    echo "✅ PostgreSQL: Ready"
else
    echo "❌ PostgreSQL: Not ready"
fi

# Check Redis
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis: Ready"
else
    echo "❌ Redis: Not ready"
fi

# Check LiveKit
if curl -s http://localhost:7880/ > /dev/null 2>&1; then
    echo "✅ LiveKit: Ready"
else
    echo "❌ LiveKit: Not ready"
fi

# Check Web Service
if curl -s http://localhost:3000/ > /dev/null 2>&1; then
    echo "✅ Web Service: Ready"
else
    echo "❌ Web Service: Not ready"
fi

echo ""
echo "🎉 Interview System is starting up!"
echo "=================================="
echo ""
echo "📱 Web Interface: http://localhost:3000"
echo "🎤 Call Page: http://localhost:3000/call"
echo "📝 Prompt Builder: http://localhost:3000/questionnaire-prompt-builder"
echo ""
echo "🔧 Services:"
echo "   - PostgreSQL: localhost:5432"
echo "   - Redis: localhost:6379"
echo "   - LiveKit: localhost:7880"
echo "   - Web Service: localhost:3000"
echo ""
echo "📊 To view logs: docker-compose logs -f [service-name]"
echo "🛑 To stop: docker-compose down"
echo ""
echo "🤖 The AI agent will start automatically and wait for participants"
echo "   in the 'demo-room' room."
echo ""

# Show logs for a few seconds
echo "📋 Recent logs:"
docker-compose logs --tail=20
