import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiWifi, FiDownload, FiClock, FiZap, FiSmartphone, FiServer, FiInfo } from 'react-icons/fi';
import QRCode from 'qrcode';
import {
    getStatusText,
    getStatusColor,
    formatCredits
} from '../../utils/walletPassGenerator';

const VirtualCreditCard = ({ userCredits, user, theme }) => {
    const [isAddingToWallet, setIsAddingToWallet] = useState(false);
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
    const cardRef = useRef(null);

    // Detect Safari mobile - more robust detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent) && !/Firefox/.test(navigator.userAgent);
    const isIOSSafari = isIOS && isSafari;
    const isMobileSafari = isIOSSafari || (isSafari && /Mobile/.test(navigator.userAgent));

    // Generate QR code for the card
    useEffect(() => {
        if (user?.uid) {
            const generateQR = async () => {
                try {
                    // Create a proper wallet pass data structure for QR codes
                    const walletPassData = {
                        type: 'WIFI_CREDIT_CARD',
                        issuer: 'WiFi Costa Rica',
                        cardName: 'WiFi Credits',
                        accountId: user.uid,
                        accountEmail: user.email,
                        credits: userCredits,
                        balance: `${userCredits.hours || 0}h ${userCredits.minutes || 0}m`,
                        status: getStatusText(userCredits),
                        cardNumber: user.uid.slice(-8),
                        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        timestamp: new Date().toISOString()
                    };
                    
                    const qrDataUrl = await QRCode.toDataURL(JSON.stringify(walletPassData), {
                        width: 256,
                        margin: 2,
                        color: {
                            dark: theme === 'dark' ? '#e2e8f0' : '#1e293b',
                            light: theme === 'dark' ? '#1f2937' : '#ffffff'
                        }
                    });
                    setQrCodeDataUrl(qrDataUrl);
                } catch (error) {
                    console.error('Error generating QR code:', error);
                }
            };
            generateQR();
        }
    }, [user, userCredits, theme]);

    const addToAppleWallet = () => {
        // Validate user data first
        if (!user?.uid || !userCredits) {
            alert('❌ Error: Información del usuario no disponible\n\nPor favor, recarga la página e intenta nuevamente.');
            return;
        }

        setIsAddingToWallet(true);
        
        // For development, show setup information directly
        // In production, this would call the actual API
        setTimeout(() => {
            const setupInfo = {
                success: false,
                message: 'Apple Wallet pass generation requires server-side setup',
                development: {
                    note: 'This is a development environment. In production, you need:',
                    requirements: [
                        'Apple Developer account with PassKit certificates',
                        'Backend server with passkit-generator library',
                        'HTTPS endpoint serving .pkpass files',
                        'Proper MIME type: application/vnd.apple.pkpass'
                    ],
                    nextSteps: [
                        '1. Set up backend API endpoint for pass generation',
                        '2. Install passkit-generator on server',
                        '3. Configure Apple certificates',
                        '4. Update frontend to call server API',
                        '5. Test with real .pkpass file generation'
                    ]
                }
            };

            const message = `${setupInfo.message}\n\n${setupInfo.development.note}\n\nRequisitos:\n${setupInfo.development.requirements.map(req => `• ${req}`).join('\n')}\n\nPróximos pasos:\n${setupInfo.development.nextSteps.map(step => `• ${step}`).join('\n')}\n\n💡 Alternativa: Usa el código QR de arriba para agregar la tarjeta manualmente.`;
            alert(message);
            
            setIsAddingToWallet(false);
        }, 500);
    };

    const showIOSSafariInstructions = (dataUrl, walletName) => {
        const instructions = `📱 Para ${walletName} en iOS Safari:

1️⃣ Opción 1 - Copiar y Pegar:
   • Copia este enlace: ${dataUrl}
   • Pégalo en Safari
   • Mantén presionado y selecciona "Abrir"

2️⃣ Opción 2 - Compartir:
   • Toca el botón de compartir en Safari
   • Selecciona "Copiar enlace"
   • Pégalo en Safari y ábrelo

3️⃣ Opción 3 - QR Code:
   • Escanea el código QR de arriba
   • Tu billetera lo reconocerá automáticamente

¿Cuál opción prefieres usar?`;

        if (confirm(instructions + '\n\n¿Quieres que copie el enlace al portapapeles?')) {
            // Try to use modern clipboard API first
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(dataUrl).then(() => {
                    alert('✅ Enlace copiado al portapapeles!\n\nAhora pégalo en Safari y mantén presionado para abrirlo.');
                }).catch(() => {
                    // Fallback to manual copy
                    manualCopyToClipboard(dataUrl);
                });
            } else {
                // Fallback for browsers without clipboard API
                manualCopyToClipboard(dataUrl);
            }
        }
    };

    const manualCopyToClipboard = (text) => {
        try {
            // Create a temporary textarea element
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.left = '-999999px';
            textarea.style.top = '-999999px';
            document.body.appendChild(textarea);
            
            // Select and copy the text
            textarea.focus();
            textarea.select();
            
            // Try to execute copy command
            const successful = document.execCommand('copy');
            document.body.removeChild(textarea);
            
            if (successful) {
                alert('✅ Enlace copiado al portapapeles!\n\nAhora pégalo en Safari y mantén presionado para abrirlo.');
            } else {
                // If execCommand fails, show manual copy instructions
                alert('📋 Para copiar manualmente:\n\n1. Selecciona este texto:\n' + text + '\n\n2. Mantén presionado y selecciona "Copiar"\n3. Pégalo en Safari');
            }
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            // Show manual copy instructions as last resort
            alert('📋 Para copiar manualmente:\n\n1. Selecciona este texto:\n' + text + '\n\n2. Mantén presionado y selecciona "Copiar"\n3. Pégalo en Safari');
        }
    };

    const addToGooglePay = () => {
        // Validate user data first
        if (!user?.uid || !userCredits) {
            alert('❌ Error: Información del usuario no disponible\n\nPor favor, recarga la página e intenta nuevamente.');
            return;
        }

        setIsAddingToWallet(true);
        
        // For development, show setup information directly
        setTimeout(() => {
            const setupInfo = {
                success: false,
                message: 'Google Pay pass generation requires server-side setup',
                development: {
                    note: 'This is a development environment. In production, you need:',
                    requirements: [
                        'Google Pay API credentials',
                        'Backend server for pass generation',
                        'Proper JSON structure for Google Pay',
                        'HTTPS endpoint for pass delivery'
                    ],
                    nextSteps: [
                        '1. Set up Google Pay API credentials',
                        '2. Create backend endpoint for pass generation',
                        '3. Generate proper Google Pay JSON structure',
                        '4. Update frontend to call server API',
                        '5. Test with real Google Pay integration'
                    ]
                }
            };

            const message = `${setupInfo.message}\n\n${setupInfo.development.note}\n\nRequisitos:\n${setupInfo.development.requirements.map(req => `• ${req}`).join('\n')}\n\nPróximos pasos:\n${setupInfo.development.nextSteps.map(step => `• ${step}`).join('\n')}\n\n💡 Alternativa: Usa el código QR de arriba para agregar la tarjeta manualmente.`;
            alert(message);
            
            setIsAddingToWallet(false);
        }, 500);
    };

    const addToSamsungPay = () => {
        // Validate user data first
        if (!user?.uid || !userCredits) {
            alert('❌ Error: Información del usuario no disponible\n\nPor favor, recarga la página e intenta nuevamente.');
            return;
        }

        setIsAddingToWallet(true);
        
        // For development, show setup information directly
        setTimeout(() => {
            const setupInfo = {
                success: false,
                message: 'Samsung Pay pass generation requires server-side setup',
                development: {
                    note: 'This is a development environment. In production, you need:',
                    requirements: [
                        'Samsung Pay API credentials',
                        'Backend server for pass generation',
                        'Proper JSON structure for Samsung Pay',
                        'HTTPS endpoint for pass delivery'
                    ],
                    nextSteps: [
                        '1. Set up Samsung Pay API credentials',
                        '2. Create backend endpoint for pass generation',
                        '3. Generate proper Samsung Pay JSON structure',
                        '4. Update frontend to call server API',
                        '5. Test with real Samsung Pay integration'
                    ]
                }
            };

            const message = `${setupInfo.message}\n\n${setupInfo.development.note}\n\nRequisitos:\n${setupInfo.development.requirements.map(req => `• ${req}`).join('\n')}\n\nPróximos pasos:\n${setupInfo.development.nextSteps.map(step => `• ${step}`).join('\n')}\n\n💡 Alternativa: Usa el código QR de arriba para agregar la tarjeta manualmente.`;
            alert(message);
            
            setIsAddingToWallet(false);
        }, 500);
    };

    const addToGenericWallet = () => {
        // Validate user data first
        if (!user?.uid || !userCredits) {
            alert('❌ Error: Información del usuario no disponible\n\nPor favor, recarga la página e intenta nuevamente.');
            return;
        }

        setIsAddingToWallet(true);
        
        // For development, show setup information directly
        setTimeout(() => {
            const setupInfo = {
                success: false,
                message: 'Generic wallet pass generation requires server-side setup',
                development: {
                    note: 'This is a development environment. In production, you need:',
                    requirements: [
                        'Wallet API credentials',
                        'Backend server for pass generation',
                        'Proper JSON structure for wallet apps',
                        'HTTPS endpoint for pass delivery'
                    ],
                    nextSteps: [
                        '1. Set up wallet API credentials',
                        '2. Create backend endpoint for pass generation',
                        '3. Generate proper wallet JSON structure',
                        '4. Update frontend to call server API',
                        '5. Test with real wallet integration'
                    ]
                }
            };

            const message = `${setupInfo.message}\n\n${setupInfo.development.note}\n\nRequisitos:\n${setupInfo.development.requirements.map(req => `• ${req}`).join('\n')}\n\nPróximos pasos:\n${setupInfo.development.nextSteps.map(step => `• ${step}`).join('\n')}\n\n💡 Alternativa: Usa el código QR de arriba para agregar la tarjeta manualmente.`;
            alert(message);
            
            setIsAddingToWallet(false);
        }, 500);
    };

    const downloadCardImage = () => {
        if (!cardRef.current) return;
        
        // Use html2canvas to capture the card as an image
        import('html2canvas').then(({ default: html2canvas }) => {
            html2canvas(cardRef.current, {
                backgroundColor: null,
                scale: 2,
                useCORS: true
            }).then(canvas => {
                // Try multiple download methods for cross-browser compatibility
                tryDownloadImage(canvas);
            });
        }).catch(error => {
            console.error('Error capturing card image:', error);
            alert('❌ Error al capturar la imagen. Intenta nuevamente.');
        });
    };

    const tryDownloadImage = (canvas) => {
        const filename = `wifi-credit-card-${user?.email || 'user'}.png`;
        
        // Method 1: Try standard download (works in Chrome, Firefox, Edge)
        try {
            const link = document.createElement('a');
            link.download = filename;
            link.href = canvas.toDataURL('image/png');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Check if download actually worked
            setTimeout(() => {
                // If we're still here, download probably failed
                if (isMobileSafari) {
                    showSafariImageOptions(canvas, filename);
                }
            }, 1000);
            
        } catch (error) {
            console.log('Standard download failed, trying alternatives:', error);
            showAlternativeImageOptions(canvas, filename);
        }
    };

    const showSafariImageOptions = (canvas, filename) => {
        const options = [
            '📱 Safari no puede descargar archivos directamente.',
            '',
            'Alternativas disponibles:',
            '1. Escanea el código QR de abajo',
            '2. Usa el botón de compartir de Safari',
            '3. Copia la imagen y pégalo en otra app',
            '4. Usa Chrome o Firefox si es posible',
            '5. Abre en nueva pestaña y guarda manualmente'
        ].join('\n');
        
        if (confirm(options + '\n\n¿Quieres abrir la imagen en una nueva pestaña?')) {
            // Open image in new tab for manual saving
            const newWindow = window.open();
            newWindow.document.write(`
                <html>
                    <head><title>WiFi Credit Card</title></head>
                    <body style="margin:0;padding:20px;text-align:center;background:#f0f0f0;">
                        <h2>Tu Tarjeta Virtual WiFi</h2>
                        <p>Mantén presionado la imagen y selecciona "Guardar imagen"</p>
                        <img src="${canvas.toDataURL('image/png')}" style="max-width:100%;border:2px solid #ccc;border-radius:10px;" />
                        <br><br>
                        <button onclick="window.close()" style="padding:10px 20px;background:#007AFF;color:white;border:none;border-radius:5px;cursor:pointer;">
                            Cerrar
                        </button>
                    </body>
                </html>
            `);
        }
    };

    const showAlternativeImageOptions = (canvas, filename) => {
        const options = [
            '❌ No se pudo descargar automáticamente.',
            '',
            'Opciones alternativas:',
            '1. Escanea el código QR de abajo',
            '2. Usa el botón de compartir del navegador',
            '3. Copia la imagen y pégalo en otra app',
            '4. Abre en nueva pestaña y guarda manualmente'
        ].join('\n');
        
        if (confirm(options + '\n\n¿Quieres abrir la imagen en una nueva pestaña?')) {
            // Open image in new tab for manual saving
            const newWindow = window.open();
            newWindow.document.write(`
                <html>
                    <head><title>WiFi Credit Card</title></head>
                    <body style="margin:0;padding:20px;text-align:center;background:#f0f0f0;">
                        <h2>Tu Tarjeta Virtual WiFi</h2>
                        <p>Haz clic derecho en la imagen y selecciona "Guardar imagen como..."</p>
                        <img src="${canvas.toDataURL('image/png')}" style="max-width:100%;border:2px solid #ccc;border-radius:10px;" />
                        <br><br>
                        <button onclick="window.close()" style="padding:10px 20px;background:#007AFF;color:white;border:none;border-radius:5px;cursor:pointer;">
                            Cerrar
                        </button>
                    </body>
                </html>
            `);
        }
    };

    return (
        <div className="space-y-4">
            {/* Safari Mobile Notice */}
            {isMobileSafari && (
                <div className={`p-4 rounded-xl border-2 border-blue-300 ${
                    theme === 'dark' 
                        ? 'bg-blue-900/20 text-blue-200' 
                        : 'bg-blue-50 text-blue-800'
                }`}>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">📱</span>
                        <h4 className="font-semibold">Safari Detectado</h4>
                    </div>
                    <p className="text-sm mb-3">
                        Safari tiene limitaciones para descargar archivos. Usa estas opciones alternativas:
                    </p>
                    <ul className="text-xs space-y-1">
                        <li>• <strong>QR Code:</strong> Escanea el código de abajo con tu billetera</li>
                        <li>• <strong>Compartir:</strong> Usa el botón de compartir de Safari</li>
                        <li>• <strong>Copiar y Pegar:</strong> Copia el enlace y pégalo en Safari</li>
                        <li>• <strong>Navegador Alternativo:</strong> Usa Chrome o Firefox si es posible</li>
                    </ul>
                </div>
            )}

            {/* Virtual Credit Card */}
            <div 
                id="virtual-credit-card" 
                ref={cardRef}
                className={`relative overflow-hidden rounded-2xl p-6 shadow-2xl transform transition-all duration-300 hover:scale-105 ${
                    theme === 'dark' 
                        ? 'bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 text-white' 
                        : 'bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 text-white'
                }`}
            >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
                </div>

                {/* Card Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-white/20'}`}>
                            <FiWifi className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">WiFi Costa Rica</h3>
                            <p className="text-sm opacity-80">Virtual Credit Card</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs opacity-80">Status</div>
                        <div className={`text-sm font-medium ${getStatusColor(userCredits)}`}>
                            {getStatusText(userCredits)}
                        </div>
                    </div>
                </div>

                {/* Credit Display */}
                <div className="mb-6">
                    <div className="text-xs opacity-80 mb-2">Available Credits</div>
                    <div className="text-4xl font-bold mb-2">
                        {formatCredits(userCredits)}
                    </div>
                    <div className="text-sm opacity-80">
                        {user?.email || 'User Account'}
                    </div>
                </div>

                {/* Card Details */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <FiClock className="w-4 h-4 opacity-80" />
                            <span className="text-sm opacity-80">WiFi Access</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <FiZap className="w-4 h-4 opacity-80" />
                            <span className="text-sm opacity-80">High Speed</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs opacity-80">Card Type</div>
                        <div className="text-sm font-medium">VIRTUAL</div>
                    </div>
                </div>

                {/* Card Number (Hidden for security) */}
                <div className="mt-4 pt-4 border-t border-white/20">
                    <div className="text-xs opacity-80 mb-1">Card Number</div>
                    <div className="font-mono text-sm tracking-wider">
                        •••• •••• •••• {user?.uid?.slice(-4) || '0000'}
                    </div>
                </div>
            </div>

            {/* Quick Download Options */}
            <div className="space-y-3">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white text-center">
                    📱 Descargar Tarjeta Virtual
                </h4>
                
                {/* Download as Image */}
                <motion.button
                    onClick={downloadCardImage}
                    className="w-full py-3 px-6 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <FiDownload className="w-5 h-5" />
                    {isMobileSafari ? 'Opciones para Safari' : 'Descargar como Imagen'}
                </motion.button>
            </div>

            {/* Wallet Integration Buttons */}
            <div className="space-y-3">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white text-center">
                    🎯 Crear para Billeteras Digitales
                </h4>
                
                {isMobileSafari && (
                    <div className={`p-3 rounded-lg text-center text-sm ${
                        theme === 'dark' 
                            ? 'bg-yellow-900/20 text-yellow-200 border border-yellow-700' 
                            : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                    }`}>
                        <p>📱 <strong>Safari:</strong> Toca cualquier botón para obtener opciones compatibles</p>
                    </div>
                )}
                
                {/* Apple Wallet */}
                <motion.button
                    onClick={addToAppleWallet}
                    disabled={isAddingToWallet}
                    className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-3 ${
                        theme === 'dark'
                            ? 'bg-black hover:bg-gray-800 text-white disabled:bg-gray-800 disabled:text-gray-400'
                            : 'bg-black hover:bg-gray-800 text-white disabled:bg-gray-400'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {isAddingToWallet ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            {isMobileSafari ? 'Preparando...' : 'Creando...'}
                        </>
                    ) : (
                        <>
                            <FiSmartphone className="w-5 h-5" />
                            {isMobileSafari ? 'Obtener para Apple Wallet' : 'Crear para Apple Wallet'}
                        </>
                    )}
                </motion.button>

                {/* Google Pay */}
                <motion.button
                    onClick={addToGooglePay}
                    disabled={isAddingToWallet}
                    className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-3 ${
                        theme === 'dark'
                            ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-800 disabled:text-blue-400'
                            : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-400'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {isAddingToWallet ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Creando...
                        </>
                    ) : (
                        <>
                            <FiSmartphone className="w-5 h-5" />
                            Crear para Google Pay
                        </>
                    )}
                </motion.button>

                {/* Samsung Pay */}
                <motion.button
                    onClick={addToSamsungPay}
                    disabled={isAddingToWallet}
                    className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-3 ${
                        theme === 'dark'
                            ? 'bg-blue-800 hover:bg-blue-700 text-white disabled:bg-blue-900 disabled:text-blue-400'
                            : 'bg-blue-800 hover:bg-blue-700 text-white disabled:bg-blue-400'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {isAddingToWallet ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Creando...
                        </>
                    ) : (
                        <>
                            <FiSmartphone className="w-5 h-5" />
                            Crear para Samsung Pay
                        </>
                    )}
                </motion.button>

                {/* Generic Wallet */}
                <motion.button
                    onClick={addToGenericWallet}
                    disabled={isAddingToWallet}
                    className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-3 ${
                        theme === 'dark'
                            ? 'bg-purple-600 hover:bg-purple-700 text-white disabled:bg-purple-800 disabled:text-purple-400'
                            : 'bg-purple-600 hover:bg-purple-700 text-white disabled:bg-purple-400'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {isAddingToWallet ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Creando...
                        </>
                    ) : (
                        <>
                            <FiSmartphone className="w-5 h-5" />
                            Crear para Otras Billeteras
                        </>
                    )}
                </motion.button>
            </div>

            {/* Instructions */}
            <div className={`p-4 rounded-xl text-sm ${
                theme === 'dark' 
                    ? 'bg-gray-800 text-gray-300' 
                    : 'bg-blue-50 text-blue-800'
            }`}>
                <h4 className="font-medium mb-2">💡 Cómo usar tu tarjeta virtual:</h4>
                <ul className="space-y-1 text-xs">
                    <li>• Descarga la tarjeta como imagen para uso offline</li>
                    <li>• Crea archivos compatibles con tu billetera digital preferida</li>
                    <li>• Muestra la tarjeta desde tu teléfono al administrador</li>
                    <li>• Los créditos se actualizan automáticamente</li>
                    <li>• Acceso rápido sin necesidad de conexión a internet</li>
                    <li>• Compatible con la mayoría de billeteras digitales</li>
                </ul>
            </div>

            {/* QR Code for Manual Addition */}
            <div className={`p-4 rounded-xl text-center ${
                theme === 'dark' 
                    ? 'bg-gray-800 text-gray-300' 
                    : 'bg-green-50 text-green-800'
            }`}>
                <h4 className="font-medium mb-2">🔍 Código QR para Billeteras</h4>
                <p className="text-xs mb-3">
                    Este código QR contiene la información de tu tarjeta virtual en formato compatible con billeteras digitales
                </p>
                <div className="bg-white p-4 rounded-lg inline-block">
                    {qrCodeDataUrl ? (
                        <img src={qrCodeDataUrl} alt="QR Code" className="w-32 h-32" />
                    ) : (
                        <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                            <FiWifi className="w-16 h-16 text-gray-400" />
                        </div>
                    )}
                </div>
                <div className="mt-3 text-xs space-y-1">
                    <p className="font-medium">📱 Cómo usar:</p>
                    <p>• Abre tu app de billetera preferida</p>
                    <p>• Busca "Escanear QR" o "Agregar tarjeta"</p>
                    <p>• Escanea este código</p>
                    <p>• Confirma la información y agrega</p>
                </div>
                <p className="text-xs mt-2 opacity-80">
                    Compatible con Apple Wallet, Google Pay, Samsung Pay y más
                </p>
            </div>

            {/* Debug Information - Only show in development */}
            {process.env.NODE_ENV === 'development' && (
                <div className={`p-4 rounded-xl text-xs ${
                    theme === 'dark' 
                        ? 'bg-gray-800 text-gray-300 border border-gray-600' 
                        : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                }`}>
                    <h4 className="font-medium mb-2">🐛 Debug Info (Solo Desarrollo)</h4>
                    <div className="space-y-1">
                        <p><strong>User UID:</strong> {user?.uid || 'No disponible'}</p>
                        <p><strong>User Email:</strong> {user?.email || 'No disponible'}</p>
                        <p><strong>Credits:</strong> {JSON.stringify(userCredits) || 'No disponible'}</p>
                        <p><strong>QR Generated:</strong> {qrCodeDataUrl ? 'Sí' : 'No'}</p>
                        <p><strong>Theme:</strong> {theme}</p>
                    </div>
                </div>
            )}

            {/* Direct Wallet Integration */}
            <div className={`p-4 rounded-xl ${
                theme === 'dark' 
                    ? 'bg-purple-900/20 text-purple-200 border border-purple-700' 
                    : 'bg-purple-50 text-purple-800 border border-purple-200'
            }`}>
                <h4 className="font-medium mb-3 text-center">🚀 Integración Directa con Billeteras</h4>
                <p className="text-xs mb-4 text-center">
                    Agrega tu tarjeta directamente sin descargar archivos
                </p>
                
                <div className="space-y-3">
                    {/* Apple Wallet Direct */}
                    <button
                        onClick={() => {
                            const setupInfo = {
                                message: 'Apple Wallet integration requires server-side setup',
                                requirements: [
                                    'Apple Developer account with PassKit certificates',
                                    'Backend server with passkit-generator library',
                                    'HTTPS endpoint serving .pkpass files',
                                    'Proper MIME type: application/vnd.apple.pkpass'
                                ],
                                nextSteps: [
                                    '1. Set up Apple Developer account',
                                    '2. Generate PassKit certificates',
                                    '3. Create backend API endpoint',
                                    '4. Test with real .pkpass files'
                                ]
                            };

                            const message = `${setupInfo.message}\n\nRequisitos:\n${setupInfo.requirements.map(req => `• ${req}`).join('\n')}\n\nPróximos pasos:\n${setupInfo.nextSteps.map(step => `• ${step}`).join('\n')}\n\n💡 Alternativa: Usa el código QR de arriba para agregar la tarjeta manualmente.`;
                            alert(message);
                        }}
                        className="w-full py-2 px-4 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
                    >
                        🍎 Agregar a Apple Wallet
                    </button>
                    
                    {/* Google Pay Direct */}
                    <button
                        onClick={() => {
                            const setupInfo = {
                                message: 'Google Pay integration requires server-side setup',
                                requirements: [
                                    'Google Pay API credentials',
                                    'Backend server for pass generation',
                                    'Proper JSON structure for Google Pay',
                                    'HTTPS endpoint for pass delivery'
                                ],
                                nextSteps: [
                                    '1. Set up Google Pay API credentials',
                                    '2. Create backend endpoint for pass generation',
                                    '3. Generate proper Google Pay JSON structure',
                                    '4. Test with real Google Pay integration'
                                ]
                            };

                            const message = `${setupInfo.message}\n\nRequisitos:\n${setupInfo.requirements.map(req => `• ${req}`).join('\n')}\n\nPróximos pasos:\n${setupInfo.nextSteps.map(step => `• ${step}`).join('\n')}\n\n💡 Alternativa: Usa el código QR de arriba para agregar la tarjeta manualmente.`;
                            alert(message);
                        }}
                        className="w-full py-2 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                        🔵 Agregar a Google Pay
                    </button>
                    
                    {/* Generic Wallet Direct */}
                    <button
                        onClick={() => {
                            const setupInfo = {
                                message: 'Generic wallet integration requires server-side setup',
                                requirements: [
                                    'Wallet API credentials',
                                    'Backend server for pass generation',
                                    'Proper JSON structure for wallet apps',
                                    'HTTPS endpoint for pass delivery'
                                ],
                                nextSteps: [
                                    '1. Set up wallet API credentials',
                                    '2. Create backend endpoint for pass generation',
                                    '3. Generate proper wallet JSON structure',
                                    '4. Test with real wallet integration'
                                ]
                            };

                            const message = `${setupInfo.message}\n\nRequisitos:\n${setupInfo.requirements.map(req => `• ${req}`).join('\n')}\n\nPróximos pasos:\n${setupInfo.nextSteps.map(step => `• ${step}`).join('\n')}\n\n💡 Alternativa: Usa el código QR de arriba para agregar la tarjeta manualmente.`;
                            alert(message);
                        }}
                        className="w-full py-2 px-4 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors"
                    >
                        💳 Agregar a tu Billetera
                    </button>
                </div>
                
                <p className="text-xs mt-3 text-center opacity-80">
                    💡 El código QR es la forma más rápida y compatible
                </p>
            </div>

            {/* Server Setup Information */}
            <div className={`p-4 rounded-xl border-2 border-orange-300 ${
                theme === 'dark' 
                    ? 'bg-orange-900/20 text-orange-200' 
                    : 'bg-orange-50 text-orange-800'
            }`}>
                <div className="flex items-center gap-3 mb-3">
                    <FiServer className="w-6 h-6" />
                    <h4 className="font-semibold">🔧 Configuración del Servidor Requerida</h4>
                </div>
                <p className="text-sm mb-3">
                    Para que Apple Wallet funcione correctamente, necesitas configurar el servidor:
                </p>
                
                <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                        <span className="text-orange-500">1.</span>
                        <div>
                            <strong>Certificados Apple:</strong> Cuenta de desarrollador con certificados PassKit
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="text-orange-500">2.</span>
                        <div>
                            <strong>Backend API:</strong> Endpoint para generar archivos .pkpass firmados
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="text-orange-500">3.</span>
                        <div>
                            <strong>Librería:</strong> passkit-generator en el servidor
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="text-orange-500">4.</span>
                        <div>
                            <strong>HTTPS:</strong> Servir archivos con MIME type: application/vnd.apple.pkpass
                        </div>
                    </div>
                </div>
                
                <div className="mt-3 p-3 rounded-lg bg-white/10">
                    <p className="text-xs font-medium mb-2">📋 Archivos .pkpass requeridos:</p>
                    <ul className="text-xs space-y-1">
                        <li>• <code>pass.json</code> - Configuración de la tarjeta</li>
                        <li>• <code>manifest.json</code> - Hashes SHA-1 de todos los archivos</li>
                        <li>• <code>signature</code> - Firma RSA con certificado Apple</li>
                        <li>• Imágenes de la tarjeta (icon, logo, strip, thumbnail)</li>
                    </ul>
                </div>
                
                <p className="text-xs mt-3 opacity-80">
                    💡 <strong>Alternativa:</strong> Usa el código QR de arriba para agregar la tarjeta manualmente
                </p>
            </div>

            {/* Development Status */}
            <div className={`p-4 rounded-xl border-2 border-blue-300 ${
                theme === 'dark' 
                    ? 'bg-blue-900/20 text-blue-200' 
                    : 'bg-blue-50 text-blue-800'
            }`}>
                <div className="flex items-center gap-3 mb-2">
                    <FiInfo className="w-5 h-5" />
                    <h4 className="font-semibold">📱 Estado Actual</h4>
                </div>
                <p className="text-sm mb-3">
                    <strong>Modo Desarrollo:</strong> Los botones de billetera muestran información de configuración
                </p>
                <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                        <span>QR Code: ✅ Funcionando (datos de tarjeta)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        <span>Apple Wallet: ❌ Requiere servidor</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        <span>Google Pay: ❌ Requiere servidor</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        <span>Descarga: ❌ Requiere servidor</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VirtualCreditCard;
