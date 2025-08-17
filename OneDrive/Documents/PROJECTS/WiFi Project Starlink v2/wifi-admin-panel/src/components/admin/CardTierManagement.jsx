import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { FiShield, FiStar, FiZap, FiWifi, FiEdit3, FiSave, FiX } from 'react-icons/fi';

const CardTierManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [selectedTier, setSelectedTier] = useState('common');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const usersData = usersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setUsers(usersData);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCardTierInfo = (tier) => {
        const tiers = {
            common: {
                name: 'Common Card',
                icon: FiWifi,
                color: 'from-gray-400 to-gray-600',
                description: 'Tarjeta básica para nuevos usuarios',
                features: ['WiFi Access', 'Basic Support'],
                requirements: 'Usuario recién registrado'
            },
            standard: {
                name: 'Standard Card',
                icon: FiStar,
                color: 'from-blue-500 to-blue-700',
                description: 'Tarjeta estándar con beneficios adicionales',
                features: ['WiFi Access', 'Priority Support', 'Bonus Credits'],
                requirements: 'Mínimo 10 horas de crédito'
            },
            premium: {
                name: 'Premium Card',
                icon: FiZap,
                color: 'from-purple-500 to-purple-700',
                description: 'Tarjeta premium con características avanzadas',
                features: ['WiFi Access', 'Premium Support', 'Bonus Credits', 'Fast Lane'],
                requirements: 'Mínimo 50 horas de crédito'
            },
            vip: {
                name: 'VIP Card',
                icon: FiStar,
                color: 'from-yellow-400 to-orange-500',
                description: 'Tarjeta VIP con acceso exclusivo',
                features: ['WiFi Access', 'VIP Support', 'Maximum Credits', 'Fast Lane', 'Exclusive Access'],
                requirements: 'Mínimo 100 horas de crédito o asignación manual'
            }
        };
        return tiers[tier] || tiers.common;
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        setSelectedTier(user.cardTier || 'common');
    };

    const handleSaveTier = async () => {
        if (!editingUser) return;

        try {
            await updateDoc(doc(db, 'users', editingUser.id), {
                cardTier: selectedTier,
                cardTierUpdatedAt: new Date()
            });

            // Update local state
            setUsers(prev => prev.map(user => 
                user.id === editingUser.id 
                    ? { ...user, cardTier: selectedTier }
                    : user
            ));

            setEditingUser(null);
            alert(`Tarjeta ${getCardTierInfo(selectedTier).name} asignada exitosamente a ${editingUser.email}`);
        } catch (error) {
            console.error('Error updating user card tier:', error);
            alert('Error al actualizar el nivel de tarjeta del usuario');
        }
    };

    const getCurrentTier = (user) => {
        if (user.cardTier) {
            return user.cardTier;
        }
        
        // Auto-assign based on credits
        const totalHours = (user.credits?.hours || 0) + (user.credits?.minutes || 0) / 60;
        if (totalHours >= 100) return 'vip';
        if (totalHours >= 50) return 'premium';
        if (totalHours >= 10) return 'standard';
        return 'common';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Cargando usuarios...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    Gestión de Niveles de Tarjetas
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Asigna diferentes niveles de tarjetas a los usuarios según su estado y consumo
                </p>
            </div>

            {/* Card Tier Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {['common', 'standard', 'premium', 'vip'].map((tier) => {
                    const tierInfo = getCardTierInfo(tier);
                    const Icon = tierInfo.icon;
                    return (
                        <motion.div
                            key={tier}
                            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700"
                            whileHover={{ y: -2 }}
                        >
                            <div className="text-center">
                                <div className={`w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br ${tierInfo.color} flex items-center justify-center`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                                    {tierInfo.name}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    {tierInfo.description}
                                </p>
                                <div className="text-xs text-gray-500 dark:text-gray-500">
                                    {tierInfo.requirements}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-600">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        Usuarios del Sistema ({users.length})
                    </h3>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Usuario
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Créditos
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Nivel Actual
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                            {users.map((user) => {
                                const currentTier = getCurrentTier(user);
                                const tierInfo = getCardTierInfo(currentTier);
                                const Icon = tierInfo.icon;
                                
                                return (
                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            {user.displayName?.[0] || user.email?.[0] || 'U'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {user.displayName || 'Sin nombre'}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">
                                                {user.credits?.hours || 0}h {user.credits?.minutes || 0}m
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${tierInfo.color} flex items-center justify-center mr-2`}>
                                                    <Icon className="w-4 h-4 text-white" />
                                                </div>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                                    {currentTier}
                                                </span>
                                                {user.cardTier && (
                                                    <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                                                        Manual
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleEditUser(user)}
                                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                            >
                                                <FiEdit3 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                                Asignar Nivel de Tarjeta
                            </h3>
                            <button
                                onClick={() => setEditingUser(null)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <FiX className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="mb-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                Usuario: <span className="font-medium">{editingUser.email}</span>
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Créditos actuales: {editingUser.credits?.hours || 0}h {editingUser.credits?.minutes || 0}m
                            </p>
                        </div>
                        
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Nivel de Tarjeta
                            </label>
                            <select
                                value={selectedTier}
                                onChange={(e) => setSelectedTier(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="common">Common Card</option>
                                <option value="standard">Standard Card</option>
                                <option value="premium">Premium Card</option>
                                <option value="vip">VIP Card</option>
                            </select>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg mb-6">
                            <h4 className="font-medium text-gray-800 dark:text-white mb-2">
                                Características de {getCardTierInfo(selectedTier).name}:
                            </h4>
                            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                {getCardTierInfo(selectedTier).features.map((feature, index) => (
                                    <li key={index} className="flex items-center">
                                        <FiShield className="w-3 h-3 text-green-500 mr-2" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        <div className="flex gap-3">
                            <button
                                onClick={() => setEditingUser(null)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveTier}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <FiSave className="w-4 h-4" />
                                Guardar
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default CardTierManagement;
