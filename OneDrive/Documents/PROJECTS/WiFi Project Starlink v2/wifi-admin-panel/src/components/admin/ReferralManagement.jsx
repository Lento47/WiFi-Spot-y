import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, updateDoc, doc, serverTimestamp, where, orderBy, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import Icon from '../common/Icon.jsx';

const ReferralManagement = () => {
    const [referrals, setReferrals] = useState([]);
    const [filterStatus, setFilterStatus] = useState('all');
    const [referralStats, setReferralStats] = useState({
        totalReferrals: 0,
        pendingReferrals: 0,
        successfulReferrals: 0,
        expiredReferrals: 0,
        totalCreditsAwarded: 0
    });
    const [shareActivity, setShareActivity] = useState([]);
    const [showShareActivity, setShowShareActivity] = useState(false);
    const [usersWithStrikes, setUsersWithStrikes] = useState([]);
    const [showStrikeManagement, setShowStrikeManagement] = useState(false);

    useEffect(() => {
        const referralsQuery = query(
            collection(db, 'referrals'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(referralsQuery, (snapshot) => {
            const referralsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setReferrals(referralsData);
            updateStats(referralsData);
        });

        // Fetch share activity
        fetchShareActivity();

        // Fetch users with strikes
        fetchUsersWithStrikes();

        return unsubscribe;
    }, []);

    const fetchShareActivity = async () => {
        try {
            const sharesQuery = query(
                collection(db, 'referralShares'),
                orderBy('sharedAt', 'desc')
            );
            
            const unsubscribe = onSnapshot(sharesQuery, (snapshot) => {
                const sharesData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setShareActivity(sharesData);
            });
            
            return unsubscribe;
        } catch (error) {
            console.error('Error fetching share activity:', error);
        }
    };

    const updateStats = (referralsData) => {
        const totalReferrals = referralsData.length;
        const pendingReferrals = referralsData.filter(ref => ref.status === 'pending').length;
        const successfulReferrals = referralsData.filter(ref => ref.status === 'successful').length;
        const expiredReferrals = referralsData.filter(ref => ref.status === 'expired').length;
        const totalCreditsAwarded = referralsData
            .filter(ref => ref.status === 'successful')
            .reduce((sum, ref) => sum + (ref.creditReward || 0), 0);

        setReferralStats({
            totalReferrals,
            pendingReferrals,
            successfulReferrals,
            expiredReferrals,
            totalCreditsAwarded
        });
    };

    const fetchUsersWithStrikes = async () => {
        try {
            const usersQuery = query(
                collection(db, 'users'),
                where('strikeCount', '>', 0),
                orderBy('strikeCount', 'desc')
            );
            
            const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
                const usersData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setUsersWithStrikes(usersData);
            });
            
            return unsubscribe;
        } catch (error) {
            console.error('Error fetching users with strikes:', error);
        }
    };

    const forgiveUserStrikes = async (userId, userName) => {
        try {
            // Update user document to reset strikes
            await updateDoc(doc(db, 'users', userId), {
                strikeCount: 0,
                lastStrikeReset: null,
                strikesForgivenAt: serverTimestamp(),
                strikesForgivenBy: 'admin'
            });

            // Create notification for the user
            try {
                await addDoc(collection(db, 'notifications'), {
                    toUserId: userId,
                    type: 'strikes_forgiven',
                    title: '🎭 Strikes Perdonados',
                    message: `Sus strikes han sido perdonados por un administrador. Puede hacer referencias nuevamente.`,
                    createdAt: serverTimestamp(),
                    isRead: false,
                    priority: 'high'
                });
            } catch (notificationError) {
                console.warn('Could not create notification, but strikes were forgiven:', notificationError);
            }
            
            alert(`✅ Strikes perdonados para ${userName}. El usuario puede ahora hacer referencias nuevamente.`);
        } catch (error) {
            console.error('Error forgiving user strikes:', error);
            alert('Error al perdonar los strikes del usuario');
        }
    };

    const handleStatusUpdate = async (referralId, newStatus, creditReward = 0) => {
        try {
            const referralRef = doc(db, 'referrals', referralId);
            const updateData = {
                status: newStatus,
                updatedAt: serverTimestamp()
            };

            if (newStatus === 'successful' && creditReward > 0) {
                updateData.creditReward = creditReward;
                updateData.creditAwardedAt = serverTimestamp();
            }

            await updateDoc(referralRef, updateData);
        } catch (error) {
            console.error('Error updating referral status:', error);
            alert('Error al actualizar el estado de la referencia');
        }
    };

    const filteredReferrals = referrals.filter(referral =>
        filterStatus === 'all' || referral.status === filterStatus
    );

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString('es-CR');
    };

    const getStatusInfo = (status) => {
        const statusConfig = {
            pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
            successful: { label: 'Exitoso', color: 'bg-green-100 text-green-800', icon: '✅' },
            expired: { label: 'Expirado', color: 'bg-red-100 text-red-800', icon: '❌' }
        };
        return statusConfig[status] || statusConfig.pending;
    };

    const getRelationshipInfo = (relationshipId) => {
        const relationships = {
            family: { label: 'Familiar', icon: '👨‍👩‍👧‍👦' },
            friend: { label: 'Amigo', icon: '👥' },
            neighbor: { label: 'Vecino', icon: '🏠' },
            colleague: { label: 'Colega', icon: '💼' },
            other: { label: 'Otro', icon: '🤝' },
            automatic: { label: 'Automático', icon: '🤖' }
        };
        return relationships[relationshipId] || relationships.other;
    };

    const getShareMethodInfo = (method) => {
        const methodConfig = {
            copy: { label: 'Copiado', icon: '📋', color: 'bg-blue-100 text-blue-800' },
            native_share: { label: 'Compartido', icon: '📤', color: 'bg-green-100 text-green-800' },
            clipboard_share: { label: 'Portapapeles', icon: '📋', color: 'bg-purple-100 text-purple-800' }
        };
        return methodConfig[method] || methodConfig.copy;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 rounded-2xl shadow-lg text-white">
                <h2 className="text-3xl font-bold mb-2">Gestión de Referencias</h2>
                <p className="text-purple-100">
                    Administra el programa de referencias y monitorea la actividad
                </p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">{referralStats.totalReferrals}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Total Referencias</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg text-center">
                    <div className="text-2xl font-bold text-yellow-600">{referralStats.pendingReferrals}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Pendientes</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg text-center">
                    <div className="text-2xl font-bold text-green-600">{referralStats.successfulReferrals}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Exitosas</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg text-center">
                    <div className="text-2xl font-bold text-red-600">{referralStats.expiredReferrals}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Expiradas</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">{referralStats.totalCreditsAwarded}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Créditos Otorgados</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg text-center">
                    <div className={`text-2xl font-bold ${usersWithStrikes.length > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                        {usersWithStrikes.length}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                        {usersWithStrikes.length > 0 ? 'Con Strikes' : 'Sin Strikes'}
                    </div>
                </div>
            </div>

            {/* Share Activity Overview */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                        📊 Actividad de Compartir Códigos
                    </h3>
                    <button
                        onClick={() => setShowShareActivity(!showShareActivity)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        {showShareActivity ? 'Ocultar' : 'Ver'} Actividad
                    </button>
                </div>
                
                {showShareActivity && (
                    <div className="space-y-3">
                        {shareActivity.slice(0, 20).map((share) => (
                            <div key={share.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getShareMethodInfo(share.shareMethod).color}`}>
                                        {getShareMethodInfo(share.shareMethod).icon} {getShareMethodInfo(share.shareMethod).label}
                                    </div>
                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                        {share.referrerName} compartió {share.referralCode}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-500">
                                    {formatDate(share.sharedAt)}
                                </div>
                            </div>
                        ))}
                        {shareActivity.length === 0 && (
                            <p className="text-center text-slate-500 py-4">No hay actividad de compartir aún</p>
                        )}
                    </div>
                )}
            </div>

            {/* Strike Management */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                        ⚠️ Gestión de Strikes y Advertencias
                    </h3>
                    <button
                        onClick={() => setShowStrikeManagement(!showStrikeManagement)}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        {showStrikeManagement ? 'Ocultar' : 'Ver'} Gestión de Strikes
                    </button>
                </div>
                
                {showStrikeManagement && (
                    <div className="space-y-4">
                        {usersWithStrikes.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                                <p>🎉 ¡Excelente! No hay usuarios con strikes activos.</p>
                                <p className="text-sm mt-2">Todos los usuarios pueden hacer referencias sin restricciones.</p>
                            </div>
                        ) : (
                            <>
                                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                                            <Icon path="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" className="w-5 h-5" />
                                            <span className="font-semibold">Información del Sistema de Strikes</span>
                                        </div>
                                        {usersWithStrikes.length > 0 && (
                                            <button
                                                onClick={() => {
                                                    if (window.confirm(`¿Está seguro de que desea perdonar TODOS los strikes de ${usersWithStrikes.length} usuarios?\n\nEsto permitirá que todos los usuarios hagan referencias nuevamente inmediatamente.`)) {
                                                        usersWithStrikes.forEach(user => {
                                                            forgiveUserStrikes(user.id, user.username || user.email);
                                                        });
                                                    }
                                                }}
                                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg transition-colors text-sm"
                                                title="Perdonar strikes de todos los usuarios"
                                            >
                                                🎭 Perdonar Todos
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-sm text-orange-700 dark:text-orange-300">
                                        Los usuarios acumulan strikes por intentar eludir el período de espera de 3 días entre referencias. 
                                        Después de 5 strikes, son castigados con un cooldown de 3 días. 
                                        Como administrador, puedes perdonar strikes para dar a los usuarios una segunda oportunidad.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {usersWithStrikes.map((user) => (
                                        <div key={user.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border-l-4 border-orange-500">
                                            <div className="flex items-center gap-4">
                                                <div className="text-center">
                                                    <div className={`text-2xl font-bold ${
                                                        user.strikeCount >= 5 ? 'text-red-600' : 'text-orange-600'
                                                    }`}>
                                                        {user.strikeCount}/5
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        {user.strikeCount >= 5 ? 'CASTIGADO' : 'Strikes'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                                                        {user.username || user.email}
                                                    </h4>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                                        {user.email}
                                                    </p>
                                                    {user.lastStrikeReset && (
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            Último strike: {formatDate(user.lastStrikeReset)}
                                                        </p>
                                                    )}
                                                    {user.strikesForgivenAt && (
                                                        <p className="text-xs text-green-600 mt-1">
                                                            ✅ Perdonado el {formatDate(user.strikesForgivenAt)}
                                                        </p>
                                                    )}
                                                    {user.strikesForgivenBy && (
                                                        <p className="text-xs text-blue-600 mt-1">
                                                            👑 Perdonado por: {user.strikesForgivenBy}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {user.strikeCount >= 5 && (
                                                    <div className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                                                        🚫 Castigado
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm(`¿Está seguro de que desea perdonar los strikes de ${user.username || user.email}?\n\nEsto permitirá que el usuario haga referencias nuevamente inmediatamente.`)) {
                                                            forgiveUserStrikes(user.id, user.username || user.email);
                                                        }
                                                    }}
                                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                                                    title="Perdonar strikes y permitir referencias nuevamente"
                                                >
                                                    🎭 Perdonar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200 mb-2">
                                        <Icon path="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-5 h-5" />
                                        <span className="font-semibold">¿Qué sucede al perdonar strikes?</span>
                                    </div>
                                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                                        <li>• El contador de strikes se resetea a 0</li>
                                        <li>• El usuario puede hacer referencias inmediatamente</li>
                                        <li>• Se registra la acción del administrador</li>
                                        <li>• El usuario recibe una notificación de que sus strikes fueron perdonados</li>
                                    </ul>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Filter Controls */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                <div className="flex items-center gap-4 mb-6">
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                        Filtros
                    </h3>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                    >
                        <option value="all">Todas las Referencias</option>
                        <option value="pending">Pendientes</option>
                        <option value="successful">Exitosas</option>
                        <option value="expired">Expiradas</option>
                    </select>
                </div>
            </div>

            {/* Referrals List */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-6">
                    Lista de Referencias
                </h3>
                
                {filteredReferrals.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        <p>No hay referencias en esta categoría.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredReferrals.map(referral => (
                            <div
                                key={referral.id}
                                className="border border-slate-200 dark:border-slate-700 rounded-lg p-4"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusInfo(referral.status).color}`}>
                                            {getStatusInfo(referral.status).icon} {getStatusInfo(referral.status).label}
                                        </div>
                                        <div className="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                            {getRelationshipInfo(referral.relationship).icon} {getRelationshipInfo(referral.relationship).label}
                                        </div>
                                        {referral.status === 'successful' && (
                                            <div className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                                +{referral.creditReward} créditos
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right text-sm text-slate-500 dark:text-slate-400">
                                        <p>Creada: {formatDate(referral.createdAt)}</p>
                                        {referral.updatedAt && (
                                            <p>Actualizada: {formatDate(referral.updatedAt)}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                    <div>
                                        <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">
                                            Referidor
                                        </h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            <strong>Nombre:</strong> {referral.referrerName}
                                        </p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            <strong>Email:</strong> {referral.referrerEmail}
                                        </p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            <strong>Código:</strong> <code className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">{referral.referralCode}</code>
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">
                                            Referido
                                        </h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            <strong>Nombre:</strong> {referral.referredName}
                                        </p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            <strong>Email:</strong> {referral.referredEmail}
                                        </p>
                                        {referral.notes && (
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                <strong>Notas:</strong> {referral.notes}
                                            </p>
                                        )}
                                        {referral.newUserId && (
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                <strong>ID Usuario:</strong> {referral.newUserId}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                {referral.status === 'pending' && (
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleStatusUpdate(referral.id, 'successful', 60)}
                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                                        >
                                            ✅ Aprobar (60 créditos)
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(referral.id, 'expired')}
                                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                                        >
                                            ❌ Rechazar
                                        </button>
                                    </div>
                                )}

                                {referral.status === 'successful' && (
                                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                                        <p className="text-sm text-green-700 dark:text-green-300">
                                            <strong>Referencia aprobada</strong> - Se otorgaron {referral.creditReward} créditos a {referral.referrerName}
                                            {referral.creditAwardedAt && (
                                                <span> el {formatDate(referral.creditAwardedAt)}</span>
                                            )}
                                        </p>
                                    </div>
                                )}

                                {referral.status === 'expired' && (
                                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-green-800">
                                        <p className="text-sm text-red-700 dark:text-red-300">
                                            <strong>Referencia expirada</strong> - No se cumplieron los requisitos para la aprobación
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Program Settings Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-200 dark:border-blue-800">
                <h3 className="text-xl font-semibold text-blue-800 dark:text-blue-200 mb-4">
                    ⚙️ Configuración del Programa
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-700 dark:text-blue-300">
                    <div>
                        <h4 className="font-semibold mb-2">Recompensas por Referencia:</h4>
                        <ul className="space-y-1">
                            <li>• 60 minutos de WiFi gratis por referencia exitosa</li>
                            <li>• Créditos se otorgan automáticamente</li>
                            <li>• Sin límite de referencias por usuario</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">Proceso Automático:</h4>
                        <ul className="space-y-1">
                            <li>• Los códigos se validan al registrarse</li>
                            <li>• Se previene el uso duplicado</li>
                            <li>• Se evitan auto-referencias</li>
                            <li>• Notificaciones automáticas</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReferralManagement;
