import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
        <style>{`
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
    
    // Debug: Check current auth state
    const [currentUser, setCurrentUser] = useState(null);
    
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            console.log('AuthPage auth state changed:', user);
            setCurrentUser(user);
        });
        return unsubscribe;
    }, [auth]);

    // Fetch available referral codes
    useEffect(() => {
        if (!isLogin) {
            fetchAvailableReferralCodes();
        }
    }, [isLogin]);

    // No longer needed since we're using popup instead of redirect

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
        console.log('Authentication successful for user:', user);
        
        try {
            // Check if user exists in Firestore
            const userRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                console.log('User not found in Firestore, creating new user document...');
                
                // Create initial user document
                const userData = {
                    email: user.email,
                    displayName: user.displayName || user.email.split('@')[0],
                    photoURL: user.photoURL || null,
                    createdAt: serverTimestamp(),
                    creditsMinutes: 0,
                    isTempUsername: true
                };
                
                try {
                    await setDoc(userRef, userData);
                    console.log('User document created successfully in Firestore');
                } catch (createError) {
                    console.error('Error creating user document:', createError);
                    // Continue anyway, the user can still set username
                }
                
                setNewUser(user);
            } else {
                console.log('User found in Firestore:', userDoc.data());
                // User exists, they should be logged in
                // You might want to redirect or update state here
            }
        } catch (error) {
            console.error('Error checking user in Firestore:', error);
            // Even if Firestore fails, we can still proceed with the user
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
        setLoading(true);
        try {
            // Use popup for emulator (works better than redirect)
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({
                prompt: 'select_account'
            });
            
            // For emulator, popup auth works better than redirect
            const result = await signInWithPopup(auth, provider);
            console.log('Google sign-in successful:', result);
            await handleAuthSuccess(result);
        } catch (err) {
            console.error('Google sign-in error:', err);
            setError(err.message.replace('Firebase: ', ''));
        } finally {
            setLoading(false);
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
            console.log('Checking username availability for:', username);
            
            // Check if username is already taken
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where("username", "==", username));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                setError("Este nombre de usuario ya está en uso.");
                setLoading(false);
                return;
            }
            
            console.log('Username is available, updating user document...');

            // Update user document with username
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

            console.log('Updating user document with data:', updateData);
            await updateDoc(doc(db, 'users', newUser.uid), updateData);
            console.log('User document updated successfully!');
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
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2">¡Bienvenido!</h2>
                        <p className="text-gray-600 dark:text-gray-300">Elige tu nombre de usuario para continuar</p>
                        
                        {/* Debug Info */}
                        {import.meta.env.DEV && (
                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-700 mb-2">
                                    🔍 <strong>Debug Info:</strong>
                                </p>
                                {currentUser ? (
                                    <p className="text-sm text-green-700">
                                        ✅ User authenticated: {currentUser.email} ({currentUser.uid})
                                    </p>
                                ) : (
                                    <p className="text-sm text-red-700">
                                        ❌ No user authenticated
                                    </p>
                                )}
                                <button 
                                    onClick={() => {
                                        console.log('Current auth state:', auth.currentUser);
                                        console.log('Current user state:', currentUser);
                                    }}
                                    className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                >
                                    Check Auth State
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <form onSubmit={handleUsernameSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Nombre de Usuario</label>
                            <input 
                                type="text" 
                                value={username} 
                                onChange={(e) => setUsername(e.target.value)} 
                                required 
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-700 dark:text-slate-900"
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:via-slate-900 dark:to-slate-800 relative overflow-hidden">
            {/* Enhanced background effects - reduced on mobile */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/8 lg:from-blue-400/10 via-purple-400/6 lg:via-purple-400/8 via-indigo-400/4 lg:via-indigo-400/6 to-pink-400/8 lg:to-pink-400/10 dark:from-blue-400/4 lg:dark:from-blue-400/5 dark:via-purple-400/3 lg:dark:via-purple-400/4 dark:via-indigo-400/2 lg:dark:via-indigo-400/3 dark:to-pink-400/4 lg:dark:to-pink-400/5"></div>
            <div className="absolute inset-0 bg-gradient-to-tl from-cyan-400/6 lg:from-cyan-400/8 via-blue-400/4 lg:via-blue-400/6 to-indigo-400/6 lg:to-indigo-400/8 dark:from-cyan-400/3 lg:dark:from-cyan-400/4 dark:via-blue-400/2 lg:dark:via-blue-400/3 dark:to-indigo-400/3 lg:dark:to-indigo-400/4"></div>
            {/* Floating orbs effect - reduced on mobile */}
            <div className="absolute top-10 sm:top-20 left-10 sm:left-20 w-32 sm:w-48 lg:w-72 h-32 sm:h-48 lg:h-72 bg-gradient-to-r from-blue-400/15 lg:from-blue-400/20 to-purple-400/15 lg:to-purple-400/20 dark:from-blue-400/8 lg:dark:from-blue-400/10 dark:to-purple-400/8 lg:dark:to-purple-400/10 rounded-full blur-lg sm:blur-2xl lg:blur-3xl animate-pulse"></div>
            <div className="absolute bottom-10 sm:bottom-20 right-10 sm:right-20 w-40 sm:w-64 lg:w-96 h-40 sm:h-64 lg:h-96 bg-gradient-to-r from-indigo-400/15 lg:from-indigo-400/20 to-pink-400/15 lg:to-pink-400/20 dark:from-indigo-400/8 lg:dark:from-indigo-400/10 dark:to-pink-400/8 lg:dark:to-pink-400/10 rounded-full blur-lg sm:blur-2xl lg:blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
            <div className="absolute top-1/2 left-1/4 sm:left-1/3 w-24 sm:w-32 lg:w-48 h-24 sm:h-32 lg:h-48 bg-gradient-to-r from-cyan-400/10 lg:from-cyan-400/15 to-blue-400/10 lg:to-blue-400/15 dark:from-cyan-400/6 lg:dark:from-cyan-400/8 dark:to-blue-400/6 lg:dark:to-blue-400/8 rounded-full blur-lg sm:blur-xl lg:blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
            <WaveBackground />
            
            {/* Mobile-first layout */}
            <div className="flex flex-col lg:flex-row min-h-screen">
                {/* Left Section - Hidden on mobile, visible on desktop */}
                <div className="hidden lg:block lg:w-1/2 relative z-10 bg-gradient-to-br from-blue-900 via-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
                    {/* Enhanced left section background effects */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-indigo-600/15 via-purple-600/20 to-pink-600/15"></div>
                    <div className="absolute inset-0 bg-gradient-to-tl from-cyan-600/15 via-blue-600/10 to-indigo-600/15"></div>
                    {/* Floating accent orbs */}
                    <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-gradient-to-r from-cyan-400/30 to-blue-400/30 rounded-full blur-xl animate-pulse"></div>
                    <div className="absolute bottom-1/4 left-1/4 w-24 h-24 bg-gradient-to-r from-purple-400/30 to-pink-400/30 rounded-full blur-lg animate-pulse" style={{animationDelay: '1.5s'}}></div>
                    <div className="h-full w-full p-8 flex items-center justify-center relative">
                        {/* Theme Toggle Button - Top Right */}
                        <button
                            onClick={() => {
                                const root = document.documentElement;
                                if (root.classList.contains('dark')) {
                                    root.classList.remove('dark');
                                    localStorage.setItem('theme', 'light');
                                } else {
                                    root.classList.add('dark');
                                    localStorage.setItem('theme', 'dark');
                                }
                            }}
                            className="absolute top-8 right-8 p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm"
                        >
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        </button>
                        
                        <div className="max-w-md text-center">
                            <div className="mb-8">
                                <WiFiHubLogo />
                                <h1 className="text-3xl font-bold mb-4 text-slate-100 drop-shadow-lg">WiFi Hub</h1>
                            </div>
                            <h2 className="mb-6 text-5xl font-bold text-slate-100 drop-shadow-lg">Conecta con el Mundo</h2>
                            <p className="mb-12 text-xl text-blue-100 drop-shadow-md">Accede a internet de alta velocidad con Starlink</p>

                            <div className="w-full max-w-sm space-y-4">
                                <div className="group relative rounded-xl bg-white/10 p-4 backdrop-blur-sm border border-white/20 hover:bg-white/25 hover:border-white/40 hover:scale-105 hover:shadow-2xl transition-all duration-500 ease-out cursor-pointer overflow-hidden">
                                    <div className="flex items-center gap-4 relative z-10">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-blue-600 font-bold group-hover:bg-blue-500 group-hover:text-white group-hover:scale-110 transition-all duration-300 ease-out">1</span>
                                        <span className="text-lg text-slate-100 font-medium group-hover:text-white transition-colors duration-300">Crea tu cuenta</span>
                                    </div>
                                    {/* Hover glass effect overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover:from-white/15 group-hover:via-white/8 group-hover:to-white/15 rounded-xl transition-all duration-500 ease-out"></div>
                                </div>
                                <div className="group relative rounded-xl bg-white/5 p-4 backdrop-blur-sm border border-white/10 hover:bg-white/25 hover:border-white/40 hover:scale-105 hover:shadow-2xl transition-all duration-500 ease-out cursor-pointer overflow-hidden">
                                    <div className="flex items-center gap-4 relative z-10">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-slate-100 font-bold group-hover:bg-purple-500 group-hover:text-white group-hover:scale-110 transition-all duration-300 ease-out">2</span>
                                        <span className="text-lg text-slate-100 font-medium group-hover:text-white transition-colors duration-300">Conecta tu dispositivo</span>
                                    </div>
                                    {/* Hover glass effect overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover:from-white/15 group-hover:via-white/8 group-hover:to-white/15 rounded-xl transition-all duration-500 ease-out"></div>
                                </div>
                                <div className="group relative rounded-xl bg-white/5 p-4 backdrop-blur-sm border border-white/10 hover:bg-white/25 hover:border-white/40 hover:scale-105 hover:shadow-2xl transition-all duration-500 ease-out cursor-pointer overflow-hidden">
                                    <div className="flex items-center gap-4 relative z-10">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-slate-100 font-bold group-hover:bg-pink-500 group-hover:text-white group-hover:scale-110 transition-all duration-300 ease-out">3</span>
                                        <span className="text-lg text-slate-100 font-medium group-hover:text-white transition-colors duration-300">Disfruta de internet rápido</span>
                                    </div>
                                    {/* Hover glass effect overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover:from-white/15 group-hover:via-white/8 group-hover:to-white/15 rounded-xl transition-all duration-500 ease-out"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section - Main content */}
                <div className="flex w-full items-center justify-center p-3 sm:p-4 lg:p-6 lg:w-1/2 relative z-10">
                    <div className="w-full max-w-sm lg:max-w-md">
                        <div className="bg-white/20 dark:bg-slate-800/40 backdrop-blur-xl rounded-xl lg:rounded-2xl p-4 sm:p-5 lg:p-8 shadow-lg relative overflow-hidden border border-white/30 dark:border-slate-600/30">
                            {/* Simplified glass effect for mobile, enhanced for desktop */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 dark:from-slate-700/20 dark:via-transparent dark:to-slate-600/10 rounded-2xl lg:rounded-3xl"></div>
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 via-transparent to-purple-400/5 dark:from-blue-300/10 dark:via-transparent dark:to-purple-300/10 rounded-2xl lg:rounded-3xl"></div>
                            {/* Enhanced effects for desktop only */}
                            <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-white/50 via-transparent to-white/50 dark:from-white/60 dark:via-transparent dark:to-white/60 rounded-3xl"></div>
                            <div className="hidden lg:block absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-white/50 dark:from-white/60 dark:via-transparent dark:to-white/60 rounded-3xl"></div>
                            <div className="hidden lg:block absolute inset-2 bg-gradient-to-r from-white/40 via-transparent to-white/40 dark:from-white/50 dark:via-transparent dark:to-white/50 rounded-2xl"></div>
                            <div className="hidden lg:block absolute inset-2 bg-gradient-to-b from-white/40 via-transparent to-white/40 dark:from-white/50 dark:via-transparent dark:to-white/50 rounded-2xl"></div>
                            <div className="hidden lg:block absolute inset-4 bg-gradient-to-r from-white/30 via-transparent to-white/30 dark:from-white/40 dark:via-transparent dark:to-white/40 rounded-xl"></div>
                            <div className="hidden lg:block absolute inset-4 bg-gradient-to-b from-white/30 via-transparent to-white/30 dark:from-white/40 dark:via-transparent dark:to-white/40 rounded-xl"></div>
                            <div className="hidden lg:block absolute inset-6 bg-gradient-to-r from-white/20 via-transparent to-white/20 dark:from-white/30 dark:via-transparent dark:to-white/30 rounded-lg"></div>
                            <div className="hidden lg:block absolute inset-6 bg-gradient-to-b from-white/20 via-transparent to-white/20 dark:from-white/30 dark:via-transparent dark:to-white/30 rounded-lg"></div>
                            <div className="hidden lg:block absolute inset-0 bg-gradient-to-br from-cyan-400/4 via-blue-400/3 via-purple-400/4 to-pink-400/3 dark:from-cyan-300/6 dark:via-blue-300/4 dark:via-purple-300/6 dark:to-pink-300/4 rounded-3xl"></div>
                            {/* Content wrapper */}
                            <div className="relative z-10">
                            {/* Mobile Header - Visible only on mobile */}
                            <div className="lg:hidden text-center mb-4 sm:mb-6 lg:mb-8 p-3 sm:p-4 lg:p-6 bg-white/20 dark:bg-slate-800/40 backdrop-blur-xl rounded-xl lg:rounded-2xl shadow-lg relative overflow-hidden border border-white/30 dark:border-slate-600/30">
                                {/* Simplified mobile glass effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 dark:from-slate-700/20 dark:via-transparent dark:to-slate-600/10 rounded-2xl"></div>
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 via-transparent to-purple-400/5 dark:from-blue-300/10 dark:via-transparent dark:to-purple-300/10 rounded-2xl"></div>
                                {/* Content wrapper */}
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-3 sm:mb-4">
                                        <div className="flex-1">
                                            <WiFiHubLogo />
                                            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200 mb-1 sm:mb-2">WiFi Hub</h1>
                                            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">Conecta con el mundo</p>
                                        </div>
                                        {/* Theme Toggle Button */}
                                        <button
                                            onClick={() => {
                                                const root = document.documentElement;
                                                if (root.classList.contains('dark')) {
                                                    root.classList.remove('dark');
                                                    localStorage.setItem('theme', 'light');
                                                } else {
                                                    root.classList.add('dark');
                                                    localStorage.setItem('theme', 'dark');
                                                }
                                            }}
                                            className="p-1.5 sm:p-2 bg-white/20 dark:bg-slate-700/20 hover:bg-white/30 dark:hover:bg-slate-700/30 rounded-lg transition-colors backdrop-blur-sm"
                                        >
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-800 dark:text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mx-auto max-w-xs sm:max-w-sm">
                                <h2 className="mb-2 text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-100 text-center">
                                    {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
                                </h2>
                                <p className="mb-4 sm:mb-6 lg:mb-8 text-sm sm:text-base text-slate-600 dark:text-slate-300 text-center">
                                    {isLogin ? 'Bienvenido de vuelta' : 'Únete a nuestra comunidad WiFi'}
                                </p>

                                {/* Google Sign In */}
                                <div className="mb-4 sm:mb-6 lg:mb-8">
                                    {import.meta.env.DEV && (
                                        <div className="mb-2 text-center">
                                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                                🔧 Development Mode - Firebase Emulator
                                            </span>
                                        </div>
                                    )}
                                    <button 
                                        onClick={handleGoogleSignIn} 
                                        className="w-full flex justify-center items-center gap-2 sm:gap-3 py-2.5 sm:py-3 px-3 sm:px-4 border-2 border-gray-200 dark:border-slate-600 rounded-lg lg:rounded-xl hover:border-gray-300 dark:hover:border-slate-500 transition-all transform hover:scale-105"
                                    >
                                        <GoogleIcon />
                                        <span className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200">
                                            Continuar con Google
                                        </span>
                                    </button>
                                </div>

                                {/* Enhanced Glass Morphism Divider */}
                                <div className="relative mb-4 sm:mb-6 lg:mb-8">
                                    {/* Main divider line with glass effect */}
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-400/60 via-purple-500/60 via-pink-400/60 to-transparent dark:from-transparent dark:via-blue-300/60 dark:via-purple-400/60 dark:via-pink-300/60 dark:to-transparent rounded-full shadow-lg"></div>
                                    </div>
                                    
                                    {/* Enhanced center text container */}
                                    <div className="relative flex justify-center">
                                        <div className="px-4 lg:px-6 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-full border border-white/40 dark:border-slate-600/40 shadow-xl relative overflow-hidden group hover:bg-white/90 dark:hover:bg-slate-800/90 transition-all duration-500">
                                            {/* Glass effect overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/10 dark:from-slate-700/20 dark:via-transparent dark:to-slate-600/10 rounded-full group-hover:from-white/30 group-hover:via-transparent group-hover:to-white/20 dark:group-hover:from-slate-700/30 dark:group-hover:via-transparent dark:group-hover:to-slate-600/20 transition-all duration-500"></div>
                                            
                                            {/* Subtle inner glow */}
                                            <div className="absolute inset-1 bg-gradient-to-br from-blue-400/10 via-purple-400/8 to-pink-400/10 dark:from-blue-300/15 dark:via-purple-300/12 dark:to-pink-300/15 rounded-full"></div>
                                            
                                            {/* Text with enhanced styling */}
                                            <span className="relative z-10 text-xs lg:text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors duration-500">
                                                O continúa con email
                                            </span>
                                            
                                            {/* Floating particles around the text */}
                                            <div className="absolute -top-1 -left-1 w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-60 animate-pulse"></div>
                                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full opacity-60 animate-pulse" style={{animationDelay: '0.5s'}}></div>
                                            <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-gradient-to-r from-pink-400 to-blue-500 rounded-full opacity-70 animate-pulse" style={{animationDelay: '1s'}}></div>
                                            <div className="absolute -bottom-1 -right-1 w-1.5 h-1.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full opacity-70 animate-pulse" style={{animationDelay: '1.5s'}}></div>
                                        </div>
                                    </div>
                                    
                                    {/* Animated light rays extending from the divider */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-full max-w-xs flex justify-between">
                                            <motion.div
                                                animate={{
                                                    scale: [1, 1.2, 1],
                                                    opacity: [0.3, 0.6, 0.3]
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    ease: "easeInOut"
                                                }}
                                                className="w-1 h-8 bg-gradient-to-b from-blue-400/40 to-transparent rounded-full"
                                            ></motion.div>
                                            <motion.div
                                                animate={{
                                                    scale: [1, 1.3, 1],
                                                    opacity: [0.2, 0.5, 0.2]
                                                }}
                                                transition={{
                                                    duration: 2.5,
                                                    repeat: Infinity,
                                                    ease: "easeInOut",
                                                    delay: 0.5
                                                }}
                                                className="w-1 h-6 bg-gradient-to-b from-purple-400/40 to-transparent rounded-full"
                                            ></motion.div>
                                            <motion.div
                                                animate={{
                                                    scale: [1, 1.1, 1],
                                                    opacity: [0.4, 0.7, 0.4]
                                                }}
                                                transition={{
                                                    duration: 1.8,
                                                    repeat: Infinity,
                                                    ease: "easeInOut",
                                                    delay: 1
                                                }}
                                                className="w-1 h-10 bg-gradient-to-b from-pink-400/40 to-transparent rounded-full"
                                            ></motion.div>
                                        </div>
                                    </div>
                                    
                                    {/* Energy waves emanating from the center */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <motion.div
                                            animate={{
                                                scale: [1, 1.5, 1],
                                                opacity: [0.1, 0, 0.1]
                                            }}
                                            transition={{
                                                duration: 3,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }}
                                            className="w-16 h-16 border border-blue-400/20 rounded-full"
                                        ></motion.div>
                                        <motion.div
                                            animate={{
                                                scale: [1, 2, 1],
                                                opacity: [0.05, 0, 0.05]
                                            }}
                                            transition={{
                                                duration: 4,
                                                repeat: Infinity,
                                                ease: "easeInOut",
                                                delay: 1
                                            }}
                                            className="absolute w-24 h-24 border border-purple-400/20 rounded-full"
                                        ></motion.div>
                                    </div>
                                </div>

                                {/* Email/Password Form */}
                                <form onSubmit={handleEmailSubmit} className="space-y-3 sm:space-y-4 lg:space-y-6">
                                    <div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/30 dark:bg-slate-700/30 border border-white/50 dark:border-slate-600/50 rounded-lg lg:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base text-slate-700 dark:text-slate-100 backdrop-blur-sm placeholder-slate-500 dark:placeholder-slate-400"
                                            placeholder="tu@email.com"
                                        />
                                    </div>

                                    <div>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/30 dark:bg-slate-700/30 border border-white/50 dark:border-slate-600/50 rounded-lg lg:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base text-slate-700 dark:text-slate-100 backdrop-blur-sm placeholder-slate-500 dark:placeholder-slate-400"
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
                                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg lg:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base text-slate-700 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400"
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
                                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg lg:rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none text-sm sm:text-base"
                                    >
                                        {loading ? <Spinner /> : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')}
                                    </button>
                </form>

                                {/* Toggle Login/Register */}
                                <p className="text-center text-xs sm:text-sm text-gray-600 dark:text-slate-300 mt-4 sm:mt-6">
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
        </div>
    );
};

export default AuthPage;