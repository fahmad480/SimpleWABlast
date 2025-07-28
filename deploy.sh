#!/bin/bash

echo "🚀 WhatsApp Blast - Docker Deployment"
echo "===================================="

case "$1" in
    "build")
        echo "📦 Building Docker image..."
        docker compose build
        ;;
    "start")
        echo "� Starting application..."
        docker compose up -d
        echo "✅ Application started!"
        echo "🌐 Access: http://localhost:3000"
        ;;
    "stop")
        echo "🛑 Stopping application..."
        docker compose down
        echo "✅ Application stopped!"
        ;;
    "logs")
        echo "📊 Showing logs..."
        docker compose logs -f whatsapp-blast
        ;;
    *)
        echo "Usage: $0 {build|start|stop|logs}"
        echo ""
        echo "Commands:"
        echo "  build  - Build Docker image"
        echo "  start  - Start application"
        echo "  stop   - Stop application"
        echo "  logs   - Show application logs"
        echo ""
        echo "Examples:"
        echo "  $0 build     # Build image"
        echo "  $0 start     # Start app"
        echo "  $0 logs      # View logs"
        exit 1
        ;;
esac
