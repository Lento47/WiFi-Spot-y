import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    FiPackage, FiPlus, FiEdit2, FiTrash2, FiSearch, FiFilter, 
    FiDownload, FiRefreshCw, FiClock, FiDollarSign, FiWifi, 
    FiCheck, FiX, FiAlertCircle, FiEye 
} from 'react-icons/fi';
import { 
    collection, getDocs, doc, addDoc, updateDoc, deleteDoc, 
    query, where, orderBy, onSnapshot, writeBatch 
} from 'firebase/firestore';
import { db } from '../../firebase';

const PackageManagement = () => {
    const [packages, setPackages] = useState([]);
    const [filteredPackages, setFilteredPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedPackages, setSelectedPackages] = useState([]);
    const [editingPackage, setEditingPackage] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [packageToDelete, setPackageToDelete] = useState(null);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        inactive: 0,
        timeBased: 0,
        dataBased: 0
    });

    // Fetch packages
    useEffect(() => {
        const fetchPackages = async () => {
            try {
                setLoading(true);
                const packagesRef = collection(db, 'timePackages');
                const q = query(packagesRef, orderBy('createdAt', 'desc'));
                
                const unsubscribe = onSnapshot(q, (snapshot) => {
                    const packagesData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
                        updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
                    }));
                    
                    setPackages(packagesData);
                    setFilteredPackages(packagesData);
                    updateStats(packagesData);
                    setLoading(false);
                });

                return () => unsubscribe();
            } catch (error) {
                console.error('Error fetching packages:', error);
                setLoading(false);
            }
        };

        fetchPackages();
    }, []);

    // Update stats
    const updateStats = (packagesData) => {
        const stats = {
            total: packagesData.length,
            active: packagesData.filter(p => p.status === 'active').length,
            inactive: packagesData.filter(p => p.status === 'inactive').length,
            timeBased: packagesData.filter(p => p.type === 'time').length,
            dataBased: packagesData.filter(p => p.type === 'data').length
        };
        setStats(stats);
    };

    // Filter and search packages
    useEffect(() => {
        let filtered = packages;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(pkg => 
                pkg.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                pkg.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                pkg.type?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(pkg => pkg.status === statusFilter);
        }

        // Type filter
        if (typeFilter !== 'all') {
            filtered = filtered.filter(pkg => pkg.type === typeFilter);
        }

        // Sort
        filtered.sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];
            
            if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
                aValue = aValue || new Date(0);
                bValue = bValue || new Date(0);
            }
            
            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        setFilteredPackages(filtered);
    }, [packages, searchTerm, statusFilter, typeFilter, sortBy, sortOrder]);

    // Handle package selection
    const handlePackageSelect = (packageId) => {
        setSelectedPackages(prev => 
            prev.includes(packageId) 
                ? prev.filter(id => id !== packageId)
                : [...prev, packageId]
        );
    };

    // Handle select all
    const handleSelectAll = () => {
        if (selectedPackages.length === filteredPackages.length) {
            setSelectedPackages([]);
        } else {
            setSelectedPackages(filteredPackages.map(p => p.id));
        }
    };

    // Create new package
    const handleCreatePackage = async (packageData) => {
        try {
            const packageRef = collection(db, 'timePackages');
            await addDoc(packageRef, {
                ...packageData,
                createdAt: new Date(),
                updatedAt: new Date(),
                status: 'active'
            });
            
            setShowCreateModal(false);
        } catch (error) {
            console.error('Error creating package:', error);
            alert('Error al crear el paquete');
        }
    };

    // Edit package
    const handleEditPackage = (pkg) => {
        setEditingPackage({ ...pkg });
        setShowEditModal(true);
    };

    // Save package changes
    const handleSavePackage = async () => {
        try {
            const packageRef = doc(db, 'timePackages', editingPackage.id);
            await updateDoc(packageRef, {
                name: editingPackage.name,
                description: editingPackage.description,
                type: editingPackage.type,
                duration: editingPackage.duration,
                price: editingPackage.price,
                status: editingPackage.status,
                features: editingPackage.features,
                updatedAt: new Date()
            });
            
            setShowEditModal(false);
            setEditingPackage(null);
        } catch (error) {
            console.error('Error updating package:', error);
            alert('Error al actualizar el paquete');
        }
    };

    // Delete package
    const handleDeletePackage = async () => {
        try {
            const batch = writeBatch(db);
            
            // Delete package document
            const packageRef = doc(db, 'timePackages', packageToDelete.id);
            batch.delete(packageRef);
            
            // You can add more related data deletion here if needed
            
            await batch.commit();
            setShowDeleteModal(false);
            setPackageToDelete(null);
        } catch (error) {
            console.error('Error deleting package:', error);
            alert('Error al eliminar el paquete');
        }
    };

    // Bulk actions
    const handleBulkAction = async (action) => {
        if (selectedPackages.length === 0) return;
        
        try {
            const batch = writeBatch(db);
            
            selectedPackages.forEach(packageId => {
                const packageRef = doc(db, 'timePackages', packageId);
                if (action === 'activate') {
                    batch.update(packageRef, { status: 'active', updatedAt: new Date() });
                } else if (action === 'deactivate') {
                    batch.update(packageRef, { status: 'inactive', updatedAt: new Date() });
                } else if (action === 'delete') {
                    batch.delete(packageRef);
                }
            });
            
            await batch.commit();
            setSelectedPackages([]);
        } catch (error) {
            console.error('Error performing bulk action:', error);
            alert('Error al realizar acción en lote');
        }
    };

    // Export packages
    const handleExportPackages = () => {
        const csvContent = [
            ['ID', 'Nombre', 'Descripción', 'Tipo', 'Duración', 'Precio', 'Estado', 'Características', 'Fecha Creación'],
            ...filteredPackages.map(pkg => [
                pkg.id,
                pkg.name || '',
                pkg.description || '',
                pkg.type || '',
                pkg.duration || '',
                pkg.price || '',
                pkg.status || 'active',
                JSON.stringify(pkg.features || []),
                pkg.createdAt?.toLocaleDateString() || ''
            ])
        ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `paquetes_${new Date().toISOString().split('T')[0]}.csv`;
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
                        <FiPackage className="w-8 h-8 text-blue-600 dark:text-blue-400" />
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
                            <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Por Tiempo</p>
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.timeBased}</p>
                        </div>
                        <FiClock className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    </div>
                </motion.div>
                
                <motion.div
                    className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4"
                    whileHover={{ scale: 1.02 }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Por Datos</p>
                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.dataBased}</p>
                        </div>
                        <FiWifi className="w-8 h-8 text-orange-600 dark:text-orange-400" />
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
                                placeholder="Buscar paquetes..."
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
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">Todos los tipos</option>
                            <option value="time">Por Tiempo</option>
                            <option value="data">Por Datos</option>
                        </select>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="createdAt">Fecha de creación</option>
                            <option value="updatedAt">Última actualización</option>
                            <option value="name">Nombre</option>
                            <option value="price">Precio</option>
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
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <FiPlus className="w-4 h-4" />
                            Crear Paquete
                        </button>
                        
                        <button
                            onClick={handleExportPackages}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <FiDownload className="w-4 h-4" />
                            Exportar
                        </button>
                        
                        <button
                            onClick={() => window.location.reload()}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            <FiRefreshCw className="w-4 h-4" />
                            Actualizar
                        </button>
                    </div>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedPackages.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <p className="text-blue-800 dark:text-blue-200">
                            {selectedPackages.length} paquete(s) seleccionado(s)
                        </p>
                        <div className="flex gap-2">
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
                                    setPackageToDelete({ id: 'bulk', count: selectedPackages.length });
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

            {/* Packages Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto min-w-full">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedPackages.length === filteredPackages.length && filteredPackages.length > 0}
                                        onChange={handleSelectAll}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Paquete
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Tipo
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Duración/Datos
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Precio
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Fecha Creación
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredPackages.map((pkg) => (
                                <motion.tr
                                    key={pkg.id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <td className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedPackages.includes(pkg.id)}
                                            onChange={() => handlePackageSelect(pkg.id)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                                <FiPackage className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div className="ml-3">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {pkg.name || 'Sin nombre'}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {pkg.description || 'Sin descripción'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                            pkg.type === 'time'
                                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                                : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                        }`}>
                                            {pkg.type === 'time' ? 'Por Tiempo' : 'Por Datos'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-sm text-gray-900 dark:text-white">
                                            {pkg.type === 'time' 
                                                ? `${pkg.duration || 0} minutos`
                                                : `${pkg.data || 0} GB`
                                            }
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            ₡{pkg.price?.toLocaleString() || 0}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                            pkg.status === 'active' 
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                        }`}>
                                            {pkg.status === 'active' ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                        {pkg.createdAt?.toLocaleDateString() || 'N/A'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEditPackage(pkg)}
                                                className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                                title="Editar paquete"
                                            >
                                                <FiEdit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setPackageToDelete(pkg);
                                                    setShowDeleteModal(true);
                                                }}
                                                className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                                title="Eliminar paquete"
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

                {filteredPackages.length === 0 && (
                    <div className="text-center py-12">
                        <FiPackage className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                        <p className="text-gray-500 dark:text-gray-400">
                            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                                ? 'No se encontraron paquetes con los filtros aplicados'
                                : 'No hay paquetes registrados'
                            }
                        </p>
                    </div>
                )}
            </div>

            {/* Create Package Modal */}
            {showCreateModal && (
                <CreatePackageModal 
                    onClose={() => setShowCreateModal(false)}
                    onSubmit={handleCreatePackage}
                />
            )}

            {/* Edit Package Modal */}
            {showEditModal && editingPackage && (
                <EditPackageModal 
                    package={editingPackage}
                    onClose={() => setShowEditModal(false)}
                    onSubmit={handleSavePackage}
                />
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && packageToDelete && (
                <DeletePackageModal 
                    package={packageToDelete}
                    onClose={() => setShowDeleteModal(false)}
                    onConfirm={handleDeletePackage}
                />
            )}
        </div>
    );
};

