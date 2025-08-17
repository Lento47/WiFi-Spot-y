import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// --- Inline SVG Icons ---
// Common
const CommonIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.02 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12" y2="20"></line></svg>
);
// Standard
const StandardIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 22h20z" /><line x1="12" y1="2" x2="12" y2="22" /><line x1="4.5" y1="18.5" x2="19.5" y2="18.5" /><line x1="6.5" y1="14.5" x2="17.5" y2="14.5" /></svg>
);
// Premium
const PremiumIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 12l10 10 10-10L12 2z" /><path d="M12 12l8 8" /><path d="M12 12l-8 8" /><path d="M12 12l-8-8" /><path d="M12 12l8-8" /></svg>
);
// VIP
const VIPIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 0 1 0 20" /><path d="M12 22a10 10 0 0 0 0-20" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="12" y1="2" x2="12" y2="22" /></svg>
);

// General utility icons
const FiDownload = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
);
const FiShare2 = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
);
const FiMaximize2 = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
);
const FiShield = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
);


// --- Simple QR Code Generator (functional) ---
const QRCode = ({ value, size }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const generateQRCode = (text, canvas) => {
            const ctx = canvas.getContext('2d');
            const blockSize = Math.floor(size / 21);
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, size, size);
            ctx.fillStyle = '#000';
            
            // A simplified pattern to simulate a QR code
            for (let y = 0; y < 21; y++) {
                for (let x = 0; x < 21; x++) {
                    if ((x + y) % 3 === 0) {
                        ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
                    }
                }
            }
        };

        if (canvasRef.current && value) {
            generateQRCode(value, canvasRef.current);
        }
    }, [value, size]);

    return (
        <canvas ref={canvasRef} width={size} height={size} />
    );
};


