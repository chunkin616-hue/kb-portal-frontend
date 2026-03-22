#!/bin/bash

# KB Portal Deployment Script

set -e

echo "🚀 Deploying KB Portal..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "⚠️  PostgreSQL is not running. Starting PostgreSQL..."
    
    # Try to start PostgreSQL (adjust for your system)
    if command -v brew &> /dev/null; then
        brew services start postgresql
    elif command -v systemctl &> /dev/null; then
        sudo systemctl start postgresql
    else
        echo "❌ Cannot start PostgreSQL automatically. Please start it manually."
        exit 1
    fi
    
    # Wait for PostgreSQL to start
    sleep 5
fi

# Check if database exists
echo "🔍 Checking database..."
if ! psql -U kenchan -d kb_portal -c "SELECT 1" &> /dev/null; then
    echo "⚠️  Database 'kb_portal' does not exist. Creating..."
    createdb -U kenchan kb_portal
    echo "✅ Database created."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🏗️  Building application..."
npm run build

# Start the application
echo "🚀 Starting KB Portal..."
PORT=3003 npm start &

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Test the API
echo "🧪 Testing API..."
node test-api.js

echo ""
echo "✅ KB Portal is now running!"
echo "🌐 Frontend: http://localhost:3003"
echo "🔧 API Health: http://localhost:3003/api/health"
echo ""
echo "📝 Login credentials:"
echo "   Username: admin"
echo "   Password: afe2026"
echo ""
echo "🛑 To stop the server, press Ctrl+C"