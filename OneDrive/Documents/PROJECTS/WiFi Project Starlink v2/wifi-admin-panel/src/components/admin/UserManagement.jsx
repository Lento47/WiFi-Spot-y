import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

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

export default UserManagement;
