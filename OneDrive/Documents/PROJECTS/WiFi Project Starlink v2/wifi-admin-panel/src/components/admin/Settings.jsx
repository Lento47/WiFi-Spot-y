import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';

// --- Sub-component for managing Time Packages ---
const TimePackageSettings = () => {
    const [packages, setPackages] = useState([]);
    const [newPackage, setNewPackage] = useState({ name: '', price: '', duration: '' });

    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'timePackages'), snapshot => {
            setPackages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsub();
    }, []);

    const handleAddPackage = async (e) => {
        e.preventDefault();
        if (!newPackage.name || !newPackage.price || !newPackage.duration) return;
        await addDoc(collection(db, 'timePackages'), {
            name: newPackage.name,
            price: Number(newPackage.price),
            durationMinutes: Number(newPackage.duration)
        });
        setNewPackage({ name: '', price: '', duration: '' });
    };

    const handleDeletePackage = async (id) => {
        await deleteDoc(doc(db, 'timePackages', id));
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                <h4 className="font-bold text-xl text-slate-800 dark:text-slate-200 mb-4">Añadir Nuevo Paquete</h4>
                <form onSubmit={handleAddPackage} className="space-y-4">
                    <div><label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nombre</label><input type="text" value={newPackage.name} onChange={e => setNewPackage({...newPackage, name: e.target.value})} className="w-full mt-1 p-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600" /></div>
                    <div><label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Precio (₡)</label><input type="number" value={newPackage.price} onChange={e => setNewPackage({...newPackage, price: e.target.value})} className="w-full mt-1 p-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600" /></div>
                    <div><label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Duración (Minutos)</label><input type="number" value={newPackage.duration} onChange={e => setNewPackage({...newPackage, duration: e.target.value})} className="w-full mt-1 p-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600" /></div>
                    <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg">Añadir Paquete</button>
                </form>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                <h4 className="font-bold text-xl text-slate-800 dark:text-slate-200 mb-4">Paquetes Actuales</h4>
                <ul className="space-y-3 max-h-60 overflow-y-auto">{packages.map(p => <li key={p.id} className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg flex justify-between items-center"><div><p className="font-semibold text-slate-800 dark:text-slate-200">{p.name}</p><p className="text-sm text-slate-500 dark:text-slate-400">₡{p.price} - {p.durationMinutes} min</p></div><button onClick={() => handleDeletePackage(p.id)} className="text-red-500 hover:text-red-700">Eliminar</button></li>)}</ul>
            </div>
        </div>
    );
};

// --- Sub-component for managing Bulletin Board Channels ---
const ChannelSettings = () => {
    const [topics, setTopics] = useState([]);
    const [newTopic, setNewTopic] = useState({ name: '', logo: '💬', canWrite: true });

    useEffect(() => {
        const unsubTopics = onSnapshot(collection(db, 'topics'), snapshot => {
            setTopics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubTopics();
    }, []);

    const handleAddTopic = async (e) => {
        e.preventDefault();
        if (!newTopic.name.trim()) return;
        await addDoc(collection(db, 'topics'), {
            name: newTopic.name.trim(),
            logo: newTopic.logo,
            canWrite: newTopic.canWrite
        });
        setNewTopic({ name: '', logo: '💬', canWrite: true });
    };

    const handleDeleteTopic = async (id) => {
        await deleteDoc(doc(db, 'topics', id));
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                <h4 className="font-bold text-xl text-slate-800 dark:text-slate-200 mb-4">Añadir Nuevo Canal</h4>
                <form onSubmit={handleAddTopic} className="space-y-4">
                    <div><label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nombre del Canal</label><input type="text" value={newTopic.name} onChange={e => setNewTopic({...newTopic, name: e.target.value})} className="w-full mt-1 p-2 border rounded-lg" /></div>
                    <div><label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Logo (Emoji)</label><input type="text" value={newTopic.logo} onChange={e => setNewTopic({...newTopic, logo: e.target.value})} className="w-full mt-1 p-2 border rounded-lg" maxLength="2" /></div>
                    <div className="flex items-center"><input type="checkbox" id="canWrite" checked={newTopic.canWrite} onChange={e => setNewTopic({...newTopic, canWrite: e.target.checked})} className="h-4 w-4 rounded" /><label htmlFor="canWrite" className="ml-2 text-sm text-slate-700 dark:text-slate-300">Los usuarios pueden escribir en este canal</label></div>
                    <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg">Añadir Canal</button>
                </form>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                <h4 className="font-bold text-xl text-slate-800 dark:text-slate-200 mb-4">Canales Actuales</h4>
                <ul className="space-y-2 max-h-60 overflow-y-auto">{topics.map(t => <li key={t.id} className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg flex justify-between items-center"><div className="flex items-center gap-2"><span className="text-xl">{t.logo}</span><span className="text-slate-800 dark:text-slate-200">{t.name}</span></div><button onClick={() => handleDeleteTopic(t.id)} className="text-red-500 hover:text-red-700 text-sm">Eliminar</button></li>)}</ul>
            </div>
        </div>
    );
};

// --- Main Settings Component ---
const Settings = () => {
    const [activeSetting, setActiveSetting] = useState('packages'); // 'packages' or 'channels'

    return (
        <div>
            <div className="mb-6 border-b border-slate-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button onClick={() => setActiveSetting('packages')} className={`${activeSetting === 'packages' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                        Paquetes de Tiempo
                    </button>
                    <button onClick={() => setActiveSetting('channels')} className={`${activeSetting === 'channels' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                        Canales del Mural
                    </button>
                </nav>
            </div>

            {activeSetting === 'packages' && <TimePackageSettings />}
            {activeSetting === 'channels' && <ChannelSettings />}
        </div>
    );
};

export default Settings;