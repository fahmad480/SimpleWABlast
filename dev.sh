#!/bin/bash

echo "🚀 Starting WhatsApp Blast Development Server..."

# Stop any existing containers
echo "⏹️  Stopping existing containers..."
docker compose down
docker compose -f docker-compose.dev.yml down

# Build the image
echo "🏗️  Building Docker image..."
docker compose -f docker-compose.dev.yml build

# Start the development server
echo "▶️  Starting development server with hot reload..."
docker compose -f docker-compose.dev.yml up -d

echo "✅ Development server started!"
echo "📱 Access the app at: http://localhost:3000"
echo "📋 View logs with: npm run docker:logs:dev"
echo "⏹️  Stop with: npm run docker:stop:dev"
