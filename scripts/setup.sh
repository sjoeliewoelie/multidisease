#!/bin/bash

# Multi-Disease Platform Setup Script
echo "🏥 Setting up Multi-Disease Treatment Monitoring Platform..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

echo "✅ Docker version: $(docker --version)"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker Compose version: $(docker-compose --version)"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd packages/backend
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

cd ../..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd packages/frontend
npm install

cd ../..

# Create environment files
echo "🔧 Setting up environment files..."

# Backend environment
if [ ! -f "packages/backend/.env" ]; then
    cp packages/backend/.env.example packages/backend/.env
    echo "✅ Created packages/backend/.env"
    echo "⚠️  Please update the environment variables in packages/backend/.env"
else
    echo "⚠️  packages/backend/.env already exists"
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p uploads
mkdir -p docker/nginx/ssl
mkdir -p docker/prometheus
mkdir -p docker/grafana/provisioning

# Set up database with Docker Compose
echo "🐳 Starting database services..."
docker-compose up -d postgres redis

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run database migrations
echo "🔧 Running database migrations..."
cd packages/backend
npx prisma migrate dev --name init
npx prisma db seed

cd ../..

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update environment variables in packages/backend/.env"
echo "2. Start development servers: npm run dev"
echo "3. Access the application:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:5000"
echo "   - API Documentation: http://localhost:5000/docs"
echo "   - Database: localhost:5432"
echo ""
echo "🐳 For production deployment:"
echo "   docker-compose up -d"
echo ""
echo "📚 For more information, check the README.md file" 