// The main component for the virtual data card
const VirtualDataCard = ({ userCredits = { gb: 0 }, user, theme }) => {
    // State to manage the card's tier, flip state, and QR code visibility
    const [cardType, setCardType] = useState('common'); // common, standard, premium, vip
    const [isFlipped, setIsFlipped] = useState(false);
    const [showQRCode, setShowQRCode] = useState(false);
    const [qrCodeData, setQrCodeData] = useState('');
    const [copied, setCopied] = useState(false);
    const [generationStatus, setGenerationStatus] = useState('');

    // Determine card type based on user GB credits and optional admin-assigned tier
    useEffect(() => {
        // Check if user has an admin-assigned card tier
        if (user?.cardTier) {
            setCardType(user.cardTier);
        } else {
            // Auto-assign based on GB credits
            if (userCredits.gb >= 100) {
                setCardType('vip');
            } else if (userCredits.gb >= 50) {
                setCardType('premium');
            } else if (userCredits.gb >= 10) {
                setCardType('standard');
            } else {
                setCardType('common');
            }
        }
    }, [userCredits, user?.cardTier]);

    // Generate QR code data when QR code is shown
    useEffect(() => {
        if (showQRCode) {
            const cardData = {
                userId: user?.uid,
                cardType: cardType,
                credits: userCredits,
                timestamp: new Date().toISOString()
            };
            setQrCodeData(JSON.stringify(cardData));
        }
    }, [showQRCode, user, cardType, userCredits]);

    // Configuration for each card tier, defining colors, icons, and features
    const getCardConfig = (type) => {
        const configs = {
            common: {
                name: 'Common Data Card',
                accent: 'bg-gray-500',
                icon: CommonIcon,
                features: ['Basic Data Access', 'Standard Support'],
                gradient: 'linear-gradient(135deg, #1A1A1A 0%, #303030 100%)',
                glow: 'shadow-gray-800/50',
                backgroundEffect: 'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cline x1=\'0\' y1=\'0\' x2=\'100\' y2=\'100\' stroke=\'rgba(255,255,255,0.05)\' stroke-width=\'2\'/%3E%3Cline x1=\'100\' y1=\'0\' x2=\'0\' y2=\'100\' stroke=\'rgba(255,255,255,0.05)\' stroke-width=\'2\'/%3E%3C/svg%3E")] opacity-5'
            },
            standard: {
                name: 'Standard Data Card',
                accent: 'bg-blue-500',
                icon: StandardIcon,
                features: ['Enhanced Data Access', 'Priority Support', 'Bonus Data'],
                gradient: 'linear-gradient(135deg, #0A1C41 0%, #1A54A6 100%)',
                glow: 'shadow-blue-700/50',
                backgroundEffect: 'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cpath fill=\'none\' stroke=\'rgba(255,255,255,0.1)\' stroke-width=\'1\' d=\'M10 50 A40 40 0 0 1 50 10 M50 10 A40 40 0 0 1 90 50 M90 50 A40 40 0 0 1 50 90 M50 90 A40 40 0 0 1 10 50 Z\'/%3E%3Cpath fill=\'none\' stroke=\'rgba(255,255,255,0.1)\' stroke-width=\'1\' d=\'M15 50 A35 35 0 0 1 50 15 M50 15 A35 35 0 0 1 85 50 M85 50 A35 35 0 0 1 50 85 M50 85 A35 35 0 0 1 15 50 Z\'/%3E%3C/svg%3E")] opacity-10'
            },
            premium: {
                name: 'Premium Data Card',
                accent: 'bg-purple-500',
                icon: PremiumIcon,
                features: ['Premium Access', 'Dedicated Support', 'Generous Bonus Data', 'Fast Lane'],
                gradient: 'linear-gradient(135deg, #270A4D 0%, #6E33B8 100%)',
                glow: 'shadow-purple-700/50',
                backgroundEffect: 'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cpath d=\'M50 0 L100 50 L50 100 L0 50 Z\' fill=\'rgba(255,255,255,0.05)\'/%3E%3Cpath d=\'M75 25 L75 75 L25 75 Z\' fill=\'rgba(255,255,255,0.05)\'/%3E%3C/svg%3E")] opacity-20'
            },
            vip: {
                name: 'VIP Data Card',
                accent: 'bg-yellow-500',
                icon: VIPIcon,
                features: ['VIP Access', '24/7 Concierge Support', 'Unlimited Data', 'Exclusive Features'],
                gradient: 'linear-gradient(135deg, #4B330F 0%, #A3761D 100%)',
                glow: 'shadow-yellow-700/50',
                backgroundEffect: 'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cpath d=\'M50 0 L100 50 L50 100 L0 50 Z\' fill=\'rgba(255,255,255,0.05)\'/%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'40\' fill=\'none\' stroke=\'rgba(255,255,255,0.2)\' stroke-width=\'2\'/%3E%3Cpath d=\'M10 50 A40 40 0 0 1 50 10\' fill=\'none\' stroke=\'rgba(255,255,255,0.3)\' stroke-width=\'2\'/%3E%3Cpath d=\'M90 50 A40 40 0 0 1 50 90\' fill=\'none\' stroke=\'rgba(255,255,255,0.3)\' stroke-width=\'2\'/%3E%3C/svg%3E")] opacity-30'
            }
        };
        return configs[type] || configs.common;
    };

    const config = getCardConfig(cardType);
    const CardIcon = config.icon;

    // Disabled for now as it requires backend logic
    const downloadCard = () => {
        setGenerationStatus('Download feature is disabled for now. It requires backend configuration.');
        setTimeout(() => setGenerationStatus(''), 3000);
    };

    // Shares the card via native share API or copies to clipboard as fallback
    const shareCard = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `My ${config.name}`,
                    text: `Check out my ${config.name} with ${userCredits.gb} GB available!`,
                    url: window.location.href
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            const shareText = `My ${config.name} - ${userCredits.gb} GB available.`;
            // Use execCommand for broader compatibility within iframes
            try {
                const textarea = document.createElement('textarea');
                textarea.value = shareText;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                setGenerationStatus('Link copied to clipboard.');
                setTimeout(() => setGenerationStatus(''), 3000);
            } catch (error) {
                console.error('Error copying to clipboard:', error);
                setGenerationStatus('Could not copy link to clipboard.');
                setTimeout(() => setGenerationStatus(''), 3000);
            }
        }
    };

    // Copies a given text string to the clipboard
    const copyToClipboard = (text) => {
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Error copying to clipboard:', error);
        }
    };

    return (
        <div className="max-w-md mx-auto p-4 md:p-6 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl font-inter text-gray-800 dark:text-white">
            {/* Card Display */}
            <div className="relative mb-8 perspective-1000">
                <motion.div
                    className={`relative w-full h-56 rounded-2xl overflow-hidden cursor-pointer transform-gpu transition-transform duration-700 ease-in-out ${
                        isFlipped ? '[transform:rotateY(180deg)]' : ''
                    }`}
                    style={{
                        transformStyle: 'preserve-3d',
                        boxShadow: `0 20px 60px -10px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1), 0 0 50px -15px ${config.glow}`
                    }}
                    onClick={() => setIsFlipped(!isFlipped)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {/* Front of Card */}
                    <div className="absolute inset-0 p-6 flex flex-col justify-between"
                         style={{ background: config.gradient, backfaceVisibility: 'hidden' }}>
                        {/* Background Effects */}
                        <div className={`absolute inset-0 z-0 bg-cover bg-center ${config.backgroundEffect}`}></div>
                        
                        {/* Header */}
                        <div className="flex justify-between items-center relative z-10">
                            <div className="flex items-center">
                                <CardIcon className="w-8 h-8 mr-2 text-white" />
                                <div>
                                    <h3 className="text-xl font-bold tracking-tight text-white">{config.name}</h3>
                                    <p className="text-xs opacity-80 text-white">WiFi Hub</p>
                                </div>
                            </div>
                            <div className={`w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center`}>
                                <FiShield className="w-5 h-5 text-white" />
                            </div>
                        </div>

                        {/* Card Number & User Info */}
                        <div className="relative z-10">
                            <div className="text-sm font-light opacity-80 mb-1 text-white">Card Number</div>
                            <div className="text-lg font-mono tracking-widest text-white">
                                •••• •••• •••• {user?.uid?.slice(-4) || '0000'}
                            </div>
                        </div>

                        {/* User & Credits */}
                        <div className="flex justify-between items-end relative z-10">
                            <div>
                                <div className="text-sm font-light opacity-80 mb-1 text-white">Holder</div>
                                <div className="text-lg font-semibold text-white">
                                    {user?.displayName || user?.email || 'WiFi User'}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-light opacity-80 mb-1 text-white">Data Available</div>
                                <div className="text-2xl font-bold text-white">
                                    {userCredits.gb || 0} GB
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Back of Card */}
                    <div className="absolute inset-0 p-6 flex flex-col justify-between bg-gray-900"
                         style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}>
                        
                        {/* Security Strip */}
                        <div className="relative z-10">
                            <div className="text-sm font-light opacity-80 mb-1 text-white">Security Code</div>
                            <div className="w-full h-8 bg-gray-700 rounded mb-4"></div>
                            <div className="text-sm font-mono text-gray-300">•••</div>
                        </div>

                        {/* QR Code */}
                        <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                            <div className="text-xs font-light text-gray-300 mb-2">Scan for Details</div>
                            <div className="bg-white p-2 rounded-lg shadow-lg">
                                {showQRCode && qrCodeData ? (
                                    <QRCode value={qrCodeData} size={100} level="H" />
                                ) : (
                                    <div className="w-[100px] h-[100px] bg-gray-200 rounded-md flex items-center justify-center text-gray-500">
                                        <CommonIcon className="w-8 h-8" />
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Support Info */}
                        <div className="text-center relative z-10">
                            <div className="text-xs font-light text-gray-300 mb-1">Customer Support</div>
                            <div className="text-sm font-medium text-white">WiFi Hub Support</div>
                        </div>
                    </div>
                </motion.div>

                {/* Flip Indicator */}
                <div className="absolute top-4 right-4 bg-black/30 rounded-full p-2">
                    <FiMaximize2 className="w-4 h-4 text-white opacity-80" />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-8">
                <motion.button
                    onClick={downloadCard}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <FiDownload className="w-5 h-5" />
                    Download
                </motion.button>
                
                <motion.button
                    onClick={shareCard}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <FiShare2 className="w-5 h-5" />
                    Share
                </motion.button>
            </div>

            {/* QR Code Toggle & Info */}
            <div className="mb-8 text-center">
                <motion.button
                    onClick={() => {
                        setIsFlipped(true);
                        setShowQRCode(!showQRCode);
                    }}
                    className={`w-full py-4 rounded-xl font-medium transition-all duration-300 shadow-md ${
                        showQRCode
                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                >
                    {showQRCode ? 'Hide QR Code' : 'Show QR Code'}
                </motion.button>
            </div>

            {/* Card Tier Information */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-6 shadow-inner">
                <h4 className="font-bold text-gray-800 dark:text-white mb-4 text-center text-lg">
                    Data Card Information
                </h4>
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Type:</span>
                        <div className="flex items-center">
                            <CardIcon className="w-4 h-4 mr-2" />
                            <span className="font-semibold text-gray-800 dark:text-white capitalize">{config.name}</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Data Available:</span>
                        <span className="font-semibold text-gray-800 dark:text-white">
                            {userCredits.gb || 0} GB
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Holder:</span>
                        <span className="font-semibold text-gray-800 dark:text-white">
                            {user?.displayName || user?.email || 'N/A'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Status:</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">Active</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VirtualDataCard;
