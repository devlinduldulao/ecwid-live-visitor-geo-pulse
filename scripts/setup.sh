#!/bin/bash
# Setup script for the static Ecwid dashboard
# Run: bash scripts/setup.sh

set -e

echo "=== Live Visitor Geo Pulse for Ecwid Setup ==="
echo ""

# Check Node.js version
NODE_VERSION=$(node -v 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1)
if [ -z "$NODE_VERSION" ] || [ "$NODE_VERSION" -lt 20 ]; then
  echo "❌ Node.js 20+ is required. Current: $(node -v 2>/dev/null || echo 'not installed')"
  exit 1
fi
echo "✅ Node.js $(node -v)"

echo ""
echo "Installing dependencies..."
npm install

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Run: npm run serve"
echo "  2. Open: http://localhost:5001/index.html"
echo "  3. For local preview outside Ecwid, append ?storeId=...&token=..."
echo ""
