#!/bin/bash
# Capital Fleet — Clean Start Script
# Usage: bash start.sh

set -e

echo "🚀 Capital Fleet — Starting All Services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Kill any processes already using our ports
echo "⚡ Clearing ports 4100 and 5173..."
fuser -k 4100/tcp 2>/dev/null && echo "  → Killed process on port 4100" || echo "  → Port 4100 already free"
fuser -k 5173/tcp 2>/dev/null && echo "  → Killed process on port 5173" || echo "  → Port 5173 already free"
sleep 1

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Start API in background
echo ""
echo "🔧 Starting Backend API (port 4100)..."
cd "$SCRIPT_DIR/apps/api"
node dist/main.js &
API_PID=$!
echo "  → API PID: $API_PID"

# Wait for API to be ready
echo "  → Waiting for API readiness..."
READY=0
for i in {1..15}; do
  if curl -s -f http://localhost:4100/api/health >/dev/null 2>&1; then
    READY=1
    break
  fi
  sleep 0.5
done

if [ $READY -eq 1 ]; then
  echo "  → ✅ API is healthy at http://localhost:4100/api"
else
  echo "  → ⚠️  API is still initializing, proceeding..."
fi

# Start Frontend in background
echo ""
echo "🌐 Starting Frontend (port 5173)..."
cd "$SCRIPT_DIR/apps/web"
npm run dev &
WEB_PID=$!
echo "  → Frontend PID: $WEB_PID"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Capital Fleet is running!"
echo ""
echo "   Frontend  →  http://localhost:5173"
echo "   API       →  http://localhost:4100/api"
echo "   API Docs  →  http://localhost:4100/api/docs"
echo ""
echo "📋 Login Credentials (Shared Password: CapitalFleet2026!):"
echo "   Drivers:        driver.abebe@capitalre.com (Senior VIP Chauffeur)"
echo "                   driver.mulugeta@capitalre.com (Heavy Transit Chauffeur)"
echo "   Departments:    employee.finance@capitalre.com (Finance & Procurement)"
echo "                   employee.hr@capitalre.com (Human Resources)"
echo "                   employee.it@capitalre.com (Information Technology)"
echo "                   employee.admin@capitalre.com (General Administration)"
echo "                   employee@capitalre.com (Project Engineering)"
echo "                   bethlehem@capitalre.com (Sales & Real Estate)"
echo "   Logistics:      logistics@capitalre.com (Fleet Dispatch & Review)"
echo "   System Admin:   admin@capitalre.com (Executive Command & Analytics)"
echo ""
echo "Press Ctrl+C to stop all services."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Wait — kill both on Ctrl+C
trap "echo ''; echo 'Stopping services...'; kill $API_PID $WEB_PID 2>/dev/null; exit 0" INT TERM
wait
