import React, { useRef, useState, useEffect } from 'react';
import { motion } from "framer-motion";
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';

const Checkmark = ({ size = 100, strokeWidth = 2, color = "currentColor", className = "" }) => {
  const draw = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (i) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: {
          delay: i * 0.2,
          type: "spring",
          duration: 1.5,
          bounce: 0.2,
          ease: "easeInOut",
        },
        opacity: { delay: i * 0.2, duration: 0.2 },
      },
    }),
  };

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      initial="hidden"
      animate="visible"
      className={className}
    >
      <title>Animated Checkmark</title>
      <motion.circle
        cx="50"
        cy="50"
        r="40"
        stroke={color}
        variants={draw}
        custom={0}
        style={{
          strokeWidth,
          strokeLinecap: "round",
          fill: "transparent",
        }}
      />
      <motion.path
        d="M30 50L45 65L70 35"
        stroke={color}
        variants={draw}
        custom={1}
        style={{
          strokeWidth,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          fill: "transparent",
        }}
      />
    </motion.svg>
  );
};

const PaymentSuccessAnimation = ({ 
  paymentData, 
  onClose
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const receiptRef = useRef(null);

  // Generate QR code for transaction validation
  useEffect(() => {
    if (paymentData) {
      const generateQR = async () => {
        try {
          // Create transaction validation data
          const validationData = {
            transactionId: paymentData.sinpeId || `TXN_${Date.now()}`,
            amount: paymentData.amount,
            packageName: paymentData.packageName,
            durationMinutes: paymentData.durationMinutes,
            timestamp: paymentData.timestamp || Date.now(),
            status: 'pending_approval',
            validationHash: btoa(`${paymentData.sinpeId || 'unknown'}_${paymentData.amount}_${Date.now()}`).slice(0, 16) // Simple hash for demo
          };
          
          const qrData = JSON.stringify(validationData);
          const qrDataUrl = await QRCode.toDataURL(qrData, {
            width: 120,
            margin: 2,
            color: {
              dark: '#1e293b', // slate-800
              light: '#ffffff'
            }
          });
          setQrCodeDataUrl(qrDataUrl);
        } catch (error) {
          console.error('Error generating QR code:', error);
        }
      };
      
      generateQR();
    }
  }, [paymentData]);

    if (!paymentData) return null;

  const formatCurrency = (amount, currency = 'CRC') => {
    if (currency === 'CRC') {
      return new Intl.NumberFormat('es-CR', {
        style: 'currency',
        currency: 'CRC',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const downloadReceipt = async (format = 'png') => {
    if (!receiptRef.current) return;
    
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });
      
      const link = document.createElement('a');
      if (format === 'png') {
        link.download = `receipt-${paymentData.sinpeId || Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
      } else {
        link.download = `receipt-${paymentData.sinpeId || Date.now()}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9);
      }
      
      link.click();
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Error al descargar el recibo. Inténtalo de nuevo.');
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadQRCode = async () => {
    if (!qrCodeDataUrl) return;
    
    setIsDownloading(true);
    try {
      const link = document.createElement('a');
      link.download = `qr-validation-${paymentData.sinpeId || Date.now()}.png`;
      link.href = qrCodeDataUrl;
      link.click();
    } catch (error) {
      console.error('Error downloading QR code:', error);
      alert('Error al descargar el código QR. Inténtalo de nuevo.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-md mx-auto"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 0.4,
          ease: [0.4, 0, 0.2, 1],
          scale: {
            type: "spring",
            damping: 15,
            stiffness: 200,
          },
        }}
      >
        {/* Receipt Content */}
        <div 
          ref={receiptRef}
          className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl border border-gray-200 dark:border-slate-600"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              className="flex justify-center mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.4,
                ease: [0.4, 0, 0.2, 1],
                scale: {
                  type: "spring",
                  damping: 15,
                  stiffness: 200,
                },
              }}
            >
              <div className="relative">
                <motion.div
                  className="absolute inset-0 blur-xl bg-emerald-500/20 rounded-full"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: 0.2,
                    duration: 0.8,
                    ease: "easeOut",
                  }}
                />
                <Checkmark
                  size={80}
                  strokeWidth={4}
                  color="rgb(16 185 129)"
                  className="relative z-10"
                />
              </div>
            </motion.div>
            
            <motion.h2
              className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.4 }}
            >
              ¡Pago Exitoso!
            </motion.h2>
            
            <motion.p
              className="text-slate-600 dark:text-slate-300"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.4 }}
            >
              Tu transacción ha sido procesada correctamente
            </motion.p>
          </div>

          {/* Transaction Details */}
          <motion.div
            className="space-y-4 mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 1.2,
              duration: 0.6,
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            {/* Amount */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
              <div className="text-center">
                <span className="text-sm font-medium text-blue-600 mb-2 block">
                  Monto Pagado
                </span>
                <div className="text-3xl font-bold text-blue-700">
                  {formatCurrency(paymentData.amount, 'CRC')}
                </div>
                <div className="text-sm text-blue-600 mt-1">
                  {paymentData.packageName || 'Paquete de WiFi'}
                </div>
              </div>
            </div>

            {/* Transaction Info */}
            <div className="bg-gray-50 dark:bg-slate-700 rounded-2xl p-4 border border-gray-200 dark:border-slate-600">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400">ID de Transacción:</span>
                  <span className="text-sm font-mono text-slate-800 dark:text-slate-200">
                    {paymentData.sinpeId || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Paquete:</span>
                  <span className="text-sm text-gray-800 dark:text-gray-200">
                    {paymentData.packageName || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Duración:</span>
                  <span className="text-sm text-gray-800 dark:text-gray-200">
                    {paymentData.durationMinutes ? `${Math.floor(paymentData.durationMinutes / 60)}h ${paymentData.durationMinutes % 60}m` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">SINPE ID:</span>
                  <span className="text-sm text-gray-800 dark:text-gray-200">
                    {paymentData.sinpeId || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Fecha:</span>
                  <span className="text-sm text-gray-800 dark:text-gray-200">
                    {new Date(paymentData.timestamp || Date.now()).toLocaleDateString('es-CR')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Hora:</span>
                  <span className="text-sm text-gray-800 dark:text-gray-200">
                    {new Date(paymentData.timestamp || Date.now()).toLocaleTimeString('es-CR')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Estado:</span>
                  <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-xs rounded-full font-medium">
                    Pendiente de Aprobación
                  </span>
                </div>
              </div>
            </div>

            {/* QR Code for Transaction Validation */}
            {qrCodeDataUrl && (
              <motion.div
                className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-700 dark:to-slate-600 rounded-2xl p-6 border border-blue-200 dark:border-slate-600"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.3, duration: 0.4 }}
              >
                <div className="text-center">
                  <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-3">
                    Código QR para Validación
                  </h4>
                  <div className="flex justify-center mb-3">
                    <img 
                      src={qrCodeDataUrl} 
                      alt="QR Code para validación de transacción"
                      className="w-24 h-24 rounded-lg border-2 border-blue-200 dark:border-slate-500"
                    />
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Escanea para verificar la transacción
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    ID: {paymentData.sinpeId || 'N/A'}
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Download Options */}
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.4 }}
          >
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Descarga tu recibo de pago
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => downloadReceipt('png')}
                disabled={isDownloading}
                className="flex items-center justify-center gap-2 px-3 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isDownloading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    PNG
                  </>
                )}
              </button>
              
              <button
                onClick={() => downloadReceipt('jpeg')}
                disabled={isDownloading}
                className="flex items-center justify-center gap-2 px-3 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isDownloading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    JPEG
                  </>
                )}
              </button>

              <button
                onClick={downloadQRCode}
                disabled={isDownloading}
                className="flex items-center justify-center gap-2 px-3 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isDownloading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                    </svg>
                    QR
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Close Button */}
          <motion.div
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6, duration: 0.4 }}
          >
            <button
              onClick={onClose}
              className="px-6 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              Cerrar
            </button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PaymentSuccessAnimation;
