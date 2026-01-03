#!/bin/bash

# Start AfroMoji Backend and Frontend
# This script starts both servers for development

echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║                                                                       ║"
echo "║              🚀 Starting AfroMoji - Full Stack 🚀                     ║"
echo "║                                                                       ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if in correct directory
if [ ! -d "afro-api" ] || [ ! -d "afro-web" ]; then
    echo "❌ Error: Must run from project root directory"
    echo "Expected directories: afro-api/ and afro-web/"
    exit 1
fi

# Check if ports are available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use"
        echo "   Kill process: lsof -ti:$1 | xargs kill -9"
        return 1
    fi
    return 0
}

echo "Checking ports..."
check_port 3001 || exit 1
check_port 3000 || exit 1
echo "✅ Ports available"
echo ""

# Start backend
echo "${BLUE}Starting Backend (Port 3001)...${NC}"
cd afro-api

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "${YELLOW}Installing backend dependencies...${NC}"
    npm install
fi

# Start backend in background
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
echo "   Logs: tail -f backend.log"
echo ""

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo "${GREEN}✅ Backend is ready!${NC}"
        break
    fi
    echo -n "."
    sleep 1
done
echo ""

# Start frontend
cd ../afro-web
echo "${BLUE}Starting Frontend (Port 3000)...${NC}"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
fi

# Start frontend in background
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"
echo "   Logs: tail -f frontend.log"
echo ""

# Wait for frontend to be ready
echo "Waiting for frontend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "${GREEN}✅ Frontend is ready!${NC}"
        break
    fi
    echo -n "."
    sleep 1
done
echo ""

# Success message
echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║                                                                       ║"
echo "║                    ✅ Both Servers Running! ✅                         ║"
echo "║                                                                       ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo ""
echo "${GREEN}Backend:${NC}  http://localhost:3001"
echo "${GREEN}Frontend:${NC} http://localhost:3000"
echo ""
echo "Open your browser: ${BLUE}http://localhost:3000/onboarding${NC}"
echo ""
echo "Process IDs:"
echo "  Backend:  $BACKEND_PID"
echo "  Frontend: $FRONTEND_PID"
echo ""
echo "To stop both servers:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "Or use:"
echo "  ./STOP_BOTH.sh"
echo ""

# Save PIDs for stop script
echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid

# Keep script running and show logs
echo "Press Ctrl+C to stop both servers..."
echo ""

# Trap Ctrl+C
trap "echo ''; echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; rm -f .backend.pid .frontend.pid; echo '✅ Servers stopped'; exit" INT

# Tail both logs
tail -f backend.log frontend.log



