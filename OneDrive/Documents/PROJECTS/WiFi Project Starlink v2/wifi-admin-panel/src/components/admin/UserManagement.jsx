import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../firebase';
import RoleBadge from '../common/RoleBadge.jsx';

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
                    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
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
        if (!selectedUser || !amount || isNaN(amount)) return;
        const userRef = doc(db, "users", selectedUser.id);
        await updateDoc(userRef, { creditsMinutes: increment(amount) });
        setCreditAmount('');
    };

    const handleMarkTokenAsUsed = async (tokenId) => {
        await updateDoc(doc(db, "tokens", tokenId), { status: 'used' });
    };

    const PaymentStatusBadge = ({ status }) => <span className={`px-3 py-1 inline-flex text-xs font-bold rounded-full ring-1 ring-inset ${{approved: 'bg-green-100 text-green-800',pending: 'bg-orange-100 text-orange-800',rejected: 'bg-red-100 text-red-800'}[status]}`}>{status}</span>;
    const TokenStatusBadge = ({ status }) => <span className={`px-3 py-1 inline-flex text-xs font-bold rounded-full ring-1 ring-inset ${{active: 'bg-blue-100 text-blue-800', used: 'bg-slate-100 text-slate-800'}[status]}`}>{status}</span>;
    
    const formatCredits = (minutes) => {
        if (!minutes) return "0 minutos";
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = Math.round(minutes % 60);
        return `${hours}h ${remainingMinutes}m`;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-6">Usuarios</h3>
                <div className="mb-4">
                    <input 
                        type="text"
                        placeholder="Buscar por nombre de usuario..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg"
                    />
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
                    <ul className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[65vh] overflow-y-auto">
                        {filteredUsers.map(user => (
                            <li key={user.id} onClick={() => setSelectedUser(user)} className={`p-4 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer ${selectedUser?.id === user.id ? 'bg-blue-100 dark:bg-slate-700' : ''}`}>
                                <div className="flex items-center space-x-2">
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{user.username}</p>
                                    <RoleBadge user={user} />
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className="lg:col-span-2">
                <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-6">Detalles</h3>
                {selectedUser ? (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg space-y-8">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-xl text-slate-800 dark:text-slate-200 truncate">{selectedUser.username}</p>
                                    <RoleBadge user={selectedUser} />
                                </div>
                                <div className="text-right flex-shrink-0 ml-4">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Créditos</p>
                                    <p className="font-bold text-blue-600 dark:text-blue-400">{formatCredits(selectedUser.creditsMinutes)}</p>
                                </div>
                            </div>
                            {/* Credit Adjustment UI remains the same */}
                        </div>
                        {/* Payment and Token History UI remains the same */}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
                        <p className="text-slate-500 dark:text-slate-400">Seleccione un usuario.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;