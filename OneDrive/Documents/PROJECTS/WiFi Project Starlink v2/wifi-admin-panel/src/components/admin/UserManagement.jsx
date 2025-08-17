import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    FiUsers, FiSearch, FiEdit2, FiTrash2, FiEye, FiFilter, 
    FiDownload, FiRefreshCw, FiUserPlus, FiMail, FiPhone, 
    FiCalendar, FiShield, FiCheck, FiX, FiAlertCircle, FiClock, FiWifi 
} from 'react-icons/fi';
import { 
    collection, getDocs, doc, updateDoc, deleteDoc, 
    query, where, orderBy, limit, onSnapshot, writeBatch 
} from 'firebase/firestore';
import { db } from '../../firebase';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        inactive: 0,
        admins: 0,
        regular: 0
    });

    // Fetch users
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const usersRef = collection(db, 'users');
                const q = query(usersRef, orderBy('createdAt', 'desc'));
                
                const unsubscribe = onSnapshot(q, (snapshot) => {
                    const usersData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
                        lastLogin: doc.data().lastLogin?.toDate?.() || null
                    }));
                    
                    setUsers(usersData);
                    setFilteredUsers(usersData);
                    updateStats(usersData);
                    setLoading(false);
                });

                return () => unsubscribe();
            } catch (error) {
                console.error('Error fetching users:', error);
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    // Update stats
    const updateStats = (usersData) => {
        const stats = {
            total: usersData.length,
            active: usersData.filter(u => u.status === 'active').length,
            inactive: usersData.filter(u => u.status === 'inactive').length,
            admins: usersData.filter(u => u.role === 'admin').length,
            regular: usersData.filter(u => u.role === 'user').length
        };
        setStats(stats);
    };

    // Filter and search users
    useEffect(() => {
        let filtered = users;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(user => 
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.uid?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(user => user.status === statusFilter);
        }

        // Role filter
        if (roleFilter !== 'all') {
            filtered = filtered.filter(user => user.role === roleFilter);
        }

        // Sort
        filtered.sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];
            
            if (sortBy === 'createdAt' || sortBy === 'lastLogin') {
                aValue = aValue || new Date(0);
                bValue = bValue || new Date(0);
            }
            
            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        setFilteredUsers(filtered);
    }, [users, searchTerm, statusFilter, roleFilter, sortBy, sortOrder]);

    // Handle user selection
    const handleUserSelect = (userId) => {
        setSelectedUsers(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    // Handle select all
    const handleSelectAll = () => {
        if (selectedUsers.length === filteredUsers.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(filteredUsers.map(u => u.id));
        }
    };

    // Edit user
    const handleEditUser = (user) => {
        setEditingUser({ ...user });
        setShowEditModal(true);
    };

    // Save user changes
    const handleSaveUser = async () => {
        try {
            const userRef = doc(db, 'users', editingUser.id);

            // Normalize values to avoid undefined writes
            const safeRole = editingUser.role || 'user';
            const safeStatus = editingUser.status || 'active';
            const currentCredits = editingUser.credits || { hours: 0, minutes: 0, gb: 0 };
            let safeHours = parseInt(currentCredits.hours ?? 0, 10);
            let safeMinutes = parseInt(currentCredits.minutes ?? 0, 10);
            let safeGb = parseInt(currentCredits.gb ?? 0, 10);
            if (Number.isNaN(safeHours)) safeHours = 0;
            if (Number.isNaN(safeMinutes)) safeMinutes = 0;
            if (Number.isNaN(safeGb)) safeGb = 0;

            // Roll minutes into hours when >= 60 and keep non-negative
            if (safeMinutes < 0) safeMinutes = 0;
            if (safeHours < 0) safeHours = 0;
            if (safeGb < 0) safeGb = 0;
            if (safeMinutes >= 60) {
                safeHours += Math.floor(safeMinutes / 60);
                safeMinutes = safeMinutes % 60;
            }

            await updateDoc(userRef, {
                displayName: editingUser.displayName || '',
                status: safeStatus,
                role: safeRole,
                'credits.hours': safeHours,
                'credits.minutes': safeMinutes,
                'credits.gb': safeGb,
                'credits.lastUpdated': new Date(),
                updatedAt: new Date()
            });
            
            setShowEditModal(false);
            setEditingUser(null);
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Error al actualizar usuario');
        }
    };

    // Delete user
    const handleDeleteUser = async () => {
        try {
            const batch = writeBatch(db);
            
            // Delete user document
            const userRef = doc(db, 'users', userToDelete.id);
            batch.delete(userRef);
            
            // Delete related data (payments, support tickets, etc.)
            // You can add more collections here as needed
            
            await batch.commit();
            setShowDeleteModal(false);
            setUserToDelete(null);
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Error al eliminar usuario');
        }
    };

    // Bulk actions
    const handleBulkAction = async (action) => {
        if (selectedUsers.length === 0) return;
        
        try {
            const batch = writeBatch(db);
            
            selectedUsers.forEach(userId => {
                const userRef = doc(db, 'users', userId);
                if (action === 'activate') {
                    batch.update(userRef, { status: 'active', updatedAt: new Date() });
                } else if (action === 'deactivate') {
                    batch.update(userRef, { status: 'inactive', updatedAt: new Date() });
                } else if (action === 'delete') {
                    batch.delete(userRef);
                }
            });
            
            await batch.commit();
            setSelectedUsers([]);
        } catch (error) {
            console.error('Error performing bulk action:', error);
            alert('Error al realizar acción en lote');
        }
    };

    // Export users
    const handleExportUsers = () => {
        const csvContent = [
            ['ID', 'Email', 'Nombre', 'Estado', 'Rol', 'Créditos (Horas)', 'Créditos (Minutos)', 'Créditos (GB)', 'Fecha Creación', 'Último Login'],
            ...filteredUsers.map(user => [
                user.uid,
                user.email || '',
                user.displayName || '',
                user.status || 'active',
                user.role || 'user',
                user.credits?.hours || 0,
                user.credits?.minutes || 0,
                user.credits?.gb || 0,
                user.createdAt?.toLocaleDateString() || '',
                user.lastLogin?.toLocaleDateString() || ''
            ])
        ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `usuarios_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <motion.div
                    className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
                    whileHover={{ scale: 1.02 }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total</p>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</p>
                        </div>
                        <FiUsers className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                </motion.div>
                
                <motion.div
                    className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
                    whileHover={{ scale: 1.02 }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-600 dark:text-green-400">Activos</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
                        </div>
                        <FiCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                </motion.div>
                
                <motion.div
                    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
                    whileHover={{ scale: 1.02 }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-red-600 dark:text-red-400">Inactivos</p>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.inactive}</p>
                        </div>
                        <FiX className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                </motion.div>
                
                <motion.div
                    className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4"
                    whileHover={{ scale: 1.02 }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Admins</p>
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.admins}</p>
                        </div>
                        <FiShield className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    </div>
                </motion.div>
                
                <motion.div
                    className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4"
                    whileHover={{ scale: 1.02 }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Regulares</p>
                            <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.regular}</p>
                        </div>
                        <FiUsers className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                    </div>
                </motion.div>
            </div>

            {/* Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
                    <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
                        {/* Search */}
                        <div className="relative flex-1 w-full sm:max-w-md">
                            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Buscar usuarios..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Filters */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">Todos los estados</option>
                            <option value="active">Activos</option>
                            <option value="inactive">Inactivos</option>
                        </select>

                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">Todos los roles</option>
                            <option value="admin">Administradores</option>
                            <option value="user">Usuarios</option>
                        </select>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="createdAt">Fecha de creación</option>
                            <option value="lastLogin">Último login</option>
                            <option value="email">Email</option>
                            <option value="displayName">Nombre</option>
                        </select>

                        <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                        >
                            {sortOrder === 'asc' ? '↑' : '↓'}
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <button
                            onClick={handleExportUsers}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <FiDownload className="w-4 h-4" />
                            Exportar
                        </button>
                        
                        <button
                            onClick={() => window.location.reload()}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <FiRefreshCw className="w-4 h-4" />
                            Actualizar
                        </button>
                    </div>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedUsers.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <p className="text-blue-800 dark:text-blue-200">
                            {selectedUsers.length} usuario(s) seleccionado(s)
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => handleBulkAction('activate')}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                            >
                                Activar
                            </button>
                            <button
                                onClick={() => handleBulkAction('deactivate')}
                                className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
                            >
                                Desactivar
                            </button>
                            <button
                                onClick={() => {
                                    setUserToDelete({ id: 'bulk', count: selectedUsers.length });
                                    setShowDeleteModal(true);
                                }}
                                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Users Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-2 py-3 text-left w-12">
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                                        onChange={handleSelectAll}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </th>
                                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-48">
                                    Usuario
                                </th>
                                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20">
                                    Estado
                                </th>
                                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20">
                                    Rol
                                </th>
                                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
                                    Créditos (Tiempo/GB)
                                </th>
                                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-28">
                                    Fecha Creación
                                </th>
                                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-28">
                                    Último Login
                                </th>
                                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredUsers.map((user) => (
                                <motion.tr
                                    key={user.id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <td className="px-2 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(user.id)}
                                            onChange={() => handleUserSelect(user.id)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </td>
                                    <td className="px-2 py-3">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                                                <FiUsers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div className="ml-3 min-w-0">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                    {user.displayName || 'Sin nombre'}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                    {user.email}
                                                </div>
                                                <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                                                    {user.uid?.slice(0, 8)}...
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-2 py-3">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                            user.status === 'active' 
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                        }`}>
                                            {user.status === 'active' ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-2 py-3">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                            user.role === 'admin'
                                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                        }`}>
                                            {user.role === 'admin' ? 'Admin' : 'Usuario'}
                                        </span>
                                    </td>
                                    <td className="px-2 py-3">
                                        <div className="text-sm text-gray-900 dark:text-white">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1">
                                                    <FiClock className="w-3 h-3 text-green-600" />
                                                    <span>{user.credits?.hours || 0}h {user.credits?.minutes || 0}m</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <FiWifi className="w-3 h-3 text-blue-600" />
                                                    <span>{user.credits?.gb || 0} GB</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-2 py-3 text-sm text-gray-500 dark:text-gray-400">
                                        {user.createdAt?.toLocaleDateString() || 'N/A'}
                                    </td>
                                    <td className="px-2 py-3 text-sm text-gray-500 dark:text-gray-400">
                                        {user.lastLogin?.toLocaleDateString() || 'Nunca'}
                                    </td>
                                    <td className="px-2 py-3">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEditUser(user)}
                                                className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                                title="Editar usuario"
                                            >
                                                <FiEdit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setUserToDelete(user);
                                                    setShowDeleteModal(true);
                                                }}
                                                className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                                title="Eliminar usuario"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredUsers.length === 0 && (
                    <div className="text-center py-12">
                        <FiUsers className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                        <p className="text-gray-500 dark:text-gray-400">
                            {searchTerm || statusFilter !== 'all' || roleFilter !== 'all' 
                                ? 'No se encontraron usuarios con los filtros aplicados'
                                : 'No hay usuarios registrados'
                            }
                        </p>
                    </div>
                )}
            </div>

            {/* Edit User Modal */}
            {showEditModal && editingUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                                Editar Usuario
                            </h3>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={editingUser.email || ''}
                                    disabled
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Nombre
                                </label>
                                <input
                                    type="text"
                                    value={editingUser.displayName || ''}
                                    onChange={(e) => setEditingUser({...editingUser, displayName: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Estado
                                </label>
                                <select
                                    value={editingUser.status || 'active'}
                                    onChange={(e) => setEditingUser({...editingUser, status: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="active">Activo</option>
                                    <option value="inactive">Inactivo</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Rol
                                </label>
                                <select
                                    value={editingUser.role || 'user'}
                                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="user">Usuario</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Créditos (Horas)
                                </label>
                                <input
                                    type="number"
                                    value={editingUser.credits?.hours || 0}
                                    onChange={(e) => setEditingUser({
                                        ...editingUser, 
                                        credits: {...editingUser.credits, hours: parseInt(e.target.value) || 0}
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Créditos (Minutos)
                                </label>
                                <input
                                    type="number"
                                    value={editingUser.credits?.minutes || 0}
                                    onChange={(e) => setEditingUser({
                                        ...editingUser, 
                                        credits: {...editingUser.credits, minutes: parseInt(e.target.value) || 0}
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Créditos (GB)
                                </label>
                                <input
                                    type="number"
                                    value={editingUser.credits?.gb || 0}
                                    onChange={(e) => setEditingUser({
                                        ...editingUser, 
                                        credits: {...editingUser.credits, gb: parseInt(e.target.value) || 0}
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleSaveUser}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Guardar Cambios
                            </button>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && userToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <FiAlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                                Confirmar Eliminación
                            </h3>
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            {userToDelete.id === 'bulk' 
                                ? `¿Estás seguro de que quieres eliminar ${userToDelete.count} usuario(s)? Esta acción no se puede deshacer.`
                                : `¿Estás seguro de que quieres eliminar al usuario "${userToDelete.displayName || userToDelete.email}"? Esta acción no se puede deshacer.`
                            }
                        </p>
                        
                        <div className="flex gap-3">
                            <button
                                onClick={handleDeleteUser}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Eliminar
                            </button>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;