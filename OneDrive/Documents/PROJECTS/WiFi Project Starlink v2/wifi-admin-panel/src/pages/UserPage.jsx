import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { collection, doc, onSnapshot, updateDoc, serverTimestamp, setDoc, addDoc, query, where, orderBy, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase';
import Spinner from '../components/common/Spinner.jsx';
import { useTheme } from '../App.jsx'; // Import the theme hook
import Icon from '../components/common/Icon.jsx'; // Import the Icon component

const ThemeToggleButton = () => {
    const { theme, toggleTheme } = useTheme();
    return (
        <button onClick={toggleTheme} className="p-2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            {theme === 'light' ? <Icon path="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /> : <Icon path="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />}
        </button>
    );
};

const UserPage = ({ user }) => {
    // ... (all existing state and functions remain the same)
    const [activeTab, setActiveTab] = useState('buy');
    const [submission, setSubmission] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [userData, setUserData] = useState({ creditsMinutes: 0 });
    const [timePackages, setTimePackages] = useState([]);
    const [userTokens, setUserTokens] = useState([]);
    const [minutesToUse, setMinutesToUse] = useState('');
    const [generatedToken, setGeneratedToken] = useState(null);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'timePackages'), snapshot => {
            setTimePackages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsub();
    }, []);
    
    useEffect(() => {
        const userRef = doc(db, "users", user.uid);
        const unsub = onSnapshot(userRef, (doc) => {
            setUserData(doc.data() || { creditsMinutes: 0 });
        });
        return () => unsub();
    }, [user.uid]);

    useEffect(() => {
        const q = query(collection(db, "tokens"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, snapshot => {
            setUserTokens(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
        });
        return () => unsub();
    }, [user.uid]);

    const formatCredits = (minutes) => {
        if (!minutes || minutes < 0) return "0h 0m";
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = Math.round(minutes % 60);
        return `${hours}h ${remainingMinutes}m`;
    };

    const handleGenerateToken = async (e) => {
        e.preventDefault();
        const minutes = parseInt(minutesToUse, 10);
        if (isNaN(minutes) || minutes <= 0) {
            alert("Por favor, ingrese un número válido de minutos.");
            return;
        }
        if (minutes > userData.creditsMinutes) {
            alert("No tiene suficientes créditos para generar este token.");
            return;
        }

        setIsLoading(true);
        try {
            const tokenString = `WIFI-${Date.now().toString().slice(-4)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
            
            await addDoc(collection(db, 'tokens'), {
                userId: user.uid,
                tokenString,
                durationMinutes: minutes,
                status: 'active',
                createdAt: serverTimestamp()
            });

            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                creditsMinutes: increment(-minutes)
            });

            setGeneratedToken(tokenString);
            setMinutesToUse('');

        } catch (error) {
            console.error("Error generating token:", error);
            alert("Ocurrió un error al generar el token.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitPurchase = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.target);
        const sinpeId = formData.get('sinpe-id'), file = formData.get('receipt-file'), selectedPackageId = formData.get('package');
        const selectedPackage = timePackages.find(p => p.id === selectedPackageId);
        
        try {
            const filePath = `receipts/${user.uid}/${Date.now()}-${file.name}`;
            const storageRef = ref(storage, filePath);
            const uploadResult = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(uploadResult.ref);
            await setDoc(doc(db, 'users', user.uid), { email: user.email, createdAt: serverTimestamp() }, { merge: true });
            const docRef = await addDoc(collection(db, "payments"), { 
                userId: user.uid, sinpeId, receiptImageUrl: downloadURL, status: "pending", 
                createdAt: serverTimestamp(), packageName: selectedPackage.name, price: selectedPackage.price,
                durationMinutes: selectedPackage.durationMinutes
            });
            setSubmission({ id: docRef.id, status: 'pending' });
        } catch (error) { 
            console.error("Error submitting payment:", error);
            alert("Ocurrió un error."); 
        } finally { 
            setIsLoading(false); 
        }
    };
    
    const handleLogout = () => signOut(auth);

    const BuyCreditsView = () => (
        submission ? (
             <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-4">{ {pending: "Solicitud Enviada", approved: "✅ ¡Aprobada!", rejected: "❌ Rechazada"}[submission.status] }</h2>
                <button onClick={() => setSubmission(null)} className="mt-8 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-3 px-6 rounded-lg">Hacer otra solicitud</button>
            </div>
        ) : (
             <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2">Comprar Créditos</h2>
                <p className="mb-8 text-slate-500 dark:text-slate-400">Pague al SINPE <strong className="font-mono text-slate-700 dark:text-slate-300">8888-8888</strong>.</p>
                <form onSubmit={handleSubmitPurchase}>
                    <div className="mb-4">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Paquete</label>
                        <select name="package" required className="w-full px-3 py-3 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg">{timePackages.map(p => <option key={p.id} value={p.id}>{p.name} - ₡{p.price}</option>)}</select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1"># Comprobante</label>
                        <input name="sinpe-id" required className="w-full px-3 py-3 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg" />
                    </div>
                    <div className="mb-8">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Recibo</label>
                        <input type="file" name="receipt-file" required accept="image/*" className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-semibold file:bg-slate-50 dark:file:bg-slate-700 file:text-blue-700 dark:file:text-blue-300" />
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center bg-blue-600 text-white font-bold py-4 rounded-lg">{isLoading ? <Spinner /> : 'Enviar para Verificación'}</button>
                </form>
            </div>
        )
    );

    const GenerateTokenView = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2">Generar Token</h2>
                <p className="mb-8 text-slate-500 dark:text-slate-400">Use sus créditos para crear un token de acceso.</p>
                <form onSubmit={handleGenerateToken}>
                    <div className="mb-4">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Minutos a usar</label>
                        <input type="number" value={minutesToUse} onChange={e => setMinutesToUse(e.target.value)} placeholder={`Máximo: ${Math.floor(userData.creditsMinutes)}`} required className="w-full px-3 py-3 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg" />
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center bg-green-500 text-white font-bold py-4 rounded-lg">{isLoading ? <Spinner /> : 'Generar Token'}</button>
                </form>
                {generatedToken && (
                    <div className="mt-8 p-4 bg-green-100 dark:bg-green-900/50 rounded-lg text-center">
                        <p className="text-sm text-green-800 dark:text-green-300">Su nuevo token es:</p>
                        <p className="text-2xl font-mono font-bold text-green-900 dark:text-green-200 break-all">{generatedToken}</p>
                    </div>
                )}
            </div>
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">Mis Tokens Activos</h3>
                {userTokens.length > 0 ? (
                    <ul className="space-y-3 max-h-96 overflow-y-auto">
                        {userTokens.map(token => (
                            <li key={token.id} className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                                <p className="font-mono font-bold text-slate-700 dark:text-slate-200">{token.tokenString}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{token.durationMinutes} minutos</p>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-slate-500 dark:text-slate-400">No tiene tokens generados.</p>}
            </div>
        </div>
    );

    return (
        <div className="bg-slate-100 dark:bg-slate-900 min-h-screen p-4">
            <header className="max-w-7xl mx-auto flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Portal de Usuario</h1>
                    <p className="text-slate-500 dark:text-slate-400">{user.email}</p>
                </div>
                <div className="flex items-center space-x-6">
                    <div className="text-right">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Crédito Disponible</p>
                        <p className="font-bold text-blue-600 dark:text-blue-400 text-lg">{formatCredits(userData.creditsMinutes)}</p>
                    </div>
                    <ThemeToggleButton />
                    <button onClick={handleLogout} className="font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400">Cerrar Sesión</button>
                </div>
            </header>
            <nav className="flex justify-center mb-8">
                <div className="flex items-center space-x-2 p-1.5 bg-slate-200 dark:bg-slate-800 rounded-full">
                    <button onClick={() => setActiveTab('buy')} className={`px-4 py-2 text-sm font-semibold rounded-full ${activeTab === 'buy' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-slate-200 shadow' : 'text-slate-600 dark:text-slate-400'}`}>Comprar Créditos</button>
                    <button onClick={() => setActiveTab('tokens')} className={`px-4 py-2 text-sm font-semibold rounded-full ${activeTab === 'tokens' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-slate-200 shadow' : 'text-slate-600 dark:text-slate-400'}`}>Usar Créditos / Tokens</button>
                </div>
            </nav>
            <main className="flex items-start justify-center">
                {activeTab === 'buy' ? <BuyCreditsView /> : <GenerateTokenView />}
            </main>
        </div>
    );
};

export default UserPage;