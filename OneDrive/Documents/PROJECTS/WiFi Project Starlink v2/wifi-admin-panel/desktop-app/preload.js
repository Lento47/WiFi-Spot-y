const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Server management
  getServerStatus: () => ipcRenderer.invoke('get-server-status'),
  startServer: () => ipcRenderer.invoke('start-server'),
  stopServer: () => ipcRenderer.invoke('stop-server'),
  
  // Wallet pass generation
  generateAppleWalletPass: (data) => fetch('http://localhost:3001/api/wallet/apple-pass', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  
  generateGooglePayPass: (data) => fetch('http://localhost:3001/api/wallet/google-pay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  
  generateSamsungPayPass: (data) => fetch('http://localhost:3001/api/wallet/samsung-pay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  
  generateGenericWalletPass: (data) => fetch('http://localhost:3001/api/wallet/generic-pass', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  
  // Health check
  checkServerHealth: () => fetch('http://localhost:3001/health').then(res => res.json())
});
