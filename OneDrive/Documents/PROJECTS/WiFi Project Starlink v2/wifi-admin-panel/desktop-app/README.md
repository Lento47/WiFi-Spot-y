# WiFi Costa Rica Wallet Pass Generator - Desktop Application

A cross-platform desktop application built with Electron that provides a user-friendly interface for generating digital wallet passes for Apple Wallet, Google Pay, Samsung Pay, and other wallet applications.

## 🚀 Features

- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Built-in Server**: Integrated Express server for wallet pass generation
- **Multiple Wallet Support**: Apple Wallet, Google Pay, Samsung Pay, Generic Wallets
- **Real-time Status**: Server status monitoring and health checks
- **Modern UI**: Clean, responsive interface with dark mode support
- **System Tray**: Runs in background with system tray integration
- **Auto-reload**: Development mode with automatic server restart

## 📋 Prerequisites

- **Node.js 16+** - [Download here](https://nodejs.org/)
- **npm** - Usually comes with Node.js
- **Apple Developer Account** (for production Apple Wallet passes)

## 🛠 Installation

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd wifi-admin-panel/desktop-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Install Electron Dependencies
```bash
npm run postinstall
```

## 🚀 Usage

### Development Mode
```bash
# Start both server and Electron app
npm run dev

# Or start them separately
npm run server    # Start backend server
npm run electron  # Start Electron app
```

### Production Mode
```bash
# Start the application
npm start
```

### Build Distributables
```bash
# Build for all platforms
npm run build

# Build for specific platform
npm run build:linux
npm run build:win
npm run build:mac
```

## 🏗 Project Structure

```
desktop-app/
├── main.js              # Main Electron process
├── preload.js           # Preload script for secure IPC
├── package.json         # Dependencies and build config
├── README.md           # This file
├── renderer/           # Frontend files
│   ├── index.html      # Main HTML interface
│   ├── renderer.js     # Frontend logic
│   └── styles.css      # Custom styles
└── assets/             # Icons and images
    ├── icon.png        # App icon
    ├── icon.ico        # Windows icon
    └── icon.icns       # macOS icon
```

## 🔧 Configuration

### Environment Variables
```bash
NODE_ENV=development    # Set to 'production' for builds
PORT=3001              # Server port (default: 3001)
```

### Build Configuration
The `package.json` includes comprehensive build configurations for:
- **Linux**: AppImage, DEB, RPM, Snap packages
- **Windows**: NSIS installer, portable executable
- **macOS**: DMG installer

## 📱 Wallet Integration

### Apple Wallet
- Generates `.pkpass` files (requires Apple certificates)
- Serves with proper MIME type for Safari compatibility
- Direct "Add to Wallet" integration

### Google Pay
- Creates loyalty card JSON structures
- Provides step-by-step instructions
- Compatible with Google Pay app

### Samsung Pay
- Generates Samsung Pay compatible passes
- Includes setup instructions
- Works with Samsung Pay app

### Generic Wallets
- Universal wallet pass format
- JSON data for manual import
- Compatible with most wallet applications

## 🎯 Development

### Adding New Wallet Types
1. Add endpoint in `main.js`
2. Update `preload.js` with new API method
3. Add button and logic in `renderer.js`
4. Test with target wallet app

### Customizing the UI
- Modify `renderer/index.html` for layout changes
- Update `renderer/renderer.js` for functionality
- Customize `renderer/styles.css` for styling

### Server Modifications
- Edit `main.js` for server logic changes
- Add new endpoints as needed
- Update health checks and monitoring

## 🚀 Building for Distribution

### Linux
```bash
npm run build:linux
# Generates: AppImage, DEB, RPM, Snap
```

### Windows
```bash
npm run build:win
# Generates: NSIS installer, portable exe
```

### macOS
```bash
npm run build:mac
# Generates: DMG installer
```

### All Platforms
```bash
npm run build
# Generates packages for all platforms
```

## 📦 Distribution

### Linux
- **AppImage**: Universal Linux package
- **DEB**: Debian/Ubuntu packages
- **RPM**: Red Hat/CentOS packages
- **Snap**: Snapcraft packages

### Windows
- **NSIS**: Professional installer with options
- **Portable**: Single executable file

### macOS
- **DMG**: Standard macOS disk image

## 🔒 Security Features

- **Context Isolation**: Secure communication between processes
- **Preload Scripts**: Controlled API exposure
- **Input Validation**: Form validation and sanitization
- **Error Handling**: Comprehensive error management

## 🐛 Troubleshooting

### Common Issues

1. **Server Won't Start**
   - Check if port 3001 is available
   - Verify Node.js installation
   - Check console for error messages

2. **Build Failures**
   - Ensure all dependencies are installed
   - Check Node.js version compatibility
   - Verify build tools for target platform

3. **Wallet Pass Generation Fails**
   - Check server status indicator
   - Verify form data is complete
   - Check console for API errors

4. **App Won't Launch**
   - Verify Electron installation
   - Check system requirements
   - Review error logs

### Debug Mode
```bash
# Enable development tools
NODE_ENV=development npm start
```

## 📚 API Reference

### Server Endpoints
- `GET /health` - Server health check
- `POST /api/wallet/apple-pass` - Generate Apple Wallet pass
- `POST /api/wallet/google-pay` - Generate Google Pay pass
- `POST /api/wallet/samsung-pay` - Generate Samsung Pay pass
- `POST /api/wallet/generic-pass` - Generate generic wallet pass

### IPC Methods
- `getServerStatus()` - Get server running status
- `startServer()` - Start the backend server
- `stopServer()` - Stop the backend server
- `generateAppleWalletPass(data)` - Generate Apple Wallet pass
- `generateGooglePayPass(data)` - Generate Google Pay pass
- `generateSamsungPayPass(data)` - Generate Samsung Pay pass
- `generateGenericWalletPass(data)` - Generate generic wallet pass

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:
- Check the troubleshooting section
- Review console logs and error messages
- Consult the API documentation
- Open an issue on GitHub

---

**Note**: This desktop application includes the wallet pass generation server and provides a user-friendly interface for generating passes. For production use, ensure you have proper Apple Developer certificates for Apple Wallet integration.
