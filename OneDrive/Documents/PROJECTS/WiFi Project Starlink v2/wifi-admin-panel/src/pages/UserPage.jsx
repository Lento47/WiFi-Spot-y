import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { collection, doc, onSnapshot, updateDoc, serverTimestamp, setDoc, addDoc, query, where, orderBy, increment, writeBatch, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase';
import Spinner from '../components/common/Spinner.jsx';
import Icon from '../components/common/Icon.jsx';
import BulletinBoard from '../components/user/BulletinBoard.jsx';
import EnhancedBulletinBoard from '../components/user/EnhancedBulletinBoard.jsx';
import Support from '../components/user/Support.jsx';
import ReferralProgram from '../components/user/ReferralProgram.jsx';
import PaymentSuccessAnimation from '../components/common/PaymentSuccessAnimation.jsx';
import { useTheme } from '../App.jsx';

const ThemeToggleButton = () => {
    const { theme, toggleTheme } = useTheme();
    return (
        <button onClick={toggleTheme} className="p-2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            {theme === 'light' ? <Icon path="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /> : <Icon path="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />}
        </button>
    );
};

const BuyCreditsView = ({ submission, setSubmission, timePackages, handleSubmitPurchase, isLoading }) => (
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
                    <select name="package" required className="w-full px-3 py-3 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200">{timePackages.map(p => <option key={p.id} value={p.id} className="text-slate-700 dark:text-slate-200">{p.name} - ₡{p.price}</option>)}</select>
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1"># Comprobante</label>
                    <input name="sinpe-id" required className="w-full px-3 py-3 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200" />
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

const GenerateTokenView = ({ handleGenerateToken, minutesToUse, setMinutesToUse, userData, formatCredits, isLoading, generatedToken, userTokens }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2">Generar Token</h2>
            <p className="mb-8 text-slate-500 dark:text-slate-400">Use sus créditos para crear un token de acceso.</p>
            <form onSubmit={handleGenerateToken}>
                <div className="mb-4">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Minutos a usar</label>
                    <input type="number" value={minutesToUse} onChange={e => setMinutesToUse(e.target.value)} placeholder={`Máximo: ${Math.floor(userData.creditsMinutes)}`} required className="w-full px-3 py-3 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200" />
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



// --- NEW: Notifications Component ---
const NotificationsPanel = ({ user }) => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "notifications"), where("toUserId", "==", user.uid), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, snapshot => {
            setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsub();
    }, [user.uid]);

    const handleOpen = async () => {
        setIsOpen(!isOpen);
        if (!isOpen) { // Mark as read when opening for the first time
            const unreadNotifs = notifications.filter(n => !n.isRead);
            if (unreadNotifs.length > 0) {
                const batch = writeBatch(db);
                unreadNotifs.forEach(notif => {
                    batch.update(doc(db, "notifications", notif.id), { isRead: true });
                });
                await batch.commit();
            }
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="relative">
            <button onClick={handleOpen} className="relative p-2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                <Icon path="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-800"></span>
                )}
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl border dark:border-slate-700 z-10">
                    <div className="p-3 font-bold text-lg border-b dark:border-slate-700">Notificaciones</div>
                    <ul className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? notifications.map(n => (
                            <li key={n.id} className={`p-3 border-b dark:border-slate-700 ${!n.isRead ? 'bg-blue-50 dark:bg-blue-900/50' : ''}`}>
                                <p className="text-sm">{n.message}</p>
                                <p className="text-xs text-slate-400 mt-1">{n.createdAt.toDate().toLocaleString('es-CR')}</p>
                            </li>
                        )) : <li className="p-4 text-sm text-slate-500">No hay notificaciones.</li>}
                    </ul>
                </div>
            )}
        </div>
    );
};

