import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiClock, FiSettings, FiHelpCircle, FiFileText, FiWifi, FiMessageCircle, FiUsers, FiLogOut, FiPackage } from 'react-icons/fi';
import { RiRobot2Line } from 'react-icons/ri';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../App';
import { signOut } from 'firebase/auth';
import { auth, db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import PaymentSuccessAnimation from '../components/common/PaymentSuccessAnimation';
import Support from '../components/user/Support';
import BulletinBoard from '../components/user/BulletinBoard';
import Help from '../components/user/Help';
import AIChatbot from '../components/common/AIChatbot';
import VirtualCreditCard from '../components/user/VirtualCreditCard';

const UserPage = () => {
    const { user, loading } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [packages, setPackages] = useState([]);
    const [selectedPackage, setSelectedPackage] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [receiptFile, setReceiptFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
    const [paymentData, setPaymentData] = useState(null);
    const [activeTab, setActiveTab] = useState('buy');
    const [userCredits, setUserCredits] = useState({ hours: 1, minutes: 0 });
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update current time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Reset payment success state when changing tabs
    useEffect(() => {
        if (activeTab !== 'buy') {
            setShowPaymentSuccess(false);
            setPaymentData(null);
        }
    }, [activeTab]);

    useEffect(() => {
        if (!user) {
            console.log('UserPage: No user, skipping package fetch');
            return;
        }

        console.log('UserPage: Setting up real-time listener for packages...');
        console.log('UserPage: Current user:', user.email);
        
        const packagesRef = collection(db, 'timePackages');
        const unsubscribe = onSnapshot(packagesRef, (snapshot) => {
            try {
                console.log('UserPage: Real-time packages update received');
                console.log('UserPage: Snapshot size:', snapshot.size);
                console.log('UserPage: Snapshot empty:', snapshot.empty);
                
                const packagesList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                console.log('UserPage: Updated packages:', packagesList);
                setPackages(packagesList);
            } catch (error) {
                console.error('Error processing packages snapshot:', error);
                setPackages([]);
            }
        }, (error) => {
            console.error('Error in packages listener:', error);
            setPackages([]);
        });

        return () => {
            console.log('UserPage: Cleaning up packages listener');
            unsubscribe();
        };
    }, [user]);

    const handleSubmitPurchase = async (e) => {
        e.preventDefault();
        if (!selectedPackage || !phoneNumber || !receiptFile) return;

        const selectedPkg = packages.find(pkg => pkg.id === selectedPackage);
        if (!selectedPkg) return;

        setIsUploading(true);

        try {
            // Upload receipt to Firebase Storage
            const receiptRef = ref(storage, `receipts/${user.uid}/${Date.now()}_${receiptFile.name}`);
            const uploadResult = await uploadBytes(receiptRef, receiptFile);
            const receiptUrl = await getDownloadURL(uploadResult.ref);

            console.log('Receipt uploaded successfully:', receiptUrl);

            // Create payment data with receipt information
            const paymentData = {
                userId: user.uid,
                userEmail: user.email,
                userName: user.displayName || user.email,
                packageId: selectedPackage,
                packageName: selectedPkg.name,
                packageDuration: selectedPkg.duration,
                packagePrice: selectedPkg.price,
                phoneNumber: phoneNumber,
                receiptUrl: receiptUrl,
                receiptFileName: receiptFile.name,
                status: 'pending',
                timestamp: serverTimestamp(),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            console.log('Creating payment with data:', paymentData);

            const docRef = await addDoc(collection(db, 'payments'), paymentData);
            
            setPaymentData({
                ...paymentData,
                id: docRef.id,
                timestamp: new Date()
            });
            setShowPaymentSuccess(true);
            
            // Reset form
            setSelectedPackage('');
            setPhoneNumber('');
            setReceiptFile(null);
        } catch (error) {
            console.error('Error submitting payment:', error);
            alert('Error al enviar el pago. Por favor, intenta de nuevo.');
        } finally {
            setIsUploading(false);
        }
    };

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
                    <p className="text-lg text-gray-600 dark:text-gray-300">No has iniciado sesión</p>
                </div>
            </div>
        );
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'buy':
                return (
                    <div className="space-y-6">
                        {/* Virtual Credit Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="text-center mb-6">
                                <FiClock className="w-6 h-6 text-green-600 mx-auto mb-2" />
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Tu Tarjeta Virtual WiFi</h2>
                                <p className="text-gray-600 dark:text-gray-400">Descarga tu tarjeta virtual para acceso rápido</p>
                            </div>
                            <VirtualCreditCard 
                                userCredits={userCredits} 
                                user={user} 
                                theme={theme} 
                            />
                        </div>

                        {/* Credit Status Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3 mb-4">
                                <FiClock className="w-6 h-6 text-green-600" />
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Estado de Créditos</h2>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                                    {userCredits.hours}h {userCredits.minutes}m
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">Tiempo Restante</div>
                                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 mb-2">
                                    <div 
                                        className="bg-green-500 h-3 rounded-full transition-all duration-300"
                                        style={{ width: '75%' }}
                                    ></div>
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Aproximadamente 75% de tu tiempo disponible
                                </div>
                            </div>
                            
                            {/* Payment Instructions */}
                            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                                <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">📋 Instrucciones de Pago:</h3>
                                <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                                    <li>1. Realiza el pago SINPE al número: <strong>88888888</strong></li>
                                    <li>2. Sube el comprobante de pago en el formulario</li>
                                    <li>3. Espera la aprobación del administrador</li>
                                    <li>4. Recibirás notificación cuando se apruebe</li>
                                </ol>
                                
                                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                                    <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">✅ Comprobante Subido</h4>
                                    <p className="text-sm text-green-700 dark:text-green-300">
                                        Tu comprobante de pago ha sido subido exitosamente. 
                                        El administrador lo revisará y aprobará tu pago en las próximas 24-48 horas.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Package Selection Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Seleccionar Paquete</h2>
                                <p className="text-gray-600 dark:text-gray-400">Elige el paquete de tiempo que mejor se adapte a tus necesidades</p>
                            </div>
                            
                            {/* Debug Info - Remove this after testing */}
                            {process.env.NODE_ENV === 'development' && (
                                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg text-sm">
                                    <p className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">Debug Info:</p>
                                    <p className="text-yellow-700 dark:text-yellow-300">Total packages fetched: {packages.length}</p>
                                    <p className="text-yellow-700 dark:text-yellow-300">Active packages: {packages.filter(pkg => pkg.isActive !== false).length}</p>
                                    {packages.length > 0 && (
                                        <details className="mt-2">
                                            <summary className="cursor-pointer text-yellow-700 dark:text-yellow-300">Raw packages data:</summary>
                                            <pre className="mt-2 text-xs bg-yellow-100 dark:bg-yellow-900 p-2 rounded overflow-auto text-yellow-800 dark:text-yellow-200">
                                                {JSON.stringify(packages, null, 2)}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                            )}
                            
                            {packages.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="text-gray-400 dark:text-gray-500 mb-4">
                                        <FiPackage className="w-16 h-16 mx-auto" />
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400">No hay paquetes disponibles en este momento.</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Contacta al administrador para más información.</p>
                                    
                                    {/* Admin Help */}
                                    {user?.email === 'lejzer36@gmail.com' && (
                                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg text-sm">
                                            <p className="font-medium text-blue-800 dark:text-blue-300 mb-2">💡 Para Administradores:</p>
                                            <p className="text-blue-700 dark:text-blue-300">Ve a la pestaña "Configuración" en el panel de administración para crear paquetes de tiempo.</p>
                                            <p className="text-blue-700 dark:text-blue-300 mt-1">Los paquetes aparecerán aquí automáticamente una vez creados.</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {packages
                                        .filter(pkg => pkg.isActive !== false) // Only show active packages
                                        .map((pkg) => {
                                            // Convert duration to number for calculations
                                            const durationNum = parseFloat(pkg.duration) || 1;
                                            const priceNum = parseFloat(pkg.price) || 0;
                                            
                                            return (
                                                <motion.div
                                                    key={pkg.id}
                                                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                                                        selectedPackage === pkg.id
                                                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                            : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600'
                                                    }`}
                                                    onClick={() => setSelectedPackage(pkg.id)}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    {pkg.name === '3 horas' && (
                                                        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                                                            Más Popular
                                                        </div>
                                                    )}
                                                    <div className="text-center">
                                                        <div className="text-lg font-semibold text-gray-800 dark:text-white mb-1">{pkg.name}</div>
                                                        <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">₡{pkg.price}</div>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                                            ₡{durationNum > 0 ? Math.round(priceNum / durationNum) : 0} por hora
                                                        </div>
                                                        {pkg.description && (
                                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">{pkg.description}</div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                </div>
                            )}

                            {/* Purchase Form */}
                            <form onSubmit={handleSubmitPurchase} className="mt-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Número de Teléfono SINPE
                                    </label>
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        placeholder="Ej: 88888888"
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                        required
                                    />
                                </div>

                                {/* Receipt Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Comprobante de Pago (Obligatorio)
                                    </label>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-center w-full">
                                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600">
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    {receiptFile ? (
                                                        <div className="text-center">
                                                            <FiFileText className="w-8 h-8 text-green-600 mb-2" />
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">{receiptFile.name}</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">Archivo seleccionado</p>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center">
                                                            <FiFileText className="w-8 h-8 text-gray-400 mb-2" />
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                <span className="font-semibold">Click para subir</span> o arrastra y suelta
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, PDF hasta 10MB</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept=".png,.jpg,.jpeg,.pdf"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file && file.size <= 10 * 1024 * 1024) { // 10MB limit
                                                            setReceiptFile(file);
                                                        } else if (file) {
                                                            alert('El archivo es demasiado grande. Máximo 10MB.');
                                                        }
                                                    }}
                                                    required
                                                />
                                            </label>
                                        </div>
                                        {receiptFile && (
                                            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <FiFileText className="w-5 h-5 text-green-600" />
                                                    <span className="text-sm text-green-800 dark:text-green-300">{receiptFile.name}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setReceiptFile(null)}
                                                    className="text-red-600 hover:text-red-800 dark:hover:text-red-400 text-sm"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <motion.button
                                    type="submit"
                                    disabled={!selectedPackage || !phoneNumber || !receiptFile || isUploading}
                                    className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {isUploading ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Subiendo comprobante...
                                        </div>
                                    ) : (
                                        'Comprar Paquete'
                                    )}
                                </motion.button>
                            </form>
                        </div>
                    </div>
                );
            case 'use':
                return (
                    <div className="space-y-6">
                        {/* Virtual Credit Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="text-center mb-6">
                                <FiWifi className="w-16 h-16 text-green-600 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Tu Tarjeta Virtual WiFi</h2>
                                <p className="text-gray-600 dark:text-gray-400">Descarga tu tarjeta virtual para acceso rápido a WiFi</p>
                            </div>
                            <VirtualCreditCard 
                                userCredits={userCredits} 
                                user={user} 
                                theme={theme} 
                            />
                        </div>

                        {/* WiFi Connection Info */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Conectar a WiFi</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">Conecta tu dispositivo a la red WiFi-Hub para comenzar a usar tus créditos</p>
                                <div className="bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                                    <div className="text-green-800 dark:text-green-300 font-medium">Red: WiFi-Hub</div>
                                    <div className="text-green-700 dark:text-green-400 text-sm">Contraseña: Proporcionada por administración</div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'history':
                return (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Historial de Transacciones</h2>
                        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                            <FiFileText className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                            <p>No hay transacciones para mostrar</p>
                        </div>
                    </div>
                );
                            case 'support':
                    console.log('Rendering Support component with user:', user);
                    return <Support user={user} />;
            case 'bulletin':
                return <BulletinBoard />;
            case 'help':
                return <Help />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            {/* Top Header */}
            <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Left - Logo and Status */}
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <FiWifi className="w-6 h-6 text-green-600" />
                                <span className="text-xl font-bold text-gray-800 dark:text-white">WiFi Costa Rica</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>Conectado</span>
                            </div>
                        </div>

                        {/* Right - Credits, Time, and Logout */}
                        <div className="flex items-center gap-6">
                            <button
                                onClick={toggleTheme}
                                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
                            >
                                {theme === 'light' ? '🌙' : '☀️'}
                            </button>
                            <div className="text-right">
                                <div className="text-sm text-gray-600 dark:text-gray-400">Crédito Disponible</div>
                                <div className="text-lg font-bold text-green-600 dark:text-green-400">{userCredits.hours}h {userCredits.minutes}m</div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-gray-600 dark:text-gray-400">Hora Actual</div>
                                <div className="text-sm font-medium text-gray-800 dark:text-white">
                                    {currentTime.toLocaleTimeString('es-CR', { 
                                        hour: '2-digit', 
                                        minute: '2-digit', 
                                        second: '2-digit',
                                        hour12: true 
                                    })}
                                </div>
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
                            {/* User Profile */}
                            <div className="text-center mb-6 pb-6 border-b border-gray-200 dark:border-gray-600">
                                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <FiUser className="w-8 h-8 text-green-600" />
                                </div>
                                <div className="font-medium text-gray-800 dark:text-white">Usuario</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">{user.displayName || user.email}</div>
                            </div>

                            {/* Navigation */}
                            <nav className="space-y-2">
                                {[
                                    { id: 'buy', label: 'Comprar Créditos', icon: FiFileText },
                                    { id: 'use', label: 'Usar Créditos', icon: FiClock },
                                    { id: 'history', label: 'Historial', icon: FiFileText },
                                    { id: 'support', label: 'Soporte', icon: FiHelpCircle },
                                    { id: 'bulletin', label: 'Mural Comunitario', icon: FiUsers },
                                    { id: 'help', label: 'Ayuda', icon: FiHelpCircle }
                                ].map((item) => (
                                    <motion.button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                                            activeTab === item.id
                                                ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700'
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
                        {/* Tab Navigation */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
                            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                                {[
                                    { id: 'buy', label: 'Comprar Créditos' },
                                    { id: 'use', label: 'Usar Créditos' },
                                    { id: 'history', label: 'Historial' },
                                    { id: 'support', label: 'Soporte' }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                            activeTab === tab.id
                                                ? 'bg-white dark:bg-gray-600 text-green-600 dark:text-green-400 shadow-sm'
                                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tab Content */}
                        {renderTabContent()}
                    </div>
                </div>
            </div>

            {/* Payment Success Animation */}
            {showPaymentSuccess && paymentData && (
                <PaymentSuccessAnimation
                    paymentData={paymentData}
                    onClose={() => setShowPaymentSuccess(false)}
                />
            )}

            {/* AI Chatbot */}
            <AIChatbot />
        </div>
    );
};

export default UserPage;