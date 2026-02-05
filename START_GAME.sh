#!/bin/bash

# Street Pixel Wars - Easy Start Script
# This script will start both backend and frontend servers

echo "🎮 Starting Street Pixel Wars..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if in correct directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo -e "${RED}Error: Must run this script from the ft_transcendence directory${NC}"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for Node.js
if ! command_exists node; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Install Node.js from https://nodejs.org/"
    exit 1
fi

# Check for npm
if ! command_exists npm; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Node.js found: $(node --version)"
echo -e "${GREEN}✓${NC} npm found: $(npm --version)"
echo ""

# Install backend dependencies if needed
if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
    cd backend
    npm install
    cd ..
fi

# Install frontend dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
    cd frontend
    npm install
    cd ..
fi

# Run migrations if database doesn't exist
if [ ! -f "backend/db/data.sqlite3" ]; then
    echo -e "${YELLOW}🗄️  Setting up database...${NC}"
    cd backend
    mkdir -p db
    npm run migrate
    npm run seed
    cd ..
    echo -e "${GREEN}✓${NC} Database setup complete"
    echo ""
fi

# Get local IP address
echo -e "${GREEN}🌐 Your IP Addresses:${NC}"
if command_exists hostname; then
    echo "Local IP: $(hostname -I | awk '{print $1}')"
fi
echo "Localhost: http://localhost:3001"
echo ""

# Start backend in background
echo -e "${YELLOW}🚀 Starting backend server...${NC}"
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Check if backend started successfully
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✓${NC} Backend running (PID: $BACKEND_PID)"
else
    echo -e "${RED}✗${NC} Backend failed to start. Check backend.log"
    exit 1
fi

# Start frontend in background
echo -e "${YELLOW}🎨 Starting frontend server...${NC}"
cd frontend
npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
sleep 5

# Check if frontend started
if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}✓${NC} Frontend running (PID: $FRONTEND_PID)"
else
    echo -e "${RED}✗${NC} Frontend failed to start. Check frontend.log"
    kill $BACKEND_PID
    exit 1
fi

echo ""
echo -e "${GREEN}🎮 Game is ready!${NC}"
echo ""
echo "Access the game at:"
echo "  - Your computer: http://localhost:3001"
echo "  - From friends: http://$(hostname -I | awk '{print $1}'):3001"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""
echo "Logs:"
echo "  - Backend: tail -f backend.log"
echo "  - Frontend: tail -f frontend.log"
echo ""

# Save PIDs for cleanup
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

# Wait for Ctrl+C
trap cleanup INT

cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping servers...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    rm -f .backend.pid .frontend.pid
    echo -e "${GREEN}✓${NC} Servers stopped"
    exit 0
}

# Keep script running
wait
