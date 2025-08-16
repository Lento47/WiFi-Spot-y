import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, writeBatch, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import Icon from '../common/Icon.jsx';

const EnhancedNotifications = ({ user }) => {
    const [notifications, setNotifications] = useState([]);
    const [filterType, setFilterType] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user?.uid) return;

        // Query for admin notifications (all notifications for admin users)
        const q = query(
            collection(db, 'notifications'),
            where('isAdminNotification', '==', true),
            orderBy('createdAt', 'desc')
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const notificationsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setNotifications(notificationsData);
            
            const unread = notificationsData.filter(n => !n.isRead).length;
            setUnreadCount(unread);
            setIsLoading(false);
        });

        return unsub;
    }, [user]);

    const handleMarkAsRead = async (notificationId) => {
        try {
            await updateDoc(doc(db, 'notifications', notificationId), { 
                isRead: true,
                readAt: new Date()
            });
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const unreadNotifications = notifications.filter(n => !n.isRead);
            if (unreadNotifications.length === 0) return;

            const batch = writeBatch(db);
            unreadNotifications.forEach(notification => {
                const notificationRef = doc(db, 'notifications', notification.id);
                batch.update(notificationRef, { 
                    isRead: true,
                    readAt: new Date()
                });
            });

            await batch.commit();
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    const getFilteredNotifications = () => {
        if (filterType === 'all') return notifications;
        return notifications.filter(notification => notification.type === filterType);
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'payment_submission':
                return <Icon path="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h6m3-3.75l-3 3m3 0l-3-3m-3.75 6.75h16.5c.621 0 1.125-.504 1.125-1.125V6.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v10.5c0 .621.504 1.125 1.125 1.125z" />;
            case 'support_ticket':
                return <Icon path="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />;
            case 'mention':
                return <Icon path="M7.5 8.25h9m-9 3H12m-9.75 1.5c0-.83.67-1.5 1.5-1.5h14.25c.83 0 1.5.67 1.5 1.5v6.75c0 .83-.67 1.5-1.5 1.5H5.25c-.83 0-1.5-.67-1.5-1.5V9.75z" />;
            case 'bulletin_post':
                return <Icon path="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />;
            case 'referral':
                return <Icon path="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM13.5 15a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />;
            default:
                return <Icon path="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />;
        }
    };

    const getNotificationTypeLabel = (type) => {
        switch (type) {
            case 'payment_submission':
                return 'Nuevo Pago';
            case 'support_ticket':
                return 'Ticket de Soporte';
            case 'mention':
                return 'Mención';
            case 'bulletin_post':
                return 'Nuevo Post';
            case 'referral':
                return 'Nueva Referencia';
            default:
                return 'Notificación';
        }
    };

    const getNotificationPriority = (type) => {
        switch (type) {
            case 'payment_submission':
                return 'high';
            case 'support_ticket':
                return 'medium';
            case 'mention':
                return 'low';
            default:
                return 'low';
        }
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'N/A';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Ahora mismo';
        if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
        if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)}h`;
        return date.toLocaleDateString('es-CR');
    };

    const getNotificationActions = (notification) => {
        switch (notification.type) {
            case 'payment_submission':
                return (
                    <div className="flex gap-2 mt-3">
                        <button 
                            onClick={() => window.open(`/admin/payments`, '_blank')}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Ver Pagos
                        </button>
                    </div>
                );
            case 'support_ticket':
                return (
                    <div className="flex gap-2 mt-3">
                        <button 
                            onClick={() => window.open(`/admin/support`, '_blank')}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Ver Tickets
                        </button>
                    </div>
                );
            case 'bulletin_post':
                return (
                    <div className="flex gap-2 mt-3">
                        <button 
                            onClick={() => window.open(`/admin/bulletin`, '_blank')}
                            className="px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            Ver Mural
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                <div className="animate-pulse">
                    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const filteredNotifications = getFilteredNotifications();

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-200">
                        Notificaciones
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400">
                        {unreadCount} sin leer de {notifications.length} total
                    </p>
                </div>
                <div className="flex gap-2">
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="px-4 py-2 text-sm bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                        >
                            Marcar todas como leídas
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Controls */}
            <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setFilterType('all')}
                        className={`px-3 py-1 text-sm rounded-full transition-colors ${
                            filterType === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                        }`}
                    >
                        Todas ({notifications.length})
                    </button>
                    <button
                        onClick={() => setFilterType('payment_submission')}
                        className={`px-3 py-1 text-sm rounded-full transition-colors ${
                            filterType === 'payment_submission'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                        }`}
                    >
                        Pagos ({notifications.filter(n => n.type === 'payment_submission').length})
                    </button>
                    <button
                        onClick={() => setFilterType('support_ticket')}
                        className={`px-3 py-1 text-sm rounded-full transition-colors ${
                            filterType === 'support_ticket'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                        }`}
                    >
                        Soporte ({notifications.filter(n => n.type === 'support_ticket').length})
                    </button>
                    <button
                        onClick={() => setFilterType('mention')}
                        className={`px-3 py-1 text-sm rounded-full transition-colors ${
                            filterType === 'mention'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                        }`}
                    >
                        Menciones ({notifications.filter(n => n.type === 'mention').length})
                    </button>
                </div>
            </div>

            {/* Notifications List */}
            {filteredNotifications.length === 0 ? (
                <div className="text-center py-12">
                    <Icon path="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">
                        {filterType === 'all' ? 'No hay notificaciones.' : `No hay notificaciones de ${getNotificationTypeLabel(filterType).toLowerCase()}.`}
                    </p>
                </div>
            ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                    {filteredNotifications.map(notification => (
                        <div
                            key={notification.id}
                            className={`p-4 rounded-xl shadow-lg border-l-4 transition-all duration-200 ${
                                notification.isRead
                                    ? 'bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600'
                                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-1">
                                    {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300">
                                                {getNotificationTypeLabel(notification.type)}
                                            </span>
                                            {!notification.isRead && (
                                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                            )}
                                        </div>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            {formatTimestamp(notification.createdAt)}
                                        </span>
                                    </div>
                                    
                                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                                        {notification.title || notification.message}
                                    </h4>
                                    
                                    {notification.description && (
                                        <p className="text-slate-700 dark:text-slate-300 text-sm mb-2">
                                            {notification.description}
                                        </p>
                                    )}
                                    
                                    {notification.userInfo && (
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                                            <span className="font-medium">Usuario:</span> {notification.userInfo.username || notification.userInfo.email}
                                        </div>
                                    )}
                                    
                                    {getNotificationActions(notification)}
                                    
                                    {!notification.isRead && (
                                        <button
                                            onClick={() => handleMarkAsRead(notification.id)}
                                            className="mt-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            Marcar como leída
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EnhancedNotifications;
