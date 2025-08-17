const express = require('express');
const { Pass } = require('passkit-generator');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

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

// Generate Apple Wallet pass
app.post('/api/wallet/apple-pass', async (req, res) => {
    try {
        const { userId, userEmail, credits } = req.body;
        
        // Create pass instance using passkit-generator
        const pass = await Pass.from({
            model: path.join(__dirname, 'models/Generic.pass'),
            certificates: {
                wwdr: path.join(__dirname, 'certs/wwdr.p12'),
                signerCert: path.join(__dirname, 'certs/pass.p12'),
                signerKey: path.join(__dirname, 'certs/pass.p12'),
                signerKeyPassphrase: process.env.PASS_CERT_PASSWORD || 'password'
            }
        });

        // Configure pass fields
        pass.setBarcodes({
            message: JSON.stringify({
                uid: userId,
                email: userEmail,
                credits: credits,
                timestamp: new Date().toISOString()
            }),
            format: 'PKBarcodeFormatQR',
            messageEncoding: 'iso-8859-1'
        });

        // Add primary field for credits
        pass.primaryFields.add({
            key: 'credits',
            label: 'Available Credits',
            value: formatCredits(credits)
        });

        // Add secondary fields
        pass.secondaryFields.add({
            key: 'status',
            label: 'Status',
            value: getStatusText(credits)
        });

        pass.secondaryFields.add({
            key: 'email',
            label: 'Account',
            value: userEmail || 'User Account'
        });

        // Add auxiliary fields
        pass.auxiliaryFields.add({
            key: 'type',
            label: 'Card Type',
            value: 'VIRTUAL'
        });

        pass.auxiliaryFields.add({
            key: 'access',
            label: 'Access',
            value: 'WiFi + High Speed'
        });

        // Generate the .pkpass file
        const buffer = await pass.generate();
        
        // Save to passes directory
        const filename = `wifi-card-${userId}-${Date.now()}.pkpass`;
        const filePath = path.join(__dirname, 'passes', filename);
        
        // Ensure passes directory exists
        if (!fs.existsSync(path.join(__dirname, 'passes'))) {
            fs.mkdirSync(path.join(__dirname, 'passes'), { recursive: true });
        }
        
        fs.writeFileSync(filePath, buffer);
        
        // Return the URL to the generated pass
        const passUrl = `http://localhost:${PORT}/passes/${filename}`;
        
        res.json({
            success: true,
            message: 'Apple Wallet pass generated successfully',
            passUrl: passUrl,
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
        
        // Create Google Pay loyalty card structure
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
        
        // Create Samsung Pay loyalty card structure
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
        
        // Create generic wallet pass structure
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

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Wallet Pass Generation Server is running',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Wallet Pass Generation Server running on port ${PORT}`);
    console.log(`📱 Apple Wallet endpoint: http://localhost:${PORT}/api/wallet/apple-pass`);
    console.log(`🔵 Google Pay endpoint: http://localhost:${PORT}/api/wallet/google-pay`);
    console.log(`📱 Samsung Pay endpoint: http://localhost:${PORT}/api/wallet/samsung-pay`);
    console.log(`💳 Generic Wallet endpoint: http://localhost:${PORT}/api/wallet/generic-pass`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
