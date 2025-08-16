import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import Spinner from '../common/Spinner.jsx';

const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.519-3.108-11.182-7.333l-6.571,4.819C9.656,39.663,16.318,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.082,5.571l6.19,5.238C39.988,36.103,44,30.533,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);

const WiFiHubLogo = () => (
    <div className="relative w-20 h-20 lg:w-24 lg:h-24 mx-auto mb-6 lg:mb-8">
        <style jsx>{`
            @keyframes cosmicPulse {
                0%, 100% { opacity: 0.9; transform: scale(1); }
                50% { opacity: 0.7; transform: scale(1.05); }
            }
            @keyframes cosmicSpin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            @keyframes cosmicPing {
                0% { transform: scale(1); opacity: 0.7; }
                50% { transform: scale(1.5); opacity: 0.3; }
                100% { transform: scale(1); opacity: 0.7; }
            }
            @keyframes cosmicBounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-3px); }
            }
            .cosmic-pulse { animation: cosmicPulse 2s ease-in-out infinite; }
            .cosmic-spin-3s { animation: cosmicSpin 3s linear infinite; }
            .cosmic-spin-8s { animation: cosmicSpin 8s linear infinite; }
            .cosmic-ping { animation: cosmicPing 2s ease-in-out infinite; }
            .cosmic-bounce { animation: cosmicBounce 1.5s ease-in-out infinite; }
        `}</style>
        
        <svg 
            viewBox="0 0 100 100" 
            className="w-full h-full drop-shadow-2xl"
        >
            {/* Background circle with cosmic effect */}
            <defs>
                <radialGradient id="cosmicBg" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#1e3a8a" />
                    <stop offset="70%" stopColor="#3730a3" />
                    <stop offset="100%" stopColor="#1e1b4b" />
                </radialGradient>
                <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="50%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#f97316" />
                </radialGradient>
                <radialGradient id="energyGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#0891b2" />
                </radialGradient>
            </defs>
            
            {/* Main background circle */}
            <circle cx="50" cy="50" r="48" fill="url(#cosmicBg)" stroke="#3b82f6" strokeWidth="0.5" opacity="0.8" />
            
            {/* Cosmic background dots */}
            <circle cx="25" cy="20" r="0.5" fill="#ffffff" opacity="0.6" />
            <circle cx="75" cy="30" r="0.3" fill="#ffffff" opacity="0.4" />
            <circle cx="20" cy="70" r="0.4" fill="#ffffff" opacity="0.5" />
            <circle cx="80" cy="80" r="0.6" fill="#ffffff" opacity="0.3" />
            <circle cx="45" cy="15" r="0.2" fill="#ffffff" opacity="0.7" />
            <circle cx="65" cy="85" r="0.3" fill="#ffffff" opacity="0.4" />
            
            {/* Central energy core */}
            <circle cx="50" cy="50" r="20" fill="url(#coreGlow)" opacity="0.9" className="cosmic-pulse" />
            <circle cx="50" cy="50" r="16" fill="#fbbf24" opacity="0.8" />
            <circle cx="50" cy="50" r="12" fill="#f59e0b" opacity="0.9" />
            
            {/* Swirling core animation - using custom CSS */}
            <circle cx="50" cy="50" r="18" fill="none" stroke="#f97316" strokeWidth="1" opacity="0.6" className="cosmic-spin-3s" />
            
            {/* Radiating energy structures - main arms */}
            <g opacity="0.8">
                {/* Top arm */}
                <path d="M50 30 Q50 25 50 20 Q50 15 48 12 Q46 10 44 8" 
                      stroke="#06b6d4" strokeWidth="1.5" fill="none" opacity="0.7" />
                <circle cx="44" cy="8" r="2" fill="url(#energyGlow)" className="cosmic-ping" />
                
                {/* Bottom arm */}
                <path d="M50 70 Q50 75 50 80 Q50 85 52 88 Q54 90 56 92" 
                      stroke="#06b6d4" strokeWidth="1.5" fill="none" opacity="0.7" />
                <circle cx="56" cy="92" r="2" fill="url(#energyGlow)" className="cosmic-ping" style={{animationDelay: '0.5s'}} />
                
                {/* Left arm */}
                <path d="M30 50 Q25 50 20 50 Q15 50 12 48 Q10 46 8 44" 
                      stroke="#06b6d4" strokeWidth="1.5" fill="none" opacity="0.7" />
                <circle cx="8" cy="44" r="2" fill="url(#energyGlow)" className="cosmic-ping" style={{animationDelay: '1s'}} />
                
                {/* Right arm */}
                <path d="M70 50 Q75 50 80 50 Q85 50 88 52 Q90 54 92 56" 
                      stroke="#06b6d4" strokeWidth="1.5" fill="none" opacity="0.7" />
                <circle cx="92" cy="56" r="2" fill="url(#energyGlow)" className="cosmic-ping" style={{animationDelay: '1.5s'}} />
            </g>
            
            {/* Secondary energy connections */}
            <g opacity="0.6">
                {/* Diagonal connections */}
                <path d="M35 35 Q40 40 45 45" stroke="#0891b2" strokeWidth="1" fill="none" />
                <path d="M65 35 Q60 40 55 45" stroke="#0891b2" strokeWidth="1" fill="none" />
                <path d="M35 65 Q40 60 45 55" stroke="#0891b2" strokeWidth="1" fill="none" />
                <path d="M65 65 Q60 60 55 55" stroke="#0891b2" strokeWidth="1" fill="none" />
            </g>
            
            {/* Energy particles around core - using custom CSS animations */}
            <circle cx="50" cy="30" r="1" fill="#fbbf24" opacity="0.8" className="cosmic-bounce" />
            <circle cx="50" cy="70" r="1" fill="#fbbf24" opacity="0.8" className="cosmic-bounce" style={{animationDelay: '0.5s'}} />
            <circle cx="30" cy="50" r="1" fill="#fbbf24" opacity="0.8" className="cosmic-bounce" style={{animationDelay: '1s'}} />
            <circle cx="70" cy="50" r="1" fill="#fbbf24" opacity="0.8" className="cosmic-bounce" style={{animationDelay: '1.5s'}} />
            
            {/* Outer energy ring - using custom CSS animation */}
            <circle cx="50" cy="50" r="42" fill="none" stroke="#3b82f6" strokeWidth="0.5" opacity="0.4" className="cosmic-spin-8s" />
        </svg>
    </div>
);

