import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiDollarSign, FiWifi, FiSettings, FiShield, FiTrendingUp, FiCamera, FiLogOut, FiHome, FiPackage, FiActivity, FiX, FiMessageCircle, FiBarChart, FiClock, FiMessageSquare, FiShare2 } from 'react-icons/fi';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { collection, getDocs, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../App';
import PendingPayments from '../components/admin/PendingPayments';
import NetworkDataManagement from '../components/admin/NetworkDataManagement';
import QRScanner from '../components/admin/QRScanner';
import AdminSupport from '../components/admin/AdminSupport';
import SystemConfiguration from '../components/admin/SystemConfiguration';
import UserManagement from '../components/admin/UserManagement';
import PackageManagement from '../components/admin/PackageManagement';
import CardTierManagement from '../components/admin/CardTierManagement';
import ConsumptionAnalytics from '../components/admin/ConsumptionAnalytics';
import AIChatbot from '../components/common/AIChatbot';
import BulletinBoard from '../components/user/BulletinBoard';

const AdminPage = () => {
    const { user, isAdmin, loading } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState({
        totalUsers: 0,
        pendingPayments: 0,
        totalRevenue: 0,
        activeConnections: 0,
        activeTokens: 0,
        totalDataConsumption: 0,
        totalReferrals: 0,
        totalMessages: 0,
        topConsumingUsers: []
    });
    const [tickets, setTickets] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);
    const [showQRScanner, setShowQRScanner] = useState(false);
    const [showTopUsersModal, setShowTopUsersModal] = useState(false);

    console.log('AdminPage render - user:', user, 'loading:', loading, 'isAdmin:', isAdmin, 'activeTab:', activeTab);

    useEffect(() => {
        console.log('AdminPage useEffect - user changed:', user);
        const fetchStats = async () => {
            try {
                console.log('Fetching stats...');
                // Fetch total users
                const usersSnapshot = await getDocs(collection(db, 'users'));
                const totalUsers = usersSnapshot.size;

                // Fetch pending payments
                const paymentsQuery = query(
                    collection(db, 'payments'),
                    where('status', '==', 'pending')
                );
                const paymentsSnapshot = await getDocs(paymentsQuery);
                const pendingPayments = paymentsSnapshot.size;

                // Calculate total revenue (approved payments)
                const approvedPaymentsQuery = query(
                    collection(db, 'payments'),
                    where('status', '==', 'approved')
                );
                const approvedPaymentsSnapshot = await getDocs(approvedPaymentsQuery);
                const totalRevenue = approvedPaymentsSnapshot.docs.reduce((sum, doc) => {
                    const paymentData = doc.data();
                    const price = parseFloat(paymentData.packagePrice || paymentData.price || 0);
                    return sum + (isNaN(price) ? 0 : price);
                }, 0);

                // Fetch active tokens (users with active credits)
                const activeUsersQuery = query(
                    collection(db, 'users'),
                    where('credits.hours', '>', 0)
                );
                const activeUsersSnapshot = await getDocs(activeUsersQuery);
                const activeTokens = activeUsersSnapshot.size;

                // Calculate total data consumption from user credits
                let totalDataConsumption = 0;
                activeUsersSnapshot.docs.forEach(doc => {
                    const userData = doc.data();
                    const hours = userData.credits?.hours || 0;
                    const minutes = userData.credits?.minutes || 0;
                    totalDataConsumption += (hours * 60 + minutes);
                });

                // Fetch total referrals
                const referralsQuery = query(collection(db, 'referrals'));
                const referralsSnapshot = await getDocs(referralsQuery);
                const totalReferrals = referralsSnapshot.size;

                // Fetch total messages from support tickets
                const messagesQuery = query(collection(db, 'supportTickets'));
                const messagesSnapshot = await getDocs(messagesQuery);
                const totalMessages = messagesSnapshot.size;

                // Get top 5 most consuming users
                const allUsersQuery = query(collection(db, 'users'));
                const allUsersSnapshot = await getDocs(allUsersQuery);
                const usersWithConsumption = allUsersSnapshot.docs.map(doc => {
                    const userData = doc.data();
                    const hours = userData.credits?.hours || 0;
                    const minutes = userData.credits?.minutes || 0;
                    return {
                        id: doc.id,
                        email: userData.email,
                        displayName: userData.displayName,
                        consumption: hours * 60 + minutes,
                        credits: userData.credits || { hours: 0, minutes: 0 }
                    };
                }).sort((a, b) => b.consumption - a.consumption).slice(0, 5);

                console.log('Enhanced stats fetched:', { 
                    totalUsers, pendingPayments, totalRevenue, activeTokens, 
                    totalDataConsumption, totalReferrals, totalMessages 
                });

                setStats({
                    totalUsers,
                    pendingPayments,
                    totalRevenue,
                    activeConnections: activeTokens, // Use active tokens as active connections
                    activeTokens,
                    totalDataConsumption,
                    totalReferrals,
                    totalMessages,
                    topConsumingUsers: usersWithConsumption
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
            }
        };

        if (user) {
            fetchStats();
        }
    }, [user]);

    // Fetch tickets for dashboard
    useEffect(() => {
        if (!user) return;
        
        const q = query(
            collection(db, 'supportTickets'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ticketsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTickets(ticketsData);
        });

        return () => unsubscribe();
    }, [user]);

    // Fetch recent activities for dashboard
    useEffect(() => {
        if (!user) return;
        
        const fetchRecentActivities = async () => {
            try {
                const activities = [];
                
                // Fetch recent payments
                const paymentsQuery = query(
                    collection(db, 'payments'),
                    orderBy('createdAt', 'desc'),
                    limit(5)
                );
                const paymentsSnapshot = await getDocs(paymentsQuery);
                paymentsSnapshot.docs.forEach(doc => {
                    const payment = doc.data();
                    activities.push({
                        id: doc.id,
                        type: 'payment',
                        title: `Pago ${payment.status === 'pending' ? 'Pendiente' : payment.status === 'approved' ? 'Aprobado' : 'Rechazado'}`,
                        description: `${payment.userEmail || 'Usuario'} - ₡${payment.packagePrice || payment.price || 0}`,
                        timestamp: payment.createdAt?.toDate() || new Date(),
                        status: payment.status,
                        icon: 'payment'
                    });
                });

                // Fetch recent support tickets
                const ticketsQuery = query(
                    collection(db, 'supportTickets'),
                    orderBy('createdAt', 'desc'),
                    limit(5)
                );
                const ticketsSnapshot = await getDocs(ticketsQuery);
                ticketsSnapshot.docs.forEach(doc => {
                    const ticket = doc.data();
                    activities.push({
                        id: doc.id,
                        type: 'ticket',
                        title: `Ticket de Soporte ${ticket.status === 'open' ? 'Abierto' : ticket.status === 'closed' ? 'Cerrado' : 'En Proceso'}`,
                        description: `${ticket.userEmail || 'Usuario'} - ${ticket.subject || 'Sin asunto'}`,
                        timestamp: ticket.createdAt?.toDate() || new Date(),
                        status: ticket.status,
                        icon: 'ticket'
                    });
                });

                // Fetch recent user registrations
                const usersQuery = query(
                    collection(db, 'users'),
                    orderBy('createdAt', 'desc'),
                    limit(5)
                );
                const usersSnapshot = await getDocs(usersQuery);
                usersSnapshot.docs.forEach(doc => {
                    const userData = doc.data();
                    activities.push({
                        id: doc.id,
                        type: 'user',
                        title: 'Nuevo Usuario Registrado',
                        description: `${userData.email || 'Usuario'} - ${userData.role === 'admin' ? 'Admin' : 'Usuario'}`,
                        timestamp: userData.createdAt?.toDate() || new Date(),
                        status: 'new',
                        icon: 'user'
                    });
                });

                // Sort all activities by timestamp and take the most recent 10
                const sortedActivities = activities
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, 10);

                setRecentActivities(sortedActivities);
            } catch (error) {
                console.error('Error fetching recent activities:', error);
            }
        };

        fetchRecentActivities();
    }, [user]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

         if (loading) {
    return (
             <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
                 <div className="text-center">
                     <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                     <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Cargando...</p>
                 </div>
                        </div>
         );
     }

     if (!user) {
         return (
             <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
                 <div className="text-center">
                     <p className="text-lg text-gray-600 dark:text-gray-300">No tienes acceso a esta página</p>
                </div>
        </div>
    );
     }

     if (!isAdmin) {
         return (
             <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
                 <div className="text-center">
                     <p className="text-lg text-gray-600 dark:text-gray-300">No tienes permisos de administrador</p>
                     <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Solo los administradores pueden acceder a esta página</p>
                 </div>
             </div>
         );
     }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="space-y-6">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            <motion.div
                                className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700"
                                whileHover={{ scale: 1.02 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Usuarios</p>
                                        <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalUsers}</p>
                                    </div>
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <FiUsers className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700"
                                whileHover={{ scale: 1.02 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Pagos Pendientes</p>
                                        <p className="text-lg sm:text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.pendingPayments}</p>
                                    </div>
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <FiDollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700"
                                whileHover={{ scale: 1.02 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Conexiones Activas</p>
                                        <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">{stats.activeTokens}</p>
                                    </div>
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <FiWifi className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700"
                                whileHover={{ scale: 1.02 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Ingresos Totales</p>
                                        <p className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400">₡{stats.totalRevenue.toLocaleString()}</p>
                                    </div>
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <FiTrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Additional Metrics Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            <motion.div
                                className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700"
                                whileHover={{ scale: 1.02 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Tokens Activos</p>
                                        <p className="text-lg sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.activeTokens}</p>
                                    </div>
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <FiBarChart className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700"
                                whileHover={{ scale: 1.02 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Consumo Total</p>
                                        <p className="text-lg sm:text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                                            {Math.floor(stats.totalDataConsumption / 60)}h {stats.totalDataConsumption % 60}m
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cyan-100 dark:bg-cyan-900 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <FiClock className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-600" />
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700"
                                whileHover={{ scale: 1.02 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Referidos</p>
                                        <p className="text-lg sm:text-2xl font-bold text-pink-600 dark:text-pink-400">{stats.totalReferrals}</p>
                                    </div>
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-100 dark:bg-pink-900 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <FiShare2 className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600" />
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700"
                                whileHover={{ scale: 1.02 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Mensajes</p>
                                        <p className="text-lg sm:text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.totalMessages}</p>
                                    </div>
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <FiMessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                                    </div>
                                </div>
                            </motion.div>
                                                </div>

                        {/* Top Users Button */}
                        <div className="flex justify-center">
                            <motion.button
                                onClick={() => setShowTopUsersModal(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <FiBarChart className="w-5 h-5" />
                                <span className="font-medium">Ver Top 5 Usuarios Más Consumidores</span>
                            </motion.button>
                        </div>

                                                   {/* Quick Actions */}
                         <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                             <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Acciones Rápidas</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <motion.button
                                    onClick={() => setActiveTab('payments')}
                                    className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <FiDollarSign className="w-6 h-6 text-blue-600" />
                                    <div className="text-left">
                                        <div className="font-medium text-blue-800">Gestionar Pagos</div>
                                        <div className="text-sm text-blue-600">{stats.pendingPayments} pendientes</div>
                                    </div>
                                </motion.button>

                                <motion.button
                                    onClick={() => setShowQRScanner(true)}
                                    className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <FiCamera className="w-6 h-6 text-green-600" />
                                    <div className="text-left">
                                        <div className="font-medium text-green-800">Validar QR</div>
                                        <div className="text-sm text-green-600">Escanear transacciones</div>
                                    </div>
                                </motion.button>

                                <motion.button
                                    onClick={() => setActiveTab('network')}
                                    className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <FiActivity className="w-6 h-6 text-purple-600" />
                                    <div className="text-left">
                                        <div className="font-medium text-purple-800">Estado de Red</div>
                                        <div className="text-sm text-purple-600">Monitorear conexiones</div>
                                    </div>
                                </motion.button>

                                <motion.button
                                    onClick={() => setActiveTab('support')}
                                    className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <FiMessageCircle className="w-6 h-6 text-indigo-600" />
                                    <div className="text-left">
                                        <div className="font-medium text-indigo-800">Soporte</div>
                                        <div className="text-sm text-indigo-600">{tickets?.filter(t => t.status === 'open').length || 0} abiertos</div>
                                    </div>
                                </motion.button>
                                
                                                                <motion.button
                                    onClick={() => setActiveTab('configuration')}
                                    className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <FiSettings className="w-6 h-6 text-purple-600" />
                                    <div className="text-left">
                                        <div className="font-medium text-purple-800">Configuración</div>
                                        <div className="text-sm text-purple-600">Paquetes y sistema</div>
                                    </div>
                                </motion.button>
                                
                                <motion.button
                                    onClick={() => setActiveTab('users')}
                                    className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <FiUsers className="w-6 h-6 text-indigo-600" />
                                    <div className="text-left">
                                        <div className="font-medium text-indigo-800">Usuarios</div>
                                        <div className="text-sm text-indigo-600">{stats.totalUsers} registrados</div>
                                    </div>
                                </motion.button>
                    </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-4">Actividad Reciente</h2>
                            {recentActivities.length > 0 ? (
                                <div className="space-y-3">
                                    {recentActivities.map((activity) => (
                                        <motion.div
                                            key={activity.id}
                                            className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            {/* Activity Icon */}
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                activity.type === 'payment' ? 'bg-green-100 dark:bg-green-900' :
                                                activity.type === 'ticket' ? 'bg-blue-100 dark:bg-blue-900' :
                                                activity.type === 'user' ? 'bg-purple-100 dark:bg-purple-900' :
                                                'bg-gray-100 dark:bg-gray-600'
                                            }`}>
                                                {activity.type === 'payment' && <FiDollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />}
                                                {activity.type === 'ticket' && <FiMessageCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                                                {activity.type === 'user' && <FiUsers className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                                            </div>
                                            
                                            {/* Activity Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="text-sm font-medium text-gray-800 dark:text-white truncate">
                                                        {activity.title}
                                                    </h4>
                                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                                        activity.status === 'pending' || activity.status === 'open' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                                        activity.status === 'approved' || activity.status === 'closed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                        activity.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                                        activity.status === 'new' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                                        'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                                    }`}>
                                                        {activity.status === 'pending' ? 'Pendiente' :
                                                         activity.status === 'approved' ? 'Aprobado' :
                                                         activity.status === 'rejected' ? 'Rechazado' :
                                                         activity.status === 'open' ? 'Abierto' :
                                                         activity.status === 'closed' ? 'Cerrado' :
                                                         activity.status === 'new' ? 'Nuevo' : activity.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                                    {activity.description}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                    {activity.timestamp.toLocaleString('es-ES', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                    <FiActivity className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                                    <p>No hay actividad reciente para mostrar</p>
                                    <p className="text-sm mt-2">Las actividades aparecerán aquí automáticamente</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'payments':
                return <PendingPayments db={db} />;
            case 'packages':
                return <PackageManagement />;
            case 'network':
                return <NetworkDataManagement />;
            case 'support':
                return <AdminSupport />;
            case 'configuration':
                return <SystemConfiguration />;
                         case 'users':
                             return <UserManagement />;
                         case 'cardTiers':
                             return <CardTierManagement />;
            case 'consumptionAnalytics':
                return <ConsumptionAnalytics />;
            case 'bulletinBoard':
                return <BulletinBoard user={user} isAdmin={true} />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            {/* Debug Info - Hidden on mobile */}
            <div className="hidden lg:block bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                <p><strong>Debug:</strong> AdminPage is rendering</p>
                <p>User: {user?.email || 'None'}</p>
                <p>IsAdmin: {isAdmin ? 'Yes' : 'No'}</p>
                <p>Loading: {loading ? 'Yes' : 'No'}</p>
                <p>ActiveTab: {activeTab}</p>
            </div>

            {/* Top Header */}
            <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="w-full px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 sm:h-16 gap-4 sm:gap-0">
                        {/* Left - Logo and Status */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
                            <div className="flex items-center gap-2">
                                <FiShield className="w-6 h-6 text-blue-600 flex-shrink-0" />
                                <span className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">Panel de Administración</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>Administrador</span>
                            </div>
                        </div>

                        {/* Right - User Info and Logout */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 w-full sm:w-auto">
                            <button
                                onClick={toggleTheme}
                                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
                            >
                                {theme === 'light' ? '🌙' : '☀️'}
                            </button>
                            <div className="text-left sm:text-right">
                                <div className="text-sm text-gray-600 dark:text-gray-400">Administrador</div>
                                <div className="text-sm font-medium text-gray-800 dark:text-white">{user?.displayName || user?.email || 'Usuario'}</div>
                            </div>
                            <motion.button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <FiLogOut className="w-4 h-4" />
                                <span className="hidden sm:inline">Cerrar Sesión</span>
                                <span className="sm:hidden">Salir</span>
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>

                        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                    {/* Left Sidebar - Admin Profile & Settings */}
                    <div className="w-full lg:w-80 lg:flex-shrink-0 order-2 lg:order-1">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            {/* Admin Profile */}
                            <div className="text-center mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-200 dark:border-gray-600">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <FiShield className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                                </div>
                                <div className="font-medium text-gray-800 dark:text-white text-sm sm:text-base">Administrador</div>
                                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{user?.displayName || user?.email || 'Usuario'}</div>
                            </div>

                            {/* Quick Stats */}
                            <div className="mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-200 dark:border-gray-600">
                                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 text-left">Resumen Rápido</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Total Usuarios:</span>
                                        <span className="font-medium text-gray-800 dark:text-white">{stats.totalUsers}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Pagos Pendientes:</span>
                                        <span className="font-medium text-orange-600 dark:text-orange-400">{stats.pendingPayments}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Ingresos:</span>
                                        <span className="font-medium text-green-600 dark:text-green-400">₡{stats.totalRevenue.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Navigation */}
                            <nav className="space-y-2">
                                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 text-left">Navegación</h3>
                                {[
                                    { id: 'dashboard', label: 'Dashboard', icon: FiHome },
                                    { id: 'payments', label: 'Gestionar Pagos', icon: FiDollarSign },
                                    { id: 'packages', label: 'Paquetes', icon: FiPackage },
                                    { id: 'network', label: 'Estado de Red', icon: FiActivity },
                                    { id: 'support', label: 'Soporte', icon: FiMessageCircle },
                                    { id: 'configuration', label: 'Configuración', icon: FiSettings },
                                    { id: 'users', label: 'Usuarios', icon: FiUsers },
                                    { id: 'cardTiers', label: 'Gestión de Tarjetas', icon: FiShield },
                                    { id: 'consumptionAnalytics', label: 'Análisis de Consumo', icon: FiBarChart },
                                    { id: 'bulletinBoard', label: 'Mural Comunitario', icon: FiMessageSquare }
                                ].map((item) => (
                                    <motion.button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id)}
                                        className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-left transition-colors text-sm sm:text-base ${
                                            activeTab === item.id
                                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-white'
                                        }`}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <item.icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                                        <span className="truncate">{item.label}</span>
                                    </motion.button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Main Content - Right Side */}
                    <div className="flex-1 order-1 lg:order-2">
                        {/* Page Header */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-4 sm:mb-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex-1">
                                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                                        {activeTab === 'dashboard' && 'Dashboard'}
                                        {activeTab === 'payments' && 'Gestionar Pagos'}
                                        {activeTab === 'packages' && 'Gestión de Paquetes'}
                                        {activeTab === 'network' && 'Estado de Red'}
                                        {activeTab === 'support' && 'Gestión de Soporte'}
                                        {activeTab === 'configuration' && 'Configuración del Sistema'}
                                        {activeTab === 'users' && 'Gestión de Usuarios'}
                                        {activeTab === 'cardTiers' && 'Gestión de Tarjetas'}
                                        {activeTab === 'consumptionAnalytics' && 'Análisis de Consumo'}
                                        {activeTab === 'bulletinBoard' && 'Mural Comunitario'}
                                    </h1>
                                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                                        {activeTab === 'dashboard' && 'Vista general del sistema WiFi'}
                                        {activeTab === 'payments' && 'Aprobar o rechazar pagos pendientes'}
                                        {activeTab === 'packages' && 'Configurar paquetes de tiempo'}
                                        {activeTab === 'network' && 'Monitorear el estado de la red'}
                                        {activeTab === 'support' && 'Gestionar tickets de soporte técnico'}
                                        {activeTab === 'configuration' && 'Configurar paquetes, canales y sistema'}
                                        {activeTab === 'users' && 'Administrar usuarios del sistema'}
                                        {activeTab === 'cardTiers' && 'Asignar niveles de tarjetas a usuarios'}
                                        {activeTab === 'consumptionAnalytics' && 'Analizar el consumo de datos de los usuarios'}
                                        {activeTab === 'bulletinBoard' && 'Ver y publicar mensajes en el mural comunitario'}
                                    </p>
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="flex gap-2 sm:gap-3">
                                    {activeTab === 'payments' && (
                                        <motion.button
                                            onClick={() => setShowQRScanner(true)}
                                            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <FiCamera className="w-4 h-4" />
                                            <span className="hidden sm:inline">Validar QR</span>
                                            <span className="sm:hidden">QR</span>
                                        </motion.button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            {(() => {
                                try {
                                    return renderTabContent();
                                } catch (error) {
                                    console.error('Error rendering tab content:', error);
                                    return (
                                        <div className="text-center py-8">
                                            <p className="text-red-600 mb-4">Error al cargar el contenido</p>
                                            <p className="text-gray-600 text-sm">{error.message}</p>
                                        </div>
                                    );
                                }
                            })()}
                        </div>
                    </div>
                </div>
            </div>

                         {/* QR Scanner Modal */}
             {showQRScanner && (
                 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                     <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
                         <div className="flex items-center justify-between mb-4">
                             <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Escanear QR</h3>
                             <button
                                 onClick={() => setShowQRScanner(false)}
                                 className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                             >
                                 <FiX className="w-5 h-5" />
                             </button>
                         </div>
                         <QRScanner onClose={() => setShowQRScanner(false)} />
                     </div>
                 </div>
             )}

            {/* Top Users Modal */}
            {showTopUsersModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Top 5 Usuarios Más Consumidores</h3>
                            <button
                                onClick={() => setShowTopUsersModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <FiX className="w-6 h-6" />
                            </button>
                        </div>
                        
                        {stats.topConsumingUsers.length > 0 ? (
                            <div className="space-y-4">
                                {stats.topConsumingUsers.map((user, index) => (
                                    <motion.div
                                        key={user.id}
                                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.1 }}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                                                index === 0 ? 'bg-yellow-500' :
                                                index === 1 ? 'bg-gray-400' :
                                                index === 2 ? 'bg-orange-600' :
                                                'bg-blue-500'
                                            }`}>
                                                {index + 1}
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-800 dark:text-white">
                                                    {user.displayName || user.email || 'Usuario'}
                                                </h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-gray-800 dark:text-white">
                                                {Math.floor(user.consumption / 60)}h {user.consumption % 60}m
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                Total consumido
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <FiUsers className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                                <p className="text-gray-500 dark:text-gray-400">No hay datos de consumo disponibles</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* AI Chatbot */}
            <AIChatbot />
        </div>
    );
};

export default AdminPage;
