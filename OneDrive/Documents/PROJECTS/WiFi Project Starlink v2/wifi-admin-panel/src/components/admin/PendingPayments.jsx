import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { FiEye, FiDownload, FiCheck, FiX, FiUser, FiPackage, FiPhone, FiClock, FiX as FiClose } from 'react-icons/fi';

const PendingPayments = ({ db }) => {
    const [payments, setPayments] = useState([]);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    
    useEffect(() => {
        if (!db) return;
        const q = query(collection(db, "payments"), where("status", "==", "pending"));
        const unsub = onSnapshot(q, (snapshot) => {
            const paymentData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log('Pending payments data:', paymentData);
            setPayments(paymentData);
        });
        return () => unsub();
    }, [db]);
    
    const handleAction = async (paymentId, action, userId, duration) => {
        if (!db) return;
        
        try {
            const paymentRef = doc(db, "payments", paymentId);
            
            if (action === 'approve') {
                const token = `WIFI-${Date.now().toString().slice(-4)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
                
                // First update the payment document
                console.log('Updating payment document:', paymentId);
                await updateDoc(paymentRef, { 
                    status: "approved", 
                    token, 
                    approvedAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                console.log('Payment document updated successfully');
                
                // Then update the user document to add credits
                if (userId && duration) {
                    console.log('Updating user document:', userId, 'with duration:', duration);
                    const userRef = doc(db, "users", userId);
                    
                    // Convert duration to minutes if it's a string like "2 hours"
                    let durationInMinutes = duration;
                    if (typeof duration === 'string') {
                        if (duration.includes('hora') || duration.includes('hour')) {
                            const hours = parseInt(duration.match(/(\d+)/)?.[1] || '1');
                            durationInMinutes = hours * 60;
                        } else if (duration.includes('minuto') || duration.includes('minute')) {
                            durationInMinutes = parseInt(duration.match(/(\d+)/)?.[1] || '60');
                        }
                    }
                    
                    await updateDoc(userRef, { 
                        creditsMinutes: increment(durationInMinutes || 60),
                        updatedAt: serverTimestamp()
                    });
                    console.log('User document updated successfully');
                }
            } else {
                console.log('Rejecting payment:', paymentId);
                await updateDoc(paymentRef, { 
                    status: "rejected", 
                    rejectedAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                console.log('Payment rejected successfully');
            }
        } catch (error) {
            console.error('Error in handleAction:', error);
            alert(`Error: ${error.message}`);
        }
    };

    return (
        <div>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">Pagos Pendientes</h3>
            {payments.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-slate-500 dark:text-gray-400">No hay pagos pendientes.</p>
                </div>
            ) : (
                <div className="space-y-5">
                    {payments.map(p => (
                        <div key={p.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Payment Details */}
                                <div className="lg:col-span-2 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-bold text-xl text-slate-800 dark:text-white mb-2">
                                                {p.packageName || 'Paquete sin nombre'}
                                            </h3>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-slate-500 dark:text-gray-400">Monto:</p>
                                                    <p className="font-semibold text-slate-700 dark:text-gray-300">₡{p.packagePrice || p.price || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-500 dark:text-gray-400">Duración:</p>
                                                    <p className="font-semibold text-slate-700 dark:text-gray-300">
                                                        {p.packageDuration || p.duration || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                                Pendiente
                                            </span>
                                        </div>
                                    </div>

                                    {/* User Information */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <FiUser className="w-4 h-4 text-gray-500" />
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Usuario</p>
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {p.userName || p.userEmail || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FiPhone className="w-4 h-4 text-gray-500" />
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Teléfono SINPE</p>
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {p.phoneNumber || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FiClock className="w-4 h-4 text-gray-500" />
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Fecha</p>
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {p.timestamp?.toDate ? p.timestamp.toDate().toLocaleDateString('es-CR') : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FiPackage className="w-4 h-4 text-gray-500" />
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">ID del Pago</p>
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 font-mono">
                                                    {p.id}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Receipt Preview and Actions */}
                                <div className="space-y-4">
                                    {/* Receipt Section */}
                                    {p.receiptUrl ? (
                                        <div className="space-y-3">
                                            <h4 className="font-medium text-slate-700 dark:text-gray-300">Comprobante de Pago</h4>
                                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                                    {p.receiptFileName || 'Comprobante'}
                                                </p>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedReceipt({
                                                                url: p.receiptUrl,
                                                                fileName: p.receiptFileName || 'Comprobante',
                                                                userName: p.userName,
                                                                userEmail: p.userEmail
                                                            });
                                                            setShowReceiptModal(true);
                                                        }}
                                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                                                    >
                                                        <FiEye className="w-4 h-4" />
                                                        Ver
                                                    </button>
                                                    <a 
                                                        href={p.receiptUrl} 
                                                        download
                                                        className="flex items-center justify-center px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
                                                    >
                                                        <FiDownload className="w-4 h-4" />
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                                            <p className="text-sm">Sin comprobante</p>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="space-y-2">
                                        <button 
                                            onClick={() => handleAction(p.id, 'approve', p.userId, p.packageDuration || p.duration)} 
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                                            disabled={!p.userId}
                                        >
                                            <FiCheck className="w-4 h-4" />
                                            Aprobar
                                        </button>
                                        <button 
                                            onClick={() => handleAction(p.id, 'reject')} 
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                                        >
                                            <FiX className="w-4 h-4" />
                                            Rechazar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Receipt Preview Modal */}
            {showReceiptModal && selectedReceipt && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                                Comprobante de Pago
                            </h3>
                            <button
                                onClick={() => {
                                    setShowReceiptModal(false);
                                    setSelectedReceipt(null);
                                }}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <FiClose className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                            <div className="mb-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    Archivo: {selectedReceipt.fileName}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Usuario: {selectedReceipt.userName || selectedReceipt.userEmail}
                                </p>
                            </div>

                            {/* Receipt Display */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                {selectedReceipt.url.endsWith('.pdf') ? (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                                            Vista previa de PDF no disponible
                                        </p>
                                        <a
                                            href={selectedReceipt.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            <FiEye className="w-4 h-4" />
                                            Abrir PDF
                                        </a>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <img
                                            src={selectedReceipt.url}
                                            alt="Comprobante de pago"
                                            className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-600"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'block';
                                            }}
                                        />
                                        <div className="hidden mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                            <p className="text-red-600 text-sm">
                                                Error al cargar la imagen. 
                                                <a 
                                                    href={selectedReceipt.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="ml-2 underline"
                                                >
                                                    Abrir en nueva pestaña
                                                </a>
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <a
                                    href={selectedReceipt.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <FiEye className="w-4 h-4" />
                                    Abrir en Nueva Pestaña
                                </a>
                                <a
                                    href={selectedReceipt.url}
                                    download
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    <FiDownload className="w-4 h-4" />
                                    Descargar
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PendingPayments;
