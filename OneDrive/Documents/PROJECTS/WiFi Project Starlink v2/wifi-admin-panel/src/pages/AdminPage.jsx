import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, where, getDocs, updateDoc, serverTimestamp, increment, orderBy } from 'firebase/firestore';
import { auth, db } from '../firebase';

// --- Helper Components (now inside AdminPage.jsx) ---
const Icon = ({ path, className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
);

// --- Admin Sub-Components (now inside AdminPage.jsx) ---

const Dashboard = ({ db }) => {
    const [stats, setStats] = useState({ users: 0, pending: 0, approved: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!db) return;
        const fetchStats = async () => {
            try {
                const usersSnapshot = await getDocs(collection(db, 'users'));
                const paymentsSnapshot = await getDocs(collection(db, 'payments'));
                let pendingCount = 0, approvedCount = 0;
                paymentsSnapshot.forEach(doc => {
                    const status = doc.data().status;
                    if (status === 'pending') pendingCount++;
                    if (status === 'approved') approvedCount++;
                });
                setStats({ users: usersSnapshot.size, pending: pendingCount, approved: approvedCount });
            } catch (error) { console.error("Error fetching stats:", error); } 
            finally { setLoading(false); }
        };
        fetchStats();
    }, [db]);

    const StatCard = ({ title, value, icon, color }) => (
        <div className="bg-white p-6 rounded-2xl shadow-lg flex items-center space-x-5">
            <div className={`p-4 rounded-full ${color.bg}`}>{React.cloneElement(icon, { className: `w-8 h-8 ${color.text}` })}</div>
            <div>
                <p className="text-base text-slate-500 font-medium">{title}</p>
                {loading ? <div className="h-9 w-12 mt-1 bg-slate-200 rounded-md animate-pulse"></div> : <p className="text-4xl font-bold text-slate-800">{value}</p>}
            </div>
        </div>
    );

    return (
        <div>
            <h3 className="text-3xl font-bold text-slate-800 mb-6">Resumen General</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <StatCard title="Usuarios Totales" value={stats.users} icon={<Icon path="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.663M15 12.5a5 5 0 11-10 0 5 5 0 0110 0z" />} color={{bg: 'bg-blue-100', text: 'text-blue-600'}} />
                <StatCard title="Pagos Pendientes" value={stats.pending} icon={<Icon path="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />} color={{bg: 'bg-orange-100', text: 'text-orange-600'}} />
                <StatCard title="Pagos Aprobados" value={stats.approved} icon={<Icon path="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />} color={{bg: 'bg-green-100', text: 'text-green-600'}} />
            </div>
        </div>
    );
};

const PendingPayments = ({ db }) => {
    const [payments, setPayments] = useState([]);
    useEffect(() => {
        if (!db) return;
        const q = query(collection(db, "payments"), where("status", "==", "pending"));
        const unsub = onSnapshot(q, (snapshot) => setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        return () => unsub();
    }, [db]);
    
    const handleAction = async (paymentId, action, userId, duration) => {
        if (!db) return;
        const paymentRef = doc(db, "payments", paymentId);
        
        if (action === 'approve') {
            const token = `WIFI-${Date.now().toString().slice(-4)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
            await updateDoc(paymentRef, { status: "approved", token, approvedAt: serverTimestamp() });
            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, { creditsMinutes: increment(duration || 0) });
        } else {
            await updateDoc(paymentRef, { status: "rejected", rejectedAt: serverTimestamp() });
        }
    };

    return (
        <div>
            <h3 className="text-3xl font-bold text-slate-800 mb-6">Pagos Pendientes</h3>
            {payments.length === 0 ? <div className="text-center py-12"><p className="text-slate-500">No hay pagos pendientes.</p></div> : (
                <div className="space-y-5">{payments.map(p => <div key={p.id} className="bg-white p-5 rounded-2xl shadow-lg"><div className="flex flex-col sm:flex-row justify-between items-start"><div className="mb-4 sm:mb-0"><p className="font-bold text-xl text-slate-800">{p.packageName}</p><p className="font-semibold text-slate-600">Monto: ₡{p.price}</p><p className="text-sm text-slate-500">Usuario: <span className="font-mono text-xs">{p.userId}</span></p><a href={p.receiptImageUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-sm font-semibold text-blue-600 hover:underline">Ver Recibo →</a></div><div className="flex items-center space-x-3"><button onClick={() => handleAction(p.id, 'approve', p.userId, p.durationMinutes)} className="px-4 py-2 text-sm font-bold text-white bg-green-500 rounded-full">Aprobar</button><button onClick={() => handleAction(p.id, 'reject')} className="px-4 py-2 text-sm font-bold text-white bg-red-500 rounded-full">Rechazar</button></div></div></div>)}</div>
            )}
        </div>
    );
};

const UserManagement = ({ db }) => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userPayments, setUserPayments] = useState([]);
    useEffect(() => {
        if (!db) return;
        const unsub = onSnapshot(collection(db, 'users'), snapshot => setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        return () => unsub();
    }, [db]);
    useEffect(() => {
        if (!selectedUser || !db) { setUserPayments([]); return; }
        const q = query(collection(db, "payments"), where("userId", "==", selectedUser.id), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, snapshot => setUserPayments(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}))));
        return () => unsub();
    }, [selectedUser, db]);
    const StatusBadge = ({ status }) => <span className={`px-3 py-1 inline-flex text-xs font-bold rounded-full ring-1 ring-inset ${{approved: 'bg-green-100 text-green-800 ring-green-600/20',pending: 'bg-orange-100 text-orange-800 ring-orange-600/20',rejected: 'bg-red-100 text-red-800 ring-red-600/20'}[status]}`}>{status}</span>;
    
    const formatCredits = (minutes) => {
        if (!minutes) return "0 minutos";
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours} horas, ${remainingMinutes} minutos`;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1"><h3 className="text-3xl font-bold text-slate-800 mb-6">Usuarios</h3><div className="bg-white rounded-2xl shadow-lg"><ul className="divide-y divide-slate-100 max-h-[65vh] overflow-y-auto">{users.map(user => <li key={user.id} onClick={() => setSelectedUser(user)} className={`p-4 hover:bg-blue-50 cursor-pointer ${selectedUser?.id === user.id ? 'bg-blue-100' : ''}`}><p className="text-sm font-semibold text-slate-800 truncate">{user.email || user.id}</p></li>)}</ul></div></div>
            <div className="lg:col-span-2"><h3 className="text-3xl font-bold text-slate-800 mb-6">Detalles</h3>{selectedUser ? <div className="bg-white p-6 rounded-2xl shadow-lg"><div className="flex justify-between items-start mb-4"><p className="font-bold text-xl text-slate-800 truncate">{selectedUser.email || selectedUser.id}</p><div className="text-right"><p className="text-sm text-slate-500">Créditos</p><p className="font-bold text-blue-600">{formatCredits(selectedUser.creditsMinutes)}</p></div></div><p className="text-slate-500 mb-6">Historial de Pagos:</p>{userPayments.length > 0 ? <ul className="space-y-4">{userPayments.map(p => <li key={p.id} className="p-4 bg-slate-50 rounded-xl flex justify-between items-center"><div><p className="font-bold text-slate-700">{p.packageName}</p><p className="text-xs text-slate-500">{p.createdAt?.toDate().toLocaleString('es-CR')}</p></div><StatusBadge status={p.status} /></li>)}</ul> : <p>No hay pagos.</p>}</div> : <div className="text-center py-12 bg-white rounded-2xl shadow-lg"><p>Seleccione un usuario.</p></div>}</div>
        </div>
    );
};

const Settings = ({ db }) => {
    const [packages, setPackages] = useState([]);
    const [newPackage, setNewPackage] = useState({ name: '', price: '', duration: '' });

    useEffect(() => {
        if (!db) return;
        const unsub = onSnapshot(collection(db, 'timePackages'), snapshot => {
            setPackages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsub();
    }, [db]);

    const handleAddPackage = async (e) => {
        e.preventDefault();
        if (!db || !newPackage.name || !newPackage.price || !newPackage.duration) return;
        await addDoc(collection(db, 'timePackages'), {
            name: newPackage.name,
            price: Number(newPackage.price),
            durationMinutes: Number(newPackage.duration)
        });
        setNewPackage({ name: '', price: '', duration: '' });
    };

    const handleDeletePackage = async (id) => {
        if (!db) return;
        await deleteDoc(doc(db, 'timePackages', id));
    };

    return (
        <div>
            <h3 className="text-3xl font-bold text-slate-800 mb-6">Configurar Paquetes de Tiempo</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h4 className="font-bold text-xl text-slate-800 mb-4">Añadir Nuevo Paquete</h4>
                    <form onSubmit={handleAddPackage} className="space-y-4">
                        <div><label className="text-sm font-semibold">Nombre</label><input type="text" value={newPackage.name} onChange={e => setNewPackage({...newPackage, name: e.target.value})} className="w-full mt-1 p-2 border rounded-lg" /></div>
                        <div><label className="text-sm font-semibold">Precio (₡)</label><input type="number" value={newPackage.price} onChange={e => setNewPackage({...newPackage, price: e.target.value})} className="w-full mt-1 p-2 border rounded-lg" /></div>
                        <div><label className="text-sm font-semibold">Duración (Minutos)</label><input type="number" value={newPackage.duration} onChange={e => setNewPackage({...newPackage, duration: e.target.value})} className="w-full mt-1 p-2 border rounded-lg" /></div>
                        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg">Añadir Paquete</button>
                    </form>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h4 className="font-bold text-xl text-slate-800 mb-4">Paquetes Actuales</h4>
                    <ul className="space-y-3">{packages.map(p => <li key={p.id} className="p-3 bg-slate-50 rounded-lg flex justify-between items-center"><div><p className="font-semibold">{p.name}</p><p className="text-sm text-slate-500">₡{p.price} - {p.durationMinutes} min</p></div><button onClick={() => handleDeletePackage(p.id)} className="text-red-500 hover:text-red-700">Eliminar</button></li>)}</ul>
                </div>
            </div>
        </div>
    );
};


// --- Main Admin Page Component ---

const AdminPage = ({ user }) => {
    const [activeTab, setActiveTab] = useState('dashboard');

    const handleLogout = () => {
        signOut(auth);
    };

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', component: <Dashboard db={db} />, icon: <Icon path="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /> },
        { id: 'payments', label: 'Pagos Pendientes', component: <PendingPayments db={db} />, icon: <Icon path="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h6m3-3.75l-3 3m3 0l-3-3m-3.75 6.75h16.5c.621 0 1.125-.504 1.125-1.125V6.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v10.5c0 .621.504 1.125 1.125 1.125z" /> },
        { id: 'users', label: 'Usuarios', component: <UserManagement db={db} />, icon: <Icon path="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.663M15 12.5a5 5 0 11-10 0 5 5 0 0110 0z" /> },
        { id: 'settings', label: 'Configuración', component: <Settings db={db} />, icon: <Icon path="M9.594 3.94c.09-.542.56-1.007 1.11-1.11h2.593c.55 0 1.02.465 1.11 1.11l.09 1.423a7.5 7.5 0 015.418 5.418l1.423.09c.542.09 1.007.56 1.11 1.11v2.593c0 .55-.465 1.02-1.11 1.11l-1.423.09a7.5 7.5 0 01-5.418 5.418l-.09 1.423c-.09.542-.56 1.007-1.11 1.11h-2.593c-.55 0-1.02-.465-1.11-1.11l-.09-1.423a7.5 7.5 0 01-5.418-5.418l-1.423-.09c-.542-.09-1.007-.56-1.11-1.11v-2.593c0 .55.465-1.02 1.11 1.11l1.423-.09a7.5 7.5 0 015.418-5.418l.09-1.423z M12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" /> },
    ];

    const TabButton = ({ tab, isActive }) => (
        <button onClick={() => setActiveTab(tab.id)} className={`flex items-center w-full space-x-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-200'}`}>
            {tab.icon}<span>{tab.label}</span>
        </button>
    );

    return (
        <div className="bg-slate-50 min-h-screen text-slate-800 p-4 sm:p-6 md:p-8">
            <div className="max-w-screen-2xl mx-auto">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900">Panel de Administrador</h1>
                        <p className="text-slate-500">{user.email}</p>
                    </div>
                    <button onClick={handleLogout} className="font-semibold text-blue-600 hover:underline">Cerrar Sesión</button>
                </header>
                <div className="flex flex-col lg:flex-row gap-8">
                    <aside className="lg:w-64 bg-white/70 p-4 rounded-3xl shadow-lg">
                        <h2 className="text-xl font-bold text-slate-800 mb-6 px-2">Menú</h2>
                        <div className="space-y-3">
                            {tabs.map(tab => <TabButton key={tab.id} tab={tab} isActive={activeTab === tab.id} />)}
                            <button onClick={handleLogout} className="flex items-center w-full space-x-3 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-200 mt-6">
                                <Icon path="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                                <span>Cerrar Sesión</span>
                            </button>
                        </div>
                    </aside>
                    <main className="flex-1">
                        {tabs.find(tab => tab.id === activeTab)?.component}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;
