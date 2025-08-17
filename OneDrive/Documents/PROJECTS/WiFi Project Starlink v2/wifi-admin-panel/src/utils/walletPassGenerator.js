// Wallet Pass Generator Utility
// This utility generates wallet pass files for different digital wallet platforms

// Helper functions - defined first to avoid reference errors
export const getStatusText = (userCredits) => {
    const totalMinutes = (userCredits.hours || 0) * 60 + (userCredits.minutes || 0);
    if (totalMinutes > 120) return 'Excellent';
    if (totalMinutes > 60) return 'Good';
    return 'Low';
};

export const getStatusColor = (userCredits) => {
    const totalMinutes = (userCredits.hours || 0) * 60 + (userCredits.minutes || 0);
    if (totalMinutes > 120) return 'text-green-400';
    if (totalMinutes > 60) return 'text-yellow-400';
    return 'text-red-400';
};

export const formatCredits = (userCredits) => {
    const hours = userCredits.hours || 0;
    const minutes = userCredits.minutes || 0;
    
    if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
        return `${hours}h`;
    } else if (minutes > 0) {
        return `${minutes}m`;
    }
    return '0h 0m';
};

export const generateAppleWalletPass = (user, userCredits) => {
    try {
        // Create a proper Apple Wallet pass structure
        // Note: In production, you'd need proper Apple Developer certificates
        const passData = {
            formatVersion: 1,
            passTypeIdentifier: 'pass.com.wificostarica.creditcard',
            serialNumber: user?.uid || 'unknown',
            teamIdentifier: 'wificostarica',
            organizationName: 'WiFi Costa Rica',
            description: 'Virtual WiFi Credit Card',
            generic: {
                primaryFields: [
                    {
                        key: 'credits',
                        label: 'Available Credits',
                        value: formatCredits(userCredits)
                    }
                ],
                secondaryFields: [
                    {
                        key: 'status',
                        label: 'Status',
                        value: getStatusText(userCredits)
                    },
                    {
                        key: 'email',
                        label: 'Account',
                        value: user?.email || 'User Account'
                    }
                ],
                auxiliaryFields: [
                    {
                        key: 'type',
                        label: 'Card Type',
                        value: 'VIRTUAL'
                    },
                    {
                        key: 'access',
                        label: 'Access',
                        value: 'WiFi + High Speed'
                    }
                ]
            },
            barcodes: [
                {
                    format: 'PKBarcodeFormatQR',
                    message: JSON.stringify({
                        uid: user?.uid,
                        email: user?.email,
                        credits: userCredits,
                        timestamp: new Date().toISOString()
                    }),
                    messageEncoding: 'iso-8859-1'
                }
            ]
        };

        return passData;
    } catch (error) {
        console.error('Error generating Apple Wallet pass:', error);
        throw new Error('Failed to generate Apple Wallet pass');
    }
};

export const generateGooglePayPass = (user, userCredits) => {
    try {
        // Create a Google Pay loyalty card format
        const loyaltyCard = {
            type: 'LOYALTY',
            id: user?.uid || 'unknown',
            accountName: user?.email || 'User Account',
            accountId: user?.uid || 'unknown',
            loyaltyPoints: {
                balance: {
                    kind: 'LOYALTY_POINTS',
                    string: formatCredits(userCredits)
                }
            },
            issuerName: 'WiFi Costa Rica',
            programName: 'WiFi Credits',
            cardTemplate: 'VIRTUAL',
            cardNumber: user?.uid?.slice(-8) || '00000000',
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        };

        return loyaltyCard;
    } catch (error) {
        console.error('Error generating Google Pay pass:', error);
        throw new Error('Failed to generate Google Pay pass');
    }
};

export const generateSamsungPayPass = (user, userCredits) => {
    try {
        // Create a Samsung Pay loyalty card format
        const loyaltyCard = {
            cardType: 'LOYALTY',
            cardId: user?.uid || 'unknown',
            cardName: 'WiFi Costa Rica Credits',
            cardNumber: user?.uid?.slice(-8) || '00000000',
            issuerName: 'WiFi Costa Rica',
            programName: 'WiFi Credits',
            balance: formatCredits(userCredits),
            status: getStatusText(userCredits),
            accountEmail: user?.email || 'User Account',
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            cardTemplate: 'VIRTUAL'
        };

        return loyaltyCard;
    } catch (error) {
        console.error('Error generating Samsung Pay pass:', error);
        throw new Error('Failed to generate Samsung Pay pass');
    }
};

export const generateGenericWalletPass = (user, userCredits) => {
    try {
        // Create a generic wallet pass format that works with most digital wallets
        const genericPass = {
            format: 'GENERIC',
            version: '1.0',
            cardId: user?.uid || 'unknown',
            cardName: 'WiFi Costa Rica Credits',
            issuerName: 'WiFi Costa Rica',
            programName: 'WiFi Credits',
            balance: formatCredits(userCredits),
            status: getStatusText(userCredits),
            accountEmail: user?.email || 'User Account',
            cardNumber: user?.uid?.slice(-8) || '00000000',
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            cardTemplate: 'VIRTUAL',
            metadata: {
                uid: user?.uid,
                email: user?.email,
                credits: userCredits,
                timestamp: new Date().toISOString()
            }
        };

        return genericPass;
    } catch (error) {
        console.error('Error generating generic wallet pass:', error);
        throw new Error('Failed to generate generic wallet pass');
    }
};

export const createDownloadableFile = (data, filename, mimeType) => {
    try {
        if (!data) {
            throw new Error('No data provided for file creation');
        }

        // Check if we're on Safari or mobile browser
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent) && !/Firefox/.test(navigator.userAgent);
        const isMobileSafari = isIOS && isSafari;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (isMobileSafari || (isMobile && isSafari)) {
            // For Safari mobile, create a data URL and open in new tab
            const jsonString = JSON.stringify(data, null, 2);
            const dataUrl = `data:${mimeType};charset=utf-8,${encodeURIComponent(jsonString)}`;
            
            // Open in new tab for manual saving
            const newWindow = window.open();
            newWindow.document.write(`
                <html>
                    <head><title>${filename}</title></head>
                    <body style="margin:0;padding:20px;text-align:center;background:#f0f0f0;font-family:Arial,sans-serif;">
                        <h2>Tu Archivo de Billetera</h2>
                        <p><strong>${filename}</strong></p>
                        <p>Para guardar este archivo:</p>
                        <ul style="text-align:left;max-width:500px;margin:20px auto;">
                            <li>Mantén presionado el enlace de abajo</li>
                            <li>Selecciona "Copiar enlace"</li>
                            <li>Pega el enlace en Safari</li>
                            <li>Mantén presionado y selecciona "Abrir"</li>
                        </ul>
                        <div style="background:white;padding:20px;border-radius:10px;margin:20px 0;">
                            <a href="${dataUrl}" download="${filename}" style="color:#007AFF;text-decoration:none;font-size:18px;">
                                📥 Descargar ${filename}
                            </a>
                        </div>
                        <p style="color:#666;font-size:14px;">
                            O escanea el código QR de la tarjeta para agregar directamente a tu billetera
                        </p>
                        <button onclick="window.close()" style="padding:10px 20px;background:#007AFF;color:white;border:none;border-radius:5px;cursor:pointer;">
                            Cerrar
                        </button>
                    </body>
                </html>
            `);
            return true;
        } else {
            // For other browsers, use the standard download approach
            const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: mimeType
            });
            
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            return true;
        }
    } catch (error) {
        console.error('Error creating downloadable file:', error);
        return false;
    }
};
