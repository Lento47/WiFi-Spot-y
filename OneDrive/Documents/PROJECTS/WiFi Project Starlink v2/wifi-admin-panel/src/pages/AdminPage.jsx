import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import Dashboard from '../components/admin/Dashboard.jsx';
import PendingPayments from '../components/admin/PendingPayments.jsx';
import UserManagement from '../components/admin/UserManagement.jsx';
import Settings from '../components/admin/Settings.jsx';
import CensoredWords from '../components/admin/CensoredWords.jsx';
import SupportManagement from '../components/admin/SupportManagement.jsx';
import DataExport from '../components/admin/DataExport.jsx';
import NetworkDataManagement from '../components/admin/NetworkDataManagement.jsx';
import ReferralManagement from '../components/admin/ReferralManagement.jsx';
import BulletinBoard from '../components/user/BulletinBoard.jsx'; // Import the bulletin board
import EnhancedNotifications from '../components/admin/EnhancedNotifications.jsx';
import NotificationBell from '../components/admin/NotificationBell.jsx';
import Icon from '../components/common/Icon.jsx';
import { useTheme } from '../App.jsx';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc } from 'firebase/firestore';

const ThemeToggleButton = () => {
    const { theme, toggleTheme } = useTheme();
    return (
        <button onClick={toggleTheme} className="p-2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            {theme === 'light' ? <Icon path="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /> : <Icon path="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />}
        </button>
    );
};

// Enhanced Notifications component is imported separately

const AdminPage = ({ user }) => {
    const [activeTab, setActiveTab] = useState('dashboard');

    const handleLogout = () => {
        signOut(auth);
    };

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', component: <Dashboard db={db} />, icon: <Icon path="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /> },
        { id: 'payments', label: 'Pagos Pendientes', component: <PendingPayments db={db} />, icon: <Icon path="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h6m3-3.75l-3 3m3 0l-3-3m-3.75 6.75h16.5c.621 0 1.125-.504 1.125-1.125V6.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v10.5c0 .621.504 1.125 1.125 1.125z" /> },
        { id: 'users', label: 'Usuarios', component: <UserManagement db={db} />, icon: <Icon path="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.663M15 12.5a5 5 0 11-10 0 5 5 0 0110 0z" /> },
        { id: 'bulletin', label: 'Ver Mural', component: <BulletinBoard user={user} isAdmin={true} />, icon: <Icon path="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /> },
        { id: 'moderation', label: 'Moderar Palabras', component: <CensoredWords />, icon: <Icon path="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /> },
        { id: 'support', label: 'Soporte', component: <SupportManagement db={db} />, icon: <Icon path="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /> },
        { id: 'export', label: 'Exportar Datos', component: <DataExport />, icon: <Icon path="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /> },
        { id: 'networkData', label: 'Gestión de Datos de Red', component: <NetworkDataManagement />, icon: <Icon path="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v3.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125v-3.75m16.5 0v3.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125v-3.75" /> },
        { id: 'referrals', label: 'Gestión de Referencias', component: <ReferralManagement />, icon: <Icon path="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM13.5 15a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /> },
        { id: 'notifications', label: 'Notificaciones', component: <EnhancedNotifications user={user} />, icon: <Icon path="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /> },
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
                        <NotificationBell 
                            user={user} 
                            onNotificationClick={() => setActiveTab('notifications')}
                        />
                        <ThemeToggleButton />
                        <button onClick={handleLogout} className="font-semibold text-blue-600 hover:underline">Cerrar Sesión</button>
                    </div>
                </header>
                <div className="flex flex-col lg:flex-row gap-8">
                    <aside className="lg:w-64 bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl p-4 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-700">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 px-2">Menú</h2>
                        <div className="space-y-3">
                            {tabs.map(tab => <TabButton key={tab.id} tab={tab} isActive={activeTab === tab.id} />)}
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