import React, { useRef, useState } from 'react';
import { motion } from "framer-motion";
import html2canvas from 'html2canvas';

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
  const receiptRef = useRef(null);

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
          className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-200"
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
              className="text-2xl font-bold text-gray-800 mb-2"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.4 }}
            >
              ¡Pago Exitoso!
            </motion.h2>
            
            <motion.p
              className="text-gray-600"
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
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">ID de Transacción:</span>
                  <span className="text-sm font-mono text-gray-800">
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
                  <span className="text-sm text-gray-600">Estado:</span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                    Pendiente de Aprobación
                  </span>
                </div>
              </div>
            </div>
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
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => downloadReceipt('png')}
                disabled={isDownloading}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
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
