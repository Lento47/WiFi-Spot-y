import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';

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

export default Settings;
