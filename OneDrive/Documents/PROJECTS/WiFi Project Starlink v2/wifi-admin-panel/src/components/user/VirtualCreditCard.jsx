import React, { useState, useRef, useEffect } from 'react';
import { FiCreditCard, FiDownload, FiSmartphone, FiQrCode, FiCopy, FiCheck, FiX } from 'react-icons/fi';
import QRCode from 'qrcode';
import { useAuth } from '../../hooks/useAuth';
import { generateWalletPassData } from '../../utils/walletPassGenerator';

const VirtualCreditCard = ({ credits = { hours: 0, minutes: 0 } }) => {
  const { user } = useAuth();
  const [qrCodeData, setQrCodeData] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [walletPassData, setWalletPassData] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState('');
  const [isMobileSafari, setIsMobileSafari] = useState(false);
  const cardRef = useRef(null);

  // Detect Safari mobile
  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    const isMobile = /iPhone|iPad|iPod/.test(userAgent);
    setIsMobileSafari(isSafari && isMobile);
  }, []);

  // Generate QR code data
  useEffect(() => {
    if (user && credits) {
      const passData = generateWalletPassData(user.uid, user.email, credits);
      setWalletPassData(passData);
      
      QRCode.toDataURL(JSON.stringify(passData), {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).then(url => {
        setQrCodeData(url);
      }).catch(err => {
        console.error('Error generating QR code:', err);
      });
    }
  }, [user, credits]);

  const formatCredits = (credits) => {
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
  };

  const getStatusText = (credits) => {
    const totalMinutes = (credits.hours || 0) * 60 + (credits.minutes || 0);
    if (totalMinutes > 120) return 'Excellent';
    if (totalMinutes > 60) return 'Good';
    return 'Low';
  };

  const getStatusColor = (credits) => {
    const totalMinutes = (credits.hours || 0) * 60 + (credits.minutes || 0);
    if (totalMinutes > 120) return 'text-green-500';
    if (totalMinutes > 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const generateAppleWalletPass = async () => {
    setIsGenerating(true);
    setGenerationStatus('Generating Apple Wallet pass...');
    
    try {
      const response = await fetch('http://localhost:3001/api/wallet/apple-pass', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
          credits: credits
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setGenerationStatus('Apple Wallet pass generated successfully!');
        
        // For Safari, redirect to the .pkpass file
        if (isMobileSafari) {
          window.location.href = result.passUrl;
        } else {
          // For other browsers, download the file
          const link = document.createElement('a');
          link.href = result.passUrl;
          link.download = result.filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        setGenerationStatus(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error generating Apple Wallet pass:', error);
      setGenerationStatus(`Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateGooglePayPass = async () => {
    setIsGenerating(true);
    setGenerationStatus('Generating Google Pay pass...');
    
    try {
      const response = await fetch('http://localhost:3001/api/wallet/google-pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
          credits: credits
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setGenerationStatus('Google Pay pass generated successfully!');
        setSelectedWallet('Google Pay');
        setShowInstructions(true);
      } else {
        setGenerationStatus(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error generating Google Pay pass:', error);
      setGenerationStatus(`Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSamsungPayPass = async () => {
    setIsGenerating(true);
    setGenerationStatus('Generating Samsung Pay pass...');
    
    try {
      const response = await fetch('http://localhost:3001/api/wallet/samsung-pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
          credits: credits
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setGenerationStatus('Samsung Pay pass generated successfully!');
        setSelectedWallet('Samsung Pay');
        setShowInstructions(true);
      } else {
        setGenerationStatus(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error generating Samsung Pay pass:', error);
      setGenerationStatus(`Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateGenericWalletPass = async () => {
    setIsGenerating(true);
    setGenerationStatus('Generating generic wallet pass...');
    
    try {
      const response = await fetch('http://localhost:3001/api/wallet/generic-pass', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
          credits: credits
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setGenerationStatus('Generic wallet pass generated successfully!');
        setSelectedWallet('Generic Wallet');
        setShowInstructions(true);
      } else {
        setGenerationStatus(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error generating generic wallet pass:', error);
      setGenerationStatus(`Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadCardImage = async () => {
    if (!cardRef.current) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true
      });

      const imageData = canvas.toDataURL('image/png');
      
      if (isMobileSafari) {
        // Safari mobile workaround
        const newWindow = window.open();
        newWindow.document.write(`
          <html>
            <body style="margin:0;padding:20px;background:#f0f0f0;">
              <h3>Save WiFi Card Image</h3>
              <p>Long press the image below and select "Save to Photos"</p>
              <img src="${imageData}" style="width:100%;max-width:400px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.15);" />
              <p><small>Or screenshot this page to save the card</small></p>
            </body>
          </html>
        `);
      } else {
        // Standard download for other browsers
        const link = document.createElement('a');
        link.download = `wifi-card-${user.uid}.png`;
        link.href = imageData;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading card image:', error);
      alert('Error downloading image. Please try again.');
    }
  };

  const copyToClipboard = async (text) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      alert('Error copying to clipboard. Please copy manually.');
    }
  };

  if (!user) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <p className="text-gray-600 dark:text-gray-400">Please log in to view your virtual credit card.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
          <FiCreditCard className="mr-2" />
          Virtual Credit Card
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowQR(!showQR)}
            className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            title="Toggle QR Code"
          >
            <FiQrCode size={20} />
          </button>
          <button
            onClick={downloadCardImage}
            className="p-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors"
            title="Download as Image"
          >
            <FiDownload size={20} />
          </button>
        </div>
      </div>

      {/* Virtual Card Display */}
      <div 
        ref={cardRef}
        className="relative bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-xl mb-6 overflow-hidden"
      >
        {/* Card Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
        </div>

        {/* Card Content */}
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-semibold opacity-90">WiFi Costa Rica</h3>
              <p className="text-sm opacity-75">Virtual Credit Card</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{formatCredits(credits)}</div>
              <div className={`text-sm font-medium ${getStatusColor(credits)}`}>
                {getStatusText(credits)}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="text-sm opacity-75 mb-1">Card Number</div>
            <div className="font-mono text-lg tracking-wider">
              {user.uid.slice(-8).toUpperCase()}
            </div>
          </div>

          <div className="flex justify-between items-end">
            <div>
              <div className="text-sm opacity-75 mb-1">Account</div>
              <div className="font-medium">{user.email}</div>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-75 mb-1">Valid Until</div>
              <div className="font-medium">
                {new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Section */}
      {showQR && qrCodeData && (
        <div className="mb-6 text-center">
          <div className="bg-white p-4 rounded-lg inline-block">
            <img src={qrCodeData} alt="Wallet Pass QR Code" className="w-48 h-48" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Scan this QR code with your wallet app
          </p>
        </div>
      )}

      {/* Wallet Integration Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
          <FiSmartphone className="mr-2" />
          Add to Digital Wallet
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={generateAppleWalletPass}
            disabled={isGenerating}
            className="bg-black text-white px-4 py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <FiCreditCard className="mr-2" />
            Apple Wallet
          </button>
          
          <button
            onClick={generateGooglePayPass}
            disabled={isGenerating}
            className="bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <FiCreditCard className="mr-2" />
            Google Pay
          </button>
          
          <button
            onClick={generateSamsungPayPass}
            disabled={isGenerating}
            className="bg-blue-800 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <FiCreditCard className="mr-2" />
            Samsung Pay
          </button>
          
          <button
            onClick={generateGenericWalletPass}
            disabled={isGenerating}
            className="bg-gray-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <FiCreditCard className="mr-2" />
            Generic Wallet
          </button>
        </div>
      </div>

      {/* Generation Status */}
      {isGenerating && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-blue-800 dark:text-blue-200 text-sm">{generationStatus}</p>
        </div>
      )}

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                {selectedWallet} Setup Instructions
              </h3>
              <button
                onClick={() => setShowInstructions(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <p>1. Open {selectedWallet} on your phone</p>
              <p>2. Look for "Add card" or "Import" option</p>
              <p>3. Scan the QR code from the virtual card above</p>
              <p>4. Or manually enter the card details</p>
              <p>5. Confirm and add to your wallet</p>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowInstructions(false)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safari Mobile Notice */}
      {isMobileSafari && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            <strong>iOS Safari Notice:</strong> For Apple Wallet integration, tap the Apple Wallet button above. 
            For other wallets, use the QR code or download the card image.
          </p>
        </div>
      )}

      {/* Development Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Development Info</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Backend server should be running on port 3001 for wallet pass generation.
          </p>
          <button
            onClick={() => copyToClipboard(JSON.stringify(walletPassData, null, 2))}
            className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
          >
            {copied ? <FiCheck className="inline mr-1" /> : <FiCopy className="inline mr-1" />}
            Copy Pass Data
          </button>
        </div>
      )}
    </div>
  );
};

export default VirtualCreditCard;
