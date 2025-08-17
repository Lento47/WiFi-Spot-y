import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiClock, FiSettings, FiHelpCircle, FiFileText, FiWifi, FiMessageCircle, FiUsers, FiLogOut, FiPackage, FiTrendingDown } from 'react-icons/fi';
import { RiRobot2Line } from 'react-icons/ri';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../App';
import { signOut } from 'firebase/auth';
import { auth, db, storage, functions } from '../firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import PaymentSuccessAnimation from '../components/common/PaymentSuccessAnimation';
import Support from '../components/user/Support';
import BulletinBoard from '../components/user/BulletinBoard';
import Help from '../components/user/Help';
import AIChatbot from '../components/common/AIChatbot';
import VirtualCreditCard from '../components/user/VirtualCreditCard';
import VirtualDataCard from '../components/user/VirtualDataCard';

const UserPage = () => {
    const { user, loading, isAdmin } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [packages, setPackages] = useState([]);
    const [selectedPackage, setSelectedPackage] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [receiptFile, setReceiptFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
    const [paymentData, setPaymentData] = useState(null);
    const [cardTab, setCardTab] = useState('time');
    const [mainTab, setMainTab] = useState('buy');
    const [userCredits, setUserCredits] = useState({ hours: 0, minutes: 0, gb: 0, totalConsumed: 0 });
    const [currentTime, setCurrentTime] = useState(new Date());
    const [tokenDuration, setTokenDuration] = useState('1');
    const [deviceName, setDeviceName] = useState('');
    const [generatedToken, setGeneratedToken] = useState(null);
    const [isGeneratingToken, setIsGeneratingToken] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [tokens, setTokens] = useState([]);


    // Update current time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Reset payment success state when changing tabs
    useEffect(() => {
        if (mainTab !== 'buy') {
            setShowPaymentSuccess(false);
            setPaymentData(null);
        }
    }, [mainTab]);

    useEffect(() => {
        if (!user) {
    
            return;
        }


        
        const packagesRef = collection(db, 'timePackages');
        const unsubscribe = onSnapshot(packagesRef, (snapshot) => {
            try {

                
                const packagesList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

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

            unsubscribe();
        };
    }, [user]);

    // Fetch user credits
    useEffect(() => {
        if (!user) return;

        const fetchUserCredits = async () => {
            try {

                
                // Try to get user by UID first (more reliable)
                let userDoc = null;
                try {
                    userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', user.uid)));
                } catch (error) {

                }
                
                // If not found by UID, try by email
                if (!userDoc || userDoc.empty) {
                    try {
                        userDoc = await getDocs(query(collection(db, 'users'), where('email', '==', user.email)));
                    } catch (error) {

                    }
                }
                
                if (userDoc && !userDoc.empty) {
                    const userData = userDoc.docs[0].data();

                    
                    if (userData.credits) {
                        const credits = {
                            hours: parseInt(userData.credits.hours) || 0,
                            minutes: parseInt(userData.credits.minutes) || 0,
                            gb: parseFloat(userData.credits.gb) || 0,
                            totalConsumed: parseFloat(userData.credits.totalConsumed) || 0
                        };

                        setUserCredits(credits);
                    } else {

                        // Set default credits
                        setUserCredits({
                            hours: 0,
                            minutes: 0,
                            gb: 0,
                            totalConsumed: 0
                        });
                    }
                } else {

                    // Set default credits
                    setUserCredits({
                        hours: 0,
                        minutes: 0,
                        gb: 0,
                        totalConsumed: 0
                    });
                }
            } catch (error) {
                console.error('Error fetching user credits:', error);
                // Set default credits on error
                setUserCredits({
                    hours: 0,
                    minutes: 0,
                    gb: 0,
                    totalConsumed: 0
                });
            }
        };

        fetchUserCredits();

        // Set up real-time listener for user credits
        let unsubscribe = null;
        try {
            // Try to listen to user document by UID
            const userRef = doc(db, 'users', user.uid);
            unsubscribe = onSnapshot(userRef, (doc) => {
                if (doc.exists()) {
                    const userData = doc.data();

                    if (userData.credits) {
                        const credits = {
                            hours: parseInt(userData.credits.hours) || 0,
                            minutes: parseInt(userData.credits.minutes) || 0,
                            gb: parseFloat(userData.credits.gb) || 0,
                            totalConsumed: parseFloat(userData.credits.totalConsumed) || 0
                        };

                        setUserCredits(credits);
                    }
                }
            }, (error) => {
                
                fetchUserCredits();
            });
        } catch (error) {
            
            fetchUserCredits();
        }

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [user]);

    // Fetch user transactions and tokens
    useEffect(() => {
        if (!user) return;

        // Payments
        const paymentsRef = collection(db, 'payments');
        const paymentsQ = query(paymentsRef, where('userId', '==', user.uid));
        const unsubPayments = onSnapshot(paymentsQ, (snapshot) => {
            const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            // Sort by createdAt/timestamp desc
            list.sort((a, b) => {
                const ad = (a.createdAt?.toDate?.() || a.timestamp?.toDate?.() || new Date(0)).getTime();
                const bd = (b.createdAt?.toDate?.() || b.timestamp?.toDate?.() || new Date(0)).getTime();
                return bd - ad;
            });
            setTransactions(list);
        });

        // Tokens
        const tokensRef = collection(db, 'wifiTokens');
        const tokensQ = query(tokensRef, where('userId', '==', user.uid));
        const unsubTokens = onSnapshot(tokensQ, (snapshot) => {
            const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            list.sort((a, b) => {
                const ad = (a.createdAt?.toDate?.() || new Date(a.createdAt || 0)).getTime();
                const bd = (b.createdAt?.toDate?.() || new Date(b.createdAt || 0)).getTime();
                return bd - ad;
            });
            setTokens(list);
        });

        return () => {
            unsubPayments();
            unsubTokens();
        };
    }, [user]);

    const generateToken = async () => {
        if (userCredits.hours < parseInt(tokenDuration)) return;
        
        setIsGeneratingToken(true);
        try {
            // Generate a random token
            const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            
            // Create token document in Firestore
            await addDoc(collection(db, 'wifiTokens'), {
                userId: user.uid,
                userEmail: user.email,
                token: token,
                duration: parseInt(tokenDuration),
                deviceName: deviceName || 'Dispositivo no especificado',
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + parseInt(tokenDuration) * 60 * 60 * 1000), // Convert hours to milliseconds
                isActive: true,
                usedAt: null
            });
            
            // Deduct credits from user
            const newHours = userCredits.hours - parseInt(tokenDuration);
            const newMinutes = userCredits.minutes;
            
            // Update user credits in Firestore
            await updateDoc(doc(db, 'users', user.uid), {
                'credits.hours': newHours,
                'credits.minutes': newMinutes,
                'credits.lastUpdated': new Date()
            });
            
            // Update local state - preserve GB and totalConsumed
            setUserCredits(prev => ({ 
                ...prev, 
                hours: newHours, 
                minutes: newMinutes 
            }));
            setGeneratedToken(token);
            setDeviceName('');
            
        } catch (error) {
            console.error('Error generating token:', error);
            alert('Error al generar el token. Por favor, inténtalo de nuevo.');
        } finally {
            setIsGeneratingToken(false);
        }
    };

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



            // Create payment data with receipt information
            const paymentData = {
                userId: user.uid,
                userEmail: user.email,
                userName: user.displayName || user.email,
                packageId: selectedPackage,
                packageName: selectedPkg.name,
                packageType: selectedPkg.type || 'time', // Add package type
                packageDuration: selectedPkg.duration,
                packageDataAmount: selectedPkg.dataAmount, // Add data amount for GB packages
                packagePrice: selectedPkg.price,
                phoneNumber: phoneNumber,
                receiptUrl: receiptUrl,
                receiptFileName: receiptFile.name,
                status: 'pending',
                timestamp: serverTimestamp(),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };



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
        switch (mainTab) {
            case 'buy':
                return (
                    <div className="space-y-6">
                        {/* Package Selection Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Seleccionar Paquete</h2>
                                <p className="text-gray-600 dark:text-gray-400">Elige el paquete de tiempo que mejor se adapte a tus necesidades</p>
                            </div>
                            

                            
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
                                        placeholder="Ej: 72134886"
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

                        {/* Virtual Credit Cards */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="text-center mb-6">
                                <FiClock className="w-6 h-6 text-green-600 mx-auto mb-2" />
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Tus Tarjetas Virtuales WiFi</h2>
                                <p className="text-gray-600 dark:text-gray-400">Descarga tus tarjetas virtuales para acceso rápido</p>
                            </div>
                            
                            {/* Card Type Tabs */}
                            <div className="flex justify-center mb-6">
                                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                    <button
                                        onClick={() => setCardTab('time')}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                                            cardTab === 'time'
                                                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                    >
                                        ⏰ Tarjeta de Tiempo
                                    </button>
                                    <button
                                        onClick={() => setCardTab('data')}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                                            cardTab === 'data'
                                                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                    >
                                        📊 Tarjeta de Datos
                                    </button>
                                </div>
                            </div>
                            
                            {/* Card Display */}
                            {cardTab === 'time' ? (
                                <VirtualCreditCard 
                                    userCredits={userCredits} 
                                    user={user} 
                                    theme={theme} 
                                />
                            ) : (
                                <VirtualDataCard 
                                    userCredits={userCredits} 
                                    user={user} 
                                    theme={theme} 
                                />
                            )}
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
                                    <li>1. Realiza el pago SINPE al número: <strong>72134886</strong></li>
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
                    </div>
                );
            case 'use':
                return (
                    <div className="space-y-6">
                        {/* Token Generation */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="text-center mb-6">
                                <FiWifi className="w-16 h-16 text-green-600 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Generar Token de Acceso</h2>
                                <p className="text-gray-600 dark:text-gray-400">Genera un token temporal para conectarte a WiFi</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Token Generation Form */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Duración del Token
                                        </label>
                                        <select 
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            value={tokenDuration}
                                            onChange={(e) => setTokenDuration(e.target.value)}
                                        >
                                            <option value="1">1 Hora</option>
                                            <option value="2">2 Horas</option>
                                            <option value="4">4 Horas</option>
                                            <option value="8">8 Horas</option>
                                            <option value="24">1 Día</option>
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Dispositivo (Opcional)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ej: iPhone, Laptop, etc."
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            value={deviceName}
                                            onChange={(e) => setDeviceName(e.target.value)}
                                        />
                                    </div>
                                    
                                    <motion.button
                                        onClick={generateToken}
                                        disabled={isGeneratingToken || userCredits.hours < parseInt(tokenDuration)}
                                        className={`w-full px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                                            userCredits.hours < parseInt(tokenDuration)
                                                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                                : 'bg-green-600 hover:bg-green-700 text-white'
                                        }`}
                                        whileHover={userCredits.hours >= parseInt(tokenDuration) ? { scale: 1.02 } : {}}
                                        whileTap={userCredits.hours >= parseInt(tokenDuration) ? { scale: 0.98 } : {}}
                                    >
                                        {isGeneratingToken ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                Generando...
                                            </>
                                        ) : (
                                            <>
                                                <FiWifi className="w-5 h-5" />
                                                Generar Token
                                            </>
                                        )}
                                    </motion.button>
                                    
                                    {userCredits.hours < parseInt(tokenDuration) && (
                                        <p className="text-sm text-red-600 dark:text-red-400 text-center">
                                            No tienes suficientes créditos para generar este token
                                        </p>
                                    )}
                                </div>
                                
                                {/* Current Credits Display */}
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-3">Créditos Disponibles</h3>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                                            {userCredits.hours}h {userCredits.minutes}m
                                        </div>
                                        <p className="text-sm text-green-700 dark:text-green-400">
                                            Puedes generar tokens de hasta {userCredits.hours} horas
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Generated Token Display */}
                            {generatedToken && (
                                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                                    <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-3">Token Generado Exitosamente</h4>
                                    <div className="bg-white dark:bg-gray-700 p-3 rounded border border-blue-200 dark:border-blue-600">
                                        <div className="font-mono text-sm text-blue-900 dark:text-blue-100 break-all">
                                            {generatedToken}
                                        </div>
                                    </div>
                                    <div className="mt-3 flex gap-2">
                                        <motion.button
                                            onClick={() => navigator.clipboard.writeText(generatedToken)}
                                            className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            Copiar Token
                                        </motion.button>
                                        <motion.button
                                            onClick={() => setGeneratedToken(null)}
                                            className="px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            Generar Nuevo
                                        </motion.button>
                                    </div>
                                </div>
                            )}
                        </div>

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
                    <div className="space-y-6">
                        {/* Transactions */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3 mb-4">
                                <FiFileText className="w-6 h-6 text-green-600" />
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Transacciones</h2>
                            </div>
                            {transactions.length === 0 ? (
                                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                    <FiFileText className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                                    <p>No hay transacciones para mostrar</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[700px]">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Paquete</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Monto</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Recibo</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {transactions.map(tx => {
                                                const date = tx.createdAt?.toDate?.() || tx.timestamp?.toDate?.() || new Date();
                                                return (
                                                    <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{date.toLocaleString()}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{tx.packageName || 'N/A'}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">₡{tx.packagePrice || tx.amount || 0}</td>
                                                        <td className="px-4 py-2">
                                                            <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                                                                tx.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                                                tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                                                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                            }`}>
                                                                {tx.status || 'desconocido'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2 text-sm">
                                                            {tx.receiptUrl ? (
                                                                <a href={tx.receiptUrl} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline">Ver</a>
                                                            ) : (
                                                                <span className="text-gray-400">—</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Tokens */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3 mb-4">
                                <FiWifi className="w-6 h-6 text-green-600" />
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Tokens Generados</h2>
                            </div>
                            {tokens.length === 0 ? (
                                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                    <FiWifi className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                                    <p>No hay tokens para mostrar</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[700px]">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Token</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Duración</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dispositivo</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {tokens.map(tk => {
                                                const date = tk.createdAt?.toDate?.() || new Date(tk.createdAt || Date.now());
                                                const isExpired = new Date(tk.expiresAt) < new Date();
                                                return (
                                                    <tr key={tk.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{date.toLocaleString()}</td>
                                                        <td className="px-4 py-2 text-sm font-mono text-gray-700 dark:text-gray-300 break-all">{tk.token}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{tk.duration}h</td>
                                                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{tk.deviceName}</td>
                                                        <td className="px-4 py-2">
                                                            <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                                                                tk.isActive && !isExpired
                                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                                            }`}>
                                                                {tk.isActive && !isExpired ? 'Activo' : 'Inactivo'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                );
                            case 'support':
            
                    return <Support user={user} />;
            case 'bulletin':
                return <BulletinBoard user={user} isAdmin={isAdmin} />;
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
                    <div className="flex flex-col sm:flex-row items-center justify-between h-auto sm:h-16 py-4 sm:py-0 gap-4 sm:gap-6">
                        {/* Left - Logo and Status */}
                        <div className="flex items-center gap-3 sm:gap-6">
                            <div className="flex items-center gap-2">
                                <FiWifi className="w-6 h-6 text-green-600" />
                                <span className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">WiFi Costa Rica</span>
                            </div>
                            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>Conectado</span>
                            </div>
                        </div>

                        {/* Right - Credits, Time, and Logout */}
                        <div className="flex items-center gap-3 sm:gap-6">
                            <button
                                onClick={toggleTheme}
                                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
                            >
                                {theme === 'light' ? '🌙' : '☀️'}
                            </button>
                            <div className="hidden sm:block text-right">
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
                                className="flex items-center gap-2 px-3 sm:px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm sm:text-base"
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

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                    {/* Left Sidebar */}
                    <div className="w-full lg:w-64 lg:flex-shrink-0 order-2 lg:order-1">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            {/* User Profile */}
                            <div className="text-center mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-200 dark:border-gray-600">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <FiUser className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                                </div>
                                <div className="font-medium text-gray-800 dark:text-white text-sm sm:text-base">Usuario</div>
                                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{user.displayName || user.email}</div>
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
                                        onClick={() => setMainTab(item.id)}
                                        className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-left transition-colors text-sm sm:text-base ${
                                            mainTab === item.id
                                                ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700'
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-white'
                                        }`}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                        {item.label}
                                    </motion.button>
                                ))}
                            </nav>

                            {/* Credits Display */}
                            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-600">
                                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                                    <FiClock className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">Créditos Disponibles</h3>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                                        {userCredits.hours}h {userCredits.minutes}m
                                    </div>
                                    <p className="text-xs sm:text-sm text-green-700 dark:text-green-400 mb-2">
                                        Puedes generar tokens de hasta {userCredits.hours} horas
                                    </p>
                                    {/* Connection Status */}
                                    <div className="flex items-center justify-center gap-2 mt-3">
                                        <div className={`w-2 h-2 rounded-full ${userCredits.hours > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        <span className={`text-xs font-medium ${userCredits.hours > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {userCredits.hours > 0 ? 'Disponible para conectar' : 'Sin créditos activos'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Data Credits Display */}
                            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-600">
                                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                                    <FiWifi className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">Datos Disponibles</h3>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                                        {parseFloat(userCredits.gb || 0).toFixed(2)} GB
                                    </div>
                                    <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-400 mb-2">
                                        Datos disponibles para navegación
                                    </p>

                                    {/* Data Usage Status */}
                                    <div className="flex items-center justify-center gap-2 mt-3">
                                        <div className={`w-2 h-2 rounded-full ${(userCredits.gb || 0) > 0 ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                                        <span className={`text-xs font-medium ${(userCredits.gb || 0) > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {(userCredits.gb || 0) > 0 ? 'Datos disponibles' : 'Sin datos disponibles'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Total Consumption Display */}
                            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-600">
                                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                                    <FiTrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">Consumo Total</h3>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                                        {parseFloat(userCredits.totalConsumed || 0).toFixed(2)} GB
                                    </div>
                                    <p className="text-xs sm:text-sm text-red-700 dark:text-red-400 mb-2">
                                        Total de datos consumidos
                                    </p>
                                    {/* Consumption Progress Bar */}
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
                                        <div 
                                            className="bg-red-500 h-2 rounded-full transition-all duration-300"
                                            style={{ 
                                                width: `${Math.min(((userCredits.totalConsumed || 0) / Math.max((userCredits.gb || 0) + (userCredits.totalConsumed || 0), 1)) * 100, 100)}%` 
                                            }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        {Math.round(((userCredits.totalConsumed || 0) / Math.max((userCredits.gb || 0) + (userCredits.totalConsumed || 0), 1)) * 100)}% del total histórico
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 order-1 lg:order-2">
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