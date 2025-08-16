import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, increment, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import Icon from '../common/Icon.jsx';

const ReferralProgram = ({ user }) => {
    const [referrals, setReferrals] = useState([]);
    const [referralStats, setReferralStats] = useState({
        totalReferrals: 0,
        successfulReferrals: 0,
        pendingReferrals: 0,
        totalEarnings: 0,
        referralCode: '',
        sharesCount: 0,
        lastSharedAt: null,
        strikeCount: 0, // Track consecutive attempts
        lastStrikeReset: null // Track when strikes reset
    });
    const [showReferralForm, setShowReferralForm] = useState(false);
    const [newReferral, setNewReferral] = useState({
        referredEmail: '',
        referredName: '',
        relationship: '',
        notes: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [shareHistory, setShareHistory] = useState([]);
    const [userCredits, setUserCredits] = useState(0);
    const [notifications, setNotifications] = useState([]);

    const relationships = [
        { id: 'family', label: 'Familiar', icon: '👨‍👩‍👧‍👦' },
        { id: 'friend', label: 'Amigo', icon: '👥' },
        { id: 'neighbor', label: 'Vecino', icon: '🏠' },
        { id: 'colleague', label: 'Colega', icon: '💼' },
        { id: 'other', label: 'Otro', icon: '🤝' }
    ];

    useEffect(() => {
        if (!user?.uid) return;

        // Generate referral code if user doesn't have one
        generateReferralCode();

        // Fetch user's referrals
        const referralsQuery = query(
            collection(db, 'referrals'),
            where('referrerId', '==', user.uid),
            where('status', 'in', ['pending', 'successful', 'expired'])
        );

        const unsubscribe = onSnapshot(referralsQuery, (snapshot) => {
            const referralsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setReferrals(referralsData);
            updateReferralStats(referralsData);
        });

        // Fetch share history
        fetchShareHistory();

        // Listen to user's credit updates in real-time
        const userUnsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
            if (doc.exists()) {
                const userData = doc.data();
                setUserCredits(userData.creditsMinutes || 0);
                
                // Update referral code if it was generated
                if (userData.referralCode && !referralStats.referralCode) {
                    setReferralStats(prev => ({ ...prev, referralCode: userData.referralCode }));
                }
                
                // Update strike information
                setReferralStats(prev => ({
                    ...prev,
                    strikeCount: userData.strikeCount || 0,
                    lastStrikeReset: userData.lastStrikeReset || null
                }));
            }
        });

        // Listen to referral success notifications
        const notificationsQuery = query(
            collection(db, 'notifications'),
            where('toUserId', '==', user.uid),
            where('type', '==', 'referral_successful'),
            orderBy('createdAt', 'desc')
        );

        const notificationsUnsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
            const notificationsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setNotifications(notificationsData);
        });

        return () => {
            unsubscribe();
            userUnsubscribe();
            notificationsUnsubscribe();
        };
    }, [user]);

    const fetchShareHistory = async () => {
        try {
            const sharesQuery = query(
                collection(db, 'referralShares'),
                where('referrerId', '==', user.uid),
                orderBy('sharedAt', 'desc')
            );
            
            const unsubscribe = onSnapshot(sharesQuery, (snapshot) => {
                const sharesData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setShareHistory(sharesData);
                
                // Update stats
                setReferralStats(prev => ({
                    ...prev,
                    sharesCount: sharesData.length,
                    lastSharedAt: sharesData[0]?.sharedAt || null
                }));
            });
            
            return unsubscribe;
        } catch (error) {
            console.error('Error fetching share history:', error);
        }
    };

    const generateReferralCode = async () => {
        if (referralStats.referralCode) return;

        try {
            // Check if user already has a referral code
            const userDoc = await getDocs(query(
                collection(db, 'users'),
                where('uid', '==', user.uid)
            ));

            if (!userDoc.empty) {
                const userData = userDoc.docs[0].data();
                if (userData.referralCode) {
                    setReferralStats(prev => ({ ...prev, referralCode: userData.referralCode }));
                    return;
                }
            }

            // Generate new referral code
            const code = `REF-${user.uid.substring(0, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
            
            // Update user document with referral code
            await updateDoc(doc(db, 'users', user.uid), {
                referralCode: code,
                referralProgramJoined: serverTimestamp()
            });

            setReferralStats(prev => ({ ...prev, referralCode: code }));
        } catch (error) {
            console.error('Error generating referral code:', error);
        }
    };

    const updateReferralStats = (referralsData) => {
        const totalReferrals = referralsData.length;
        const successfulReferrals = referralsData.filter(ref => ref.status === 'successful').length;
        const pendingReferrals = referralsData.filter(ref => ref.status === 'pending').length;
        const totalEarnings = referralsData
            .filter(ref => ref.status === 'successful')
            .reduce((sum, ref) => sum + (ref.creditReward || 0), 0);

        setReferralStats(prev => ({
            ...prev,
            totalReferrals,
            successfulReferrals,
            pendingReferrals,
            totalEarnings
        }));
    };

    // Check if user is punished for excessive referral attempts
    const checkStrikePunishment = () => {
        const { strikeCount, lastStrikeReset } = referralStats;
        
        // If no strikes, user is not punished
        if (strikeCount === 0) return null;
        
        // Check if punishment period has passed (3 days)
        if (lastStrikeReset) {
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            
            // Handle both Firestore Timestamp and regular Date objects
            let lastStrikeDate;
            if (lastStrikeReset.toDate && typeof lastStrikeReset.toDate === 'function') {
                // It's a Firestore Timestamp
                lastStrikeDate = lastStrikeReset.toDate();
            } else if (lastStrikeReset instanceof Date) {
                // It's already a Date object
                lastStrikeDate = lastStrikeReset;
            } else {
                // Invalid date, reset strikes
                console.warn('Invalid lastStrikeReset value:', lastStrikeReset);
                resetStrikes();
                return null;
            }
            
            if (lastStrikeDate > threeDaysAgo) {
                // Still in punishment period
                const timeRemaining = new Date(lastStrikeDate.getTime() + (3 * 24 * 60 * 60 * 1000));
                const hoursRemaining = Math.ceil((timeRemaining - new Date()) / (1000 * 60 * 60));
                const daysRemaining = Math.ceil(hoursRemaining / 24);
                
                return {
                    isPunished: true,
                    timeRemaining: daysRemaining > 0 ? `${daysRemaining} días` : `${hoursRemaining} horas`,
                    strikeCount: strikeCount
                };
            } else {
                // Punishment period has passed, reset strikes
                resetStrikes();
                return null;
            }
        }
        
        return null;
    };

    // Reset strikes after punishment period
    const resetStrikes = async () => {
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                strikeCount: 0,
                lastStrikeReset: null
            });
            
            setReferralStats(prev => ({
                ...prev,
                strikeCount: 0,
                lastStrikeReset: null
            }));
        } catch (error) {
            console.error('Error resetting strikes:', error);
        }
    };

    // Add a strike for failed referral attempt
    const addStrike = async () => {
        try {
            const newStrikeCount = referralStats.strikeCount + 1;
            const isPunished = newStrikeCount >= 5;
            
            await updateDoc(doc(db, 'users', user.uid), {
                strikeCount: newStrikeCount,
                lastStrikeReset: isPunished ? serverTimestamp() : null
            });
            
            // For local state, we'll use null initially and let the onSnapshot update it
            // This prevents type mismatches between Firestore Timestamp and Date
            setReferralStats(prev => ({
                ...prev,
                strikeCount: newStrikeCount,
                lastStrikeReset: isPunished ? null : null // Will be updated by onSnapshot
            }));
            
            return newStrikeCount;
        } catch (error) {
            console.error('Error adding strike:', error);
            return referralStats.strikeCount;
        }
    };

    const handleSubmitReferral = async (e) => {
        e.preventDefault();
        if (!newReferral.referredEmail.trim() || !newReferral.referredName.trim()) {
            alert('Por favor complete el email y nombre de la persona referida.');
            return;
        }

        // Check if user is punished for excessive attempts
        const punishment = checkStrikePunishment();
        if (punishment && punishment.isPunished) {
            alert(`⚠️ Usted está castigado por exceso de intentos de referencias.\n\nStrikes acumulados: ${punishment.strikeCount}/5\nTiempo restante: ${punishment.timeRemaining}\n\nDebe esperar a que termine el período de castigo para poder hacer nuevas referencias.`);
            return;
        }

        // Check regular cooldown period (3 days)
        const lastReferral = referrals
            .filter(ref => ref.status === 'successful' || ref.status === 'pending')
            .sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate())[0];

        if (lastReferral && lastReferral.createdAt) {
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            
            if (lastReferral.createdAt.toDate() > threeDaysAgo) {
                const timeRemaining = new Date(lastReferral.createdAt.toDate().getTime() + (3 * 24 * 60 * 60 * 1000));
                const hoursRemaining = Math.ceil((timeRemaining - new Date()) / (1000 * 60 * 60));
                
                // Add a strike for attempting to bypass cooldown
                const newStrikeCount = await addStrike();
                
                if (newStrikeCount >= 5) {
                    alert(`🚫 ¡Usted ha alcanzado el límite máximo de intentos!\n\nStrikes: ${newStrikeCount}/5\n\nDebido a sus múltiples intentos de eludir el período de espera, ha sido castigado con un cooldown de 3 días.\n\nTiempo restante del cooldown regular: ${hoursRemaining} horas`);
                } else {
                    alert(`⚠️ Debe esperar 3 días entre referencias. Tiempo restante: ${hoursRemaining} horas.\n\n⚠️ Strike ${newStrikeCount}/5 - ¡Cuidado! Después de 5 strikes será castigado.`);
                }
                return;
            }
        }

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'referrals'), {
                referrerId: user.uid,
                referrerEmail: user.email,
                referrerName: user.username || user.email,
                referredEmail: newReferral.referredEmail.toLowerCase(),
                referredName: newReferral.referredName,
                relationship: newReferral.relationship,
                notes: newReferral.notes,
                status: 'pending',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                creditReward: 0, // Will be set when referral becomes successful
                referralCode: referralStats.referralCode
            });

            // Reset strikes on successful referral submission
            if (referralStats.strikeCount > 0) {
                await resetStrikes();
            }

            setNewReferral({
                referredEmail: '',
                referredName: '',
                relationship: '',
                notes: ''
            });
            setShowReferralForm(false);
        } catch (error) {
            console.error('Error creating referral:', error);
            alert('Error al crear la referencia. Por favor intente nuevamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const copyReferralCode = async () => {
        try {
            await navigator.clipboard.writeText(referralStats.referralCode);
            
            // Track the share activity
            await trackReferralShare('copy');
            
            alert('Código de referencia copiado al portapapeles!');
        } catch (error) {
            console.error('Error copying referral code:', error);
            alert('Error al copiar el código. Por favor intente nuevamente.');
        }
    };

    const shareReferralCode = async () => {
        const shareText = `¡Hola! Te invito a unirte a nuestro servicio de WiFi. Usa mi código de referencia: ${referralStats.referralCode} para obtener beneficios especiales.`;
        
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'Código de Referencia WiFi',
                    text: shareText
                });
                
                // Track the share activity
                await trackReferralShare('native_share');
            } else {
                await navigator.clipboard.writeText(shareText);
                
                // Track the share activity
                await trackReferralShare('clipboard_share');
                
                alert('Mensaje copiado al portapapeles!');
            }
        } catch (error) {
            console.error('Error sharing referral code:', error);
        }
    };

    const trackReferralShare = async (shareMethod) => {
        try {
            await addDoc(collection(db, 'referralShares'), {
                referrerId: user.uid,
                referrerEmail: user.email,
                referrerName: user.username || user.email,
                referralCode: referralStats.referralCode,
                shareMethod: shareMethod, // 'copy', 'native_share', 'clipboard_share'
                sharedAt: serverTimestamp(),
                userAgent: navigator.userAgent,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('Error tracking referral share:', error);
        }
    };

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
        return relationships.find(rel => rel.id === relationshipId) || relationships[0];
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
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-2xl shadow-lg text-white">
                <h2 className="text-3xl font-bold mb-2">Programa de Referencias</h2>
                <p className="text-blue-100">
                    Invita amigos y familiares para ganar créditos de WiFi gratis
                </p>
            </div>

            {/* Current Credits Display */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-2xl shadow-lg text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-semibold mb-2">💰 Tus Créditos Actuales</h3>
                        <p className="text-green-100 mb-2">
                            Créditos disponibles para usar en WiFi
                        </p>
                        <div className="text-3xl font-bold">
                            {userCredits} minutos
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl">🎯</div>
                        <p className="text-sm text-green-100">
                            ¡Sigue invitando amigos para ganar más!
                        </p>
                    </div>
                </div>
            </div>

            {/* Recent Referral Success Notifications */}
            {notifications.length > 0 && (
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 rounded-2xl shadow-lg text-white">
                    <h3 className="text-xl font-semibold mb-4">🎉 ¡Referencias Exitosas!</h3>
                    <div className="space-y-3">
                        {notifications.slice(0, 3).map((notification) => (
                            <div key={notification.id} className="bg-white/20 p-3 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">✅</span>
                                    <div>
                                        <p className="font-semibold">{notification.title}</p>
                                        <p className="text-sm text-yellow-100">{notification.message}</p>
                                        <p className="text-xs text-yellow-200 mt-1">
                                            {formatDate(notification.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-sm text-yellow-100 mt-3 text-center">
                        ¡Los créditos se añadieron automáticamente a tu cuenta!
                    </p>
                </div>
            )}

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">{referralStats.totalReferrals}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Total Referencias</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg text-center">
                    <div className="text-2xl font-bold text-green-600">{referralStats.successfulReferrals}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Exitosas</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg text-center">
                    <div className="text-2xl font-bold text-yellow-600">{referralStats.pendingReferrals}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Pendientes</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">{referralStats.sharesCount}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Veces Compartido</div>
                </div>
            </div>

            {/* Strike Counter */}
            {referralStats.strikeCount > 0 && (
                <div className="bg-gradient-to-r from-red-500 to-pink-600 p-6 rounded-2xl shadow-lg text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-semibold mb-2">⚠️ Sistema de Strikes</h3>
                            <p className="text-red-100 mb-2">
                                Usted tiene strikes acumulados por intentos excesivos
                            </p>
                            <div className="text-3xl font-bold">
                                {referralStats.strikeCount}/5 Strikes
                            </div>
                            <p className="text-sm text-red-200 mt-1">
                                {referralStats.strikeCount >= 5 
                                    ? '🚫 CASTIGADO - Cooldown de 3 días activo'
                                    : `⚠️ ¡Cuidado! Después de 5 strikes será castigado`
                                }
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-4xl">
                                {referralStats.strikeCount >= 5 ? '🚫' : '⚠️'}
                            </div>
                            <p className="text-sm text-red-100">
                                {referralStats.strikeCount >= 5 ? 'Castigado' : 'Advertencia'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Cooldown Status Card */}
            {(() => {
                // Check strike punishment and cooldown status once
                const punishment = checkStrikePunishment();
                const lastReferral = referrals
                    .filter(ref => ref.status === 'successful' || ref.status === 'pending')
                    .sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate())[0];

                // Check strike punishment first
                if (punishment && punishment.isPunished) {
                    return (
                        <div className="bg-gradient-to-r from-red-600 to-pink-700 p-6 rounded-2xl shadow-lg text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-semibold mb-2">🚫 CASTIGO ACTIVO</h3>
                                    <p className="text-red-100 mb-2">
                                        Usted está castigado por exceso de intentos de referencias
                                    </p>
                                    <div className="text-3xl font-bold">
                                        {punishment.timeRemaining}
                                    </div>
                                    <p className="text-sm text-red-200 mt-1">
                                        Strikes acumulados: {punishment.strikeCount}/5
                                    </p>
                                    <p className="text-xs text-red-300 mt-1">
                                        ⚠️ No puede hacer nuevas referencias hasta que termine el castigo
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-4xl">🚫</div>
                                    <p className="text-sm text-red-100">
                                        Castigado
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                }

                // Check regular cooldown

                if (lastReferral && lastReferral.createdAt) {
                    const threeDaysAgo = new Date();
                    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
                    
                    if (lastReferral.createdAt.toDate() > threeDaysAgo) {
                        const timeRemaining = new Date(lastReferral.createdAt.toDate().getTime() + (3 * 24 * 60 * 60 * 1000));
                        const hoursRemaining = Math.ceil((timeRemaining - new Date()) / (1000 * 60 * 60));
                        const daysRemaining = Math.ceil(hoursRemaining / 24);
                        
                        return (
                            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 rounded-2xl shadow-lg text-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-semibold mb-2">⏰ Período de Espera</h3>
                                        <p className="text-yellow-100 mb-2">
                                            Debe esperar 3 días entre referencias
                                        </p>
                                        <div className="text-3xl font-bold">
                                            {daysRemaining > 0 ? `${daysRemaining} días` : `${hoursRemaining} horas`}
                                        </div>
                                        <p className="text-sm text-yellow-200 mt-1">
                                            Última referencia: {lastReferral.createdAt?.toDate().toLocaleDateString('es-CR')}
                                        </p>
                                        {referralStats.strikeCount > 0 && (
                                            <p className="text-xs text-yellow-300 mt-1">
                                                ⚠️ Strikes actuales: {referralStats.strikeCount}/5
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-4xl">⏳</div>
                                        <p className="text-sm text-yellow-100">
                                            Tiempo restante
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    }
                }
                
                return (
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-2xl shadow-lg text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-semibold mb-2">✅ Listo para Referencia</h3>
                                <p className="text-green-100 mb-2">
                                    Puede agregar una nueva referencia ahora
                                </p>
                                <div className="text-3xl font-bold">
                                    ¡Adelante!
                                </div>
                                <p className="text-sm text-green-200 mt-1">
                                    No hay restricciones de tiempo activas
                                </p>
                                {referralStats.strikeCount > 0 && (
                                    <p className="text-xs text-green-300 mt-1">
                                        ✅ Strikes reseteados: {referralStats.strikeCount}/5
                                    </p>
                                )}
                            </div>
                            <div className="text-right">
                                <div className="text-4xl">🚀</div>
                                <p className="text-sm text-green-100">
                                    Sin cooldown
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Referral Code Section */}
            <div className="bg-gradient-to-r from-purple-500 to-blue-600 p-6 rounded-2xl shadow-lg text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-semibold mb-2">Tu Código de Referencia</h3>
                        <p className="text-purple-100 mb-4">
                            Comparte este código con amigos y familiares para ganar créditos
                        </p>
                        <div className="flex items-center gap-3">
                            <code className="bg-white/20 px-4 py-2 rounded-lg font-mono text-lg font-bold">
                                {referralStats.referralCode || 'Generando...'}
                            </code>
                            <button
                                onClick={copyReferralCode}
                                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
                                title="Copiar código"
                            >
                                <Icon path="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2h-2m-6-4l8-8m0 0h-3m3 0v3" className="w-5 h-5" />
                            </button>
                        </div>
                        {referralStats.lastSharedAt && (
                            <p className="text-xs text-purple-200 mt-2">
                                Última vez compartido: {formatDate(referralStats.lastSharedAt)}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={shareReferralCode}
                        className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-lg transition-colors font-semibold"
                    >
                        <Icon path="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" className="w-5 h-5 inline mr-2" />
                        Compartir
                    </button>
                </div>
            </div>

            {/* How It Works */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
                    ¿Cómo Funciona?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="text-2xl">1️⃣</span>
                        </div>
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Comparte tu Código</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Copia o comparte tu código de referencia con amigos
                        </p>
                    </div>
                    <div className="text-center">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="text-2xl">2️⃣</span>
                        </div>
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Amigo se Registra</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Tu amigo usa tu código al registrarse
                        </p>
                    </div>
                    <div className="text-center">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="text-2xl">3️⃣</span>
                        </div>
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Recibe Créditos</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Obtienes 60 minutos de WiFi gratis automáticamente
                        </p>
                    </div>
                </div>
            </div>

            {/* Add New Referral */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                        Agregar Nueva Referencia
                    </h3>
                    <button
                        onClick={() => setShowReferralForm(!showReferralForm)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        {showReferralForm ? 'Cancelar' : 'Agregar Referencia'}
                    </button>
                </div>

                {/* Cooldown Status Display */}
                {(() => {
                    const lastReferral = referrals
                        .filter(ref => ref.status === 'successful' || ref.status === 'pending')
                        .sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate())[0];

                    if (lastReferral && lastReferral.createdAt) {
                        const threeDaysAgo = new Date();
                        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
                        
                        if (lastReferral.createdAt.toDate() > threeDaysAgo) {
                            const timeRemaining = new Date(lastReferral.createdAt.toDate().getTime() + (3 * 24 * 60 * 60 * 1000));
                            const hoursRemaining = Math.ceil((timeRemaining - new Date()) / (1000 * 60 * 60));
                            const daysRemaining = Math.ceil(hoursRemaining / 24);
                            
                            return (
                                <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                                    <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                                        <Icon path="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" className="w-5 h-5" />
                                        <span className="font-semibold">Período de Espera Activo</span>
                                    </div>
                                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                        Debe esperar 3 días entre referencias. 
                                        {daysRemaining > 0 ? ` Tiempo restante: ${daysRemaining} días` : ` Tiempo restante: ${hoursRemaining} horas`}
                                    </p>
                                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                                        Última referencia: {lastReferral.createdAt?.toDate().toLocaleDateString('es-CR')}
                                    </p>
                                </div>
                            );
                        }
                    }
                    
                    return (
                        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                            <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                                <Icon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="w-5 h-5" />
                                <span className="font-semibold">Listo para Nueva Referencia</span>
                            </div>
                            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                Puede agregar una nueva referencia ahora.
                            </p>
                        </div>
                    );
                })()}

                {showReferralForm && (
                    <form onSubmit={handleSubmitReferral} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Email de la Persona Referida *
                                </label>
                                <input
                                    type="email"
                                    value={newReferral.referredEmail}
                                    onChange={(e) => setNewReferral(prev => ({ ...prev, referredEmail: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="email@ejemplo.com"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Nombre de la Persona *
                                </label>
                                <input
                                    type="text"
                                    value={newReferral.referredName}
                                    onChange={(e) => setNewReferral(prev => ({ ...prev, referredName: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Nombre completo"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Relación
                                </label>
                                <select
                                    value={newReferral.relationship}
                                    onChange={(e) => setNewReferral(prev => ({ ...prev, relationship: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    {relationships.map(relationship => (
                                        <option key={relationship.id} value={relationship.id}>
                                            {relationship.icon} {relationship.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Notas (Opcional)
                                </label>
                                <input
                                    type="text"
                                    value={newReferral.notes}
                                    onChange={(e) => setNewReferral(prev => ({ ...prev, notes: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Información adicional..."
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                        >
                            {isSubmitting ? 'Agregando...' : 'Agregar Referencia'}
                        </button>
                    </form>
                )}
            </div>

            {/* Share History */}
            {shareHistory.length > 0 && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
                        📊 Historial de Compartir
                    </h3>
                    <div className="space-y-3">
                        {shareHistory.slice(0, 10).map((share) => (
                            <div key={share.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getShareMethodInfo(share.shareMethod).color}`}>
                                        {getShareMethodInfo(share.shareMethod).icon} {getShareMethodInfo(share.shareMethod).label}
                                    </div>
                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                        {formatDate(share.sharedAt)}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-500">
                                    {share.userAgent ? share.userAgent.substring(0, 30) + '...' : 'N/A'}
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-3 text-center">
                        Mostrando las últimas 10 actividades de compartir
                    </p>
                </div>
            )}

            {/* Referrals List */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-6">
                    Mis Referencias
                </h3>
                
                {referrals.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        <p>No tienes referencias aún.</p>
                        <p className="text-sm mt-2">¡Comienza compartiendo tu código de referencia!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {referrals.map(referral => (
                            <div
                                key={referral.id}
                                className="border border-slate-200 dark:border-slate-700 rounded-lg p-4"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusInfo(referral.status).color}`}>
                                            {getStatusInfo(referral.status).icon} {getStatusInfo(referral.status).label}
                                        </div>
                                        <div className="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                            {getRelationshipInfo(referral.relationship).icon} {getRelationshipInfo(referral.relationship).label}
                                        </div>
                                    </div>
                                    {referral.status === 'successful' && (
                                        <div className="text-green-600 dark:text-green-400 font-semibold">
                                            +{referral.creditReward} créditos
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="font-medium text-slate-800 dark:text-slate-200">
                                            {referral.referredName}
                                        </p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            {referral.referredEmail}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Referido el {formatDate(referral.createdAt)}
                                        </p>
                                        {referral.notes && (
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                                {referral.notes}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Rewards Info */}
            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-2xl border border-green-200 dark:border-green-800">
                <h3 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-4">
                    🎁 Sistema de Recompensas
                </h3>
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">✅</span>
                        <div>
                            <p className="font-semibold text-green-800 dark:text-green-200">
                                Referencia Exitosa
                            </p>
                            <p className="text-sm text-green-700 dark:text-green-300">
                                Recibes 60 minutos de WiFi gratis por cada amigo que se registre
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">⚡</span>
                        <div>
                            <p className="font-semibold text-green-800 dark:text-green-200">
                                Créditos Automáticos
                            </p>
                            <p className="text-sm text-green-700 dark:text-green-300">
                                Los créditos se añaden automáticamente a tu cuenta
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🔄</span>
                        <div>
                            <p className="font-semibold text-green-800 dark:text-green-200">
                                Sin Límites
                            </p>
                            <p className="text-sm text-green-700 dark:text-green-300">
                                Puedes referir tantas personas como quieras
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReferralProgram;