const WaveBackground = () => (
    <div className="absolute inset-0 overflow-hidden">
        {/* Animated waves */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-blue-600/20 to-transparent animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-purple-600/20 to-transparent animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-blue-500/20 to-transparent animate-pulse" style={{animationDelay: '2s'}}></div>
        
        {/* Floating elements */}
        <div className="absolute top-20 left-10 w-4 h-4 bg-blue-400/30 rounded-full animate-bounce"></div>
        <div className="absolute top-32 right-16 w-3 h-3 bg-purple-400/30 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute top-16 right-8 w-2 h-2 bg-blue-300/30 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
    </div>
);

const AuthPage = ({ auth }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [newUser, setNewUser] = useState(null);
    const [username, setUsername] = useState('');
    const [availableReferralCodes, setAvailableReferralCodes] = useState([]);
    const [showAvailableCodes, setShowAvailableCodes] = useState(false);

    // Fetch available referral codes
    useEffect(() => {
        if (!isLogin) {
            fetchAvailableReferralCodes();
        }
    }, [isLogin]);

    const fetchAvailableReferralCodes = async () => {
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('referralCode', '!=', null));
            const querySnapshot = await getDocs(q);
            
            const codes = querySnapshot.docs
                .map(doc => doc.data())
                .filter(user => user.referralCode && user.username)
                .slice(0, 5)
                .map(user => ({
                    code: user.referralCode,
                    username: user.username
                }));
            
            setAvailableReferralCodes(codes);
        } catch (error) {
            console.error('Error fetching referral codes:', error);
        }
    };

    const copyReferralCode = (code) => {
        navigator.clipboard.writeText(code);
        setReferralCode(code);
        const originalText = document.getElementById(`copy-btn-${code}`)?.textContent;
        if (document.getElementById(`copy-btn-${code}`)) {
            document.getElementById(`copy-btn-${code}`).textContent = '¡Copiado!';
            setTimeout(() => {
                if (document.getElementById(`copy-btn-${code}`)) {
                    document.getElementById(`copy-btn-${code}`).textContent = originalText;
                }
            }, 2000);
        }
    };

    const handleAuthSuccess = async (userCredential) => {
        const user = userCredential.user;
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            setNewUser(user);
        }
    };

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            let userCredential;
            if (isLogin) {
                userCredential = await signInWithEmailAndPassword(auth, email, password);
            } else {
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
                
                if (referralCode.trim()) {
                    try {
                        const tempUsername = email.split('@')[0] + '_temp';
                        
                        await setDoc(doc(db, 'users', userCredential.user.uid), {
                            email: userCredential.user.email,
                            username: tempUsername,
                            referralCode: referralCode.trim(),
                            createdAt: serverTimestamp(),
                            isTempUsername: true
                        });
                    } catch (err) {
                        console.error('Error saving referral code:', err);
                    }
                }
                
                await handleAuthSuccess(userCredential);
            }
        } catch (err) {
            setError(err.message.replace('Firebase: ', ''));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        const provider = new GoogleAuthProvider();
        try {
            const userCredential = await signInWithPopup(auth, provider);
            await handleAuthSuccess(userCredential);
        } catch (err) {
            setError(err.message.replace('Firebase: ', ''));
        }
    };

    const handleUsernameSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        if (username.length < 3) {
            setError("El nombre de usuario debe tener al menos 3 caracteres.");
            setLoading(false);
            return;
        }

        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where("username", "==", username));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                setError("Este nombre de usuario ya está en uso.");
                setLoading(false);
                return;
            }

            const existingUserDoc = await getDoc(doc(db, 'users', newUser.uid));
            const existingData = existingUserDoc.exists() ? existingUserDoc.data() : {};

            const updateData = {
                username: username,
                isTempUsername: false
            };

            if (existingData.creditsMinutes !== undefined) {
                updateData.creditsMinutes = existingData.creditsMinutes;
            }
            if (existingData.referralCode) {
                updateData.referralCode = existingData.referralCode;
            }

            await updateDoc(doc(db, 'users', newUser.uid), updateData);
            setNewUser(null);
        } catch (err) {
            console.error(err);
            let errorMessage = "No se pudo guardar el nombre de usuario.";
            if (err.code === 'permission-denied') {
                errorMessage = "Permiso denegado. Verifique las reglas de Firestore.";
            } else if (err.code) {
                errorMessage += ` Código: ${err.code}`;
            } else {
                errorMessage += ` ${err.message}`;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (newUser) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100 flex items-center justify-center p-4 relative overflow-hidden">
                <WaveBackground />
                <div className="max-w-md w-full bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-white/20 relative z-10">
                    <div className="text-center mb-8">
                        <WiFiHubLogo />
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">¡Bienvenido!</h2>
                        <p className="text-gray-600 dark:text-gray-300">Elige tu nombre de usuario para continuar</p>
                    </div>
                    
                    <form onSubmit={handleUsernameSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Nombre de Usuario</label>
                            <input 
                                type="text" 
                                value={username} 
                                onChange={(e) => setUsername(e.target.value)} 
                                required 
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="Tu nombre de usuario"
                            />
                        </div>
                        
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4">
                                <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
                        </div>
                        )}
                        
                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                        >
                            {loading ? <Spinner /> : 'Guardar y Continuar'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100 relative overflow-hidden">
            <WaveBackground />
            
            {/* Mobile-first layout */}
            <div className="flex flex-col lg:flex-row min-h-screen">
                {/* Left Section - Hidden on mobile, visible on desktop */}
                <div className="hidden lg:block lg:w-1/2 relative z-10 bg-gradient-to-br from-blue-900 via-purple-900 to-blue-800">
                    <div className="h-full w-full p-8 flex items-center justify-center">
                        <div className="max-w-md text-center">
                            <div className="mb-8">
                                <WiFiHubLogo />
                                <h1 className="text-3xl font-bold mb-4 text-white drop-shadow-lg">WiFi Hub</h1>
                            </div>
                            <h2 className="mb-6 text-5xl font-bold text-white drop-shadow-lg">Conecta con el Mundo</h2>
                            <p className="mb-12 text-xl text-blue-100 drop-shadow-md">Accede a internet de alta velocidad con Starlink</p>

                            <div className="w-full max-w-sm space-y-4">
                                <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm border border-white/20">
                                    <div className="flex items-center gap-4">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-blue-600 font-bold">1</span>
                                        <span className="text-lg text-white font-medium">Crea tu cuenta</span>
                                    </div>
                                </div>
                                <div className="rounded-xl bg-white/5 p-4 backdrop-blur-sm border border-white/10">
                                    <div className="flex items-center gap-4">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white font-bold">2</span>
                                        <span className="text-lg text-white font-medium">Conecta tu dispositivo</span>
                                    </div>
                                </div>
                                <div className="rounded-xl bg-white/5 p-4 backdrop-blur-sm border border-white/10">
                                    <div className="flex items-center gap-4">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white font-bold">3</span>
                                        <span className="text-lg text-white font-medium">Disfruta de internet rápido</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section - Main content */}
                <div className="flex w-full items-center justify-center p-6 lg:w-1/2 relative z-10">
                    <div className="w-full max-w-md">
                        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
                            {/* Mobile Header - Visible only on mobile */}
                            <div className="lg:hidden text-center mb-8">
                                <WiFiHubLogo />
                                <h1 className="text-2xl font-bold text-gray-800 mb-2">WiFi Hub</h1>
                                <p className="text-gray-600">Conecta con el mundo</p>
                            </div>

                            <div className="mx-auto max-w-sm">
                                <h2 className="mb-2 text-3xl font-bold text-gray-800 dark:text-white text-center">
                                    {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
                                </h2>
                                <p className="mb-8 text-gray-600 dark:text-gray-300 text-center">
                                    {isLogin ? 'Bienvenido de vuelta' : 'Únete a nuestra comunidad WiFi'}
                                </p>

                                {/* Google Sign In */}
                                <div className="mb-8">
                                    <button 
                                        onClick={handleGoogleSignIn} 
                                        className="w-full flex justify-center items-center gap-3 py-3 px-4 border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all transform hover:scale-105"
                                    >
                                        <GoogleIcon />
                                        <span className="font-semibold text-gray-700 dark:text-gray-200">
                                            Continuar con Google
                                        </span>
                                    </button>
                                </div>

                                {/* Divider */}
                                <div className="relative mb-8">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-300"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="bg-white dark:bg-gray-800 px-4 text-gray-500 dark:text-gray-400">O continúa con email</span>
                                    </div>
                                </div>

                                {/* Email/Password Form */}
                                <form onSubmit={handleEmailSubmit} className="space-y-6">
                                    <div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            placeholder="tu@email.com"
                                        />
                                    </div>

                                    <div>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            placeholder="Tu contraseña"
                                        />
                                        {!isLogin && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Mínimo 8 caracteres</p>
                                        )}
                                    </div>

                                    {/* Referral Code - Only for registration */}
                                    {!isLogin && (
                                        <div>
                                            <input
                                                type="text"
                                                value={referralCode}
                                                onChange={(e) => setReferralCode(e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                placeholder="Código de referencia (opcional)"
                                            />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                💡 Si tienes un código, ingrésalo para obtener beneficios
                                            </p>
                                        </div>
                                    )}

                                    {/* Available Referral Codes */}
                                    {!isLogin && availableReferralCodes.length > 0 && (
                                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
                                            <button
                                                type="button"
                                                onClick={() => setShowAvailableCodes(!showAvailableCodes)}
                                                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium mb-3"
                                            >
                                                {showAvailableCodes ? 'Ocultar' : 'Ver'} códigos disponibles
                                            </button>
                                            
                                            {showAvailableCodes && (
                                                <div className="space-y-2">
                                                    {availableReferralCodes.map(({ code, username }) => (
                                                        <div key={code} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-blue-200 dark:border-blue-700">
                                                            <div className="flex-1">
                                                                <code className="text-sm font-mono text-blue-700 dark:text-blue-300">{code}</code>
                                                                <p className="text-xs text-blue-600 dark:text-blue-400">de @{username}</p>
                                                            </div>
                                                            <button
                                                                id={`copy-btn-${code}`}
                                                                type="button"
                                                                onClick={() => copyReferralCode(code)}
                                                                className="ml-2 px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                                                            >
                                                                Copiar
                </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                    </div>
                                    )}

                                    {/* Error Display */}
                                    {error && (
                                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4">
                                            <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
                    </div>
                                    )}

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                                    >
                                        {loading ? <Spinner /> : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')}
                    </button>
                </form>

                                {/* Toggle Login/Register */}
                                <p className="text-center text-sm text-gray-600 dark:text-gray-300 mt-6">
                    {isLogin ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}
                                    <button
                                        onClick={() => setIsLogin(!isLogin)}
                                        className="font-semibold text-blue-600 dark:text-blue-400 hover:text-purple-600 dark:hover:text-purple-400 ml-1 transition-colors"
                                    >
                        {isLogin ? 'Regístrate' : 'Inicia Sesión'}
                    </button>
                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;