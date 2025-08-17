@echo off
echo Starting WiFi Costa Rica Wallet Pass Server (Development Mode)...
echo.
echo Prerequisites:
echo 1. Node.js must be installed
echo 2. Dependencies must be installed (run: npm install)
echo 3. Apple certificates should be in certs/ folder
echo.
echo Starting server in development mode on port 3001...
echo Auto-reload enabled with nodemon
echo.
npm run dev
pause
