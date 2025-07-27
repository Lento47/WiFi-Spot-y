import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import Dashboard from '../components/admin/Dashboard.jsx';
import PendingPayments from '../components/admin/PendingPayments.jsx';
import UserManagement from '../components/admin/UserManagement.jsx';
import Settings from '../components/admin/Settings.jsx';
import Icon from '../components/common/Icon.jsx';
import { useTheme } from '../App.jsx'; // Import the useTheme hook

const ThemeToggleButton = () => {
    const { theme, toggleTheme } = useTheme();
    return (
        <button onClick={toggleTheme} className="p-2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            {theme === 'light' ? <Icon path="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /> : <Icon path="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />}
        </button>
    );
};

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
        <button onClick={() => setActiveTab(tab.id)} className={`flex items-center w-full space-x-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
            {tab.icon}<span>{tab.label}</span>
        </button>
    );

    return (
        <div className="bg-slate-50 dark:bg-slate-900 min-h-screen text-slate-800 dark:text-slate-200 p-4 sm:p-6 md:p-8">
            <div className="max-w-screen-2xl mx-auto">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Panel de Administrador</h1>
                        <p className="text-slate-500 dark:text-slate-400">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <ThemeToggleButton />
                        <button onClick={handleLogout} className="font-semibold text-blue-600 hover:underline">Cerrar Sesión</button>
                    </div>
                </header>
                <div className="flex flex-col lg:flex-row gap-8">
                    <aside className="lg:w-64 bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl p-4 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-700">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 px-2">Menú</h2>
                        <div className="space-y-3">
                            {tabs.map(tab => <TabButton key={tab.id} tab={tab} isActive={activeTab === tab.id} />)}
                            <button onClick={handleLogout} className="flex items-center w-full space-x-3 px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 mt-6">
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