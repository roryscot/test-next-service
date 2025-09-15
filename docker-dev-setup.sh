#!/bin/bash
# Docker Development Setup Script for Interview Strella System
# This script sets up the complete development environment with Docker

set -e

echo "🚀 Setting up Interview Strella Development Environment with Docker"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Set Docker Compose command
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE="docker compose"
fi

print_status "Using Docker Compose command: $DOCKER_COMPOSE"

# Create environment files if they don't exist
create_env_files() {
    print_status "Creating environment files..."
    
    # Web service .env.local
    if [ ! -f "interview-next-service/.env.local" ]; then
        cat > interview-next-service/.env.local << EOF
# LiveKit Configuration
NEXT_PUBLIC_LIVEKIT_URL=wss://localhost:7880
LIVEKIT_URL=wss://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here
EOF
        print_success "Created interview-next-service/.env.local"
    else
        print_warning "interview-next-service/.env.local already exists"
    fi
    
    # Agent .env
    if [ ! -f "interview-strella-agent/.env" ]; then
        cat > interview-strella-agent/.env << EOF
# LiveKit Configuration
LIVEKIT_URL=wss://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_VOICE=alloy
OPENAI_TEMPERATURE=0.7

# Server Configuration
SERVER_ORIGIN=http://localhost:3000
MAX_SESSION_SECONDS=300

# Logging
LOG_LEVEL=info
API_TIMEOUT_MS=10000
EOF
        print_success "Created interview-strella-agent/.env"
    else
        print_warning "interview-strella-agent/.env already exists"
    fi
}

# Build Docker images
build_images() {
    print_status "Building Docker images..."
    
    # Build web service
    print_status "Building web service image..."
    cd interview-next-service
    docker build -t interview-next-service:dev .
    cd ..
    
    # Build agent
    print_status "Building agent image..."
    cd interview-strella-agent
    docker build -t interview-strella-agent:dev .
    cd ..
    
    print_success "All images built successfully"
}

# Start services
start_services() {
    print_status "Starting services..."
    
    # Start web service and dependencies
    cd interview-next-service
    $DOCKER_COMPOSE up -d livekit redis
    print_status "Waiting for LiveKit to be ready..."
    sleep 10
    $DOCKER_COMPOSE up -d web
    cd ..
    
    print_success "Web service started at http://localhost:3000"
    print_success "LiveKit server started at wss://localhost:7880"
    print_success "Redis started at localhost:6379"
}

# Show status
show_status() {
    print_status "Service Status:"
    echo ""
    
    # Web service status
    cd interview-next-service
    $DOCKER_COMPOSE ps
    cd ..
    
    echo ""
    print_status "Available Services:"
    echo "  🌐 Web Service: http://localhost:3000"
    echo "  📋 Prompt Builder: http://localhost:3000/questionnaire-prompt-builder"
    echo "  📞 Call Interface: http://localhost:3000/call"
    echo "  🔗 LiveKit Server: wss://localhost:7880"
    echo "  📊 Redis: localhost:6379"
    echo ""
    print_status "Next Steps:"
    echo "  1. Update OpenAI API key in environment files"
    echo "  2. Visit http://localhost:3000/questionnaire-prompt-builder to set up prompts"
    echo "  3. Visit http://localhost:3000/call to join a room"
    echo "  4. Start the agent: cd interview-strella-agent && docker-compose up agent"
}

# Stop services
stop_services() {
    print_status "Stopping services..."
    
    cd interview-next-service
    $DOCKER_COMPOSE down
    cd ..
    
    cd interview-strella-agent
    $DOCKER_COMPOSE down
    cd ..
    
    print_success "All services stopped"
}

# Clean up
cleanup() {
    print_status "Cleaning up Docker resources..."
    
    # Stop and remove containers
    stop_services
    
    # Remove images
    docker rmi interview-next-service:dev interview-strella-agent:dev 2>/dev/null || true
    
    # Remove volumes
    docker volume prune -f
    
    print_success "Cleanup completed"
}

# Show help
show_help() {
    echo "Interview Strella Docker Development Setup"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  setup     Create environment files and build images"
    echo "  start     Start all services"
    echo "  stop      Stop all services"
    echo "  status    Show service status"
    echo "  logs      Show service logs"
    echo "  clean     Clean up Docker resources"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 setup    # Initial setup"
    echo "  $0 start    # Start services"
    echo "  $0 logs     # View logs"
}

# Show logs
show_logs() {
    print_status "Showing service logs..."
    
    cd interview-next-service
    $DOCKER_COMPOSE logs -f
}

# Main script logic
case "${1:-help}" in
    setup)
        create_env_files
        build_images
        print_success "Setup completed! Run '$0 start' to start services."
        ;;
    start)
        start_services
        show_status
        ;;
    stop)
        stop_services
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    clean)
        cleanup
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
