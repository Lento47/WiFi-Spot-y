import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';

const PendingPayments = ({ db }) => {
    const [payments, setPayments] = useState([]);
    
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
                    approvedAt: serverTimestamp() 
                });
                console.log('Payment document updated successfully');
                
                // Then update the user document to add credits
                if (userId && duration) {
                    console.log('Updating user document:', userId, 'with duration:', duration);
                    const userRef = doc(db, "users", userId);
                    await updateDoc(userRef, { 
                        creditsMinutes: increment(duration || 0) 
                    });
                    console.log('User document updated successfully');
                }
            } else {
                console.log('Rejecting payment:', paymentId);
                await updateDoc(paymentRef, { 
                    status: "rejected", 
                    rejectedAt: serverTimestamp() 
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
                        <div key={p.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-lg">
                            <div className="flex flex-col sm:flex-row justify-between items-start">
                                <div className="mb-4 sm:mb-0 flex-1">
                                    <p className="font-bold text-xl text-slate-800 dark:text-white">{p.packageName || 'Paquete sin nombre'}</p>
                                    <p className="font-semibold text-slate-600 dark:text-gray-300">Monto: ₡{p.price || 'N/A'}</p>
                                    <p className="text-sm text-slate-500 dark:text-gray-400">
                                        Duración: {p.durationMinutes ? `${Math.floor(p.durationMinutes / 60)}h ${p.durationMinutes % 60}m` : 'N/A'}
                                    </p>
                                    <p className="text-sm text-slate-500 dark:text-gray-400">
                                        Usuario: <span className="font-mono text-xs">{p.userId || 'N/A'}</span>
                                    </p>
                                    <p className="text-sm text-slate-500 dark:text-gray-400">
                                        SINPE ID: <span className="font-mono text-xs">{p.sinpeId || 'N/A'}</span>
                                    </p>
                                    {p.receiptImageUrl && (
                                        <a 
                                            href={p.receiptImageUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="inline-block mt-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            Ver Recibo →
                                        </a>
                                    )}
                                </div>
                                <div className="flex items-center space-x-3">
                                    <button 
                                        onClick={() => handleAction(p.id, 'approve', p.userId, p.durationMinutes)} 
                                        className="px-4 py-2 text-sm font-bold text-white bg-green-500 rounded-full hover:bg-green-600 transition-colors"
                                        disabled={!p.userId || !p.durationMinutes}
                                    >
                                        Aprobar
                                    </button>
                                    <button 
                                        onClick={() => handleAction(p.id, 'reject')} 
                                        className="px-4 py-2 text-sm font-bold text-white bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                                    >
                                        Rechazar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PendingPayments;
