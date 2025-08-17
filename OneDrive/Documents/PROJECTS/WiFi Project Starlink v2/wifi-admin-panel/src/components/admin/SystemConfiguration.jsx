import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, doc, getDocs, updateDoc, addDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { FiSettings, FiPackage, FiMessageSquare, FiSave, FiPlus, FiTrash2, FiEdit3, FiX, FiGlobe, FiWifi, FiCreditCard, FiClock } from 'react-icons/fi';

const SystemConfiguration = () => {
    const [activeTab, setActiveTab] = useState('packages');
    const [isLoading, setIsLoading] = useState(true);
    const [packages, setPackages] = useState([]);
    const [muralChannels, setMuralChannels] = useState([]);
    const [systemSettings, setSystemSettings] = useState({});
    const [editingPackage, setEditingPackage] = useState(null);
    const [editingChannel, setEditingChannel] = useState(null);
    const [showPackageForm, setShowPackageForm] = useState(false);
    const [showChannelForm, setShowChannelForm] = useState(false);

    // Package form state
    const [packageForm, setPackageForm] = useState({
        name: '',
        type: 'time', // 'time' or 'data'
        duration: '',
        durationUnit: 'hours',
        dataAmount: '', // For data packages (GB)
        price: '',
        description: '',
        features: [],
        isActive: true,
        maxUsers: '',
        speedLimit: ''
    });

    // Channel form state
    const [channelForm, setChannelForm] = useState({
        name: '',
        description: '',
        logo: '📢',
        isActive: true,
        allowedRoles: ['user', 'admin'],
        moderationLevel: 'low',
        maxPostsPerDay: 5
    });

    // System settings form state
    const [settingsForm, setSettingsForm] = useState({
        siteName: 'WiFi Hub',
        siteDescription: 'Proveedor de internet de alta velocidad',
        contactEmail: 'admin@wifihub.com',
        supportPhone: '+506 1234 5678',
        maintenanceMode: false,
        maxFileUploadSize: 10,
        sessionTimeout: 24,
        referralBonus: 60,
        defaultLanguage: 'es',
        timezone: 'America/Costa_Rica'
    });

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        try {
            setIsLoading(true);
            
            // Load packages
            const packagesSnapshot = await getDocs(collection(db, 'timePackages'));
            const packagesData = packagesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Auto-detect and update packages without type field
            for (const pkg of packagesData) {
                if (!pkg.type) {
                    try {
                        // Determine type based on package name or dataAmount
                        let detectedType = 'time';
                        if (pkg.dataAmount || pkg.dataAmount === 0) {
                            detectedType = 'data';
                        } else if (pkg.name && (pkg.name.toLowerCase().includes('gb') || pkg.name.toLowerCase().includes('gigabyte') || pkg.name.toLowerCase().includes('data'))) {
                            detectedType = 'data';
                        }
                        
                        // Update the package with detected type
                        await updateDoc(doc(db, 'timePackages', pkg.id), {
                            type: detectedType,
                            updatedAt: new Date()
                        });
                        
                        console.log(`Updated package ${pkg.name} with type: ${detectedType}`);
                    } catch (error) {
                        console.error(`Error updating package ${pkg.name}:`, error);
                    }
                }
            }
            
            // Reload packages after updates
            const updatedPackagesSnapshot = await getDocs(collection(db, 'timePackages'));
            const updatedPackagesData = updatedPackagesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPackages(updatedPackagesData);

            // Load mural channels
            const channelsSnapshot = await getDocs(collection(db, 'muralChannels'));
            const channelsData = channelsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMuralChannels(channelsData);

            // Load system settings
            const settingsSnapshot = await getDocs(collection(db, 'systemSettings'));
            if (!settingsSnapshot.empty) {
                const settingsData = settingsSnapshot.docs[0].data();
                setSystemSettings(settingsData);
                setSettingsForm(prev => ({ ...prev, ...settingsData }));
            }

        } catch (error) {
            console.error('Error loading configuration data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Package Management
    const handlePackageSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingPackage) {
                // Update existing package
                await updateDoc(doc(db, 'timePackages', editingPackage.id), {
                    ...packageForm,
                    updatedAt: new Date()
                });
                setEditingPackage(null);
            } else {
                // Create new package
                await addDoc(collection(db, 'timePackages'), {
                    ...packageForm,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
            
            setShowPackageForm(false);
            setPackageForm({
                name: '',
                type: 'time', // 'time' or 'data'
                duration: '',
                durationUnit: 'hours',
                dataAmount: '', // For data packages (GB)
                price: '',
                description: '',
                features: [],
                isActive: true,
                maxUsers: '',
                speedLimit: ''
            });
            loadAllData();
        } catch (error) {
            console.error('Error saving package:', error);
            alert('Error al guardar el paquete');
        }
    };

    const handlePackageEdit = (pkg) => {
        setEditingPackage(pkg);
        setPackageForm({
            name: pkg.name || '',
            type: pkg.type || 'time', // 'time' or 'data'
            duration: pkg.duration || '',
            durationUnit: pkg.durationUnit || 'hours',
            dataAmount: pkg.dataAmount || '', // For data packages (GB)
            price: pkg.price || '',
            description: pkg.description || '',
            features: pkg.features || [],
            isActive: pkg.isActive !== false,
            maxUsers: pkg.maxUsers || '',
            speedLimit: pkg.speedLimit || ''
        });
        setShowPackageForm(true);
    };

    const handlePackageDelete = async (packageId) => {
        if (window.confirm('¿Está seguro de que desea eliminar este paquete?')) {
            try {
                await deleteDoc(doc(db, 'timePackages', packageId));
                loadAllData();
            } catch (error) {
                console.error('Error deleting package:', error);
                alert('Error al eliminar el paquete');
            }
        }
    };

    // Channel Management
    const handleChannelSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingChannel) {
                await updateDoc(doc(db, 'muralChannels', editingChannel.id), {
                    ...channelForm,
                    updatedAt: new Date()
                });
                setEditingChannel(null);
            } else {
                await addDoc(collection(db, 'muralChannels'), {
                    ...channelForm,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
            
            setShowChannelForm(false);
            setChannelForm({
                name: '',
                description: '',
                logo: '📢',
                isActive: true,
                allowedRoles: ['user', 'admin'],
                moderationLevel: 'low',
                maxPostsPerDay: 5
            });
            loadAllData();
        } catch (error) {
            console.error('Error saving channel:', error);
            alert('Error al guardar el canal');
        }
    };

    const handleChannelEdit = (channel) => {
        setEditingChannel(channel);
        setChannelForm({
            name: channel.name || '',
            description: channel.description || '',
            logo: channel.logo || '📢',
            isActive: channel.isActive !== false,
            allowedRoles: channel.allowedRoles || ['user', 'admin'],
            moderationLevel: channel.moderationLevel || 'low',
            maxPostsPerDay: channel.maxPostsPerDay || 5
        });
        setShowChannelForm(true);
    };

    const handleChannelDelete = async (channelId) => {
        if (window.confirm('¿Está seguro de que desea eliminar este canal?')) {
            try {
                await deleteDoc(doc(db, 'muralChannels', channelId));
                loadAllData();
            } catch (error) {
                console.error('Error deleting channel:', error);
                alert('Error al eliminar el canal');
            }
        }
    };

    // System Settings Management
    const handleSettingsSave = async () => {
        try {
            const settingsRef = doc(db, 'systemSettings', 'main');
            await updateDoc(settingsRef, {
                ...settingsForm,
                updatedAt: new Date()
            });
            alert('Configuración guardada exitosamente');
            loadAllData();
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Error al guardar la configuración');
        }
    };

    const addFeature = () => {
        setPackageForm(prev => ({
            ...prev,
            features: [...prev.features, '']
        }));
    };

    const updateFeature = (index, value) => {
        setPackageForm(prev => ({
            ...prev,
            features: prev.features.map((feature, i) => i === index ? value : feature)
        }));
    };

    const removeFeature = (index) => {
        setPackageForm(prev => ({
            ...prev,
            features: prev.features.filter((_, i) => i !== index)
        }));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Cargando configuración...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                    <FiSettings className="w-8 h-8 text-blue-600" />
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                            Configuración del Sistema
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Administre paquetes, canales del mural y configuraciones del sistema
                        </p>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 border-b border-gray-200 dark:border-gray-600">
                    <button
                        onClick={() => setActiveTab('packages')}
                        className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
                            activeTab === 'packages'
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-b-2 border-blue-600 dark:border-blue-400'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                        <FiPackage className="inline w-4 h-4 mr-2" />
                        Paquetes de Tiempo
                    </button>
                    <button
                        onClick={() => setActiveTab('channels')}
                        className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
                            activeTab === 'channels'
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-b-2 border-blue-600 dark:border-blue-400'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                        <FiMessageSquare className="inline w-4 h-4 mr-2" />
                        Canales del Mural
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
                            activeTab === 'settings'
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-b-2 border-blue-600 dark:border-blue-400'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                        <FiGlobe className="inline w-4 h-4 mr-2" />
                        Configuración General
                    </button>
                </div>
            </div>

            {/* Content based on active tab */}
            {activeTab === 'packages' && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                                Paquetes de Tiempo ({packages.length})
                            </h3>
                            <div className="flex gap-3">
                                <motion.button
                                    onClick={() => setShowPackageForm(true)}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <FiPlus className="w-4 h-4" />
                                    Nuevo Paquete
                                </motion.button>
                                
                                <motion.button
                                    onClick={async () => {
                                        try {
                                            const packagesSnapshot = await getDocs(collection(db, 'timePackages'));
                                            let updatedCount = 0;
                                            
                                            for (const doc of packagesSnapshot.docs) {
                                                const pkg = doc.data();
                                                if (!pkg.type) {
                                                    let detectedType = 'time';
                                                    if (pkg.dataAmount || pkg.dataAmount === 0) {
                                                        detectedType = 'data';
                                                    } else if (pkg.name && (pkg.name.toLowerCase().includes('gb') || pkg.name.toLowerCase().includes('gigabyte') || pkg.name.toLowerCase().includes('data'))) {
                                                        detectedType = 'data';
                                                    }
                                                    
                                                    await updateDoc(doc.ref, {
                                                        type: detectedType,
                                                        updatedAt: new Date()
                                                    });
                                                    updatedCount++;
                                                }
                                            }
                                            
                                            alert(`Se actualizaron ${updatedCount} paquetes con tipos detectados automáticamente`);
                                            loadAllData();
                                        } catch (error) {
                                            console.error('Error updating packages:', error);
                                            alert('Error al actualizar paquetes');
                                        }
                                    }}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <FiSettings className="w-4 h-4" />
                                    Actualizar Tipos
                                </motion.button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {packages.map(pkg => (
                                <motion.div
                                    key={pkg.id}
                                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-700"
                                    whileHover={{ y: -2 }}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className="font-semibold text-gray-800 dark:text-white">{pkg.name}</h4>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handlePackageEdit(pkg)}
                                                className="p-1 text-blue-600 hover:text-blue-800"
                                            >
                                                <FiEdit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handlePackageDelete(pkg.id)}
                                                className="p-1 text-red-600 hover:text-red-800"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{pkg.description}</p>
                                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                        ₡{pkg.price}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {pkg.type === 'data' ? (
                                            <span className="flex items-center gap-1">
                                                <FiWifi className="w-3 h-3" />
                                                {pkg.dataAmount} GB
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1">
                                                <FiClock className="w-3 h-3" />
                                                {pkg.duration} {pkg.durationUnit}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                        Tipo: {pkg.type === 'data' ? 'Datos' : 'Tiempo'}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'channels' && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                                Canales del Mural ({muralChannels.length})
                            </h3>
                            <motion.button
                                onClick={() => setShowChannelForm(true)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <FiPlus className="w-4 h-4" />
                                Nuevo Canal
                            </motion.button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {muralChannels.map(channel => (
                                <motion.div
                                    key={channel.id}
                                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-700"
                                    whileHover={{ y: -2 }}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{channel.logo}</span>
                                            <h4 className="font-semibold text-gray-800 dark:text-white">{channel.name}</h4>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleChannelEdit(channel)}
                                                className="p-1 text-blue-600 hover:text-blue-800"
                                            >
                                                <FiEdit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleChannelDelete(channel.id)}
                                                className="p-1 text-red-600 hover:text-red-800"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{channel.description}</p>
                                    <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                                        <div>Moderación: {channel.moderationLevel}</div>
                                        <div>Posts por día: {channel.maxPostsPerDay}</div>
                                        <div>Estado: {channel.isActive ? 'Activo' : 'Inactivo'}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'settings' && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
                            Configuración General del Sistema
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Nombre del Sitio
                                </label>
                                <input
                                    type="text"
                                    value={settingsForm.siteName}
                                    onChange={(e) => setSettingsForm(prev => ({ ...prev, siteName: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Email de Contacto
                                </label>
                                <input
                                    type="email"
                                    value={settingsForm.contactEmail}
                                    onChange={(e) => setSettingsForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                        </div>
                        <div className="mt-6">
                            <button
                                onClick={handleSettingsSave}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                            >
                                <FiSave className="w-4 h-4" />
                                Guardar Configuración
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Package Form Modal */}
            {showPackageForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                                {editingPackage ? 'Editar Paquete' : 'Nuevo Paquete'}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowPackageForm(false);
                                    setEditingPackage(null);
                                }}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <FiX className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handlePackageSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Nombre del Paquete *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={packageForm.name}
                                    onChange={(e) => setPackageForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="Ej: Paquete Básico"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Tipo de Paquete *
                                </label>
                                <select
                                    value={packageForm.type}
                                    onChange={(e) => setPackageForm(prev => ({ ...prev, type: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                >
                                    <option value="time">Tiempo</option>
                                    <option value="data">Datos</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Descripción
                                </label>
                                <textarea
                                    value={packageForm.description}
                                    onChange={(e) => setPackageForm(prev => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="Describe el paquete..."
                                />
                            </div>

                            {packageForm.type === 'time' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Duración *
                                            </label>
                                            <input
                                                type="number"
                                                required
                                                value={packageForm.duration}
                                                onChange={(e) => setPackageForm(prev => ({ ...prev, duration: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                                min="1"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Unidad
                                            </label>
                                            <select
                                                value={packageForm.durationUnit}
                                                onChange={(e) => setPackageForm(prev => ({ ...prev, durationUnit: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                            >
                                                <option value="minutes">Minutos</option>
                                                <option value="hours">Horas</option>
                                                <option value="days">Días</option>
                                                <option value="weeks">Semanas</option>
                                                <option value="months">Meses</option>
                                            </select>
                                        </div>
                                    </div>
                                </>
                            )}

                            {packageForm.type === 'data' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Cantidad de Datos (GB) *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        value={packageForm.dataAmount}
                                        onChange={(e) => setPackageForm(prev => ({ ...prev, dataAmount: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                        min="1"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Precio (CRC) *
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={packageForm.price}
                                    onChange={(e) => setPackageForm(prev => ({ ...prev, price: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="isActivePackage"
                                    checked={packageForm.isActive}
                                    onChange={(e) => setPackageForm(prev => ({ ...prev, isActive: e.target.checked }))}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="isActivePackage" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Paquete Activo
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPackageForm(false);
                                        setEditingPackage(null);
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <FiSave className="w-4 h-4" />
                                    {editingPackage ? 'Actualizar' : 'Crear'} Paquete
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Channel Form Modal */}
            {showChannelForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                                {editingChannel ? 'Editar Canal' : 'Nuevo Canal'}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowChannelForm(false);
                                    setEditingChannel(null);
                                    setChannelForm({
                                        name: '',
                                        description: '',
                                        logo: '📢',
                                        isActive: true,
                                        allowedRoles: ['user', 'admin'],
                                        moderationLevel: 'low',
                                        maxPostsPerDay: 5
                                    });
                                }}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <FiX className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleChannelSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Nombre del Canal *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={channelForm.name}
                                    onChange={(e) => setChannelForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="Ej: Anuncios Generales"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Descripción
                                </label>
                                <textarea
                                    value={channelForm.description}
                                    onChange={(e) => setChannelForm(prev => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="Describe el propósito del canal..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Logo del Canal
                                </label>
                                <input
                                    type="text"
                                    value={channelForm.logo}
                                    onChange={(e) => setChannelForm(prev => ({ ...prev, logo: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="Emoji para el canal (ej: 📢, 💬, 📈)"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Nivel de Moderación
                                </label>
                                <select
                                    value={channelForm.moderationLevel}
                                    onChange={(e) => setChannelForm(prev => ({ ...prev, moderationLevel: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                >
                                    <option value="low">Baja (Aprobación automática)</option>
                                    <option value="medium">Media (Revisión manual)</option>
                                    <option value="high">Alta (Aprobación requerida)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Máximo de Posts por Día
                                </label>
                                <input
                                    type="number"
                                    value={channelForm.maxPostsPerDay}
                                    onChange={(e) => setChannelForm(prev => ({ ...prev, maxPostsPerDay: parseInt(e.target.value) }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    min="1"
                                    max="100"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="isActiveChannel"
                                    checked={channelForm.isActive}
                                    onChange={(e) => setChannelForm(prev => ({ ...prev, isActive: e.target.checked }))}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="isActiveChannel" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Canal Activo
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowChannelForm(false);
                                        setEditingChannel(null);
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <FiSave className="w-4 h-4" />
                                    {editingChannel ? 'Actualizar' : 'Crear'} Canal
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default SystemConfiguration;

