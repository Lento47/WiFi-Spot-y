#!/bin/bash

echo "🚀 Starting WiFi Costa Rica Wallet Pass Server..."
echo ""
echo "Prerequisites:"
echo "1. Node.js must be installed"
echo "2. Dependencies must be installed (run: npm install)"
echo "3. Apple certificates should be in certs/ folder"
echo ""
echo "Starting server on port 3001..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed!"
    echo "Please install Node.js 16+ and try again."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed!"
    echo "Please install npm and try again."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Error: Failed to install dependencies!"
        exit 1
    fi
fi

# Check if certificates directory exists
if [ ! -d "certs" ]; then
    echo "⚠️  Warning: certs/ directory not found!"
    echo "Apple Wallet functionality will not work without certificates."
    echo "Create certs/ directory and add your .p12 files."
fi

# Start the server
echo "✅ Starting server..."
npm start
