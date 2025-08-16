import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../../firebase';
import Spinner from '../common/Spinner.jsx';
import Icon from '../common/Icon.jsx';

const SupportManagement = ({ db }) => {
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');
    const [isReplying, setIsReplying] = useState(false);

    const statusLabels = {
        'open': { label: 'Abierto', color: 'bg-blue-500', textColor: 'text-blue-600' },
        'in_progress': { label: 'En Progreso', color: 'bg-yellow-500', textColor: 'text-yellow-600' },
        'resolved': { label: 'Resuelto', color: 'bg-green-500', textColor: 'text-green-600' },
        'closed': { label: 'Cerrado', color: 'bg-gray-500', textColor: 'text-gray-600' }
    };

    const priorities = [
        { id: 'low', label: 'Baja', color: 'text-green-600' },
        { id: 'medium', label: 'Media', color: 'text-yellow-600' },
        { id: 'high', label: 'Alta', color: 'text-orange-600' },
        { id: 'urgent', label: 'Urgente', color: 'text-red-600' }
    ];

    const categories = [
        { id: 'technical', label: 'Problema Técnico', icon: '🔧' },
        { id: 'billing', label: 'Facturación', icon: '💰' },
        { id: 'connection', label: 'Problema de Conexión', icon: '📡' },
        { id: 'account', label: 'Cuenta de Usuario', icon: '👤' },
        { id: 'other', label: 'Otro', icon: '❓' }
    ];

    useEffect(() => {
        const q = query(
            collection(db, 'supportTickets'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ticketsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTickets(ticketsData);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [db]);

    const handleStatusChange = async (ticketId, newStatus) => {
        try {
            const ticketRef = doc(db, 'supportTickets', ticketId);
            await updateDoc(ticketRef, {
                status: newStatus,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating ticket status:', error);
            alert('Error al actualizar el estado del ticket.');
        }
    };

    const handleAdminReply = async (ticketId, replyText) => {
        if (!replyText.trim()) return;
        
        setIsReplying(true);
        try {
            const ticketRef = doc(db, 'supportTickets', ticketId);
            await updateDoc(ticketRef, {
                adminReply: {
                    text: replyText,
                    timestamp: serverTimestamp()
                },
                updatedAt: serverTimestamp(),
                status: 'in_progress' // Automatically set to in progress when admin replies
            });
            
            // Clear the reply form
            const replyInput = document.getElementById(`reply-${ticketId}`);
            if (replyInput) replyInput.value = '';
            
        } catch (error) {
            console.error('Error adding admin reply:', error);
            alert('Error al agregar la respuesta.');
        } finally {
            setIsReplying(false);
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString('es-CR');
    };

    const getFilteredTickets = () => {
        let filtered = tickets;
        
        if (filterStatus !== 'all') {
            filtered = filtered.filter(ticket => ticket.status === filterStatus);
        }
        
        if (filterPriority !== 'all') {
            filtered = filtered.filter(ticket => ticket.priority === filterPriority);
        }
        
        return filtered;
    };

    const getTicketStats = () => {
        const total = tickets.length;
        const open = tickets.filter(t => t.status === 'open').length;
        const inProgress = tickets.filter(t => t.status === 'in_progress').length;
        const resolved = tickets.filter(t => t.status === 'resolved').length;
        const urgent = tickets.filter(t => t.priority === 'urgent').length;
        
        return { total, open, inProgress, resolved, urgent };
    };

    const stats = getTicketStats();
    const filteredTickets = getFilteredTickets();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-6">
                    Gestión de Tickets de Soporte
                </h2>
                
                {/* Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                        <p className="text-sm text-blue-600">Total</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-yellow-600">{stats.open}</p>
                        <p className="text-sm text-yellow-600">Abiertos</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">{stats.inProgress}</p>
                        <p className="text-sm text-orange-600">En Progreso</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                        <p className="text-sm text-green-600">Resueltos</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
                        <p className="text-sm text-red-600">Urgentes</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                            Filtrar por Estado
                        </label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                        >
                            <option value="all">Todos los Estados</option>
                            <option value="open">Abiertos</option>
                            <option value="in_progress">En Progreso</option>
                            <option value="resolved">Resueltos</option>
                            <option value="closed">Cerrados</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                            Filtrar por Prioridad
                        </label>
                        <select
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value)}
                            className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                        >
                            <option value="all">Todas las Prioridades</option>
                            <option value="urgent">Urgente</option>
                            <option value="high">Alta</option>
                            <option value="medium">Media</option>
                            <option value="low">Baja</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Tickets List */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                        Tickets ({filteredTickets.length})
                    </h3>
                </div>
                
                {filteredTickets.length === 0 ? (
                    <div className="p-8 text-center">
                        <Icon path="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400 text-lg">
                            No hay tickets que coincidan con los filtros seleccionados.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {filteredTickets.map(ticket => (
                            <div key={ticket.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                                                {ticket.subject}
                                            </h4>
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusLabels[ticket.status]?.textColor} bg-opacity-10`}>
                                                {statusLabels[ticket.status]?.label}
                                            </span>
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${priorities.find(p => p.id === ticket.priority)?.color} bg-opacity-10`}>
                                                {priorities.find(p => p.id === ticket.priority)?.label}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                                            <span>{categories.find(c => c.id === ticket.category)?.icon} {categories.find(c => c.id === ticket.category)?.label}</span>
                                            <span>•</span>
                                            <span>Por: {ticket.userEmail}</span>
                                            <span>•</span>
                                            <span>Creado: {formatDate(ticket.createdAt)}</span>
                                            {ticket.updatedAt && ticket.updatedAt !== ticket.createdAt && (
                                                <>
                                                    <span>•</span>
                                                    <span>Actualizado: {formatDate(ticket.updatedAt)}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={ticket.status}
                                            onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                                            className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded"
                                        >
                                            <option value="open">Abierto</option>
                                            <option value="in_progress">En Progreso</option>
                                            <option value="resolved">Resuelto</option>
                                            <option value="closed">Cerrado</option>
                                        </select>
                                        <button
                                            onClick={() => setSelectedTicket(selectedTicket === ticket.id ? null : ticket.id)}
                                            className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
                                        >
                                            {selectedTicket === ticket.id ? 'Ocultar' : 'Ver Detalles'}
                                        </button>
                                    </div>
                                </div>

                                {/* Ticket Details */}
                                {selectedTicket === ticket.id && (
                                    <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                                        <div className="mb-4">
                                            <h5 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                                Descripción del Usuario:
                                            </h5>
                                            <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                                                {ticket.description}
                                            </p>
                                        </div>

                                        {ticket.attachmentUrl && (
                                            <div className="mb-4">
                                                <h5 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                                    Archivo Adjunto:
                                                </h5>
                                                <a
                                                    href={ticket.attachmentUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-700 underline"
                                                >
                                                    Ver archivo adjunto
                                                </a>
                                            </div>
                                        )}

                                        {ticket.adminReply && (
                                            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                                                    Respuesta del Administrador:
                                                </h5>
                                                <p className="text-blue-700 dark:text-blue-300">
                                                    {ticket.adminReply.text}
                                                </p>
                                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                                                    {formatDate(ticket.adminReply.timestamp)}
                                                </p>
                                            </div>
                                        )}

                                        {ticket.lastReply && ticket.lastReply.isUser && (
                                            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                                <h5 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                                                    Última Respuesta del Usuario:
                                                </h5>
                                                <p className="text-green-700 dark:text-green-300">
                                                    {ticket.lastReply.text}
                                                </p>
                                                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                                                    {formatDate(ticket.lastReply.timestamp)}
                                                </p>
                                            </div>
                                        )}

                                        {/* Admin Reply Form */}
                                        {ticket.status !== 'closed' && (
                                            <div className="mt-4">
                                                <h5 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                                    Responder al Usuario:
                                                </h5>
                                                <form onSubmit={(e) => {
                                                    e.preventDefault();
                                                    const replyText = e.target.replyText.value;
                                                    if (replyText.trim()) {
                                                        handleAdminReply(ticket.id, replyText);
                                                    }
                                                }}>
                                                    <textarea
                                                        id={`reply-${ticket.id}`}
                                                        name="replyText"
                                                        rows={3}
                                                        className="w-full px-3 py-2 bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        placeholder="Escriba su respuesta al usuario..."
                                                    />
                                                    <button
                                                        type="submit"
                                                        disabled={isReplying}
                                                        className="mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                                                    >
                                                        {isReplying ? <Spinner /> : 'Enviar Respuesta'}
                                                    </button>
                                                </form>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupportManagement;
