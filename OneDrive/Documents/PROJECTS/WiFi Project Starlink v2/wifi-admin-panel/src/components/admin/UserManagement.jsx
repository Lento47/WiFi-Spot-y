import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../firebase';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [userPayments, setUserPayments] = useState([]);
    const [userTokens, setUserTokens] = useState([]);
    const [creditAmount, setCreditAmount] = useState('');
    
    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'users'), snapshot => {
            const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(userList);
            setFilteredUsers(userList);
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        if (searchTerm === '') {
            setFilteredUsers(users);
        } else {
            setFilteredUsers(
                users.filter(user => 
                    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        }
    }, [searchTerm, users]);

    useEffect(() => {
        if (!selectedUser) { 
            setUserPayments([]); 
            setUserTokens([]);
            return;
        }
        const paymentsQuery = query(collection(db, "payments"), where("userId", "==", selectedUser.id), orderBy("createdAt", "desc"));
        const unsubPayments = onSnapshot(paymentsQuery, snapshot => setUserPayments(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}))));

        const tokensQuery = query(collection(db, "tokens"), where("userId", "==", selectedUser.id), orderBy("createdAt", "desc"));
        const unsubTokens = onSnapshot(tokensQuery, snapshot => setUserTokens(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}))));

        return () => {
            unsubPayments();
            unsubTokens();
        };
    }, [selectedUser]);

    const handleCreditAdjustment = async (amount) => {
        if (!selectedUser || !amount || isNaN(amount)) {
            alert("Por favor, ingrese una cantidad válida.");
            return;
        };
        const userRef = doc(db, "users", selectedUser.id);
        await updateDoc(userRef, {
            creditsMinutes: increment(amount)
        });
        setCreditAmount('');
    };

    const handleMarkTokenAsUsed = async (tokenId) => {
        const tokenRef = doc(db, "tokens", tokenId);
        await updateDoc(tokenRef, {
            status: 'used'
        });
    };

    const PaymentStatusBadge = ({ status }) => <span className={`px-3 py-1 inline-flex text-xs font-bold rounded-full ring-1 ring-inset ${{approved: 'bg-green-100 text-green-800 ring-green-600/20',pending: 'bg-orange-100 text-orange-800 ring-orange-600/20',rejected: 'bg-red-100 text-red-800 ring-red-600/20'}[status]}`}>{status}</span>;
    const TokenStatusBadge = ({ status }) => <span className={`px-3 py-1 inline-flex text-xs font-bold rounded-full ring-1 ring-inset ${{active: 'bg-blue-100 text-blue-800 ring-blue-600/20', used: 'bg-slate-100 text-slate-800 ring-slate-600/20'}[status]}`}>{status}</span>;
    
    const formatCredits = (minutes) => {
        if (!minutes) return "0 minutos";
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = Math.round(minutes % 60);
        return `${hours} horas, ${remainingMinutes} minutos`;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <h3 className="text-3xl font-bold text-slate-800 mb-6">Usuarios</h3>
                <div className="mb-4">
                    <input 
                        type="text"
                        placeholder="Buscar por correo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="bg-white rounded-2xl shadow-lg">
                    <ul className="divide-y divide-slate-100 max-h-[65vh] overflow-y-auto">
                        {filteredUsers.map(user => (
                            <li key={user.id} onClick={() => setSelectedUser(user)} className={`p-4 hover:bg-blue-50 cursor-pointer ${selectedUser?.id === user.id ? 'bg-blue-100' : ''}`}>
                                <p className="text-sm font-semibold text-slate-800 truncate">{user.email || user.id}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className="lg:col-span-2">
                <h3 className="text-3xl font-bold text-slate-800 mb-6">Detalles</h3>
                {selectedUser ? (
                    <div className="bg-white p-6 rounded-2xl shadow-lg space-y-8">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <p className="font-bold text-xl text-slate-800 truncate">{selectedUser.email || selectedUser.id}</p>
                                <div className="text-right flex-shrink-0 ml-4">
                                    <p className="text-sm text-slate-500">Créditos</p>
                                    <p className="font-bold text-blue-600">{formatCredits(selectedUser.creditsMinutes)}</p>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-slate-700 mb-2">Ajustar Créditos</h4>
                                <div className="flex items-center space-x-2">
                                    <input 
                                        type="number"
                                        value={creditAmount}
                                        onChange={(e) => setCreditAmount(e.target.value)}
                                        placeholder="Minutos"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md"
                                    />
                                    <button onClick={() => handleCreditAdjustment(Number(creditAmount))} className="px-3 py-2 bg-green-500 text-white rounded-md text-sm font-semibold hover:bg-green-600">+</button>
                                    <button onClick={() => handleCreditAdjustment(-Number(creditAmount))} className="px-3 py-2 bg-red-500 text-white rounded-md text-sm font-semibold hover:bg-red-600">-</button>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-slate-500 mb-4 font-semibold">Historial de Pagos:</p>
                                {userPayments.length > 0 ? <ul className="space-y-4">{userPayments.map(p => <li key={p.id} className="p-4 bg-slate-50 rounded-xl flex justify-between items-center"><div><p className="font-bold text-slate-700">{p.packageName}</p><p className="text-xs text-slate-500">{p.createdAt?.toDate().toLocaleString('es-CR')}</p></div><PaymentStatusBadge status={p.status} /></li>)}</ul> : <p className="text-sm text-slate-500">No hay pagos.</p>}
                            </div>
                            <div>
                                <p className="text-slate-500 mb-4 font-semibold">Tokens Generados:</p>
                                {userTokens.length > 0 ? <ul className="space-y-3">{userTokens.map(t => <li key={t.id} className="p-3 bg-blue-50 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-mono font-semibold text-blue-800">{t.tokenString}</p>
                                            <p className="text-xs text-blue-600">{t.durationMinutes} minutos</p>
                                        </div>
                                        <TokenStatusBadge status={t.status} />
                                    </div>
                                    {t.status === 'active' && (
                                        <button onClick={() => handleMarkTokenAsUsed(t.id)} className="text-xs text-slate-500 hover:underline mt-2">Marcar como usado</button>
                                    )}
                                </li>)}</ul> : <p className="text-sm text-slate-500">No hay tokens.</p>}
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