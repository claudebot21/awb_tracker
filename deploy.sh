#!/bin/bash

# AWB Tracker Production Deployment Script
# Usage: ./deploy.sh [environment]
# Environments: local (default), production

set -e

ENV=${1:-local}
COMPOSE_FILE="docker-compose.yml"

if [ "$ENV" == "production" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
    echo "🚀 Deploying to PRODUCTION environment..."
else
    echo "🔧 Deploying to LOCAL environment..."
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your configuration before continuing."
    exit 1
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f $COMPOSE_FILE down --remove-orphans

# Build and start containers
echo "🏗️  Building and starting containers..."
docker-compose -f $COMPOSE_FILE up -d --build

# Wait for database to be ready
echo "⏳ Waiting for database..."
sleep 10

# Run migrations
echo "🗃️  Running migrations..."
docker-compose -f $COMPOSE_FILE exec -T app php artisan migrate --force

# Clear and cache config
echo "⚡ Optimizing application..."
docker-compose -f $COMPOSE_FILE exec -T app php artisan config:cache
docker-compose -f $COMPOSE_FILE exec -T app php artisan route:cache
docker-compose -f $COMPOSE_FILE exec -T app php artisan view:cache

# Seed database if in local mode
if [ "$ENV" == "local" ]; then
    echo "🌱 Seeding database..."
    docker-compose -f $COMPOSE_FILE exec -T app php artisan db:seed --force
fi

echo "✅ Deployment complete!"
echo ""
echo "📊 Check status with: docker-compose -f $COMPOSE_FILE ps"
echo "📜 View logs with: docker-compose -f $COMPOSE_FILE logs -f"
echo ""

if [ "$ENV" == "local" ]; then
    echo "🌐 Application available at: http://localhost:8000"
    echo "   Default login: test@example.com / password123"
else
    echo "🌐 Application available at your configured domain"
fi
