#!/bin/bash

# Multi-Disease Platform Development Script
echo "🚀 Starting Multi-Disease Platform in Development Mode..."

# Check if .env file exists
if [ ! -f "packages/backend/.env" ]; then
    echo "❌ Backend .env file not found. Please run './scripts/setup.sh' first."
    exit 1
fi

# Start database services if not running
echo "🐳 Checking database services..."
if ! docker-compose ps postgres | grep -q "Up"; then
    echo "📦 Starting database services..."
    docker-compose up -d postgres redis
    echo "⏳ Waiting for database to be ready..."
    sleep 5
fi

# Check database connection
echo "🔍 Checking database connection..."
cd packages/backend
if ! npx prisma db push --accept-data-loss; then
    echo "❌ Database connection failed. Please check your configuration."
    exit 1
fi

# Generate Prisma client if needed
npx prisma generate

cd ../..

# Start development servers
echo "🏃 Starting development servers..."
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:5000"
echo "📚 API Docs: http://localhost:5000/docs"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Use concurrently to run both servers
npm run dev 