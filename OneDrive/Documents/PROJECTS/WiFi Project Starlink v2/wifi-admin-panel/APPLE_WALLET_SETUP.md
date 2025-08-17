# 🍎 Apple Wallet Integration Setup Guide

## Overview
This guide explains how to properly implement Apple Wallet integration for the WiFi Admin Panel. The current implementation generates unsigned JSON data, but Apple Wallet requires signed `.pkpass` files with proper certificates.

## ❌ Current Problem
- **Frontend generates**: Unsigned JSON data
- **Apple Wallet requires**: Signed `.pkpass` archive with certificates
- **Result**: Safari cannot add passes to Wallet

## ✅ Solution: Server-Side Pass Generation

### 1. Prerequisites
- [ ] Apple Developer Account ($99/year)
- [ ] PassKit certificates and keys
- [ ] Backend server (Node.js, Python, etc.)
- [ ] HTTPS endpoint
- [ ] Domain with SSL certificate

### 2. Apple Developer Setup

#### 2.1 Create Pass Type ID
1. Go to [Apple Developer Portal](https://developer.apple.com)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Identifiers** → **+** → **Pass Type ID**
4. Enter description: "WiFi Costa Rica Passes"
5. Click **Continue** → **Register**

#### 2.2 Generate Pass Certificate
1. Select your Pass Type ID
2. Click **Edit** → **Create Certificate**
3. Download the certificate file
4. Install in Keychain Access
5. Export as `.p12` file with password

#### 2.3 Download WWDR Certificate
1. Go to [Apple Developer Downloads](https://developer.apple.com/download/all/)
2. Search for "WWDR Certificate"
3. Download and install in Keychain Access
4. Export as `.p12` file

### 3. Backend Implementation

#### 3.1 Install Dependencies
```bash
npm install passkit-generator
# or
yarn add passkit-generator
```

#### 3.2 Create Pass Generation Endpoint

**Node.js Example:**
```javascript
const express = require('express');
const { Pass } = require('passkit-generator');
const path = require('path');

const app = express();

app.post('/api/wallet/apple-pass', async (req, res) => {
    try {
        const { userId, userEmail, credits } = req.body;
        
        // Create pass instance
        const pass = await Pass.from({
            model: path.join(__dirname, 'models/Generic.pass'),
            certificates: {
                wwdr: path.join(__dirname, 'certs/wwdr.p12'),
                signerCert: path.join(__dirname, 'certs/pass.p12'),
                signerKey: path.join(__dirname, 'certs/pass.p12'),
                signerKeyPassphrase: process.env.PASS_CERT_PASSWORD
            }
        });

        // Configure pass
        pass.setBarcodes({
            message: JSON.stringify({ userId, credits }),
            format: 'PKBarcodeFormatQR',
            messageEncoding: 'iso-8859-1'
        });

        pass.primaryFields.add({
            key: 'credits',
            label: 'Available Credits',
            value: `${credits.hours}h ${credits.minutes}m`
        });

        // Generate .pkpass file
        const buffer = await pass.generate();
        
        // Set proper headers
        res.set({
            'Content-Type': 'application/vnd.apple.pkpass',
            'Content-Disposition': `attachment; filename="wifi-card-${userId}.pkpass"`
        });
        
        res.send(buffer);
        
    } catch (error) {
        console.error('Error generating pass:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(3001, () => {
    console.log('Pass generation server running on port 3001');
});
```

#### 3.3 Environment Variables
```bash
# .env
PASS_CERT_PASSWORD=your_certificate_password
APPLE_TEAM_ID=your_team_identifier
APPLE_PASS_TYPE_ID=pass.com.wificostarica.creditcard
```

### 4. Frontend Updates

#### 4.1 Update API Calls
```javascript
// Replace local generation with API calls
const generateAppleWalletPass = async (user, userCredits) => {
    try {
        const response = await fetch('/api/wallet/apple-pass', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.uid, userEmail: user.email, credits: userCredits })
        });

        if (!response.ok) throw new Error('Failed to generate pass');

        // Get the .pkpass blob
        const blob = await response.blob();
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `wifi-card-${user.uid}.pkpass`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        window.URL.revokeObjectURL(url);
        
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to generate Apple Wallet pass');
    }
};
```

#### 4.2 Alternative: Direct URL Redirect
```javascript
// For immediate wallet addition
const addToAppleWallet = async (user, userCredits) => {
    try {
        const response = await fetch('/api/wallet/apple-pass', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.uid, userEmail: user.email, credits: userCredits })
        });

        if (!response.ok) throw new Error('Failed to generate pass');

        // Get the pass URL
        const { passUrl } = await response.json();
        
        // Redirect to pass URL (Safari will show "Add to Wallet")
        window.location.href = passUrl;
        
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to generate Apple Wallet pass');
    }
};
```

### 5. File Structure

```
backend/
├── models/
│   └── Generic.pass/          # Pass template
│       ├── pass.json          # Pass configuration
│       ├── icon.png           # 29x29 icon
│       ├── icon@2x.png        # 58x58 icon
│       ├── logo.png           # 160x50 logo
│       ├── logo@2x.png        # 320x100 logo
│       ├── strip.png          # 320x123 strip
│       ├── strip@2x.png       # 640x246 strip
│       ├── thumbnail.png      # 90x90 thumbnail
│       └── thumbnail@2x.png   # 180x180 thumbnail
├── certs/
│   ├── wwdr.p12              # WWDR certificate
│   └── pass.p12              # Pass certificate
├── server.js                  # Express server
└── package.json
```

### 6. Testing

#### 6.1 Local Testing
1. Start backend server: `node server.js`
2. Test endpoint: `curl -X POST http://localhost:3001/api/wallet/apple-pass`
3. Verify `.pkpass` file is generated
4. Check file contents: `unzip -l wifi-card.pkpass`

#### 6.2 iOS Testing
1. Deploy to HTTPS server
2. Open pass URL on iOS device
3. Safari should show "Add to Wallet" prompt
4. Verify pass appears in Wallet app

### 7. Production Deployment

#### 7.1 Server Requirements
- **HTTPS**: Required for Apple Wallet
- **MIME Type**: `application/vnd.apple.pkpass`
- **Headers**: Proper Content-Disposition
- **SSL**: Valid SSL certificate

#### 7.2 Security Considerations
- Store certificates securely
- Use environment variables for sensitive data
- Implement rate limiting
- Add authentication to API endpoints

### 8. Troubleshooting

#### Common Issues
1. **"Invalid pass" error**: Check certificate validity and expiration
2. **Pass won't add**: Verify MIME type and HTTPS
3. **QR code issues**: Ensure proper barcode format
4. **Image problems**: Check image dimensions and formats

#### Debug Steps
1. Check server logs for errors
2. Verify certificate installation
3. Test with Apple's PassKit testing tools
4. Validate pass structure with passkit-validator

### 9. Alternative Solutions

#### 9.1 Third-Party Services
- **Passkit.com**: Hosted pass generation
- **Passkit.io**: API-based solution
- **Apple Wallet API**: Direct integration

#### 9.2 QR Code Only
- Generate QR codes with pass data
- Users scan with wallet apps
- No file downloads required

### 10. Next Steps

1. **Immediate**: Set up Apple Developer account
2. **Week 1**: Generate certificates and keys
3. **Week 2**: Implement backend endpoint
4. **Week 3**: Test with real devices
5. **Week 4**: Deploy to production

## 📚 Resources

- [Apple PassKit Documentation](https://developer.apple.com/documentation/passkit)
- [passkit-generator Library](https://github.com/alexandercerutti/passkit-generator)
- [Apple Developer Portal](https://developer.apple.com)
- [PassKit Testing Guide](https://developer.apple.com/documentation/passkit/testing_passes)

## 🆘 Support

If you encounter issues:
1. Check Apple Developer documentation
2. Verify certificate setup
3. Test with minimal pass configuration
4. Use Apple's PassKit testing tools
5. Check server logs for detailed errors

---

**Note**: This setup requires significant backend development and Apple Developer account setup. Consider using third-party services if you need a quicker solution.
