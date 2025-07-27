import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import Spinner from '../common/Spinner.jsx';

const GoogleIcon = () => ( <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.519-3.108-11.182-7.333l-6.571,4.819C9.656,39.663,16.318,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.082,5.571l6.19,5.238C39.988,36.103,44,30.533,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg> );

const AuthPage = ({ auth }) => {
    const [view, setView] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuthSubmit = async (e) => {
        e.preventDefault(); setLoading(true); setError(''); setMessage('');
        try {
            if (view === 'login') await signInWithEmailAndPassword(auth, email, password);
            else await createUserWithEmailAndPassword(auth, email, password);
        } catch (err) { setError(err.message.replace('Firebase: ', '')); } 
        finally { setLoading(false); }
    };
    
    const handlePasswordReset = async (e) => {
        e.preventDefault(); setLoading(true); setError(''); setMessage('');
        try {
            await sendPasswordResetEmail(auth, email);
            setMessage('Se ha enviado un enlace para restablecer la contraseña a su correo.');
        } catch (err) { setError(err.message.replace('Firebase: ', '')); } 
        finally { setLoading(false); }
    };

    const handleGoogleSignIn = async () => {
        setError(''); setMessage('');
        const provider = new GoogleAuthProvider();
        try { await signInWithPopup(auth, provider); } 
        catch (err) { setError(err.message.replace('Firebase: ', '')); }
    };

    const AuthForm = () => ( <form onSubmit={handleAuthSubmit}> <div className="mb-4"> <label className="block text-sm font-bold text-slate-700 mb-1">Correo Electrónico</label> <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg"/> </div> <div className="mb-6"> <label className="block text-sm font-bold text-slate-700 mb-1">Contraseña</label> <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg"/> </div> <button type="submit" disabled={loading} className="w-full flex justify-center items-center bg-blue-600 text-white font-bold py-3 px-4 rounded-lg"> {loading ? <Spinner /> : (view === 'login' ? 'Entrar' : 'Crear Cuenta')} </button> </form> );
    const ResetForm = () => ( <form onSubmit={handlePasswordReset}> <div className="mb-6"> <label className="block text-sm font-bold text-slate-700 mb-1">Correo Electrónico</label> <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg"/> </div> <button type="submit" disabled={loading} className="w-full flex justify-center items-center bg-blue-600 text-white font-bold py-3 px-4 rounded-lg"> {loading ? <Spinner /> : 'Enviar Enlace'} </button> </form> );

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl">
                <h2 className="text-3xl font-bold text-center text-slate-800 mb-2"> {view === 'login' && 'Iniciar Sesión'} {view === 'register' && 'Registrarse'} {view === 'reset' && 'Restablecer Contraseña'} </h2>
                <p className="text-center text-slate-500 mb-8"> {view !== 'reset' ? 'Bienvenido al portal Wi-Fi' : 'Ingrese su correo para recibir un enlace.'} </p>
                {view !== 'reset' && ( <> <button onClick={handleGoogleSignIn} className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-slate-300 rounded-lg mb-6"> <GoogleIcon /> <span className="font-semibold text-slate-700">Continuar con Google</span> </button> <div className="flex items-center my-4"> <hr className="flex-grow"/><span className="mx-4 text-sm text-slate-500">O</span><hr className="flex-grow"/> </div> </> )}
                {view === 'reset' ? <ResetForm /> : <AuthForm />}
                {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
                {message && <p className="text-green-500 text-sm text-center mt-4">{message}</p>}
                <div className="text-center text-sm text-slate-500 mt-6 space-y-2">
                    {view === 'login' && ( <> <p>¿No tienes una cuenta? <button onClick={() => setView('register')} className="font-semibold text-blue-600">Regístrate</button></p> <p>¿Olvidaste tu contraseña? <button onClick={() => setView('reset')} className="font-semibold text-blue-600">Restablecer</button></p> </> )}
                    {view === 'register' && ( <p>¿Ya tienes una cuenta? <button onClick={() => setView('login')} className="font-semibold text-blue-600">Inicia Sesión</button></p> )}
                    {view === 'reset' && ( <p>¿Recordaste tu contraseña? <button onClick={() => setView('login')} className="font-semibold text-blue-600">Inicia Sesión</button></p> )}
                </div>
                <div className="text-center mt-8">
                    <a href="#/status" className="text-sm text-slate-600 hover:underline">Ver Estado de la Red</a>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;