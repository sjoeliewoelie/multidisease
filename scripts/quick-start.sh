#!/bin/bash

echo "🚀 Quick Start - Multi-Disease Platform"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Create basic structure if needed
mkdir -p logs
mkdir -p uploads

echo "📦 Installing minimal dependencies..."

# Go to backend directory
cd packages/backend

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Backend package.json not found!"
    exit 1
fi

# Install only essential dependencies for basic run
npm install express

echo "🚀 Starting Multi-Disease Platform API..."
echo ""
echo "📋 Available endpoints once started:"
echo "  - Health Check: http://localhost:5000/health"
echo "  - Documentation: http://localhost:5000/docs"
echo "  - API Info: http://localhost:5000/api/version"
echo "  - Organizations: http://localhost:5000/api/organizations"
echo "  - Service Desks: http://localhost:5000/api/organizations/service-desks"
echo "  - Diseases: http://localhost:5000/api/diseases"
echo "  - Treatments: http://localhost:5000/api/treatments"
echo "  - Questionnaires: http://localhost:5000/api/questionnaires"
echo "  - Measurement Groups: http://localhost:5000/api/measurement-groups"
echo "  - User Roles: http://localhost:5000/api/users/roles"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Run the JavaScript version (no TypeScript compilation needed)
node src/server.js 