import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import Icon from '../common/Icon.jsx';

const NotificationBell = ({ user, onNotificationClick }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        if (!user?.uid) return;

        // Query for admin notifications
        const q = query(
            collection(db, 'notifications'),
            where('isAdminNotification', '==', true),
            where('isRead', '==', false),
            orderBy('createdAt', 'desc')
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const notificationsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setNotifications(notificationsData);
            setUnreadCount(notificationsData.length);
        });

        return unsub;
    }, [user]);

    const handleBellClick = () => {
        if (onNotificationClick) {
            onNotificationClick();
        } else {
            setIsDropdownOpen(!isDropdownOpen);
        }
    };

    const getNotificationPreview = (notification) => {
        switch (notification.type) {
            case 'payment_submission':
                return `Nuevo pago de ₡${notification.amount}`;
            case 'support_ticket':
                return `Ticket: ${notification.subject}`;
            case 'bulletin_post':
                return `Nuevo post: ${notification.title}`;
            case 'referral':
                return `Nueva referencia`;
            default:
                return notification.description || 'Nueva notificación';
        }
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Ahora';
        if (diffInMinutes < 60) return `${diffInMinutes}m`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
        return date.toLocaleDateString('es-CR');
    };

    return (
        <div className="relative">
            <button
                onClick={handleBellClick}
                className="relative p-2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                title="Notificaciones"
            >
                <Icon path="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                
                {/* Notification Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Notifications */}
            {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                            Notificaciones
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {unreadCount} sin leer
                        </p>
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                                No hay notificaciones nuevas
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-200 dark:divide-slate-700">
                                {notifications.slice(0, 5).map(notification => (
                                    <div key={notification.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 mt-1">
                                                {notification.type === 'payment_submission' && (
                                                    <Icon path="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h6m3-3.75l-3 3m3 0l-3-3m-3.75 6.75h16.5c.621 0 1.125-.504 1.125-1.125V6.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v10.5c0 .621.504 1.125 1.125 1.125z" className="w-5 h-5 text-blue-500" />
                                                )}
                                                {notification.type === 'support_ticket' && (
                                                    <Icon path="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" className="w-5 h-5 text-green-500" />
                                                )}
                                                {notification.type === 'bulletin_post' && (
                                                    <Icon path="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" className="w-5 h-5 text-purple-500" />
                                                )}
                                                {notification.type === 'referral' && (
                                                    <Icon path="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM13.5 15a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" className="w-5 h-5 text-orange-500" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">
                                                    {notification.title}
                                                </p>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                                                    {getNotificationPreview(notification)}
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                                        {formatTimestamp(notification.createdAt)}
                                                    </span>
                                                    {notification.userInfo && (
                                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                                            {notification.userInfo.username || notification.userInfo.email}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {notifications.length > 5 && (
                        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                            <button
                                onClick={() => {
                                    setIsDropdownOpen(false);
                                    if (onNotificationClick) onNotificationClick();
                                }}
                                className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                Ver todas las notificaciones
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Click outside to close */}
            {isDropdownOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsDropdownOpen(false)}
                />
            )}
        </div>
    );
};

export default NotificationBell;
