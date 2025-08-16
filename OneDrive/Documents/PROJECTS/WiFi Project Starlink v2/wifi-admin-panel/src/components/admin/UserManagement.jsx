import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import RoleBadge from '../common/RoleBadge.jsx';
import Icon from '../common/Icon.jsx';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [userPayments, setUserPayments] = useState([]);
    const [userTokens, setUserTokens] = useState([]);
    const [creditAmount, setCreditAmount] = useState('');
    const [isAdjustingCredits, setIsAdjustingCredits] = useState(false);
    const [creditReason, setCreditReason] = useState('');
    const [showCreditForm, setShowCreditForm] = useState(false);
    
    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'users'), snapshot => {
            const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(user => user.username) // Only show users with usernames
                .sort((a, b) => a.username.localeCompare(b.username)); // Sort alphabetically
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
                    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        
        const paymentsQuery = query(
            collection(db, "payments"), 
            where("userId", "==", selectedUser.id), 
            orderBy("createdAt", "desc")
        );
        const unsubPayments = onSnapshot(paymentsQuery, snapshot => 
            setUserPayments(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})))
        );

        const tokensQuery = query(
            collection(db, "tokens"), 
            where("userId", "==", selectedUser.id), 
            orderBy("createdAt", "desc")
        );
        const unsubTokens = onSnapshot(tokensQuery, snapshot => 
            setUserTokens(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})))
        );

        return () => {
            unsubPayments();
            unsubTokens();
        };
    }, [selectedUser]);

    const handleCreditAdjustment = async (e) => {
        e.preventDefault();
        if (!selectedUser || !creditAmount || isNaN(creditAmount) || !creditReason.trim()) return;
        
        setIsAdjustingCredits(true);
        try {
        const userRef = doc(db, "users", selectedUser.id);
            const newCredits = (selectedUser.creditsMinutes || 0) + parseInt(creditAmount);
            
            await updateDoc(userRef, { 
                creditsMinutes: newCredits,
                lastCreditAdjustment: {
                    amount: parseInt(creditAmount),
                    reason: creditReason,
                    timestamp: serverTimestamp(),
                    previousAmount: selectedUser.creditsMinutes || 0,
                    newAmount: newCredits
                }
            });
            
            // Reset form
        setCreditAmount('');
            setCreditReason('');
            setShowCreditForm(false);
            
            alert(`Créditos ajustados exitosamente. Nuevo balance: ${formatCredits(newCredits)}`);
        } catch (error) {
            console.error('Error adjusting credits:', error);
            alert('Error al ajustar los créditos. Por favor intente nuevamente.');
        } finally {
            setIsAdjustingCredits(false);
        }
    };

    const handleMarkTokenAsUsed = async (tokenId) => {
        try {
            await updateDoc(doc(db, "tokens", tokenId), { 
                status: 'used',
                usedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error marking token as used:', error);
            alert('Error al marcar el token como usado.');
        }
    };

    const PaymentStatusBadge = ({ status }) => {
        const statusConfig = {
            approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Aprobado' },
            pending: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Pendiente' },
            rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rechazado' }
        };
        const config = statusConfig[status] || statusConfig.pending;
        
        return (
            <span className={`px-3 py-1 inline-flex text-xs font-bold rounded-full ring-1 ring-inset ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    const TokenStatusBadge = ({ status }) => {
        const statusConfig = {
            active: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Activo' },
            used: { bg: 'bg-slate-100', text: 'text-slate-800', label: 'Usado' }
        };
        const config = statusConfig[status] || statusConfig.active;
        
        return (
            <span className={`px-3 py-1 inline-flex text-xs font-bold rounded-full ring-1 ring-inset ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };
    
    const formatCredits = (minutes) => {
        if (!minutes || minutes < 0) return "0h 0m";
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = Math.round(minutes % 60);
        return `${hours}h ${remainingMinutes}m`;
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString('es-CR');
    };

    return (
        <div className="space-y-8">
            {/* Header with Search */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                            Gestión de Usuarios
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400">
                            Administre usuarios, créditos y vea el historial de pagos y tokens
                        </p>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Icon path="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" className="w-5 h-5 text-slate-400" />
                        </div>
                    <input 
                        type="text"
                            placeholder="Buscar por usuario o email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-80 pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-slate-100 placeholder-slate-500"
                    />
                </div>
                </div>
                
                {/* Search Results Summary */}
                <div className="mt-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                    <span>
                        {filteredUsers.length} de {users.length} usuarios
                    </span>
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Limpiar búsqueda
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Users List */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                                Lista de Usuarios
                            </h3>
                        </div>
                        <div className="max-h-[65vh] overflow-y-auto">
                            {filteredUsers.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Icon path="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.663M15 12.5a5 5 0 11-10 0 5 5 0 0110 0z" className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                                    <p className="text-slate-500 dark:text-slate-400">
                                        {searchTerm ? 'No se encontraron usuarios que coincidan con la búsqueda.' : 'No hay usuarios registrados.'}
                                    </p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                        {filteredUsers.map(user => (
                                        <li 
                                            key={user.id} 
                                            onClick={() => setSelectedUser(user)} 
                                            className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors ${
                                                selectedUser?.id === user.id ? 'bg-blue-50 dark:bg-slate-700 border-r-4 border-blue-500' : ''
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                                                        {user.username}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                        {user.email}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 ml-3">
                                    <RoleBadge user={user} />
                                                    <div className="text-right">
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">Créditos</p>
                                                        <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                                            {formatCredits(user.creditsMinutes)}
                                                        </p>
                                                    </div>
                                                </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                            )}
                        </div>
                </div>
            </div>

                {/* User Details */}
            <div className="lg:col-span-2">
                {selectedUser ? (
                        <div className="space-y-6">
                            {/* User Info Card */}
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                                            <Icon path="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                                                {selectedUser.username}
                                            </h3>
                                            <p className="text-slate-600 dark:text-slate-400">
                                                {selectedUser.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <RoleBadge user={selectedUser} />
                                        <div className="text-right">
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Créditos Disponibles</p>
                                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                {formatCredits(selectedUser.creditsMinutes)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Credit Management */}
                                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                                            Gestión de Créditos
                                        </h4>
                                        <button
                                            onClick={() => setShowCreditForm(!showCreditForm)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                                        >
                                            {showCreditForm ? 'Cancelar' : 'Ajustar Créditos'}
                                        </button>
                                    </div>

                                    {showCreditForm && (
                                        <form onSubmit={handleCreditAdjustment} className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                                        Cantidad a Ajustar
                                                    </label>
                                <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            value={creditAmount}
                                                            onChange={(e) => setCreditAmount(e.target.value)}
                                                            placeholder="Ej: 60 para agregar 1 hora"
                                                            className="flex-1 px-3 py-2 bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            required
                                                        />
                                                        <span className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                            minutos
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                        Use números negativos para quitar créditos
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                                        Razón del Ajuste
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={creditReason}
                                                        onChange={(e) => setCreditReason(e.target.value)}
                                                        placeholder="Ej: Compensación por falla del servicio"
                                                        className="w-full px-3 py-2 bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCreditForm(false)}
                                                    className="px-4 py-2 text-slate-600 dark:text-slate-400 font-semibold hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={isAdjustingCredits || !creditAmount || !creditReason.trim()}
                                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                                                >
                                                    {isAdjustingCredits ? 'Ajustando...' : 'Aplicar Ajuste'}
                                                </button>
                                            </div>
                                        </form>
                                    )}

                                    {/* Credit History */}
                                    {selectedUser.lastCreditAdjustment && (
                                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                            <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                                                Último Ajuste de Créditos
                                            </h5>
                                            <div className="text-sm text-blue-700 dark:text-blue-300">
                                                <p><strong>Razón:</strong> {selectedUser.lastCreditAdjustment.reason}</p>
                                                <p><strong>Cambio:</strong> {selectedUser.lastCreditAdjustment.amount > 0 ? '+' : ''}{selectedUser.lastCreditAdjustment.amount} minutos</p>
                                                <p><strong>Fecha:</strong> {formatDate(selectedUser.lastCreditAdjustment.timestamp)}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Payment History */}
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                                <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
                                    Historial de Pagos ({userPayments.length})
                                </h4>
                                {userPayments.length === 0 ? (
                                    <p className="text-slate-500 dark:text-slate-400 text-center py-8">
                                        No hay historial de pagos para este usuario.
                                    </p>
                                ) : (
                                    <div className="space-y-3 max-h-64 overflow-y-auto">
                                        {userPayments.map(payment => (
                                            <div key={payment.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                                                <div className="flex-1">
                                                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                                                        {payment.packageName}
                                                    </p>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                                        ₡{payment.price} • {payment.durationMinutes} minutos
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {formatDate(payment.createdAt)}
                                                    </p>
                                                </div>
                                                <PaymentStatusBadge status={payment.status} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Token History */}
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                                <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
                                    Historial de Tokens ({userTokens.length})
                                </h4>
                                {userTokens.length === 0 ? (
                                    <p className="text-slate-500 dark:text-slate-400 text-center py-8">
                                        No hay tokens generados para este usuario.
                                    </p>
                                ) : (
                                    <div className="space-y-3 max-h-64 overflow-y-auto">
                                        {userTokens.map(token => (
                                            <div key={token.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                                                <div className="flex-1">
                                                    <p className="font-mono font-semibold text-slate-800 dark:text-slate-200 text-sm">
                                                        {token.tokenString}
                                                    </p>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                                        {token.durationMinutes} minutos
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {formatDate(token.createdAt)}
                                                    </p>
                                </div>
                                                <div className="flex items-center gap-2">
                                                    <TokenStatusBadge status={token.status} />
                                                    {token.status === 'active' && (
                                                        <button
                                                            onClick={() => handleMarkTokenAsUsed(token.id)}
                                                            className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded transition-colors"
                                                        >
                                                            Marcar Usado
                                                        </button>
                                                    )}
                                </div>
                            </div>
                                        ))}
                                    </div>
                                )}
                        </div>
                    </div>
                ) : (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-12 text-center">
                            <Icon path="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
                                Seleccione un Usuario
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400">
                                Elija un usuario de la lista para ver sus detalles y gestionar sus créditos
                            </p>
                    </div>
                )}
                </div>
            </div>
        </div>
    );
};

export default UserManagement;