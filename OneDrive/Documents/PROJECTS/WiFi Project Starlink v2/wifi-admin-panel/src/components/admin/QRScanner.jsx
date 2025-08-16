import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import Spinner from '../common/Spinner.jsx';

const QRScanner = ({ onClose, onTransactionValidated }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setIsScanning(true);
      setError('');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      setError('No se pudo acceder a la cámara. Verifique los permisos.');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const handleManualQRInput = () => {
    const qrData = prompt('Ingrese el código QR o datos de la transacción:');
    if (qrData) {
      try {
        const parsedData = JSON.parse(qrData);
        setScannedData(parsedData);
        validateTransaction(parsedData);
      } catch (err) {
        setError('Formato de datos inválido. Asegúrese de que sea un código QR válido.');
      }
    }
  };

  const validateTransaction = async (transactionData) => {
    if (!transactionData.transactionId) {
      setError('Datos de transacción incompletos');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      // Search for the transaction in payments collection
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('sinpeId', '==', transactionData.transactionId)
      );
      
      const paymentsSnapshot = await getDocs(paymentsQuery);
      
      if (paymentsSnapshot.empty) {
        setError('Transacción no encontrada en la base de datos');
        setValidationResult({ valid: false, message: 'Transacción no encontrada' });
        return;
      }

      const paymentDoc = paymentsSnapshot.docs[0];
      const paymentData = paymentDoc.data();

      // Validate transaction details
      const isValid = 
        paymentData.amount === transactionData.amount &&
        paymentData.packageName === transactionData.packageName &&
        paymentData.durationMinutes === transactionData.durationMinutes;

      if (isValid) {
        setValidationResult({ 
          valid: true, 
          message: 'Transacción válida',
          paymentData: paymentData,
          paymentId: paymentDoc.id
        });
        
        // Update payment status to validated
        await updateDoc(doc(db, 'payments', paymentDoc.id), {
          validatedAt: new Date(),
          validationMethod: 'qr_scan',
          validationData: transactionData
        });

        if (onTransactionValidated) {
          onTransactionValidated(paymentData, paymentDoc.id);
        }
      } else {
        setValidationResult({ 
          valid: false, 
          message: 'Los datos de la transacción no coinciden',
          paymentData: paymentData,
          scannedData: transactionData
        });
      }
    } catch (err) {
      console.error('Error validating transaction:', err);
      setError('Error al validar la transacción: ' + err.message);
    } finally {
      setIsValidating(false);
    }
  };

  const resetScanner = () => {
    setScannedData(null);
    setValidationResult(null);
    setError('');
    stopScanning();
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-600"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-slate-600">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
              Validador de Transacciones QR
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Escanea códigos QR para validar transacciones de pago
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {!isScanning && !scannedData && (
            <div className="text-center space-y-4">
              <div className="w-24 h-24 mx-auto bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                </svg>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={startScanning}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                >
                  Iniciar Escaneo de Cámara
                </button>
                
                <button
                  onClick={handleManualQRInput}
                  className="w-full bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                >
                  Ingresar Datos Manualmente
                </button>
              </div>
            </div>
          )}

          {/* Camera View */}
          {isScanning && (
            <div className="space-y-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-64 bg-gray-900 rounded-xl"
                />
                <div className="absolute inset-0 border-2 border-blue-500 border-dashed rounded-xl pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-500 text-sm bg-white dark:bg-slate-800 px-2 py-1 rounded">
                    Posicione el código QR aquí
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={stopScanning}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                >
                  Detener Cámara
                </button>
              </div>
            </div>
          )}

          {/* Validation Results */}
          {validationResult && (
            <motion.div
              className={`mt-6 p-4 rounded-xl border ${
                validationResult.valid 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  validationResult.valid ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {validationResult.valid ? (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <div>
                  <h4 className={`font-semibold ${
                    validationResult.valid ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                  }`}>
                    {validationResult.message}
                  </h4>
                  {validationResult.paymentData && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      ID: {validationResult.paymentData.sinpeId} | 
                      Monto: ₡{validationResult.paymentData.amount} | 
                      Paquete: {validationResult.paymentData.packageName}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          {(scannedData || validationResult) && (
            <div className="mt-6 flex justify-center space-x-3">
              <button
                onClick={resetScanner}
                className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors"
              >
                Escanear Otro
              </button>
              
              {validationResult?.valid && (
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Completar Validación
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default QRScanner;
