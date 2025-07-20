import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { collection, doc, onSnapshot, updateDoc, serverTimestamp, setDoc, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase';
import { Spinner } from '../components/common/Spinner.jsx';

const UserPage = ({ user }) => {
    const [submission, setSubmission] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [userData, setUserData] = useState({ creditsMinutes: 0, sessionStartTime: null });
    const [timePackages, setTimePackages] = useState([]);
    const [sessionActive, setSessionActive] = useState(false);
    const [displayTime, setDisplayTime] = useState("0h 0m");

    // Fetch available time packages from the database
    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'timePackages'), snapshot => {
            setTimePackages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsub();
    }, []);
    
    // Listen for real-time updates to the user's data (credits, session)
    useEffect(() => {
        const userRef = doc(db, "users", user.uid);
        const unsub = onSnapshot(userRef, (doc) => {
            const data = doc.data();
            if (data) {
                setUserData(data);
                setSessionActive(!!data.sessionStartTime);
            }
        });
        return () => unsub();
    }, [user.uid]);

    // The new countdown timer logic
    useEffect(() => {
        if (!sessionActive || !userData.sessionStartTime) {
            setDisplayTime(formatCredits(userData.creditsMinutes, false));
            return;
        }

        // This interval updates the visual display every second
        const timerInterval = setInterval(() => {
            const startTime = userData.sessionStartTime.toMillis();
            const now = Date.now();
            const elapsedSeconds = Math.floor((now - startTime) / 1000);
            const totalSeconds = (userData.creditsMinutes || 0) * 60;
            const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
            
            setDisplayTime(formatCredits(remainingSeconds / 60, true));

            if (remainingSeconds <= 0) {
                setSessionActive(false);
                const userRef = doc(db, "users", user.uid);
                updateDoc(userRef, { creditsMinutes: 0, sessionStartTime: null });
            }
        }, 1000);

        // This interval saves the remaining time to the database periodically
        const dbUpdateInterval = setInterval(() => {
            const startTime = userData.sessionStartTime.toMillis();
            const now = Date.now();
            const elapsedMinutes = Math.floor((now - startTime) / 60000);
            const remainingMinutes = Math.max(0, (userData.creditsMinutes || 0) - elapsedMinutes);
            
            const userRef = doc(db, "users", user.uid);
            updateDoc(userRef, { creditsMinutes: remainingMinutes });
        }, 30000); // Update database every 30 seconds

        return () => {
            clearInterval(timerInterval);
            clearInterval(dbUpdateInterval);
        };
    }, [sessionActive, userData, user.uid]);

    const formatCredits = (minutes, showSeconds = false) => {
        if (minutes === undefined || minutes === null || minutes < 0) return "0h 0m 0s";
        const totalSeconds = minutes * 60;
        const hours = Math.floor(totalSeconds / 3600);
        const remainingMinutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);
        return showSeconds ? `${hours}h ${remainingMinutes}m ${seconds}s` : `${hours}h ${remainingMinutes}m`;
    };

    const handleStartSession = async () => {
        await updateDoc(doc(db, "users", user.uid), { sessionStartTime: serverTimestamp() });
        setSessionActive(true);
    };

    const handleSubmit = async (e) => {
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

    return (
        <div className="bg-slate-100 min-h-screen p-4">
            <header className="max-w-7xl mx-auto flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Portal de Usuario</h1>
                    <p className="text-slate-500">{user.email}</p>
                </div>
                <div className="flex items-center space-x-6">
                    <div className="text-right">
                        <p className="text-sm text-slate-500">Crédito Disponible</p>
                        <p className="font-bold text-blue-600 text-lg">{displayTime}</p>
                    </div>
                    <button onClick={handleLogout} className="font-semibold text-slate-600 hover:text-blue-600">Cerrar Sesión</button>
                </div>
            </header>
            <main className="flex items-center justify-center">
                {submission ? (
                    <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
                        <h2 className="text-3xl font-bold text-slate-800 mb-4">{ {pending: "Solicitud Enviada", approved: "✅ ¡Aprobada!", rejected: "❌ Rechazada"}[submission.status] }</h2>
                        <button onClick={() => setSubmission(null)} className="mt-8 bg-slate-200 text-slate-800 font-bold py-3 px-6 rounded-lg">Hacer otra solicitud</button>
                    </div>
                ) : (
                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
                        {userData.creditsMinutes > 0 && !sessionActive && (
                            <div className="text-center mb-8">
                                <button onClick={handleStartSession} className="bg-green-500 text-white font-bold py-4 px-8 rounded-lg shadow-lg">Usar Créditos</button>
                            </div>
                        )}
                        <h2 className="text-3xl font-bold text-slate-800 mb-2">Comprar Créditos</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-slate-700 mb-1">Paquete</label>
                                <select name="package" required className="w-full px-3 py-3 bg-white border-slate-300 rounded-lg">{timePackages.map(p => <option key={p.id} value={p.id}>{p.name} - ₡{p.price}</option>)}</select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-slate-700 mb-1"># Comprobante</label>
                                <input name="sinpe-id" required className="w-full px-3 py-3 bg-white border-slate-300 rounded-lg" />
                            </div>
                            <div className="mb-8">
                                <label className="block text-sm font-bold text-slate-700 mb-1">Recibo</label>
                                <input type="file" name="receipt-file" required accept="image/*" className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-semibold file:bg-slate-50" />
                            </div>
                            <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center bg-blue-600 text-white font-bold py-4 rounded-lg">{isLoading ? <Spinner /> : 'Enviar'}</button>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
};

export default UserPage;