// Create Package Modal Component
const CreatePackageModal = ({ onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'time',
        duration: '',
        data: '',
        price: '',
        features: []
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.price) {
            alert('Por favor complete los campos requeridos');
            return;
        }
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        Crear Nuevo Paquete
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nombre del Paquete *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Descripción
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tipo de Paquete
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({...formData, type: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="time">Por Tiempo</option>
                            <option value="data">Por Datos</option>
                        </select>
                    </div>
                    
                    {formData.type === 'time' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Duración (minutos)
                            </label>
                            <input
                                type="number"
                                value={formData.duration}
                                onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value) || 0})}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Datos (GB)
                            </label>
                            <input
                                type="number"
                                value={formData.data}
                                onChange={(e) => setFormData({...formData, data: parseInt(e.target.value) || 0})}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Precio (₡) *
                        </label>
                        <input
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>
                    
                    <div className="flex gap-3 mt-6">
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Crear Paquete
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Edit Package Modal Component
const EditPackageModal = ({ package: pkg, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        name: pkg.name || '',
        description: pkg.description || '',
        type: pkg.type || 'time',
        duration: pkg.duration || '',
        data: pkg.data || '',
        price: pkg.price || '',
        status: pkg.status || 'active',
        features: pkg.features || []
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.price) {
            alert('Por favor complete los campos requeridos');
            return;
        }
        onSubmit({ ...pkg, ...formData });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        Editar Paquete
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nombre del Paquete *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Descripción
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tipo de Paquete
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({...formData, type: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="time">Por Tiempo</option>
                            <option value="data">Por Datos</option>
                        </select>
                    </div>
                    
                    {formData.type === 'time' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Duración (minutos)
                            </label>
                            <input
                                type="number"
                                value={formData.duration}
                                onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value) || 0})}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Datos (GB)
                            </label>
                            <input
                                type="number"
                                value={formData.data}
                                onChange={(e) => setFormData({...formData, data: parseInt(e.target.value) || 0})}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Precio (₡) *
                        </label>
                        <input
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Estado
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="active">Activo</option>
                            <option value="inactive">Inactivo</option>
                        </select>
                    </div>
                    
                    <div className="flex gap-3 mt-6">
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Guardar Cambios
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Delete Package Modal Component
const DeletePackageModal = ({ package: pkg, onClose, onConfirm }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
                <div className="flex items-center gap-3 mb-4">
                    <FiAlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        Confirmar Eliminación
                    </h3>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {pkg.id === 'bulk' 
                        ? `¿Estás seguro de que quieres eliminar ${pkg.count} paquete(s)? Esta acción no se puede deshacer.`
                        : `¿Estás seguro de que quieres eliminar el paquete "${pkg.name}"? Esta acción no se puede deshacer.`
                    }
                </p>
                
                <div className="flex gap-3">
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Eliminar
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PackageManagement;
