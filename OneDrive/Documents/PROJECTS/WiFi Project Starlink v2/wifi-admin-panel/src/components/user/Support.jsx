import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, orderBy, onSnapshot, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import Spinner from '../common/Spinner.jsx';
import Icon from '../common/Icon.jsx';

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
        { id: 'low', label: 'Baja', color: 'text-green-600' },
        { id: 'medium', label: 'Media', color: 'text-yellow-600' },
        { id: 'high', label: 'Alta', color: 'text-orange-600' },
        { id: 'urgent', label: 'Urgente', color: 'text-red-600' }
    ];

    const statusLabels = {
        'open': { label: 'Abierto', color: 'bg-blue-500', textColor: 'text-blue-600' },
        'in_progress': { label: 'En Progreso', color: 'bg-yellow-500', textColor: 'text-yellow-600' },
        'resolved': { label: 'Resuelto', color: 'bg-green-500', textColor: 'text-green-600' },
        'closed': { label: 'Cerrado', color: 'bg-gray-500', textColor: 'text-gray-600' }
    };

    useEffect(() => {
        if (!user?.uid) return;

        const q = query(
            collection(db, 'supportTickets'),
            where('userId', '==', user.uid),
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
    }, [user?.uid]);

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

        try {
            let attachmentUrl = null;
            
            // Upload attachment if provided
            if (formData.attachment) {
                const filePath = `support-attachments/${user.uid}/${Date.now()}-${formData.attachment.name}`;
                const storageRef = ref(storage, filePath);
                const uploadResult = await uploadBytes(storageRef, formData.attachment);
                attachmentUrl = await getDownloadURL(uploadResult.ref);
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
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            await addDoc(collection(db, 'supportTickets'), ticketData);

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
                <Spinner />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                            Soporte Técnico
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400">
                            ¿Necesita ayuda? Envíe un ticket y nuestro equipo lo atenderá.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                    >
                        {showForm ? 'Cancelar' : 'Nuevo Ticket'}
                    </button>
                </div>
            </div>

            {/* New Ticket Form */}
            {showForm && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg mb-8">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-6">
                        Crear Nuevo Ticket
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Asunto
                                </label>
                                <input
                                    type="text"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700 dark:text-slate-200"
                                    placeholder="Describa brevemente su problema"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Categoría
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700 dark:text-slate-200"
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
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Prioridad
                                </label>
                                <select
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700 dark:text-slate-200"
                                >
                                    {priorities.map(pri => (
                                        <option key={pri.id} value={pri.id}>
                                            {pri.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Archivo Adjunto (opcional)
                                </label>
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    accept="image/*,.pdf,.doc,.docx,.txt"
                                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-semibold file:bg-slate-50 dark:file:bg-slate-700 file:text-blue-700 dark:file:text-blue-300"
                                />
                                <p className="text-xs text-slate-500 mt-1">Máximo 5MB</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                Descripción Detallada
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                required
                                rows={5}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700 dark:text-slate-200"
                                placeholder="Describa su problema en detalle..."
                            />
                        </div>

                        <div className="flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-6 py-3 text-slate-600 dark:text-slate-400 font-semibold hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold py-3 px-8 rounded-lg transition-colors flex items-center"
                            >
                                {isSubmitting ? <Spinner /> : 'Enviar Ticket'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Tickets List */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                        Mis Tickets ({tickets.length})
                    </h3>
                </div>
                
                {tickets.length === 0 ? (
                    <div className="p-8 text-center">
                        <Icon path="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400 text-lg">
                            No tiene tickets de soporte aún.
                        </p>
                        <p className="text-slate-400 dark:text-slate-500">
                            Cree su primer ticket cuando necesite ayuda.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {tickets.map(ticket => (
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
                                    <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                                        <div className="mb-4">
                                            <h5 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                                Descripción:
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
                                                    Su Última Respuesta:
                                                </h5>
                                                <p className="text-green-700 dark:text-green-300">
                                                    {ticket.lastReply.text}
                                                </p>
                                                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                                                    {formatDate(ticket.lastReply.timestamp)}
                                                </p>
                                            </div>
                                        )}

                                        {/* Add Reply Form */}
                                        {ticket.status !== 'closed' && (
                                            <div className="mt-4">
                                                <h5 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">
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
                                                        className="w-full px-3 py-2 bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700 dark:text-slate-200"
                                                        placeholder="Escriba su respuesta..."
                                                    />
                                                    <button
                                                        type="submit"
                                                        className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                                                    >
                                                        Enviar Respuesta
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

export default Support;