const UserPage = ({ user }) => {
    const [activeTab, setActiveTab] = useState('buy');
    const [submission, setSubmission] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [userData, setUserData] = useState(null); // Changed initial state
    const [timePackages, setTimePackages] = useState([]);
    const [userTokens, setUserTokens] = useState([]);
    const [minutesToUse, setMinutesToUse] = useState('');
    const [generatedToken, setGeneratedToken] = useState(null);
    const [username, setUsername] = useState('');
    const [usernameError, setUsernameError] = useState('');
    const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
    const [paymentData, setPaymentData] = useState(null);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'timePackages'), snapshot => {
            setTimePackages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsub();
    }, []);
    
    useEffect(() => {
        const userRef = doc(db, "users", user.uid);
        const unsub = onSnapshot(userRef, (doc) => {
            setUserData(doc.data() || { needsUsername: !doc.exists(), creditsMinutes: 0 });
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
    
    const handleUsernameSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setUsernameError('');
        if (username.length < 3) {
            setUsernameError("El nombre de usuario debe tener al menos 3 caracteres.");
            setIsLoading(false);
            return;
        }

        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where("username", "==", username));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                setUsernameError("Este nombre de usuario ya está en uso.");
                setIsLoading(false);
                return;
            }

            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                username: username,
                creditsMinutes: 0,
                createdAt: serverTimestamp()
            });
        } catch (err) {
            setUsernameError("No se pudo guardar el nombre de usuario.");
        } finally {
            setIsLoading(false);
        }
    };

    // ... (handleGenerateToken and handleSubmitPurchase remain the same)
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
            await addDoc(collection(db, 'tokens'), { userId: user.uid, tokenString, durationMinutes: minutes, status: 'active', createdAt: serverTimestamp() });
            await updateDoc(doc(db, 'users', user.uid), { creditsMinutes: increment(-minutes) });
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
            
            // Show payment success animation
            setPaymentData({
                amount: selectedPackage.price,
                packageName: selectedPackage.name,
                durationMinutes: selectedPackage.durationMinutes,
                sinpeId: sinpeId,
                timestamp: new Date(),
                status: 'pending'
            });
            setShowPaymentSuccess(true);
        } catch (error) { 
            console.error("Error submitting payment:", error);
            alert("Ocurrió un error."); 
        } finally { 
            setIsLoading(false); 
        }
    };
    
    const handleLogout = () => signOut(auth);

    if (!userData || userData.needsUsername) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl">
                    <h2 className="text-3xl font-bold text-center text-slate-800 mb-2">¡Casi listo!</h2>
                                            <p className="text-center text-slate-500 dark:text-slate-400 mb-8">Elige tu nombre de usuario para el mural comunitario.</p>
                    <form onSubmit={handleUsernameSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-slate-700 mb-1">Nombre de Usuario</label>
                            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg"/>
                        </div>
                        {usernameError && <p className="text-red-500 text-sm text-center mb-4">{usernameError}</p>}
                        <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center bg-blue-600 text-white font-bold py-3 px-4 rounded-lg">
                            {isLoading ? <Spinner /> : 'Guardar y Continuar'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-100 dark:bg-slate-900 min-h-screen p-4">
            <header className="max-w-7xl mx-auto flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Portal de Usuario</h1>
                    <p className="text-slate-500 dark:text-slate-400">{userData.username || user.email}</p>
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
                    <button onClick={() => setActiveTab('bulletin')} className={`px-4 py-2 text-sm font-semibold rounded-full ${activeTab === 'bulletin' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-slate-200 shadow' : 'text-slate-600 dark:text-slate-400'}`}>Mural Comunitario</button>
                    <button onClick={() => setActiveTab('support')} className={`px-4 py-2 text-sm font-semibold rounded-full ${activeTab === 'support' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-slate-200 shadow' : 'text-slate-600 dark:text-slate-400'}`}>Soporte</button>
                    <button onClick={() => setActiveTab('referrals')} className={`px-4 py-2 text-sm font-semibold rounded-full ${activeTab === 'referrals' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-slate-200 shadow' : 'text-slate-600 dark:text-slate-400'}`}>Referencias</button>
                </div>
            </nav>
            <main className="flex items-start justify-center">
                {activeTab === 'buy' && <BuyCreditsView 
                    submission={submission}
                    setSubmission={setSubmission}
                    timePackages={timePackages}
                    handleSubmitPurchase={handleSubmitPurchase}
                    isLoading={isLoading}
                />}
                {activeTab === 'tokens' && <GenerateTokenView 
                    handleGenerateToken={handleGenerateToken}
                    minutesToUse={minutesToUse}
                    setMinutesToUse={setMinutesToUse}
                    userData={userData}
                    formatCredits={formatCredits}
                    isLoading={isLoading}
                    generatedToken={generatedToken}
                    userTokens={userTokens}
                />}
                {activeTab === 'bulletin' && <BulletinBoard user={user} />}
                {activeTab === 'support' && <Support user={user} />}
                {activeTab === 'referrals' && <ReferralProgram user={user} />}
            </main>
            
            {/* Payment Success Animation Overlay */}
            {showPaymentSuccess && paymentData && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="relative">
                        <button 
                            onClick={() => setShowPaymentSuccess(false)}
                            className="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl z-10"
                        >
                            ×
                        </button>
                        <PaymentSuccessAnimation 
                            paymentData={paymentData}
                            onClose={() => setShowPaymentSuccess(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserPage;