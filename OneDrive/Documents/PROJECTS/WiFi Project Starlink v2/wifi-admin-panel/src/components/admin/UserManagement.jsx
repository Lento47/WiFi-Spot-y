import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../firebase'; // Make sure this path is correct

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userPayments, setUserPayments] = useState([]);
    const [userTokens, setUserTokens] = useState([]);
    
    // Effect to listen for real-time updates to the users collection
    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'users'), snapshot => {
            setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsub(); // Cleanup listener on component unmount
    }, []);

    // Effect to fetch payments and tokens when a user is selected
    useEffect(() => {
        if (!selectedUser) { 
            setUserPayments([]); 
            setUserTokens([]);
            return;
        }
        
        // Listener for the selected user's payments
        const paymentsQuery = query(collection(db, "payments"), where("userId", "==", selectedUser.id), orderBy("createdAt", "desc"));
        const unsubPayments = onSnapshot(paymentsQuery, snapshot => {
            setUserPayments(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
        });

        // Listener for the selected user's tokens
        const tokensQuery = query(collection(db, "tokens"), where("userId", "==", selectedUser.id), orderBy("createdAt", "desc"));
        const unsubTokens = onSnapshot(tokensQuery, snapshot => {
            setUserTokens(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
        });

        // Cleanup listeners when the selected user changes or component unmounts
        return () => {
            unsubPayments();
            unsubTokens();
        };
    }, [selectedUser]);

    // Component to display the status of a payment
    const PaymentStatusBadge = ({ status }) => (
        <span className={`px-3 py-1 inline-flex text-xs font-bold rounded-full ring-1 ring-inset ${{
            approved: 'bg-green-100 text-green-800 ring-green-600/20',
            pending: 'bg-orange-100 text-orange-800 ring-orange-600/20',
            rejected: 'bg-red-100 text-red-800 ring-red-600/20'
        }[status] || 'bg-gray-100 text-gray-800'}`}>
            {status}
        </span>
    );
    
    // Component to display the status of a token
    const TokenStatusBadge = ({ status }) => (
        <span className={`px-3 py-1 inline-flex text-xs font-bold rounded-full ring-1 ring-inset ${{
            active: 'bg-blue-100 text-blue-800 ring-blue-600/20',
            used: 'bg-slate-100 text-slate-800 ring-slate-600/20'
        }[status] || 'bg-gray-100 text-gray-800'}`}>
            {status}
        </span>
    );
    
    // Helper function to format minutes into a readable string
    const formatCredits = (minutes) => {
        if (!minutes) return "0 minutos";
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = Math.round(minutes % 60);
        return `${hours} horas, ${remainingMinutes} minutos`;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: User List */}
            <div className="lg:col-span-1">
                <h3 className="text-3xl font-bold text-slate-800 mb-6">Usuarios</h3>
                <div className="bg-white rounded-2xl shadow-lg">
                    <ul className="divide-y divide-slate-100 max-h-[65vh] overflow-y-auto">
                        {users.map(user => (
                            <li key={user.id} onClick={() => setSelectedUser(user)} className={`p-4 hover:bg-blue-50 cursor-pointer transition-colors ${selectedUser?.id === user.id ? 'bg-blue-100' : ''}`}>
                                <p className="text-sm font-semibold text-slate-800 truncate">{user.email || user.id}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Right Column: User Details */}
            <div className="lg:col-span-2">
                <h3 className="text-3xl font-bold text-slate-800 mb-6">Detalles</h3>
                {selectedUser ? (
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <div className="flex justify-between items-start mb-4">
                            <p className="font-bold text-xl text-slate-800 truncate">{selectedUser.email || selectedUser.id}</p>
                            <div className="text-right flex-shrink-0 ml-4">
                                <p className="text-sm text-slate-500">Créditos</p>
                                <p className="font-bold text-blue-600">{formatCredits(selectedUser.creditsMinutes)}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            {/* Payment History */}
                            <div>
                                <p className="text-slate-500 mb-4 font-semibold">Historial de Pagos:</p>
                                {userPayments.length > 0 ? (
                                    <ul className="space-y-4">
                                        {userPayments.map(p => (
                                            <li key={p.id} className="p-4 bg-slate-50 rounded-xl flex justify-between items-center">
                                                <div>
                                                    <p className="font-bold text-slate-700">{p.packageName}</p>
                                                    <p className="text-xs text-slate-500">{p.createdAt?.toDate().toLocaleString('es-CR')}</p>
                                                </div>
                                                <PaymentStatusBadge status={p.status} />
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p className="text-sm text-slate-500">No hay pagos registrados.</p>}
                            </div>
                            {/* Generated Tokens */}
                            <div>
                                <p className="text-slate-500 mb-4 font-semibold">Tokens Generados:</p>
                                {userTokens.length > 0 ? (
                                    <ul className="space-y-3">
                                        {userTokens.map(t => (
                                            <li key={t.id} className="p-3 bg-blue-50 rounded-lg flex justify-between items-center">
                                                <div>
                                                    <p className="font-mono font-semibold text-blue-800">{t.tokenString}</p>
                                                    <p className="text-xs text-blue-600">{t.durationMinutes} minutos</p>
                                                </div>
                                                <TokenStatusBadge status={t.status} />
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p className="text-sm text-slate-500">No tiene tokens generados.</p>}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
                        <p className="text-slate-500">Seleccione un usuario de la lista para ver sus detalles.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;
