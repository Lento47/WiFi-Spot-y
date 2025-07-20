import React, { useState, useEffect, useMemo } from 'react';
// This should point to your configuration file.
import { firebaseConfig } from './firebaseConfig'; 

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const Spinner = () => <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>;

// This is the main component for your user-facing page.
export default function UserPage() {
    // This section initializes a separate, lightweight connection to Firebase for this public page.
    const firebaseServices = useMemo(() => {
        const isConfigValid = Object.values(firebaseConfig).every(v => v && !v.includes('YOUR_'));
        if (!isConfigValid) return null;
        try {
            const app = initializeApp(firebaseConfig, "userApp"); // Use a unique name to avoid conflicts
            const auth = getAuth(app);
            const db = getFirestore(app);
            const storage = getStorage(app);
            return { auth, db, storage };
        } catch (error) { 
            console.error("Firebase initialization failed on User Page", error);
            return null;
        }
    }, []);
    
    // This hook ensures every visitor is anonymously signed in to get a unique ID.
    useEffect(() => {
        if(firebaseServices?.auth) {
            onAuthStateChanged(firebaseServices.auth, (user) => { 
                if (!user) {
                    signInAnonymously(firebaseServices.auth).catch(console.error);
                }
            });
        }
    }, [firebaseServices]);

    const [submission, setSubmission] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Define the available Wi-Fi plans
    const timePackages = [
        { id: 'daily', name: 'Pase Diario', price: 3000, duration: 1440 },
        { id: 'weekly', name: 'Pase Semanal', price: 15000, duration: 10080 },
        { id: 'monthly', name: 'Pase Mensual', price: 30000, duration: 43200 },
    ];

    // This function handles the form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!firebaseServices?.auth.currentUser) {
            alert("Error de autenticación. Por favor, recargue la página.");
            return;
        }

        setIsLoading(true);
        const formData = new FormData(e.target);
        const sinpeId = formData.get('sinpe-id');
        const file = formData.get('receipt-file');
        const selectedPackage = timePackages.find(p => p.id === formData.get('package'));

        if (!sinpeId || !file || !selectedPackage) {
            alert("Por favor, complete todos los campos.");
            setIsLoading(false);
            return;
        }

        try {
            const { auth, db, storage } = firebaseServices;
            // 1. Upload the receipt image to Firebase Storage
            const filePath = `receipts/${auth.currentUser.uid}/${Date.now()}-${file.name}`;
            const storageRef = ref(storage, filePath);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            // 2. Create a user record if it doesn't exist
            await setDoc(doc(db, 'users', auth.currentUser.uid), { createdAt: serverTimestamp() }, { merge: true });

            // 3. Create the payment document in Firestore with 'pending' status
            const docRef = await addDoc(collection(db, "payments"), {
                userId: auth.currentUser.uid,
                sinpeId,
                receiptImageUrl: downloadURL,
                status: "pending",
                createdAt: serverTimestamp(),
                packageName: selectedPackage.name,
                price: selectedPackage.price,
                durationMinutes: selectedPackage.duration
            });
            // 4. Update the UI to show the status
            setSubmission({ id: docRef.id, status: 'pending' });
        } catch (error) {
            console.error("Error submitting payment:", error);
            alert("Ocurrió un error al enviar su solicitud. Intente de nuevo.");
            setIsLoading(false);
        }
    };

    // This hook listens for real-time updates on the submission (e.g., when the admin approves it)
    useEffect(() => {
        if (!submission || !firebaseServices?.db) return;
        const unsub = onSnapshot(doc(firebaseServices.db, "payments", submission.id), (doc) => {
            const payment = doc.data();
            if (payment) {
                setSubmission(prev => ({ ...prev, status: payment.status, token: payment.token }));
                if (payment.status !== 'pending') {
                    unsub(); // Stop listening once the status changes from pending
                }
            }
        });
        return () => unsub();
    }, [submission?.id, firebaseServices]);
    
    // Show a loading/error message if Firebase isn't ready
    if (!firebaseServices) {
        return (
            <div className="bg-slate-100 min-h-screen flex items-center justify-center p-4">
                <div className="text-center text-red-600 font-semibold p-6 bg-white rounded-2xl shadow-lg">Error: El portal no se pudo conectar a los servicios. Verifique la configuración.</div>
            </div>
        );
    }

    // This is the view shown to the user AFTER they have submitted their payment
    if (submission) {
        return (
            <div className="bg-slate-100 min-h-screen flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
                     <h2 className="text-3xl font-bold text-slate-800 mb-4">
                        {submission.status === 'pending' && "Solicitud Enviada"}
                        {submission.status === 'approved' && "✅ ¡Solicitud Aprobada!"}
                        {submission.status === 'rejected' && "❌ Solicitud Rechazada"}
                    </h2>
                    <p className="text-slate-600 mb-6">
                        {submission.status === 'pending' && "Estamos esperando la aprobación del administrador. Puede cerrar esta página, su token se activará cuando sea aprobado."}
                        {submission.status === 'approved' && "Su pago ha sido verificado. ¡Gracias!"}
                        {submission.status === 'rejected' && "Hubo un problema con su comprobante. Por favor, contacte al administrador."}
                    </p>
                    {submission.status === 'approved' && (
                        <div className="mt-4 p-4 bg-green-100 border-2 border-dashed border-green-300 rounded-lg">
                            <p className="text-sm text-green-800">Su token de acceso es:</p>
                            <p className="text-2xl font-mono font-bold text-green-900 break-all">{submission.token}</p>
                        </div>
                    )}
                     <button onClick={() => setSubmission(null)} className="mt-8 bg-slate-200 text-slate-800 font-bold py-3 px-6 rounded-lg hover:bg-slate-300 transition-colors">
                        Hacer otra solicitud
                    </button>
                </div>
            </div>
        );
    }
    
    // This is the initial form view for the user
    return (
        <div className="bg-slate-100 min-h-screen flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
                <h2 className="text-3xl font-bold text-slate-800 mb-2">Portal de Pago Wi-Fi</h2>
                <p className="mb-8 text-slate-500">Pague al SINPE Móvil <strong className="font-mono text-slate-700">8888-8888</strong> y suba su comprobante.</p>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="package" className="block text-sm font-bold text-slate-700 mb-1">Seleccione un Paquete</label>
                        <select id="package" name="package" required className="mt-1 block w-full px-3 py-3 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {timePackages.map(p => <option key={p.id} value={p.id}>{p.name} - ₡{p.price}</option>)}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="sinpe-id" className="block text-sm font-bold text-slate-700 mb-1">Número de Comprobante SINPE</label>
                        <input type="text" id="sinpe-id" name="sinpe-id" required className="mt-1 block w-full px-3 py-3 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="mb-8">
                        <label htmlFor="receipt-file" className="block text-sm font-bold text-slate-700 mb-1">Captura del Comprobante</label>
                        <input type="file" id="receipt-file" name="receipt-file" required accept="image/*" className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-semibold file:bg-slate-50 file:text-blue-700 hover:file:bg-slate-100" />
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center bg-blue-600 text-white font-bold py-4 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-lg disabled:bg-slate-400">
                        {isLoading ? <Spinner /> : 'Enviar para Verificación'}
                    </button>
                </form>
            </div>
        </div>
    );
}
