import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, doc, getDocs, updateDoc, addDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { FiSettings, FiPackage, FiMessageSquare, FiSave, FiPlus, FiTrash2, FiEdit3, FiX, FiGlobe, FiWifi, FiCreditCard } from 'react-icons/fi';

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
        duration: '',
        durationUnit: 'hours',
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
            setPackages(packagesData);

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
                duration: '',
                durationUnit: 'hours',
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
            duration: pkg.duration || '',
            durationUnit: pkg.durationUnit || 'hours',
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
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                    <FiSettings className="w-8 h-8 text-blue-600" />
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">
                            Configuración del Sistema
                        </h2>
                        <p className="text-gray-600">
                            Administre paquetes, canales del mural y configuraciones del sistema
                        </p>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('packages')}
                        className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
                            activeTab === 'packages'
                                ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                        }`}
                    >
                        <FiPackage className="inline w-4 h-4 mr-2" />
                        Paquetes de Tiempo
                    </button>
                    <button
                        onClick={() => setActiveTab('channels')}
                        className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
                            activeTab === 'channels'
                                ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                        }`}
                    >
                        <FiMessageSquare className="inline w-4 h-4 mr-2" />
                        Canales del Mural
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
                            activeTab === 'settings'
                                ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                        }`}
                    >
                        <FiGlobe className="inline w-4 h-4 mr-2" />
                        Configuración General
                    </button>
                </div>
            </div>

            {/* Packages Tab */}
            {activeTab === 'packages' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold text-gray-800">
                                Paquetes de Tiempo ({packages.length})
                            </h3>
                            <motion.button
                                onClick={() => setShowPackageForm(true)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <FiPlus className="w-4 h-4" />
                                Nuevo Paquete
                            </motion.button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {packages.map(pkg => (
                                <motion.div
                                    key={pkg.id}
                                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                    whileHover={{ y: -2 }}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className="font-semibold text-gray-800">{pkg.name}</h4>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handlePackageEdit(pkg)}
                                                className="text-blue-600 hover:text-blue-700"
                                                title="Editar"
                                            >
                                                <FiEdit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handlePackageDelete(pkg.id)}
                                                className="text-red-600 hover:text-red-700"
                                                title="Eliminar"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2 text-sm text-gray-600">
                                        <div className="flex justify-between">
                                            <span>Duración:</span>
                                            <span className="font-medium">{pkg.duration} {pkg.durationUnit}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Precio:</span>
                                            <span className="font-medium">₡{pkg.price}</span>
                                        </div>
                                        {pkg.speedLimit && (
                                            <div className="flex justify-between">
                                                <span>Velocidad:</span>
                                                <span className="font-medium">{pkg.speedLimit} Mbps</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span>Estado:</span>
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                pkg.isActive 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {pkg.isActive ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Channels Tab */}
            {activeTab === 'channels' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold text-gray-800">
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
                                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                    whileHover={{ y: -2 }}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className="font-semibold text-gray-800">{channel.name}</h4>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleChannelEdit(channel)}
                                                className="text-blue-600 hover:text-blue-700"
                                                title="Editar"
                                            >
                                                <FiEdit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleChannelDelete(channel.id)}
                                                className="text-red-600 hover:text-red-700"
                                                title="Eliminar"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <p className="text-sm text-gray-600 mb-3">{channel.description}</p>
                                    
                                    <div className="space-y-2 text-sm text-gray-600">
                                        <div className="flex justify-between">
                                            <span>Moderación:</span>
                                            <span className="font-medium capitalize">{channel.moderationLevel}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Posts por día:</span>
                                            <span className="font-medium">{channel.maxPostsPerDay}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Estado:</span>
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                channel.isActive 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {channel.isActive ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-xl font-semibold text-gray-800 mb-6">
                            Configuración General del Sistema
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Basic Settings */}
                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-700 border-b pb-2">Configuración Básica</h4>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nombre del Sitio
                                    </label>
                                    <input
                                        type="text"
                                        value={settingsForm.siteName}
                                        onChange={(e) => setSettingsForm(prev => ({ ...prev, siteName: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Descripción del Sitio
                                    </label>
                                    <textarea
                                        value={settingsForm.siteDescription}
                                        onChange={(e) => setSettingsForm(prev => ({ ...prev, siteDescription: e.target.value }))}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email de Contacto
                                    </label>
                                    <input
                                        type="email"
                                        value={settingsForm.contactEmail}
                                        onChange={(e) => setSettingsForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Teléfono de Soporte
                                    </label>
                                    <input
                                        type="text"
                                        value={settingsForm.supportPhone}
                                        onChange={(e) => setSettingsForm(prev => ({ ...prev, supportPhone: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Advanced Settings */}
                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-700 border-b pb-2">Configuración Avanzada</h4>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Bono de Referencia (minutos)
                                    </label>
                                    <input
                                        type="number"
                                        value={settingsForm.referralBonus}
                                        onChange={(e) => setSettingsForm(prev => ({ ...prev, referralBonus: parseInt(e.target.value) }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tamaño Máximo de Archivo (MB)
                                    </label>
                                    <input
                                        type="number"
                                        value={settingsForm.maxFileUploadSize}
                                        onChange={(e) => setSettingsForm(prev => ({ ...prev, maxFileUploadSize: parseInt(e.target.value) }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Timeout de Sesión (horas)
                                    </label>
                                    <input
                                        type="number"
                                        value={settingsForm.sessionTimeout}
                                        onChange={(e) => setSettingsForm(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Idioma por Defecto
                                    </label>
                                    <select
                                        value={settingsForm.defaultLanguage}
                                        onChange={(e) => setSettingsForm(prev => ({ ...prev, defaultLanguage: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="es">Español</option>
                                        <option value="en">English</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="maintenanceMode"
                                        checked={settingsForm.maintenanceMode}
                                        onChange={(e) => setSettingsForm(prev => ({ ...prev, maintenanceMode: e.target.checked }))}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="maintenanceMode" className="text-sm font-medium text-gray-700">
                                        Modo de Mantenimiento
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <motion.button
                                onClick={handleSettingsSave}
                                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <FiSave className="w-4 h-4" />
                                Guardar Configuración
                            </motion.button>
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
                        className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold text-gray-800">
                                {editingPackage ? 'Editar Paquete' : 'Nuevo Paquete'}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowPackageForm(false);
                                    setEditingPackage(null);
                                    setPackageForm({
                                        name: '',
                                        duration: '',
                                        durationUnit: 'hours',
                                        price: '',
                                        description: '',
                                        features: [],
                                        isActive: true,
                                        maxUsers: '',
                                        speedLimit: ''
                                    });
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <FiX className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handlePackageSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nombre del Paquete *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={packageForm.name}
                                        onChange={(e) => setPackageForm(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Ej: Básico 1 Hora"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Precio (CRC) *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        value={packageForm.price}
                                        onChange={(e) => setPackageForm(prev => ({ ...prev, price: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Duración *
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            required
                                            value={packageForm.duration}
                                            onChange={(e) => setPackageForm(prev => ({ ...prev, duration: e.target.value }))}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="1"
                                        />
                                        <select
                                            value={packageForm.durationUnit}
                                            onChange={(e) => setPackageForm(prev => ({ ...prev, durationUnit: e.target.value }))}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="minutes">Minutos</option>
                                            <option value="hours">Horas</option>
                                            <option value="days">Días</option>
                                            <option value="weeks">Semanas</option>
                                            <option value="months">Meses</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Límite de Velocidad (Mbps)
                                    </label>
                                    <input
                                        type="number"
                                        value={packageForm.speedLimit}
                                        onChange={(e) => setPackageForm(prev => ({ ...prev, speedLimit: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="50"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Descripción
                                </label>
                                <textarea
                                    value={packageForm.description}
                                    onChange={(e) => setPackageForm(prev => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Describe las características del paquete..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Características
                                </label>
                                <div className="space-y-2">
                                    {packageForm.features.map((feature, index) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={feature}
                                                onChange={(e) => updateFeature(index, e.target.value)}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Característica..."
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeFeature(index)}
                                                className="px-3 py-2 text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addFeature}
                                        className="px-4 py-2 text-blue-600 hover:text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                                    >
                                        <FiPlus className="w-4 h-4 inline mr-2" />
                                        Agregar Característica
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={packageForm.isActive}
                                    onChange={(e) => setPackageForm(prev => ({ ...prev, isActive: e.target.checked }))}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
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
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
                        className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold text-gray-800">
                                {editingChannel ? 'Editar Canal' : 'Nuevo Canal'}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowChannelForm(false);
                                    setEditingChannel(null);
                                    setChannelForm({
                                        name: '',
                                        description: '',
                                        isActive: true,
                                        allowedRoles: ['user', 'admin'],
                                        moderationLevel: 'low',
                                        maxPostsPerDay: 5
                                    });
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <FiX className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleChannelSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nombre del Canal *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={channelForm.name}
                                    onChange={(e) => setChannelForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Ej: Anuncios Generales"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Descripción
                                </label>
                                <textarea
                                    value={channelForm.description}
                                    onChange={(e) => setChannelForm(prev => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Describe el propósito del canal..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nivel de Moderación
                                </label>
                                <select
                                    value={channelForm.moderationLevel}
                                    onChange={(e) => setChannelForm(prev => ({ ...prev, moderationLevel: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="low">Baja (Aprobación automática)</option>
                                    <option value="medium">Media (Revisión manual)</option>
                                    <option value="high">Alta (Aprobación requerida)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Máximo de Posts por Día
                                </label>
                                <input
                                    type="number"
                                    value={channelForm.maxPostsPerDay}
                                    onChange={(e) => setChannelForm(prev => ({ ...prev, maxPostsPerDay: parseInt(e.target.value) }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                <label htmlFor="isActiveChannel" className="text-sm font-medium text-gray-700">
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
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
