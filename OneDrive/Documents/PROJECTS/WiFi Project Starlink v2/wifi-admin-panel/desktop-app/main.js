const { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const express = require('express');
const cors = require('cors');
const { Pass } = require('passkit-generator');
const fs = require('fs');

let mainWindow;
let tray;
let serverProcess;
let isServerRunning = false;
const PORT = 3001;

// Start the Express server
function startServer() {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.static('public'));

  // Serve .pkpass files with correct MIME type
  app.use('/passes', express.static('passes', {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.pkpass')) {
        res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
        res.setHeader('Content-Disposition', 'attachment');
      }
    }
  }));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      message: 'Wallet Pass Generation Server is running',
      timestamp: new Date().toISOString()
    });
  });

  // Generate Apple Wallet pass
  app.post('/api/wallet/apple-pass', async (req, res) => {
    try {
      const { userId, userEmail, credits } = req.body;
      
      // For now, return a mock response since we don't have certificates
      // In production, this would generate real .pkpass files
      const filename = `wifi-card-${userId}-${Date.now()}.pkpass`;
      
      res.json({
        success: true,
        message: 'Apple Wallet pass generated successfully (Mock)',
        passUrl: `http://localhost:${PORT}/passes/${filename}`,
        filename: filename
      });
      
    } catch (error) {
      console.error('Error generating Apple Wallet pass:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message,
        message: 'Failed to generate Apple Wallet pass'
      });
    }
  });

  // Generate Google Pay pass
  app.post('/api/wallet/google-pay', async (req, res) => {
    try {
      const { userId, userEmail, credits } = req.body;
      
      const loyaltyCard = {
        type: 'LOYALTY_CARD',
        issuer: 'WiFi Costa Rica',
        cardName: 'WiFi Credits',
        accountId: userId,
        accountEmail: userEmail,
        credits: credits,
        balance: formatCredits(credits),
        status: getStatusText(credits),
        cardNumber: userId.slice(-8),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        timestamp: new Date().toISOString()
      };
      
      res.json({
        success: true,
        message: 'Google Pay pass generated successfully',
        data: loyaltyCard,
        instructions: [
          '1. Open Google Pay on your phone',
          '2. Tap "Cards" → "+"',
          '3. Select "Loyalty card"',
          '4. Scan the QR code from the virtual card',
          '5. Or manually enter the card details'
        ]
      });
      
    } catch (error) {
      console.error('Error generating Google Pay pass:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  // Generate Samsung Pay pass
  app.post('/api/wallet/samsung-pay', async (req, res) => {
    try {
      const { userId, userEmail, credits } = req.body;
      
      const loyaltyCard = {
        type: 'LOYALTY_CARD',
        issuer: 'WiFi Costa Rica',
        cardName: 'WiFi Credits',
        accountId: userId,
        accountEmail: userEmail,
        credits: credits,
        balance: formatCredits(credits),
        status: getStatusText(credits),
        cardNumber: userId.slice(-8),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        timestamp: new Date().toISOString()
      };
      
      res.json({
        success: true,
        message: 'Samsung Pay pass generated successfully',
        data: loyaltyCard,
        instructions: [
          '1. Open Samsung Pay on your phone',
          '2. Tap "Cards" → "+"',
          '3. Select "Loyalty card"',
          '4. Scan the QR code from the virtual card',
          '5. Or manually enter the card details'
        ]
      });
      
    } catch (error) {
      console.error('Error generating Samsung Pay pass:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  // Generate generic wallet pass
  app.post('/api/wallet/generic-pass', async (req, res) => {
    try {
      const { userId, userEmail, credits } = req.body;
      
      const genericPass = {
        type: 'GENERIC_PASS',
        issuer: 'WiFi Costa Rica',
        cardName: 'WiFi Credits',
        accountId: userId,
        accountEmail: userEmail,
        credits: credits,
        balance: formatCredits(credits),
        status: getStatusText(credits),
        cardNumber: userId.slice(-8),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        timestamp: new Date().toISOString()
      };
      
      res.json({
        success: true,
        message: 'Generic wallet pass generated successfully',
        data: genericPass,
        instructions: [
          '1. Open your preferred wallet app',
          '2. Look for "Add card" or "Import" option',
          '3. Scan the QR code from the virtual card',
          '4. Or manually enter the card details',
          '5. Confirm and add to your wallet'
        ]
      });
      
    } catch (error) {
      console.error('Error generating generic wallet pass:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  // Helper functions
  function formatCredits(credits) {
    const hours = credits.hours || 0;
    const minutes = credits.minutes || 0;
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    }
    return '0h 0m';
  }

  function getStatusText(credits) {
    const totalMinutes = (credits.hours || 0) * 60 + (credits.minutes || 0);
    if (totalMinutes > 120) return 'Excellent';
    if (totalMinutes > 60) return 'Good';
    return 'Low';
  }

  // Start server
  app.listen(PORT, () => {
    console.log(`🚀 Wallet Pass Generation Server running on port ${PORT}`);
    isServerRunning = true;
    updateTrayStatus();
  });

  return app;
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    title: 'WiFi Costa Rica Wallet Pass Generator'
  });

  // Load the main page
  mainWindow.loadFile('renderer/index.html');

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle window close
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  // Create tray icon
  const icon = nativeImage.createFromPath(path.join(__dirname, 'assets/icon.png'));
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        }
      }
    },
    {
      label: 'Server Status',
      submenu: [
        {
          label: 'Start Server',
          click: () => startServer(),
          enabled: !isServerRunning
        },
        {
          label: 'Stop Server',
          click: () => stopServer(),
          enabled: isServerRunning
        }
      ]
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('WiFi Costa Rica Wallet Pass Generator');
  tray.setContextMenu(contextMenu);
  
  updateTrayStatus();
}

function updateTrayStatus() {
  if (tray) {
    tray.setToolTip(`WiFi Costa Rica Wallet Pass Generator\nServer: ${isServerRunning ? 'Running' : 'Stopped'}`);
  }
}

function stopServer() {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
  isServerRunning = false;
  updateTrayStatus();
}

// App event handlers
app.whenReady().then(() => {
  createWindow();
  createTray();
  startServer();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  app.isQuiting = true;
  stopServer();
});

// IPC handlers
ipcMain.handle('get-server-status', () => {
  return { isRunning: isServerRunning, port: PORT };
});

ipcMain.handle('start-server', () => {
  startServer();
  return { success: true };
});

ipcMain.handle('stop-server', () => {
  stopServer();
  return { success: true };
});
