import React, { useState, useEffect } from 'react';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup,
    RecaptchaVerifier,
    signInWithPhoneNumber
} from 'firebase/auth';
import { Spinner } from '../common/Spinner.jsx';

// A simple Google Icon component
const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.519-3.108-11.182-7.333l-6.571,4.819C9.656,39.663,16.318,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.082,5.571l6.19,5.238C39.988,36.103,44,30.533,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);


const AuthPage = ({ auth }) => {
    const [authMethod, setAuthMethod] = useState('email'); // 'email', 'phone'
    const [isLogin, setIsLogin] = useState(true);
    
    // State for email auth
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    // State for phone auth
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [confirmationResult, setConfirmationResult] = useState(null);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Setup reCAPTCHA verifier
    useEffect(() => {
        // Ensure this only runs once and doesn't create multiple verifiers
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
              'size': 'invisible',
              'callback': (response) => {
                // reCAPTCHA solved, allow signInWithPhoneNumber.
              }
            });
        }
    }, [auth]);

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
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
            await signInWithPopup(auth, provider);
        } catch (err) {
            setError(err.message.replace('Firebase: ', ''));
        }
    };

    const handlePhoneSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const verifier = window.recaptchaVerifier;
            const result = await signInWithPhoneNumber(auth, phone, verifier);
            setConfirmationResult(result);
        } catch (err) {
            setError(err.message.replace('Firebase: ', ''));
        } finally {
            setLoading(false);
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await confirmationResult.confirm(otp);
        } catch (err) {
            setError(err.message.replace('Firebase: ', ''));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            {/* This container is now visible during development to help debug reCAPTCHA issues */}
            <div id="recaptcha-container" className="fixed bottom-0 right-0"></div>
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl">
                <h2 className="text-3xl font-bold text-center text-slate-800 mb-2">
                    {authMethod === 'email' ? (isLogin ? 'Iniciar Sesión' : 'Registrarse') : 'Acceso por Teléfono'}
                </h2>
                <p className="text-center text-slate-500 mb-8">Bienvenido al portal Wi-Fi</p>
                
                <button onClick={handleGoogleSignIn} className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors mb-6">
                    <GoogleIcon />
                    <span className="font-semibold text-slate-700">Continuar con Google</span>
                </button>

                <div className="flex items-center my-4">
                    <hr className="flex-grow border-t border-slate-300" />
                    <span className="mx-4 text-sm text-slate-500">O</span>
                    <hr className="flex-grow border-t border-slate-300" />
                </div>

                {authMethod === 'email' ? (
                    <form onSubmit={handleEmailSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-slate-700 mb-1">Correo Electrónico</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-slate-700 mb-1">Contraseña</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <button type="submit" disabled={loading} className="w-full flex justify-center items-center bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-lg disabled:bg-slate-400">
                            {loading ? <Spinner /> : (isLogin ? 'Entrar con correo' : 'Crear Cuenta')}
                        </button>
                    </form>
                ) : (
                    confirmationResult ? (
                        <form onSubmit={handleOtpSubmit}>
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-slate-700 mb-1">Código de Verificación</label>
                                <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <button type="submit" disabled={loading} className="w-full flex justify-center items-center bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors shadow-lg disabled:bg-slate-400">
                                {loading ? <Spinner /> : 'Verificar y Entrar'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handlePhoneSubmit}>
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-slate-700 mb-1">Número de Teléfono</label>
                                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+506 88888888" required className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <button type="submit" disabled={loading} className="w-full flex justify-center items-center bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-lg disabled:bg-slate-400">
                                {loading ? <Spinner /> : 'Enviar Código'}
                            </button>
                        </form>
                    )
                )}

                {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
                
                <p className="text-center text-sm text-slate-500 mt-6">
                    {authMethod === 'email' ? 'Prefieres usar tu teléfono?' : 'Prefieres usar tu correo?'}
                    <button onClick={() => setAuthMethod(authMethod === 'email' ? 'phone' : 'email')} className="font-semibold text-blue-600 hover:underline ml-1">
                        {authMethod === 'email' ? 'Entrar con Teléfono' : 'Entrar con Correo'}
                    </button>
                </p>

                {authMethod === 'email' && (
                    <p className="text-center text-sm text-slate-500 mt-2">
                        {isLogin ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}
                        <button onClick={() => setIsLogin(!isLogin)} className="font-semibold text-blue-600 hover:underline ml-1">
                            {isLogin ? 'Regístrate' : 'Inicia Sesión'}
                        </button>
                    </p>
                )}
            </div>
        </div>
    );
};

export default AuthPage;
