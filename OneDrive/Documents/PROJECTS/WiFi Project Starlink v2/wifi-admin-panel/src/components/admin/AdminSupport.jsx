import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { FiMessageCircle, FiFileText, FiClock, FiCheckCircle, FiX, FiEye, FiCornerUpLeft, FiUser, FiMail } from 'react-icons/fi';

const AdminSupport = () => {
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState('id'); // 'id', 'email', 'subject'

    // Ticket categories and priorities
    const categories = [
        { id: 'technical', label: 'Problema Técnico', icon: '🔧' },
        { id: 'billing', label: 'Facturación', icon: '💰' },
        { id: 'connection', label: 'Problema de Conexión', icon: '📡' },
        { id: 'account', label: 'Cuenta de Usuario', icon: '👤' },
        { id: 'other', label: 'Otro', icon: '❓' }
    ];

    const priorities = [
        { id: 'low', label: 'Baja', color: 'text-green-600', bgColor: 'bg-green-100' },
        { id: 'medium', label: 'Media', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
        { id: 'high', label: 'Alta', color: 'text-orange-600', bgColor: 'bg-orange-100' },
        { id: 'urgent', label: 'Urgente', color: 'text-red-600', bgColor: 'bg-red-100' }
    ];

    const statusLabels = {
        'open': { label: 'Abierto', color: 'bg-blue-500', textColor: 'text-blue-600', bgColor: 'bg-blue-100' },
        'in_progress': { label: 'En Progreso', color: 'bg-yellow-500', textColor: 'text-yellow-600', bgColor: 'bg-yellow-100' },
        'resolved': { label: 'Resuelto', color: 'bg-green-500', textColor: 'text-green-600', bgColor: 'bg-green-100' },
        'closed': { label: 'Cerrado', color: 'bg-gray-500', textColor: 'text-gray-600', bgColor: 'bg-gray-100' }
    };

    useEffect(() => {
        console.log('AdminSupport: Setting up Firestore listener for all tickets');
        
        // Try without orderBy first to avoid index issues
        const q = query(
            collection(db, 'supportTickets')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            console.log('AdminSupport: Firestore snapshot received:', snapshot.docs.length, 'tickets');
            console.log('AdminSupport: Snapshot metadata:', snapshot.metadata);
            console.log('AdminSupport: Snapshot changes:', snapshot.docChanges());
            
            const ticketsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Sort manually to avoid index issues
            ticketsData.sort((a, b) => {
                const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
                const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
                return bTime - aTime;
            });
            console.log('AdminSupport: Processed tickets data:', ticketsData);
            setTickets(ticketsData);
            setIsLoading(false);
        }, (error) => {
            console.error('AdminSupport: Firestore listener error:', error);
            console.error('AdminSupport: Error details:', error.code, error.message);
            setIsLoading(false);
            
            // If the listener fails, try to fetch data manually
            if (error.code === 'failed-precondition' || error.code === 'unavailable') {
                console.log('AdminSupport: Trying manual fetch due to listener error...');
                fetchTicketsManually();
            }
        });

        return () => unsubscribe();
    }, []);

    // Keyboard shortcut for search (Ctrl+F or Cmd+F)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                const searchInput = document.querySelector('input[placeholder*="Buscar"]');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Manual fetch function as fallback
    const fetchTicketsManually = async () => {
        try {
            console.log('AdminSupport: Fetching tickets manually...');
            const q = query(
                collection(db, 'supportTickets')
            );
            const snapshot = await getDocs(q);
            const ticketsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Sort manually to avoid index issues
            ticketsData.sort((a, b) => {
                const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
                const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
                return bTime - aTime;
            });
            console.log('AdminSupport: Manual fetch successful:', ticketsData.length, 'tickets');
            setTickets(ticketsData);
            setIsLoading(false);
        } catch (error) {
            console.error('AdminSupport: Manual fetch failed:', error);
            setIsLoading(false);
        }
    };

    const handleStatusChange = async (ticketId, newStatus) => {
        try {
            const ticketRef = doc(db, 'supportTickets', ticketId);
            await updateDoc(ticketRef, {
                status: newStatus,
                updatedAt: serverTimestamp()
            });
            console.log('Ticket status updated to:', newStatus);
        } catch (error) {
            console.error('Error updating ticket status:', error);
            alert('Error al actualizar el estado del ticket.');
        }
    };

    const handleAdminReply = async (ticketId) => {
        if (!replyText.trim()) return;

        setIsSubmitting(true);
        try {
            const ticketRef = doc(db, 'supportTickets', ticketId);
            await updateDoc(ticketRef, {
                adminReply: {
                    text: replyText,
                    timestamp: serverTimestamp()
                },
                status: 'in_progress',
                updatedAt: serverTimestamp()
            });
            
            setReplyText('');
            setSelectedTicket(null);
            console.log('Admin reply added successfully');
        } catch (error) {
            console.error('Error adding admin reply:', error);
            alert('Error al agregar la respuesta.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString('es-CR');
    };

    // Filter tickets based on status and search query
    const filteredTickets = tickets.filter(ticket => {
        // First filter by status
        if (filterStatus !== 'all' && ticket.status !== filterStatus) return false;
        
        // Then filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            
            switch (searchType) {
                case 'id':
                    return ticket.id.toLowerCase().includes(query);
                case 'email':
                    return ticket.userEmail?.toLowerCase().includes(query);
                case 'subject':
                    return ticket.subject?.toLowerCase().includes(query);
                default:
                    // Search in all fields
                    return (
                        ticket.id.toLowerCase().includes(query) ||
                        ticket.userEmail?.toLowerCase().includes(query) ||
                        ticket.subject?.toLowerCase().includes(query) ||
                        ticket.description?.toLowerCase().includes(query)
                    );
            }
        }
        
        return true;
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Cargando tickets...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Stats */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                            Gestión de Soporte Técnico
                        </h2>
                        <p className="text-gray-600">
                            Administre todos los tickets de soporte del sistema
                        </p>
                    </div>
                                         <div className="flex items-center gap-4">
                         <div className="text-center">
                             <div className="text-2xl font-bold text-blue-600">{tickets.filter(t => t.status === 'open').length}</div>
                             <div className="text-sm text-gray-600">Abiertos</div>
                         </div>
                         <div className="text-center">
                             <div className="text-2xl font-bold text-orange-600">{tickets.filter(t => t.status === 'in_progress').length}</div>
                             <div className="text-sm text-gray-600">En Progreso</div>
                         </div>
                         <div className="text-center">
                             <div className="text-2xl font-bold text-green-600">{tickets.filter(t => t.status === 'resolved').length}</div>
                             <div className="text-sm text-gray-600">Resueltos</div>
                         </div>
                         
                         {/* Debug Button */}
                         <motion.button
                             onClick={() => {
                                 console.log('AdminSupport Debug - Current tickets:', tickets);
                                 console.log('AdminSupport Debug - Filter status:', filterStatus);
                                 console.log('AdminSupport Debug - Filtered tickets:', filteredTickets);
                             }}
                             className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
                             whileHover={{ scale: 1.05 }}
                             whileTap={{ scale: 0.95 }}
                         >
                             Debug
                         </motion.button>
                         
                         {/* Manual Refresh Button */}
                         <motion.button
                             onClick={fetchTicketsManually}
                             className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                             whileHover={{ scale: 1.05 }}
                             whileTap={{ scale: 0.95 }}
                         >
                             Refresh
                         </motion.button>
                     </div>
                </div>

                {/* Filter Buttons */}
                <div className="flex gap-2 mb-4">
                    {Object.entries(statusLabels).map(([status, label]) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                filterStatus === status
                                    ? `${label.bgColor} ${label.textColor} border-2 border-current`
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {label.label}
                        </button>
                    ))}
                    <button
                        onClick={() => setFilterStatus('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            filterStatus === 'all'
                                ? 'bg-blue-100 text-blue-600 border-2 border-blue-600'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        Todos
                    </button>
                </div>

                {/* Search Bar */}
                <div className="flex gap-3 items-center">
                    <div className="flex-1 max-w-md">
                        <div className="relative group">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={`Buscar por ${searchType === 'id' ? 'ID del ticket' : searchType === 'email' ? 'email del usuario' : 'asunto'}...`}
                                className="w-full px-4 py-2 pl-10 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                title="Presiona Ctrl+F (o Cmd+F) para buscar rápidamente"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded border">
                                    Ctrl+F
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <select
                        value={searchType}
                        onChange={(e) => setSearchType(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="id">ID del Ticket</option>
                        <option value="email">Email del Usuario</option>
                        <option value="subject">Asunto</option>
                        <option value="all">Todos los Campos</option>
                    </select>
                    
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                            title="Limpiar búsqueda"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Tickets List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                                    <div className="flex items-center gap-3">
                    <FiMessageCircle className="w-6 h-6 text-blue-600" />
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800">
                            Tickets de Soporte ({filteredTickets.length})
                        </h3>
                        {searchQuery && (
                            <p className="text-sm text-gray-600 mt-1">
                                Búsqueda: "{searchQuery}" • {filteredTickets.length} de {tickets.length} tickets
                            </p>
                        )}
                    </div>
                </div>
                </div>
                
                {filteredTickets.length === 0 ? (
                    <div className="p-8 text-center">
                        <FiMessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500 text-lg">
                            {searchQuery 
                                ? `No se encontraron tickets que coincidan con "${searchQuery}"`
                                : filterStatus === 'all' 
                                    ? 'No hay tickets de soporte aún.' 
                                    : `No hay tickets con estado "${statusLabels[filterStatus]?.label}".`
                            }
                        </p>
                        {searchQuery && (
                            <div className="mt-4 text-sm text-gray-400">
                                <p>Intenta:</p>
                                <ul className="mt-2 space-y-1">
                                    <li>• Verificar que el ID del ticket sea correcto</li>
                                    <li>• Usar solo parte del email del usuario</li>
                                    <li>• Buscar por palabras clave en el asunto</li>
                                    <li>• Limpiar la búsqueda para ver todos los tickets</li>
                                </ul>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {filteredTickets.map(ticket => (
                            <motion.div 
                                key={ticket.id} 
                                className="p-6 hover:bg-gray-50 transition-colors"
                                whileHover={{ backgroundColor: '#f9fafb' }}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="text-lg font-semibold text-gray-800">
                                                {ticket.subject}
                                            </h4>
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusLabels[ticket.status]?.bgColor} ${statusLabels[ticket.status]?.textColor}`}>
                                                {statusLabels[ticket.status]?.label}
                                            </span>
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${priorities.find(p => p.id === ticket.priority)?.bgColor} ${priorities.find(p => p.id === ticket.priority)?.color}`}>
                                                {priorities.find(p => p.id === ticket.priority)?.label}
                                            </span>
                                        </div>
                                        
                                        {/* User Info */}
                                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                                            <span className="flex items-center gap-1">
                                                <FiUser className="w-4 h-4" />
                                                {ticket.userEmail}
                                            </span>
                                            <span>•</span>
                                            <span>{categories.find(c => c.id === ticket.category)?.icon} {categories.find(c => c.id === ticket.category)?.label}</span>
                                            <span>•</span>
                                            <span>Creado: {formatDate(ticket.createdAt)}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                                    ID: {ticket.id}
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(ticket.id);
                                                        // You could add a toast notification here
                                                    }}
                                                    className="text-blue-600 hover:text-blue-700 transition-colors"
                                                    title="Copiar ID del ticket"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                                                </button>
                                            </span>
                                        </div>

                                        {/* Description Preview */}
                                        <p className="text-gray-600 text-sm line-clamp-2">
                                            {ticket.description}
                                        </p>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setSelectedTicket(selectedTicket === ticket.id ? null : ticket.id)}
                                            className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors text-sm"
                                        >
                                            <FiEye className="w-4 h-4" />
                                            {selectedTicket === ticket.id ? 'Ocultar' : 'Ver'}
                                        </button>
                                        
                                        {/* Status Change Dropdown */}
                                        <select
                                            value={ticket.status}
                                            onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            {Object.entries(statusLabels).map(([status, label]) => (
                                                <option key={status} value={status}>
                                                    {label.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Ticket Details */}
                                {selectedTicket === ticket.id && (
                                    <motion.div 
                                        className="mt-4 p-4 bg-gray-50 rounded-lg"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                    >
                                        <div className="mb-4">
                                            <h5 className="font-semibold text-gray-700 mb-2">
                                                Descripción Completa:
                                            </h5>
                                            <p className="text-gray-600 whitespace-pre-wrap">
                                                {ticket.description}
                                            </p>
                                        </div>

                                        {ticket.attachmentUrl && (
                                            <div className="mb-4">
                                                <h5 className="font-semibold text-gray-700 mb-2">
                                                    Archivo Adjunto:
                                                </h5>
                                                <a
                                                    href={ticket.attachmentUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-700 underline flex items-center gap-2"
                                                >
                                                    <FiFileText className="w-4 h-4" />
                                                    Ver archivo adjunto
                                                </a>
                                            </div>
                                        )}

                                        {ticket.adminReply && (
                                            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                                <h5 className="font-semibold text-blue-800 mb-2">
                                                    Respuesta del Administrador:
                                                </h5>
                                                <p className="text-blue-700">
                                                    {ticket.adminReply.text}
                                                </p>
                                                <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                                                    <FiClock className="w-3 h-3" />
                                                    {formatDate(ticket.adminReply.timestamp)}
                                                </p>
                                            </div>
                                        )}

                                        {ticket.lastReply && ticket.lastReply.isUser && (
                                            <div className="mb-4 p-3 bg-green-50 rounded-lg">
                                                <h5 className="font-semibold text-green-800 mb-2">
                                                    Última Respuesta del Usuario:
                                                </h5>
                                                <p className="text-green-700">
                                                    {ticket.lastReply.text}
                                                </p>
                                                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                                                    <FiClock className="w-3 h-3" />
                                                    {formatDate(ticket.lastReply.timestamp)}
                                                </p>
                                            </div>
                                        )}

                                        {/* Admin Reply Form */}
                                        {ticket.status !== 'closed' && (
                                            <div className="mt-4">
                                                <h5 className="font-semibold text-gray-700 mb-2">
                                                    Responder como Administrador:
                                                </h5>
                                                <div className="flex gap-3">
                                                    <textarea
                                                        value={replyText}
                                                        onChange={(e) => setReplyText(e.target.value)}
                                                        rows={3}
                                                        className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                                                        placeholder="Escriba su respuesta como administrador..."
                                                    />
                                                    <button
                                                        onClick={() => handleAdminReply(ticket.id)}
                                                        disabled={isSubmitting || !replyText.trim()}
                                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                                                    >
                                                        {isSubmitting ? (
                                                            <>
                                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                                Enviando...
                                                            </>
                                                        ) : (
                                                                                                                         <>
                                                                 <FiCornerUpLeft className="w-4 h-4" />
                                                                 Responder
                                                             </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSupport;
