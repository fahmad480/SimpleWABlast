#!/bin/bash

# WhatsApp Blast Docker Deployment Script

echo "🚀 WhatsApp Blast Docker Deployment"
echo "=================================="

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo "❌ Docker is not running. Please start Docker first."
        exit 1
    fi
    echo "✅ Docker is running"
}

# Function to build and run with docker-compose
deploy_with_compose() {
    echo "📦 Building and starting with docker-compose..."
    docker-compose down 2>/dev/null
    docker-compose build
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        echo "✅ Application deployed successfully!"
        echo "🌐 Access: http://localhost:3000"
        echo "📊 Logs: docker-compose logs -f whatsapp-blast"
    else
        echo "❌ Deployment failed!"
        exit 1
    fi
}

# Function to build and run with Docker only
deploy_with_docker() {
    echo "📦 Building Docker image..."
    docker build -t whatsapp-blast .
    
    if [ $? -eq 0 ]; then
        echo "✅ Image built successfully!"
        
        # Stop existing container if running
        docker stop wa-blast-container 2>/dev/null
        docker rm wa-blast-container 2>/dev/null
        
        echo "🚀 Starting container..."
        docker run -d \
            --name wa-blast-container \
            -p 3000:3000 \
            -v "$(pwd)/auth_info_baileys:/app/auth_info_baileys" \
            whatsapp-blast
        
        if [ $? -eq 0 ]; then
            echo "✅ Container started successfully!"
            echo "🌐 Access: http://localhost:3000"
            echo "📊 Logs: docker logs -f wa-blast-container"
        else
            echo "❌ Failed to start container!"
            exit 1
        fi
    else
        echo "❌ Failed to build image!"
        exit 1
    fi
}

# Function to show logs
show_logs() {
    echo "📊 Showing application logs..."
    if [ -f "docker-compose.yml" ]; then
        docker-compose logs -f whatsapp-blast
    else
        docker logs -f wa-blast-container
    fi
}

# Function to stop application
stop_app() {
    echo "🛑 Stopping application..."
    if [ -f "docker-compose.yml" ]; then
        docker-compose down
    else
        docker stop wa-blast-container
        docker rm wa-blast-container
    fi
    echo "✅ Application stopped!"
}

# Main menu
case "$1" in
    "compose")
        check_docker
        deploy_with_compose
        ;;
    "docker")
        check_docker
        deploy_with_docker
        ;;
    "logs")
        show_logs
        ;;
    "stop")
        stop_app
        ;;
    *)
        echo "Usage: $0 {compose|docker|logs|stop}"
        echo ""
        echo "Commands:"
        echo "  compose  - Deploy using docker-compose (recommended)"
        echo "  docker   - Deploy using Docker only"
        echo "  logs     - Show application logs"
        echo "  stop     - Stop the application"
        echo ""
        echo "Examples:"
        echo "  $0 compose    # Deploy with docker-compose"
        echo "  $0 logs       # View logs"
        echo "  $0 stop       # Stop application"
        exit 1
        ;;
esac
