import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';

const PendingPayments = ({ db }) => {
    const [payments, setPayments] = useState([]);
    
    useEffect(() => {
        if (!db) return;
        const q = query(collection(db, "payments"), where("status", "==", "pending"));
        const unsub = onSnapshot(q, (snapshot) => setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        return () => unsub();
    }, [db]);
    
    const handleAction = async (paymentId, action, userId, duration) => {
        if (!db) return;
        const paymentRef = doc(db, "payments", paymentId);
        
        if (action === 'approve') {
            const token = `WIFI-${Date.now().toString().slice(-4)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
            await updateDoc(paymentRef, { status: "approved", token, approvedAt: serverTimestamp() });
            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, { creditsMinutes: increment(duration || 0) });
        } else {
            await updateDoc(paymentRef, { status: "rejected", rejectedAt: serverTimestamp() });
        }
    };

    return (
        <div>
            <h3 className="text-3xl font-bold text-slate-800 mb-6">Pagos Pendientes</h3>
            {payments.length === 0 ? <div className="text-center py-12"><p className="text-slate-500">No hay pagos pendientes.</p></div> : (
                <div className="space-y-5">{payments.map(p => <div key={p.id} className="bg-white p-5 rounded-2xl shadow-lg"><div className="flex flex-col sm:flex-row justify-between items-start"><div className="mb-4 sm:mb-0"><p className="font-bold text-xl text-slate-800">{p.packageName}</p><p className="font-semibold text-slate-600">Monto: ₡{p.price}</p><p className="text-sm text-slate-500">Usuario: <span className="font-mono text-xs">{p.userId}</span></p><a href={p.receiptImageUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-sm font-semibold text-blue-600 hover:underline">Ver Recibo →</a></div><div className="flex items-center space-x-3"><button onClick={() => handleAction(p.id, 'approve', p.userId, p.durationMinutes)} className="px-4 py-2 text-sm font-bold text-white bg-green-500 rounded-full">Aprobar</button><button onClick={() => handleAction(p.id, 'reject')} className="px-4 py-2 text-sm font-bold text-white bg-red-500 rounded-full">Rechazar</button></div></div></div>)}</div>
            )}
        </div>
    );
};

export default PendingPayments;
