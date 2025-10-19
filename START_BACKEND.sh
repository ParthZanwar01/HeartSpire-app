#!/bin/bash

# Simple script to start your backend locally
# Run this in your terminal!

echo ""
echo "════════════════════════════════════════════════════════"
echo "        🚀 Starting VitaMom Backend Locally"
echo "════════════════════════════════════════════════════════"
echo ""

# Navigate to backend directory
cd "$(dirname "$0")/python-free-implementation"

# Activate virtual environment
echo "📦 Activating virtual environment..."
source venv/bin/activate

# Install dependencies if needed
echo "📥 Checking dependencies..."
pip install flask flask-cors pillow requests --quiet 2>&1 | grep -v "already satisfied" || echo "✅ Dependencies ready"

# Get your Mac's IP address
echo ""
echo "🔍 Finding your Mac's IP address..."
MY_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')

echo ""
echo "════════════════════════════════════════════════════════"
echo "✅ Backend Starting!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "📍 Your Mac's IP: $MY_IP"
echo "🌐 Backend URL: http://$MY_IP:5000"
echo ""
echo "🔧 UPDATE YOUR APP:"
echo "   Edit: components/ScanIngredients.tsx"
echo "   Line 31: const BACKEND_URL = 'http://$MY_IP:5000';"
echo ""
echo "📱 ON YOUR iPHONE:"
echo "   1. Make sure iPhone is on same WiFi as Mac"
echo "   2. Run: npm start (in another terminal)"
echo "   3. Scan QR code in Expo Go"
echo "   4. Go to Scan tab"
echo "   5. Take vitamin photo"
echo "   6. See AI results!"
echo ""
echo "════════════════════════════════════════════════════════"
echo "🎯 Server starting... (keep this terminal open!)"
echo "════════════════════════════════════════════════════════"
echo ""

# Start server
python production_server.py

