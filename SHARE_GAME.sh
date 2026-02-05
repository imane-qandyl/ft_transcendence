#!/bin/bash

# Street Pixel Wars - Share with Friends
# This script shows you how friends can access your game

echo "🎮 Street Pixel Wars - Network Sharing"
echo "======================================"
echo ""

# Get local IP
LOCAL_IP=$(ip addr show | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}' | cut -d/ -f1 | head -1)

if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP=$(hostname -I | awk '{print $1}')
fi

# Check if servers are running
BACKEND_RUNNING=$(netstat -tlnp 2>/dev/null | grep ":3000" || ss -tlnp 2>/dev/null | grep ":3000")
FRONTEND_RUNNING=$(netstat -tlnp 2>/dev/null | grep ":3001" || ss -tlnp 2>/dev/null | grep ":3001")

if [ -z "$BACKEND_RUNNING" ] || [ -z "$FRONTEND_RUNNING" ]; then
    echo "⚠️  Game servers not running!"
    echo ""
    echo "Start the game first with:"
    echo "  ./START_GAME.sh"
    echo ""
    exit 1
fi

echo "✅ Game is running and accessible!"
echo ""
echo "📱 Share this URL with friends on your WiFi:"
echo ""
echo "   http://${LOCAL_IP}:3001"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Copy & paste this message to friends:"
echo ""
echo "┌────────────────────────────────────────┐"
echo "│                                        │"
echo "│  🎮 JOIN MY GAME!                      │"
echo "│                                        │"
echo "│  Game: Street Pixel Wars               │"
echo "│  Link: http://${LOCAL_IP}:3001    │"
echo "│                                        │"
echo "│  Instructions:                         │"
echo "│  1. Open the link above                │"
echo "│  2. Create an account                  │"
echo "│  3. Create a character                 │"
echo "│  4. Click PLAY to battle!              │"
echo "│                                        │"
echo "└────────────────────────────────────────┘"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Tips:"
echo ""
echo "  • Friends must be on the SAME WiFi as you"
echo "  • Make sure firewall allows ports 3000 and 3001"
echo "  • Your IP might change if you reconnect to WiFi"
echo ""
echo "🌐 For Internet access (friends on different WiFi):"
echo "   See: NETWORK_ACCESS.md (Port Forwarding or ngrok)"
echo ""
echo "🔧 Troubleshooting:"
echo ""
echo "  If friends can't connect:"
echo "  1. Check firewall: sudo ufw allow 3000 && sudo ufw allow 3001"
echo "  2. Verify IP hasn't changed: hostname -I"
echo "  3. Restart game: ./STOP_GAME.sh && ./START_GAME.sh"
echo ""

# Try to generate QR code if qrencode is installed
if command -v qrencode &> /dev/null; then
    echo "📱 QR Code (scan with phone):"
    echo ""
    qrencode -t ANSIUTF8 "http://${LOCAL_IP}:3001"
    echo ""
else
    echo "💡 Install qrencode to show QR code:"
    echo "   sudo apt install qrencode"
    echo ""
fi

echo "🎮 Happy gaming!"
