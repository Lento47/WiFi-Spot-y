import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { FiClock, FiCheck, FiX, FiPackage, FiDollarSign, FiCalendar } from 'react-icons/fi';

const PurchaseHistory = ({ user }) => {
    const [payments, setPayments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'payments'),
            where('userId', '==', user.uid),
            orderBy('timestamp', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const paymentsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPayments(paymentsData);
            setIsLoading(false);
        }, (error) => {
            console.error('Error fetching payments:', error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'rejected':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'approved':
                return 'Aprobado';
            case 'rejected':
                return 'Rechazado';
            case 'pending':
                return 'Pendiente';
            default:
                return 'Desconocido';
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('es-CR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount) => {
        if (!amount || isNaN(amount)) return '₡0';
        return new Intl.NumberFormat('es-CR', {
            style: 'currency',
            currency: 'CRC',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                <span className="ml-3 text-gray-600">Cargando historial...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                    <FiClock className="w-6 h-6 text-green-600" />
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Historial de Compras</h2>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                    Revisa el estado de todos tus pagos y compras realizadas
                </p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                            <FiPackage className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Compras</p>
                            <p className="text-xl font-bold text-gray-800 dark:text-white">{payments.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                            <FiCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Aprobadas</p>
                            <p className="text-xl font-bold text-gray-800 dark:text-white">
                                {payments.filter(p => p.status === 'approved').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                            <FiClock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Pendientes</p>
                            <p className="text-xl font-bold text-gray-800 dark:text-white">
                                {payments.filter(p => p.status === 'pending').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                            <FiDollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Gastado</p>
                            <p className="text-xl font-bold text-gray-800 dark:text-white">
                                {formatCurrency(payments.reduce((sum, p) => sum + (parseFloat(p.packagePrice || p.price) || 0), 0))}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payments List */}
            {payments.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-sm border border-gray-100 dark:border-gray-700">
                    <FiPackage className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No hay compras aún</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        Cuando realices tu primera compra, aparecerá aquí en tu historial.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {payments.map((payment) => (
                        <motion.div
                            key={payment.id}
                            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                {/* Payment Info */}
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                                                {payment.packageName || 'Paquete sin nombre'}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                ID: {payment.id}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                                            {getStatusLabel(payment.status)}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <FiDollarSign className="w-4 h-4 text-gray-500" />
                                            <span className="text-gray-600 dark:text-gray-400">Monto:</span>
                                            <span className="font-medium text-gray-800 dark:text-white">
                                                {formatCurrency(payment.packagePrice || payment.price)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FiPackage className="w-4 h-4 text-gray-500" />
                                            <span className="text-gray-600 dark:text-gray-400">Duración:</span>
                                            <span className="font-medium text-gray-800 dark:text-white">
                                                {payment.packageDuration || payment.duration || 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FiCalendar className="w-4 h-4 text-gray-500" />
                                            <span className="text-gray-600 dark:text-gray-400">Fecha:</span>
                                            <span className="font-medium text-gray-800 dark:text-white">
                                                {formatDate(payment.timestamp)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Additional Details */}
                                    {payment.phoneNumber && (
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            Teléfono: {payment.phoneNumber}
                                        </div>
                                    )}
                                    
                                    {payment.receiptUrl && (
                                        <div className="text-sm">
                                            <a
                                                href={payment.receiptUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
                                            >
                                                Ver comprobante →
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {/* Status-specific Actions */}
                                {payment.status === 'approved' && payment.token && (
                                    <div className="lg:text-right">
                                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Token de Acceso:</div>
                                        <div className="font-mono text-lg font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
                                            {payment.token}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PurchaseHistory;
