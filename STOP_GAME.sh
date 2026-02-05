#!/bin/bash

# Street Pixel Wars - Stop Script
echo "🛑 Stopping Street Pixel Wars..."

# Kill processes by PID files
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    kill $BACKEND_PID 2>/dev/null
    rm -f .backend.pid
    echo "✓ Backend stopped"
fi

if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    kill $FRONTEND_PID 2>/dev/null
    rm -f .frontend.pid
    echo "✓ Frontend stopped"
fi

# Also kill any remaining node processes on ports 3000 and 3001
pkill -f "node.*backend" 2>/dev/null
pkill -f "react-scripts start" 2>/dev/null

echo "✓ All servers stopped"
