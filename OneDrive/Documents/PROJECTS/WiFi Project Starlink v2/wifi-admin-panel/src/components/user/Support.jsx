import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, addDoc, query, where, orderBy, onSnapshot, updateDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { FiMessageCircle, FiFileText, FiClock, FiCheckCircle, FiX, FiPlus, FiPaperclip, FiRefreshCw } from 'react-icons/fi';

const Support = ({ user }) => {
    const [tickets, setTickets] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Form state
    const [formData, setFormData] = useState({
        subject: '',
        category: 'technical',
        priority: 'medium',
        description: '',
        attachment: null
    });

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
        console.log('Support component - user:', user);
        console.log('Support component - user.uid:', user?.uid);
        
        if (!user?.uid) {
            console.log('No user UID, returning early');
            setIsLoading(false);
            return;
        }

        console.log('Setting up Firestore listener for user:', user.uid);
        
        // Try without orderBy first to avoid index issues
        const q = query(
            collection(db, 'supportTickets'),
            where('userId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            console.log('Firestore snapshot received:', snapshot.docs.length, 'tickets');
            console.log('Snapshot metadata:', snapshot.metadata);
            console.log('Snapshot changes:', snapshot.docChanges());
            
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
            console.log('Processed tickets data:', ticketsData);
            setTickets(ticketsData);
            setIsLoading(false);
        }, (error) => {
            console.error('Firestore listener error:', error);
            console.error('Error details:', error.code, error.message);
            setIsLoading(false);
            
            // If the listener fails, try to fetch data manually
            if (error.code === 'failed-precondition' || error.code === 'unavailable') {
                console.log('Trying manual fetch due to listener error...');
                fetchTicketsManually();
            }
        });

        return () => unsubscribe();
    }, [user?.uid]);

    // Manual fetch function as fallback
    const fetchTicketsManually = async () => {
        try {
            console.log('Fetching tickets manually...');
            const q = query(
                collection(db, 'supportTickets'),
                where('userId', '==', user.uid)
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
            console.log('Manual fetch successful:', ticketsData.length, 'tickets');
            setTickets(ticketsData);
            setIsLoading(false);
        } catch (error) {
            console.error('Manual fetch failed:', error);
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.size <= 5 * 1024 * 1024) { // 5MB limit
            setFormData(prev => ({
                ...prev,
                attachment: file
            }));
        } else if (file) {
            alert('El archivo debe ser menor a 5MB');
            e.target.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        console.log('Submitting ticket with data:', formData);
        console.log('User info:', { uid: user.uid, email: user.email });

        try {
            let attachmentUrl = null;
            
            // Upload attachment if provided
            if (formData.attachment) {
                console.log('Uploading attachment:', formData.attachment.name);
                const filePath = `support-attachments/${user.uid}/${Date.now()}-${formData.attachment.name}`;
                const storageRef = ref(storage, filePath);
                const uploadResult = await uploadBytes(storageRef, formData.attachment);
                attachmentUrl = await getDownloadURL(uploadResult.ref);
                console.log('Attachment uploaded, URL:', attachmentUrl);
            }

            // Create ticket in Firestore
            const ticketData = {
                userId: user.uid,
                userEmail: user.email,
                subject: formData.subject,
                category: formData.category,
                priority: formData.priority,
                description: formData.description,
                attachmentUrl,
                status: 'open',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            console.log('Creating ticket with data:', ticketData);
            const docRef = await addDoc(collection(db, 'supportTickets'), ticketData);
            console.log('Ticket created successfully with ID:', docRef.id);
            
            // Force a refresh of the tickets list
            console.log('Ticket created, should appear in list soon...');
            
            // Immediately fetch the ticket to verify it was created
            try {
                const ticketDoc = await getDoc(doc(db, 'supportTickets', docRef.id));
                if (ticketDoc.exists()) {
                    console.log('✅ Ticket verified in Firestore:', ticketDoc.data());
                } else {
                    console.log('❌ Ticket not found in Firestore after creation');
                }
            } catch (error) {
                console.error('Error verifying ticket:', error);
            }

            // Reset form and close
            setFormData({
                subject: '',
                category: 'technical',
                priority: 'medium',
                description: '',
                attachment: null
            });
            setShowForm(false);
            
            alert('Ticket enviado exitosamente. Nos pondremos en contacto pronto.');
        } catch (error) {
            console.error('Error submitting ticket:', error);
            alert('Error al enviar el ticket. Por favor intente nuevamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddReply = async (ticketId, replyText) => {
        try {
            const ticketRef = doc(db, 'supportTickets', ticketId);
            await updateDoc(ticketRef, {
                updatedAt: serverTimestamp(),
                lastReply: {
                    text: replyText,
                    timestamp: serverTimestamp(),
                    isUser: true
                }
            });
        } catch (error) {
            console.error('Error adding reply:', error);
            alert('Error al agregar la respuesta.');
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString('es-CR');
    };

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
            {/* Header */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                            Soporte Técnico
                        </h2>
                        <p className="text-gray-600">
                            ¿Necesita ayuda? Envíe un ticket y nuestro equipo lo atenderá.
                        </p>
                    </div>
                                            <div className="flex gap-3">
                            <motion.button
                                onClick={() => setShowForm(!showForm)}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {showForm ? <FiX className="w-4 h-4" /> : <FiPlus className="w-4 h-4" />}
                                {showForm ? 'Cancelar' : 'Nuevo Ticket'}
                            </motion.button>
                            
                                                         <motion.button
                                 onClick={async () => {
                                     console.log('Manual refresh clicked');
                                     console.log('Current tickets state:', tickets);
                                     console.log('Current user:', user);
                                     
                                     // Also check what's actually in Firestore
                                     try {
                                         const q = query(collection(db, 'supportTickets'));
                                         const snapshot = await getDocs(q);
                                         console.log('🔍 All tickets in Firestore:', snapshot.docs.length);
                                         snapshot.docs.forEach(doc => {
                                             console.log(`Ticket ${doc.id}:`, doc.data());
                                         });
                                     } catch (error) {
                                         console.error('Error checking Firestore:', error);
                                     }
                                 }}
                                 className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                                 whileHover={{ scale: 1.05 }}
                                 whileTap={{ scale: 0.95 }}
                             >
                                 <FiRefreshCw className="w-4 h-4" />
                                 Debug
                             </motion.button>
                             
                             <motion.button
                                 onClick={() => {
                                     console.log('Manual refresh clicked');
                                     // Force a re-fetch of tickets
                                     setIsLoading(true);
                                     const q = query(
                                         collection(db, 'supportTickets'),
                                         where('userId', '==', user.uid)
                                     );
                                     getDocs(q).then(snapshot => {
                                         const ticketsData = snapshot.docs.map(doc => ({
                                             id: doc.id,
                                             ...doc.data()
                                         }));
                                         ticketsData.sort((a, b) => {
                                             const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
                                             const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
                                             return bTime - aTime;
                                         });
                                         setTickets(ticketsData);
                                         setIsLoading(false);
                                     }).catch(error => {
                                         console.error('Manual refresh failed:', error);
                                         setIsLoading(false);
                                     });
                                 }}
                                 className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                                 whileHover={{ scale: 1.05 }}
                                 whileTap={{ scale: 0.95 }}
                             >
                                 <FiRefreshCw className="w-4 h-4" />
                                 Refresh
                             </motion.button>
                             
                             {/* Test Button */}
                             <motion.button
                                 onClick={async () => {
                                     console.log('Testing ticket creation...');
                                     try {
                                         // Create a test ticket
                                         const testTicket = {
                                             userId: user.uid,
                                             userEmail: user.email,
                                             subject: 'Test Ticket',
                                             category: 'technical',
                                             priority: 'medium',
                                             description: 'This is a test ticket to verify Firestore is working',
                                             status: 'open',
                                             createdAt: serverTimestamp(),
                                             updatedAt: serverTimestamp()
                                         };
                                         
                                         console.log('Creating test ticket:', testTicket);
                                         const docRef = await addDoc(collection(db, 'supportTickets'), testTicket);
                                         console.log('Test ticket created with ID:', docRef.id);
                                         
                                         // Immediately read it back
                                         const testDoc = await getDoc(doc(db, 'supportTickets', docRef.id));
                                         if (testDoc.exists()) {
                                             console.log('✅ Test ticket verified:', testDoc.data());
                                         } else {
                                             console.log('❌ Test ticket not found');
                                         }
                                         
                                         // Refresh the list
                                         fetchTicketsManually();
                                     } catch (error) {
                                         console.error('Test ticket creation failed:', error);
                                     }
                                 }}
                                 className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                                 whileHover={{ scale: 1.05 }}
                                 whileTap={{ scale: 0.95 }}
                             >
                                 Test
                             </motion.button>
                        </div>
                </div>
            </div>

            {/* New Ticket Form */}
            {showForm && (
                <motion.div 
                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                >
                    <h3 className="text-xl font-semibold text-gray-800 mb-6">
                        Crear Nuevo Ticket
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Asunto
                                </label>
                                <input
                                    type="text"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                                    placeholder="Describa brevemente su problema"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Categoría
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                                >
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.icon} {cat.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Prioridad
                                </label>
                                <select
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                                >
                                    {priorities.map(pri => (
                                        <option key={pri.id} value={pri.id}>
                                            {pri.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Archivo Adjunto (opcional)
                                </label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        accept="image/*,.pdf,.doc,.docx,.txt"
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                    <FiPaperclip className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Máximo 5MB</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Descripción Detallada
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                required
                                rows={5}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                                placeholder="Describa su problema en detalle..."
                            />
                        </div>

                        <div className="flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-6 py-3 text-gray-600 font-semibold hover:text-gray-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors flex items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <FiMessageCircle className="w-4 h-4" />
                                        Enviar Ticket
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}

            {/* Tickets List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <FiMessageCircle className="w-6 h-6 text-blue-600" />
                        <h3 className="text-xl font-semibold text-gray-800">
                            Mis Tickets ({tickets.length})
                        </h3>
                    </div>
                </div>
                
                {tickets.length === 0 ? (
                    <div className="p-8 text-center">
                        <FiMessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500 text-lg">
                            No tiene tickets de soporte aún.
                        </p>
                        <p className="text-gray-400">
                            Cree su primer ticket cuando necesite ayuda.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {tickets.map(ticket => (
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
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span>{categories.find(c => c.id === ticket.category)?.icon} {categories.find(c => c.id === ticket.category)?.label}</span>
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
                                    <button
                                        onClick={() => setSelectedTicket(selectedTicket === ticket.id ? null : ticket.id)}
                                        className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
                                    >
                                        {selectedTicket === ticket.id ? 'Ocultar' : 'Ver Detalles'}
                                    </button>
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
                                                Descripción:
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
                                                    Su Última Respuesta:
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

                                        {/* Add Reply Form */}
                                        {ticket.status !== 'closed' && (
                                            <div className="mt-4">
                                                <h5 className="font-semibold text-gray-700 mb-2">
                                                    Agregar Respuesta:
                                                </h5>
                                                <form onSubmit={(e) => {
                                                    e.preventDefault();
                                                    const replyText = e.target.replyText.value;
                                                    if (replyText.trim()) {
                                                        handleAddReply(ticket.id, replyText);
                                                        e.target.replyText.value = '';
                                                    }
                                                }}>
                                                    <textarea
                                                        name="replyText"
                                                        rows={3}
                                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                                                        placeholder="Escriba su respuesta..."
                                                    />
                                                    <button
                                                        type="submit"
                                                        className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                                                    >
                                                        <FiMessageCircle className="w-4 h-4" />
                                                        Enviar Respuesta
                                                    </button>
                                                </form>
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

export default Support;
