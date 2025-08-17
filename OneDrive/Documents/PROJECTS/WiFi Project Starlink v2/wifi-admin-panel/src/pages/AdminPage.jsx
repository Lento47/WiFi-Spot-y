import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiDollarSign, FiWifi, FiSettings, FiShield, FiTrendingUp, FiCamera, FiLogOut, FiHome, FiPackage, FiActivity, FiX, FiMessageCircle } from 'react-icons/fi';
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
import AIChatbot from '../components/common/AIChatbot';

const AdminPage = () => {
    const { user, isAdmin, loading } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState({
        totalUsers: 0,
        pendingPayments: 0,
        totalRevenue: 0,
        activeConnections: 0
    });
    const [tickets, setTickets] = useState([]);
    const [showQRScanner, setShowQRScanner] = useState(false);

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

                console.log('Stats fetched:', { totalUsers, pendingPayments, totalRevenue });

                setStats({
                    totalUsers,
                    pendingPayments,
                    totalRevenue,
                    activeConnections: Math.floor(Math.random() * 50) + 10 // Mock data for now
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                                         <motion.div
                                 className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
                                 whileHover={{ scale: 1.02 }}
                                 transition={{ duration: 0.2 }}
                             >
                                 <div className="flex items-center justify-between">
                                     <div>
                                         <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Usuarios</p>
                                         <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalUsers}</p>
                                     </div>
                                     <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                         <FiUsers className="w-6 h-6 text-blue-600" />
                                     </div>
                                 </div>
                             </motion.div>

                                                         <motion.div
                                 className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
                                 whileHover={{ scale: 1.02 }}
                                 transition={{ duration: 0.2 }}
                             >
                                 <div className="flex items-center justify-between">
                                     <div>
                                         <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pagos Pendientes</p>
                                         <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.pendingPayments}</p>
                                     </div>
                                     <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                                         <FiDollarSign className="w-6 h-6 text-orange-600" />
                                     </div>
                                 </div>
                             </motion.div>

                                                         <motion.div
                                 className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
                                 whileHover={{ scale: 1.02 }}
                                 transition={{ duration: 0.2 }}
                             >
                                 <div className="flex items-center justify-between">
                                     <div>
                                         <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ingresos Totales</p>
                                         <p className="text-2xl font-bold text-green-600 dark:text-green-400">₡{stats.totalRevenue.toLocaleString()}</p>
                                     </div>
                                     <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                                         <FiTrendingUp className="w-6 h-6 text-green-600" />
                                     </div>
                                 </div>
                             </motion.div>

                             <motion.div
                                 className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
                                 whileHover={{ scale: 1.02 }}
                                 transition={{ duration: 0.2 }}
                             >
                                 <div className="flex items-center justify-between">
                    <div>
                                         <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Conexiones Activas</p>
                                         <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.activeConnections}</p>
                                     </div>
                                     <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                                         <FiWifi className="w-6 h-6 text-purple-600" />
                                     </div>
                                 </div>
                             </motion.div>
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
                    </div>
                        </div>

                                                 {/* Recent Activity */}
                         <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                             <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Actividad Reciente</h2>
                             <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                 <FiActivity className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                                 <p>No hay actividad reciente para mostrar</p>
                </div>
            </div>
                    </div>
                );
            case 'payments':
                return <PendingPayments db={db} />;
            case 'packages':
                                 return (
                     <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                         <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Gestión de Paquetes</h2>
                         <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                             <FiPackage className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                             <p>Funcionalidad de gestión de paquetes en desarrollo</p>
                         </div>
                     </div>
                 );
            case 'network':
                return <NetworkDataManagement />;
            case 'support':
                return <AdminSupport />;
            case 'configuration':
                return <SystemConfiguration />;
                         case 'users':
                 return (
                     <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                         <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Gestión de Usuarios</h2>
                         <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                             <FiUsers className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                             <p>Funcionalidad de gestión de usuarios en desarrollo</p>
                         </div>
                     </div>
                 );
             case 'settings':
                 return (
                     <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                         <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Configuración del Sistema</h2>
                         <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                             <FiSettings className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                             <p>Configuraciones del sistema en desarrollo</p>
                         </div>
                     </div>
                 );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            {/* Debug Info */}
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                <p><strong>Debug:</strong> AdminPage is rendering</p>
                <p>User: {user?.email || 'None'}</p>
                <p>IsAdmin: {isAdmin ? 'Yes' : 'No'}</p>
                <p>Loading: {loading ? 'Yes' : 'No'}</p>
                <p>ActiveTab: {activeTab}</p>
            </div>

                                     {/* Top Header */}
                         <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Left - Logo and Status */}
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <FiShield className="w-6 h-6 text-blue-600" />
                                <span className="text-xl font-bold text-gray-800">Panel de Administración</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>Administrador</span>
                            </div>
                        </div>

                                                 {/* Right - User Info and Logout */}
                         <div className="flex items-center gap-6">
                             <button
                                 onClick={toggleTheme}
                                 className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                 title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
                             >
                                 {theme === 'light' ? '🌙' : '☀️'}
                             </button>
                             <div className="text-right">
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
                                 Cerrar Sesión
                             </motion.button>
                         </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex gap-6">
                                         {/* Left Sidebar */}
                     <div className="w-64 flex-shrink-0">
                         <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                             {/* Admin Profile */}
                             <div className="text-center mb-6 pb-6 border-b border-gray-200 dark:border-gray-600">
                                 <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                                     <FiShield className="w-8 h-8 text-blue-600" />
                                 </div>
                                 <div className="font-medium text-gray-800 dark:text-white">Administrador</div>
                                 <div className="text-sm text-gray-600 dark:text-gray-400">{user?.displayName || user?.email || 'Usuario'}</div>
                             </div>

                                                     {/* Navigation */}
                         <nav className="space-y-2">
                             {[
                                 { id: 'dashboard', label: 'Dashboard', icon: FiHome },
                                 { id: 'payments', label: 'Gestionar Pagos', icon: FiDollarSign },
                                 { id: 'packages', label: 'Paquetes', icon: FiPackage },
                                 { id: 'network', label: 'Estado de Red', icon: FiActivity },
                                 { id: 'support', label: 'Soporte', icon: FiMessageCircle },
                                 { id: 'configuration', label: 'Configuración', icon: FiSettings },
                                 { id: 'users', label: 'Usuarios', icon: FiUsers },
                                 { id: 'settings', label: 'Ajustes', icon: FiSettings }
                             ].map((item) => (
                                 <motion.button
                                     key={item.id}
                                     onClick={() => setActiveTab(item.id)}
                                     className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                                         activeTab === item.id
                                             ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                                             : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-white'
                                     }`}
                                     whileHover={{ scale: 1.02 }}
                                     whileTap={{ scale: 0.98 }}
                                 >
                                     <item.icon className="w-5 h-5" />
                                     {item.label}
                                 </motion.button>
                             ))}
                         </nav>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                                                 {/* Page Header */}
                         <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
                             <div className="flex items-center justify-between">
                                 <div>
                                     <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                                         {activeTab === 'dashboard' && 'Dashboard'}
                                         {activeTab === 'payments' && 'Gestionar Pagos'}
                                         {activeTab === 'packages' && 'Gestión de Paquetes'}
                                         {activeTab === 'network' && 'Estado de Red'}
                                         {activeTab === 'support' && 'Gestión de Soporte'}
                                         {activeTab === 'configuration' && 'Configuración del Sistema'}
                                         {activeTab === 'users' && 'Gestión de Usuarios'}
                                         {activeTab === 'settings' && 'Ajustes del Sistema'}
                                     </h1>
                                     <p className="text-gray-600 dark:text-gray-400 mt-1">
                                         {activeTab === 'dashboard' && 'Vista general del sistema WiFi'}
                                         {activeTab === 'payments' && 'Aprobar o rechazar pagos pendientes'}
                                         {activeTab === 'packages' && 'Configurar paquetes de tiempo'}
                                         {activeTab === 'network' && 'Monitorear el estado de la red'}
                                         {activeTab === 'support' && 'Gestionar tickets de soporte técnico'}
                                         {activeTab === 'configuration' && 'Configurar paquetes, canales y sistema'}
                                         {activeTab === 'users' && 'Administrar usuarios del sistema'}
                                         {activeTab === 'settings' && 'Ajustes del sistema'}
                                     </p>
                                 </div>
                                
                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    {activeTab === 'payments' && (
                                        <motion.button
                                            onClick={() => setShowQRScanner(true)}
                                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <FiCamera className="w-4 h-4" />
                                            Validar QR
                                        </motion.button>
                                    )}
                                </div>
                            </div>
                        </div>

                                                 {/* Tab Content */}
                         <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
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

            {/* AI Chatbot */}
            <AIChatbot />
        </div>
    );
};

export default AdminPage;
