import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, doc, onSnapshot, updateDoc, query, where, serverTimestamp, getDocs, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// --- Reusable Helper Components ---

const Icon = ({ path, className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
);

const Spinner = () => <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>;

// --- Admin Dashboard Components ---

const FirebaseConfig = ({ setFirebaseConfig, initialConfig }) => {
    const [config, setConfig] = useState(initialConfig);
    const [isSaved, setIsSaved] = useState(false);

    const handleChange = (e) => {
        setConfig({ ...config, [e.target.name]: e.target.value });
        setIsSaved(false);
    };

    const handleSave = () => {
        localStorage.setItem('firebaseConfig', JSON.stringify(config));
        setFirebaseConfig(config);
        setIsSaved(true);
    };
    
    const isConfigComplete = Object.values(config).every(val => val && !val.includes('YOUR_'));

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Configuración de Firebase</h3>
            <p className="text-gray-600 mb-6">
                Guarde aquí su configuración de Firebase para conectar el panel de control. La información se almacenará de forma segura en su navegador.
            </p>
            <div className="space-y-4">
                {Object.keys(initialConfig).map((key) => (
                    <div key={key}>
                        <label className="block text-sm font-medium text-gray-700">{key}</label>
                        <input
                            type="text"
                            name={key}
                            value={config[key] || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder={`Your ${key}`}
                        />
                    </div>
                ))}
            </div>
            <button
                onClick={handleSave}
                disabled={!isConfigComplete}
                className="mt-6 w-full flex justify-center items-center bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
                {isSaved ? 'Guardado y Conectado' : 'Guardar y Conectar'}
            </button>
        </div>
    );
};

const PendingPayments = ({ db }) => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!db) return;
        const q = query(collection(db, "payments"), where("status", "==", "pending"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const paymentsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPayments(paymentsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching pending payments:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db]);
    
    const handleAction = async (id, action) => {
        if(!db) return;
        const paymentRef = doc(db, "payments", id);
        if (action === 'approve') {
            const token = `WIFI-${Date.now().toString().slice(-4)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
            await updateDoc(paymentRef, { status: "approved", token, approvedAt: serverTimestamp() });
        } else {
            await updateDoc(paymentRef, { status: "rejected", rejectedAt: serverTimestamp() });
        }
    };

    if (loading) return <div className="text-center p-4">Cargando pagos pendientes...</div>;

    return (
        <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Pagos Pendientes</h3>
            {payments.length === 0 ? (
                <p className="text-gray-500">No hay pagos pendientes de revisión.</p>
            ) : (
                <div className="space-y-4">
                    {payments.map(p => (
                        <div key={p.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col md:flex-row justify-between items-start">
                           <div className="mb-4 md:mb-0">
                                <p className="font-semibold">Comprobante: <span className="font-normal">{p.sinpeId}</span></p>
                                <p className="text-sm text-gray-500">Usuario: <span className="font-mono text-xs">{p.userId}</span></p>
                                <a href={p.receiptImageUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">Ver Recibo</a>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                                <button onClick={() => handleAction(p.id, 'approve')} className="px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Aprobar</button>
                                <button onClick={() => handleAction(p.id, 'reject')} className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Rechazar</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const UserManagement = ({ db }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!db) return;
        const fetchUsers = async () => {
            try {
                const userSnapshot = await getDocs(collection(db, 'users'));
                setUsers(userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [db]);

    if (loading) return <div className="text-center p-4">Cargando usuarios...</div>;

    return (
         <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Gestión de Usuarios</h3>
            {users.length === 0 ? (
                <p className="text-gray-500">No se han encontrado usuarios.</p>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de Registro</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700">{user.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.createdAt?.toDate().toLocaleString('es-CR') || 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const AdminDashboard = ({ firebaseServices }) => {
    const [activeTab, setActiveTab] = useState('payments');
    const { db } = firebaseServices;

    const tabs = [
        { id: 'payments', label: 'Pagos Pendientes', icon: <Icon path="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h6m3-3.75l-3 3m3 0l-3-3m-3.75 6.75h16.5c.621 0 1.125-.504 1.125-1.125V6.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v10.5c0 .621.504 1.125 1.125 1.125z" /> },
        { id: 'users', label: 'Usuarios', icon: <Icon path="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.663M15 12.5a5 5 0 11-10 0 5 5 0 0110 0z" /> },
    ];

    const TabButton = ({ tab, isActive }) => (
        <button
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center w-full space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
        >
            {tab.icon}
            <span>{tab.label}</span>
        </button>
    );

    return (
        <div className="flex flex-col md:flex-row gap-8">
            <aside className="md:w-64 flex-shrink-0">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Menú</h2>
                <div className="space-y-2">
                    {tabs.map(tab => <TabButton key={tab.id} tab={tab} isActive={activeTab === tab.id} />)}
                </div>
            </aside>
            <main className="flex-1 bg-white p-6 rounded-lg shadow-md min-h-[30rem]">
                {activeTab === 'payments' && <PendingPayments db={db} />}
                {activeTab === 'users' && <UserManagement db={db} />}
            </main>
        </div>
    );
};


// --- User-Facing Component (To be deployed separately) ---

export const UserPage = ({ firebaseServices }) => {
    const { db, storage, auth } = firebaseServices;
    const [submission, setSubmission] = useState(null); // {id, status}
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!auth.currentUser) {
            alert("Error de autenticación. Por favor, recargue la página.");
            return;
        }

        setIsLoading(true);
        const sinpeId = e.target.elements['sinpe-id'].value;
        const file = e.target.elements['receipt-file'].files[0];

        if (!sinpeId || !file) {
            alert("Por favor, complete todos los campos.");
            setIsLoading(false);
            return;
        }

        try {
            const filePath = `receipts/${auth.currentUser.uid}/${Date.now()}-${file.name}`;
            const storageRef = ref(storage, filePath);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            const userRef = doc(db, 'users', auth.currentUser.uid);
            await setDoc(userRef, { createdAt: serverTimestamp() }, { merge: true });

            const docRef = await addDoc(collection(db, "payments"), {
                userId: auth.currentUser.uid,
                sinpeId,
                receiptImageUrl: downloadURL,
                status: "pending",
                createdAt: serverTimestamp(),
                durationMinutes: 1440
            });
            setSubmission({ id: docRef.id, status: 'pending' });
        } catch (error) {
            console.error("Error submitting payment:", error);
            alert("Ocurrió un error al enviar su solicitud. Por favor, intente de nuevo.");
            setIsLoading(false);
        }
    };
    
    // This effect is for real-time status updates for the user
    useEffect(() => {
        if (!submission || !db) return;
        const unsub = onSnapshot(doc(db, "payments", submission.id), (doc) => {
            const payment = doc.data();
            if (payment) {
                setSubmission({ ...submission, status: payment.status, token: payment.token });
                if (payment.status === 'approved' || payment.status === 'rejected') unsub();
            }
        });
        return () => unsub();
    }, [submission?.id, db]);

    if (submission) {
        return (
            <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md mx-auto">
                 <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    {submission.status === 'pending' && "Solicitud Enviada"}
                    {submission.status === 'approved' && "✅ ¡Solicitud Aprobada!"}
                    {submission.status === 'rejected' && "❌ Solicitud Rechazada"}
                </h2>
                <p className="text-gray-600 mb-6">
                    {submission.status === 'pending' && "Estamos esperando la aprobación del administrador. Puede cerrar esta página, el token se generará en el sistema."}
                    {submission.status === 'approved' && "Su pago ha sido verificado. ¡Gracias!"}
                    {submission.status === 'rejected' && "Hubo un problema con su comprobante. Por favor, contacte al administrador."}
                </p>
                {submission.status === 'approved' && (
                    <div className="mt-4 p-4 bg-green-100 border-2 border-dashed border-green-300 rounded-lg">
                        <p className="text-sm text-green-800">Su token de acceso es:</p>
                        <p className="text-2xl font-mono font-bold text-green-900 break-all">{submission.token}</p>
                    </div>
                )}
                 <button onClick={() => setSubmission(null)} className="mt-6 bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-md hover:bg-gray-300">
                    Hacer otra solicitud
                </button>
            </div>
        );
    }
    
    // The initial form view for the user
    return (
        <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Portal de Pago Wi-Fi</h2>
                <p className="mb-6 text-sm text-gray-600">Realice el pago al SINPE Móvil <strong className="font-mono">8888-8888</strong>. Luego, suba su comprobante aquí.</p>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="sinpe-id" className="block text-sm font-medium text-gray-700">Número de Comprobante SINPE</label>
                        <input type="text" id="sinpe-id" required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="receipt-file" className="block text-sm font-medium text-gray-700">Captura del Comprobante</label>
                        <input type="file" id="receipt-file" required accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400">
                        {isLoading ? <Spinner /> : 'Enviar para Verificación'}
                    </button>
                </form>
            </div>
        </div>
    );
};


// --- Main App Component (Admin Dashboard) ---

export default function App() {
    const [firebaseServices, setFirebaseServices] = useState(null);
    const [firebaseConfig, setFirebaseConfig] = useState(() => {
        try {
            const savedConfig = localStorage.getItem('firebaseConfig');
            return savedConfig ? JSON.parse(savedConfig) : {
                apiKey: "", authDomain: "", projectId: "", storageBucket: "", messagingSenderId: "", appId: ""
            };
        } catch {
            return { apiKey: "", authDomain: "", projectId: "", storageBucket: "", messagingSenderId: "", appId: "" };
        }
    });

    const isConfigValid = useCallback(() => {
        return firebaseConfig && Object.values(firebaseConfig).every(v => v);
    }, [firebaseConfig]);

    useEffect(() => {
        if (isConfigValid()) {
            try {
                const app = initializeApp(firebaseConfig);
                const auth = getAuth(app);
                const db = getFirestore(app);
                const storage = getStorage(app);
                
                onAuthStateChanged(auth, (user) => {
                    if (!user) signInAnonymously(auth).catch(console.error);
                });

                setFirebaseServices({ app, auth, db, storage });
            } catch (error) {
                console.error("Firebase initialization failed:", error);
                setFirebaseServices(null);
            }
        }
    }, [firebaseConfig, isConfigValid]);

    return (
        <div className="bg-gray-100 min-h-screen text-gray-800 p-4 sm:p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Panel de Administrador</h1>
                    <p className="text-gray-500">Gestión del sistema Wi-Fi. 📍 Limón, Costa Rica</p>
                </header>

                {!isConfigValid() ? (
                    <FirebaseConfig setFirebaseConfig={setFirebaseConfig} initialConfig={firebaseConfig} />
                ) : !firebaseServices ? (
                    <div className="text-center p-8 bg-white rounded-lg shadow-md">
                        <h2 className="text-xl font-bold text-red-600">Conectando a Firebase...</h2>
                        <p className="text-gray-600 mt-2">Si este mensaje persiste, verifique su configuración de Firebase.</p>
                    </div>
                ) : (
                   <AdminDashboard firebaseServices={firebaseServices} />
                )}
            </div>
        </div>
    );
}

